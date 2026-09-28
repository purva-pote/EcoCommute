// POST /api/trips · GET /api/trips · DELETE /api/trips/:id
const express = require('express');
const db = require('../db');
const EcoCalc = require('../../public/js/co2');
const { requireAuth } = require('../middleware/auth');
const { toDateStr, round, HttpError } = require('../utils');

const router = express.Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates the request body and returns clean values (never trust the client) */
function validateTrip(body) {
  const mode = String(body.mode || '');
  if (!EcoCalc.MODES[mode]) throw new HttpError(400, 'Please choose a valid travel mode.');

  const distance = Number(body.distance);
  const { minDistance, maxDistance, minPassengers, maxPassengers } = EcoCalc.LIMITS;
  if (!Number.isFinite(distance) || distance < minDistance || distance > maxDistance) {
    throw new HttpError(400, `Distance must be between ${minDistance} and ${maxDistance} km.`);
  }

  let passengers = 1;
  if (mode === 'carpool') {
    passengers = Number(body.passengers);
    if (!Number.isInteger(passengers) || passengers < minPassengers || passengers > maxPassengers) {
      throw new HttpError(400, `Carpool must have ${minPassengers}–${maxPassengers} people.`);
    }
  }

  const today = toDateStr();
  const date = body.date ? String(body.date) : today;
  if (!DATE_RE.test(date) || isNaN(new Date(date))) throw new HttpError(400, 'Invalid date.');
  if (date > today) throw new HttpError(400, 'You cannot log a trip in the future.');

  const note = body.note ? String(body.note).trim().slice(0, 100) : null;
  return { mode, distance: round(distance, 2), passengers, date, note };
}

function userTotals(userId) {
  const t = db.prepare(`
    SELECT COUNT(*) AS trips, COALESCE(SUM(co2_saved),0) AS co2_saved,
           COALESCE(SUM(points),0) AS points, COALESCE(SUM(distance),0) AS distance
    FROM trips WHERE user_id = ?`).get(userId);
  return { trips: t.trips, co2_saved: round(t.co2_saved, 2), points: t.points, distance: round(t.distance, 1) };
}

// Log a new trip: the SERVER calculates CO2 and points
router.post('/', (req, res) => {
  const trip = validateTrip(req.body);
  const calc = EcoCalc.calculateTrip(trip.mode, trip.distance, trip.passengers);

  const result = db.prepare(`
    INSERT INTO trips (user_id, mode, distance, passengers, date, co2_saved, points, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, trip.mode, trip.distance, trip.passengers, trip.date, calc.co2SavedKg, calc.points, trip.note);

  const saved = db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid);
  const totals = userTotals(req.user.id);
  res.status(201).json({ trip: saved, calc, totals, level: EcoCalc.getLevel(totals.points) });
});

// List my trips, with optional filters ?mode=cycle&month=2026-09&limit=5
router.get('/', (req, res) => {
  const where = ['user_id = ?'];
  const params = [req.user.id];

  if (req.query.mode && EcoCalc.MODES[req.query.mode]) { where.push('mode = ?'); params.push(req.query.mode); }
  if (/^\d{4}-\d{2}$/.test(req.query.month || '')) { where.push('substr(date,1,7) = ?'); params.push(req.query.month); }

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 1000, 1), 1000);
  params.push(limit);
  const trips = db.prepare(`
    SELECT * FROM trips WHERE ${where.join(' AND ')}
    ORDER BY date DESC, id DESC LIMIT ?`).all(...params);

  res.json({ trips });
});

// Delete one of MY trips
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const trip = db.prepare('SELECT user_id FROM trips WHERE id = ?').get(id);
  if (!trip) throw new HttpError(404, 'Trip not found.');
  if (trip.user_id !== req.user.id) throw new HttpError(403, 'You can only delete your own trips.');

  db.prepare('DELETE FROM trips WHERE id = ?').run(id);
  res.json({ ok: true, totals: userTotals(req.user.id) });
});

module.exports = router;
