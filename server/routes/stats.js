// GET /api/stats/:userId · GET /api/stats/:userId/monthly · GET /api/community · GET /api/calculate
const express = require('express');
const db = require('../db');
const EcoCalc = require('../../public/js/co2');
const { requireAuth } = require('../middleware/auth');
const { getLeaderboard } = require('./leaderboard');
const { toDateStr, addDays, round, HttpError } = require('../utils');

const router = express.Router();

/** Only allow users to see their own detailed stats */
function ownUserId(req) {
  const id = Number(req.params.userId);
  if (id !== req.user.id) throw new HttpError(403, 'You can only view your own stats.');
  return id;
}

/** Consecutive days with at least one trip, ending today or yesterday */
function calcStreak(userId) {
  const dates = new Set(db.prepare('SELECT DISTINCT date FROM trips WHERE user_id = ?').all(userId).map(r => r.date));
  let day = toDateStr();
  if (!dates.has(day)) day = addDays(day, -1);   // streak is still alive if you logged yesterday
  let streak = 0;
  while (dates.has(day)) { streak++; day = addDays(day, -1); }
  return streak;
}

// ---------- Personal dashboard stats ----------
router.get('/stats/:userId', requireAuth, (req, res) => {
  const userId = ownUserId(req);
  const today = toDateStr();

  const t = db.prepare(`
    SELECT COUNT(*) AS trips, COALESCE(SUM(distance),0) AS distance,
           COALESCE(SUM(co2_saved),0) AS co2_saved, COALESCE(SUM(points),0) AS points
    FROM trips WHERE user_id = ?`).get(userId);

  const week = db.prepare('SELECT COALESCE(SUM(co2_saved),0) AS co2 FROM trips WHERE user_id = ? AND date >= ?')
    .get(userId, addDays(today, -6));

  // Breakdown by mode (always return all 4 modes, even if 0)
  const modeRows = db.prepare(`
    SELECT mode, COUNT(*) AS trips, SUM(distance) AS distance, SUM(co2_saved) AS co2_saved
    FROM trips WHERE user_id = ? GROUP BY mode`).all(userId);
  const byMode = Object.keys(EcoCalc.MODES).map(mode => {
    const r = modeRows.find(x => x.mode === mode) || {};
    return { mode, trips: r.trips || 0, distance: round(r.distance, 1), co2_saved: round(r.co2_saved, 2) };
  });

  // Daily CO2 for the last 14 days (missing days filled with 0)
  const start = addDays(today, -13);
  const dailyRows = db.prepare(`
    SELECT date, SUM(co2_saved) AS co2_saved, SUM(distance) AS distance
    FROM trips WHERE user_id = ? AND date >= ? GROUP BY date`).all(userId, start);
  const daily = [];
  for (let i = 0; i < 14; i++) {
    const date = addDays(start, i);
    const r = dailyRows.find(x => x.date === date) || {};
    daily.push({ date, co2_saved: round(r.co2_saved, 2), distance: round(r.distance, 1) });
  }

  const recent = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 5').all(userId);
  const board = getLeaderboard('co2', 'all');
  const me = board.find(r => r.id === userId);

  res.json({
    totals: {
      trips: t.trips,
      distance: round(t.distance, 1),
      co2_saved: round(t.co2_saved, 2),
      points: t.points,
      trees: EcoCalc.treesEquivalent(t.co2_saved),
      week_co2: round(week.co2, 2)
    },
    level: EcoCalc.getLevel(t.points),
    streak: calcStreak(userId),
    rank: me ? me.rank : null,
    totalUsers: board.length,
    byMode, daily, recent
  });
});

// ---------- Monthly statistics ----------
router.get('/stats/:userId/monthly', requireAuth, (req, res) => {
  const userId = ownUserId(req);
  const year = /^\d{4}$/.test(req.query.year || '') ? req.query.year : toDateStr().slice(0, 4);

  const rows = db.prepare(`
    SELECT substr(date,1,7) AS month, mode,
           COUNT(*) AS trips, SUM(distance) AS distance, SUM(co2_saved) AS co2_saved, SUM(points) AS points
    FROM trips WHERE user_id = ? AND substr(date,1,4) = ?
    GROUP BY month, mode`).all(userId, year);

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const mRows = rows.filter(r => r.month === key);
    const byMode = {};
    Object.keys(EcoCalc.MODES).forEach(mode => {
      const r = mRows.find(x => x.mode === mode);
      byMode[mode] = { trips: r ? r.trips : 0, distance: r ? round(r.distance, 1) : 0 };
    });
    const top = mRows.slice().sort((a, b) => b.trips - a.trips)[0];
    months.push({
      month: key,
      trips: mRows.reduce((s, r) => s + r.trips, 0),
      distance: round(mRows.reduce((s, r) => s + r.distance, 0), 1),
      co2_saved: round(mRows.reduce((s, r) => s + r.co2_saved, 0), 2),
      points: mRows.reduce((s, r) => s + r.points, 0),
      topMode: top ? top.mode : null,
      byMode
    });
  }

  const years = db.prepare('SELECT DISTINCT substr(date,1,4) AS y FROM trips WHERE user_id = ? ORDER BY y DESC')
    .all(userId).map(r => r.y);
  if (!years.includes(year)) years.unshift(year);

  res.json({ year, years, months });
});

// ---------- Community totals (public, used on the landing page) ----------
router.get('/community', (req, res) => {
  const t = db.prepare(`
    SELECT COUNT(*) AS trips, COALESCE(SUM(distance),0) AS distance, COALESCE(SUM(co2_saved),0) AS co2_saved
    FROM trips`).get();
  const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  res.json({
    users, trips: t.trips,
    distance: round(t.distance, 0),
    co2_saved: round(t.co2_saved, 1),
    trees: EcoCalc.treesEquivalent(t.co2_saved)
  });
});

// ---------- Pure calculation (no database) ----------
router.get('/calculate', (req, res) => {
  const { mode, distance, passengers } = req.query;
  if (!EcoCalc.MODES[mode]) throw new HttpError(400, 'Invalid mode');
  res.json(EcoCalc.calculateTrip(mode, Number(distance), Number(passengers)));
});

module.exports = router;
