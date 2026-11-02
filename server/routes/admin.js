// Admin API: POST /api/admin/login, then all data routes behind requireAdmin
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const EcoCalc = require('../../public/js/co2');
const { signToken } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { toDateStr, addDays, round, HttpError } = require('../utils');

const router = express.Router();

/* ---------- Admin login rate limit (in memory, 5 failures per 15 minutes per IP) ---------- */
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map();

function recentAttempts(ip) {
  const now = Date.now();
  const list = (loginAttempts.get(ip) || []).filter(t => now - t < LOGIN_WINDOW_MS);
  if (list.length) loginAttempts.set(ip, list);
  else loginAttempts.delete(ip);
  return list;
}

function recordFailure(ip) {
  const list = recentAttempts(ip);
  list.push(Date.now());
  loginAttempts.set(ip, list);
}

// Public: only admins receive a token
router.post('/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const attempts = recentAttempts(ip);
  if (attempts.length >= LOGIN_MAX_ATTEMPTS) {
    const waitMin = Math.max(1, Math.ceil((LOGIN_WINDOW_MS - (Date.now() - attempts[0])) / 60000));
    throw new HttpError(429, `Too many failed attempts. Try again in ${waitMin} minute(s).`);
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    recordFailure(ip);
    throw new HttpError(401, 'Incorrect email or password.');
  }
  if (user.role !== 'admin') {
    recordFailure(ip);
    throw new HttpError(403, 'This account does not have admin access.');
  }

  loginAttempts.delete(ip);
  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at }
  });
});

// Everything below needs a valid token AND a current admin role in the database
router.use(requireAdmin);

/* ---------- Helpers ---------- */
function positiveInt(value, name) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, `Invalid ${name}.`);
  return n;
}

function pageParam(value) {
  if (value === undefined) return 1;
  return positiveInt(value, 'page');
}

function adminCount() {
  return db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n;
}

/* ---------- Stats ---------- */
router.get('/stats', (req, res) => {
  const today = toDateStr();
  const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const totals = db.prepare(`
    SELECT COUNT(*) AS trips, COALESCE(SUM(co2_saved), 0) AS co2_saved, COALESCE(SUM(points), 0) AS points
    FROM trips`).get();
  const recentTrips = db.prepare('SELECT COUNT(*) AS n FROM trips WHERE date >= ?').get(addDays(today, -6)).n;
  const newUsers = db.prepare('SELECT COUNT(*) AS n FROM users WHERE substr(created_at, 1, 10) >= ?')
    .get(addDays(today, -29)).n;

  res.json({
    total_users: users,
    total_trips: totals.trips,
    total_co2_saved: round(totals.co2_saved, 2),
    total_points: totals.points,
    trips_last_7_days: recentTrips,
    new_users_last_30_days: newUsers
  });
});

router.get('/stats/trips-by-mode', (req, res) => {
  const rows = db.prepare(`
    SELECT mode, COUNT(*) AS trips, COALESCE(SUM(co2_saved), 0) AS co2_saved
    FROM trips GROUP BY mode`).all();

  const modes = Object.keys(EcoCalc.MODES).map(mode => {
    const row = rows.find(r => r.mode === mode) || {};
    return { mode, trips: row.trips || 0, co2_saved: round(row.co2_saved, 2) };
  });
  res.json({ modes });
});

const RANGES = [30, 90, 180, 365];

router.get('/stats/trips-over-time', (req, res) => {
  const range = req.query.days === undefined ? 30 : Number(req.query.days);
  if (!RANGES.includes(range)) throw new HttpError(400, 'days must be one of ' + RANGES.join(', ') + '.');

  const today = toDateStr();
  const start = addDays(today, -(range - 1));
  const rows = db.prepare(`
    SELECT date, COUNT(*) AS trips, COALESCE(SUM(co2_saved), 0) AS co2_saved
    FROM trips WHERE date >= ? GROUP BY date`).all(start);

  const days = [];
  for (let i = 0; i < range; i++) {
    const date = addDays(start, i);
    const row = rows.find(r => r.date === date) || {};
    days.push({ date, trips: row.trips || 0, co2_saved: round(row.co2_saved, 2) });
  }
  res.json({ days });
});

/* ---------- Users ---------- */
router.get('/users', (req, res) => {
  const page = pageParam(req.query.page);
  const pageSize = 15;
  const search = String(req.query.search || '').trim().slice(0, 100);

  const where = [];
  const params = [];
  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM users u ${whereSql}`).get(...params).n;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           (SELECT COUNT(*) FROM trips t WHERE t.user_id = u.id) AS trips,
           (SELECT COALESCE(SUM(t.co2_saved), 0) FROM trips t WHERE t.user_id = u.id) AS co2_saved
    FROM users u ${whereSql}
    ORDER BY u.id ASC
    LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

  res.json({
    users: users.map(u => ({ ...u, co2_saved: round(u.co2_saved, 2) })),
    page, pages, total
  });
});

router.patch('/users/:id/role', (req, res) => {
  const id = positiveInt(req.params.id, 'user id');
  const role = String(req.body.role || '');
  if (role !== 'user' && role !== 'admin') throw new HttpError(400, "Role must be 'user' or 'admin'.");

  const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
  if (!target) throw new HttpError(404, 'User not found.');

  if (target.id === req.user.id && role !== 'admin') {
    throw new HttpError(403, 'You cannot demote your own admin account.');
  }
  if (target.role === 'admin' && role === 'user' && adminCount() <= 1) {
    throw new HttpError(409, 'The last remaining admin cannot be demoted.');
  }

  if (target.role !== role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  }
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
  res.json({ user });
});

router.delete('/users/:id', (req, res) => {
  const id = positiveInt(req.params.id, 'user id');
  const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
  if (!target) throw new HttpError(404, 'User not found.');

  if (target.id === req.user.id) {
    throw new HttpError(403, 'You cannot delete your own admin account.');
  }
  if (target.role === 'admin' && adminCount() <= 1) {
    throw new HttpError(409, 'The last remaining admin cannot be deleted.');
  }

  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM trips WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  res.json({ ok: true });
});

/* ---------- Trips ---------- */
router.get('/trips', (req, res) => {
  const page = pageParam(req.query.page);
  const pageSize = 15;

  const where = [];
  const params = [];
  if (req.query.mode !== undefined && req.query.mode !== '') {
    const mode = String(req.query.mode);
    if (!EcoCalc.MODES[mode]) throw new HttpError(400, 'Invalid travel mode.');
    where.push('t.mode = ?');
    params.push(mode);
  }
  if (req.query.userId !== undefined && req.query.userId !== '') {
    const userId = positiveInt(req.query.userId, 'user id');
    where.push('t.user_id = ?');
    params.push(userId);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM trips t ${whereSql}`).get(...params).n;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const trips = db.prepare(`
    SELECT t.id, t.user_id, u.name AS user_name, u.email AS user_email,
           t.mode, t.distance, t.passengers, t.date, t.co2_saved, t.points, t.note
    FROM trips t JOIN users u ON u.id = t.user_id
    ${whereSql}
    ORDER BY t.date DESC, t.id DESC
    LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

  res.json({ trips, page, pages, total });
});

router.delete('/trips/:id', (req, res) => {
  const id = positiveInt(req.params.id, 'trip id');
  const trip = db.prepare('SELECT id FROM trips WHERE id = ?').get(id);
  if (!trip) throw new HttpError(404, 'Trip not found.');

  db.prepare('DELETE FROM trips WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;