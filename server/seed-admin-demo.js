// Adds 26 extra users with staggered join dates and trips, so the admin pages
// (pagination, search, "new users" KPI, charts) have something to show.
// Safe to run more than once: users that already exist are skipped. Run with:  npm run seed:admin
const bcrypt = require('bcryptjs');
const db = require('./db');
const EcoCalc = require('../public/js/co2');
const { toDateStr, addDays } = require('./utils');

const FIRST = ['Meera', 'Arjun', 'Saanvi', 'Aditya', 'Nisha', 'Kunal', 'Tara', 'Dev', 'Riya', 'Neil', 'Pooja',
               'Yash', 'Sneha', 'Harsh', 'Kavya', 'Manav', 'Zoya', 'Parth', 'Lata', 'Omkar', 'Sara', 'Veer',
               'Tanvi', 'Rahul', 'Esha', 'Dhruv'];
const LAST = ['Joshi', 'Nair', 'Reddy', 'Shah', 'Desai', 'Kulkarni', 'Bose', 'Menon', 'Verma', 'Pillai', 'Rao',
              'Chopra', 'Sethi', 'Patil', 'Ghosh', 'Malhotra', 'Khan', 'Jain', 'Bhatt', 'Naik', 'Dsouza', 'Sinha',
              'Pandey', 'Mishra', 'Saxena', 'Thakur'];
const MODES = ['walk', 'cycle', 'public', 'carpool'];
const NOTES = ['Home → College', 'College → Home', 'To the library', 'Market run', 'Gym', 'Weekend ride', null, null];

// Small deterministic random generator, so the data is the same every time
let state = 7;
const rand = () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
const between = (a, b) => a + rand() * (b - a);

const today = toDateStr();
const hash = bcrypt.hashSync('password123', 10);
const findUser = db.prepare('SELECT id FROM users WHERE email = ?');
const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)');
const insertTrip = db.prepare(`
  INSERT INTO trips (user_id, mode, distance, passengers, date, co2_saved, points, note)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

let added = 0;
db.exec('BEGIN');
try {
  FIRST.forEach((first, i) => {
    const email = `${first.toLowerCase()}@ecocommute.test`;
    if (findUser.get(email)) return;

    // First 10 joined in the last 30 days, the rest 31-120 days ago
    const joinedDaysAgo = i < 10 ? Math.floor(between(1, 29)) : Math.floor(between(31, 120));
    const joined = addDays(today, -joinedDaysAgo);
    const userId = insertUser.run(`${first} ${LAST[i]}`, email, hash, joined + ' 10:00:00').lastInsertRowid;

    const activity = i % 7 === 0 ? 0 : between(0.2, 0.7);       // a few users never logged a trip
    const favourite = MODES[i % 4];
    for (let d = joinedDaysAgo; d >= 1; d--) {
      if (rand() > activity) continue;
      const mode = rand() < 0.6 ? favourite : MODES[Math.floor(rand() * 4)];
      const distance = Math.round(between(1, 15) * 10) / 10;
      const passengers = mode === 'carpool' ? 2 + Math.floor(rand() * 3) : 1;
      const calc = EcoCalc.calculateTrip(mode, distance, passengers);
      insertTrip.run(userId, mode, distance, passengers, addDays(today, -d), calc.co2SavedKg, calc.points,
        NOTES[Math.floor(rand() * NOTES.length)]);
    }
    added++;
  });
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

const total = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
console.log(`Added ${added} users (${total} in total). Their password is password123.`);
