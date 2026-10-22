// GET /api/transit · GET /api/transit/departures?route=&from=&to=&time=HH:MM
const express = require('express');
const EcoCalc = require('../../public/js/co2');
const DATA = require('../transit-data');
const { round, HttpError } = require('../utils');

const router = express.Router();

/** "05:30" → 330 minutes after midnight. Times after midnight ("00:30") count as the next day. */
function toMinutes(hhmm, dayStart = 0) {
  const [h, m] = hhmm.split(':').map(Number);
  const min = h * 60 + m;
  return min < dayStart ? min + 1440 : min;
}

/** 1470 → "00:30" */
function toClock(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

function findRoute(id) {
  for (const [modeKey, mode] of Object.entries(DATA.modes)) {
    const route = mode.routes.find(r => r.id === id);
    if (route) return { route, modeKey, mode };
  }
  return null;
}

/** All departure times from the first stop for one service day, following the frequency bands */
function serviceDepartures(route) {
  const first = toMinutes(route.first);
  const last = toMinutes(route.last, first);
  const times = [];
  for (let t = first; t <= last; ) {
    times.push(t);
    const band = route.bands.find(b => t < b.until * 60) || route.bands[route.bands.length - 1];
    t += band.every;
  }
  return times;
}

/** Minutes from the start of the line to stop i (running time + 30 s stop at each station) */
function minutesToStop(route, i) {
  return route.stops[i][1] * route.minPerKm + i * 0.5;
}

// ---------- List of all lines and stops (used to build the dropdowns) ----------
router.get('/', (req, res) => {
  const modes = {};
  for (const [key, mode] of Object.entries(DATA.modes)) {
    modes[key] = {
      label: mode.label,
      icon: mode.icon,
      routes: mode.routes.map(r => ({
        id: r.id, name: r.name, short: r.short, color: r.color, operator: r.operator,
        first: r.first, last: r.last, stops: r.stops.map(s => s[0])
      }))
    };
  }
  res.json({ modes });
});

// ---------- Next departures between two stops ----------
router.get('/departures', (req, res) => {
  const found = findRoute(String(req.query.route || ''));
  if (!found) throw new HttpError(400, 'Unknown route.');
  const { route, modeKey } = found;

  const names = route.stops.map(s => s[0]);
  const fromIdx = names.indexOf(req.query.from);
  const toIdx = names.indexOf(req.query.to);
  if (fromIdx < 0 || toIdx < 0) throw new HttpError(400, 'Please pick stops on this route.');
  if (fromIdx === toIdx) throw new HttpError(400, 'Pick two different stops.');

  const time = /^\d{2}:\d{2}$/.test(req.query.time || '') ? req.query.time : null;
  if (!time) throw new HttpError(400, 'Time must be HH:MM.');
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 20);

  // Direction: trains leave from both ends on the same pattern.
  // Going "backwards" we measure time from the last stop instead of the first.
  const forward = fromIdx < toIdx;
  const total = minutesToStop(route, names.length - 1);
  const offset = (i) => (forward ? minutesToStop(route, i) : total - minutesToStop(route, i));
  const fromOffset = offset(fromIdx);
  const travel = Math.round(offset(toIdx) - fromOffset);

  // Departure times at the "from" stop. The line's first/last times and rush-hour
  // bands are treated as times at your station (trains start from several depots,
  // so every station gets service across the whole day). A small shift based on
  // the station's position keeps neighbouring stations from showing identical times.
  // Late-night services (after midnight) are also checked as "earlier today",
  // so searching at 00:20 still finds the 00:25 train.
  const query = toMinutes(time);
  const shift = Math.round(fromOffset) % 4;
  const atStop = serviceDepartures(route).map(t => t + shift);
  const candidates = atStop.flatMap(t => [t, t - 1440]).filter(t => t >= query && t < query + 1440).sort((a, b) => a - b);

  const departures = candidates.slice(0, limit).map(t => ({
    depart: toClock(t),
    arrive: toClock(t + travel),
    waitMin: Math.round(t - query)
  }));

  const distance = round(Math.abs(route.stops[toIdx][1] - route.stops[fromIdx][1]), 1);
  const calc = EcoCalc.calculateTrip('public', distance, 1);

  // Stops passed on this trip, in travel order
  const tripStops = forward ? names.slice(fromIdx, toIdx + 1) : names.slice(toIdx, fromIdx + 1).reverse();

  res.json({
    route: { id: route.id, name: route.name, short: route.short, color: route.color, operator: route.operator, mode: modeKey },
    from: names[fromIdx], to: names[toIdx],
    direction: forward ? `towards ${names[names.length - 1]}` : `towards ${names[0]}`,
    distance, travelMin: travel, stopsCount: tripStops.length - 1, tripStops,
    calc: { co2SavedKg: calc.co2SavedKg, points: calc.points },
    firstDeparture: toClock(atStop[0]),
    lastDeparture: toClock(atStop[atStop.length - 1]),
    departures
  });
});

module.exports = router;
