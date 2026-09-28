// Demo data so the dashboard, charts and leaderboard look alive during the presentation.
// Runs automatically when the database is empty. Force a reset with:  npm run seed
const bcrypt = require('bcryptjs');
const db = require('./db');
const EcoCalc = require('../public/js/co2');
const { toDateStr, addDays } = require('./utils');

// Demo login used on the login page's "Use demo account" button
const DEMO = { name: 'Demo User', email: 'demo@ecocommute.test', password: 'demo1234' };

// Each person has a commuting "habit": how often they log trips and which modes they prefer
const PEOPLE = [
  { name: 'Aarav Sharma',  activity: 0.80, modes: { cycle: 5, walk: 2, public: 2 },            km: [3, 12] },
  { name: 'Diya Patel',    activity: 0.70, modes: { public: 5, walk: 3 },                      km: [4, 18] },
  { name: 'Kabir Singh',   activity: 0.55, modes: { carpool: 4, public: 3, cycle: 1 },         km: [6, 22] },
  { name: 'Ananya Iyer',   activity: 0.75, modes: { walk: 5, cycle: 3 },                       km: [1, 6] },
  { name: 'Rohan Mehta',   activity: 0.45, modes: { cycle: 4, public: 2 },                     km: [4, 15] },
  { name: 'Isha Kapoor',   activity: 0.60, modes: { public: 3, carpool: 3, walk: 2 },          km: [3, 14] },
  { name: 'Vivaan Gupta',  activity: 0.35, modes: { cycle: 3, walk: 3, public: 1 },            km: [2, 10] },
  { name: DEMO.name,       activity: 0.56, modes: { cycle: 3, public: 3, walk: 2, carpool: 1 }, km: [2, 12], demo: true }
];

const NOTES = ['Home → College', 'College → Home', 'To the library', 'Market run', 'Gym', 'Weekend ride', null, null];
const DAYS_BACK = 150;

// Small deterministic random generator, so the demo data is the same every time
function makeRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function pickWeighted(weights, rand) {
  const entries = Object.entries(weights);
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [key, w] of entries) { if ((r -= w) < 0) return key; }
  return entries[0][0];
}

function seed() {
  const rand = makeRandom(42);
  const today = toDateStr();
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)');
  const insertTrip = db.prepare(`
    INSERT INTO trips (user_id, mode, distance, passengers, date, co2_saved, points, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const otherHash = bcrypt.hashSync('password123', 10);

  db.exec('BEGIN');
  try {
    for (const p of PEOPLE) {
      const email = p.demo ? DEMO.email : p.name.split(' ')[0].toLowerCase() + '@ecocommute.test';
      const hash = p.demo ? bcrypt.hashSync(DEMO.password, 10) : otherHash;
      const userId = insertUser.run(p.name, email, hash, addDays(today, -DAYS_BACK) + ' 09:00:00').lastInsertRowid;

      for (let d = DAYS_BACK; d >= 1; d--) {           // leave today empty for the live demo
        if (rand() > p.activity) continue;
        const tripsToday = rand() < 0.3 ? 2 : 1;
        for (let k = 0; k < tripsToday; k++) {
          const mode = pickWeighted(p.modes, rand);
          const distance = Math.round((p.km[0] + rand() * (p.km[1] - p.km[0])) * 10) / 10;
          const passengers = mode === 'carpool' ? 2 + Math.floor(rand() * 3) : 1;
          const calc = EcoCalc.calculateTrip(mode, distance, passengers);
          const note = NOTES[Math.floor(rand() * NOTES.length)];
          insertTrip.run(userId, mode, distance, passengers, addDays(today, -d), calc.co2SavedKg, calc.points, note);
        }
      }
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function seedIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (n === 0) {
    seed();
    console.log('  ✔ Demo data created (8 users with trip history)');
  }
}

// `npm run seed` → wipe and recreate the demo data
if (require.main === module && process.argv.includes('--reset')) {
  db.exec('DELETE FROM trips; DELETE FROM users; DELETE FROM sqlite_sequence;');
  seed();
  console.log('Database reset with fresh demo data.');
}

module.exports = { seedIfEmpty, DEMO };
