// GET /api/leaderboard?metric=co2|score&period=all|month
const express = require('express');
const db = require('../db');
const EcoCalc = require('../../public/js/co2');
const { optionalAuth } = require('../middleware/auth');
const { toDateStr, round } = require('../utils');

const router = express.Router();

/** Ranked list of all users. Aggregation happens in SQL (efficient). */
function getLeaderboard(metric = 'co2', period = 'all') {
  const orderBy = metric === 'score' ? 'points DESC, co2_saved DESC' : 'co2_saved DESC, points DESC';
  // The period filter goes in the JOIN so users with no trips still appear (with 0)
  const periodJoin = period === 'month' ? 'AND substr(t.date,1,7) = ?' : '';
  const params = period === 'month' ? [toDateStr().slice(0, 7)] : [];

  const rows = db.prepare(`
    SELECT u.id, u.name,
           COUNT(t.id)                   AS trips,
           COALESCE(SUM(t.distance), 0)  AS distance,
           COALESCE(SUM(t.co2_saved), 0) AS co2_saved,
           COALESCE(SUM(t.points), 0)    AS points
    FROM users u
    LEFT JOIN trips t ON t.user_id = u.id ${periodJoin}
    GROUP BY u.id
    ORDER BY ${orderBy}, u.name ASC`).all(...params);

  // Level is always based on all-time points
  const allTime = new Map(db.prepare('SELECT user_id, SUM(points) AS p FROM trips GROUP BY user_id')
    .all().map(r => [r.user_id, r.p]));

  return rows.map((r, i) => ({
    rank: i + 1,
    id: r.id,
    name: r.name,
    trips: r.trips,
    distance: round(r.distance, 1),
    co2_saved: round(r.co2_saved, 2),
    points: r.points,
    level: EcoCalc.getLevel(allTime.get(r.id) || 0)
  }));
}

router.get('/', optionalAuth, (req, res) => {
  const metric = req.query.metric === 'score' ? 'score' : 'co2';
  const period = req.query.period === 'month' ? 'month' : 'all';
  res.json({
    metric, period,
    currentUserId: req.user ? req.user.id : null,
    leaderboard: getLeaderboard(metric, period)
  });
});

module.exports = { router, getLeaderboard };
