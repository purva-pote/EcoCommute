// EcoCommute – Express server entry point
const path = require('path');
const express = require('express');
const cors = require('cors');

require('./db');                       // creates tables on first run
const { seedIfEmpty } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------- API routes ----------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api', require('./routes/stats'));             // /stats/:id, /community, /calculate
app.use('/api/leaderboard', require('./routes/leaderboard').router);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

// ---------- Frontend (static HTML/CSS/JS) ----------
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

// ---------- Central error handler ----------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong on the server.' : err.message });
});

seedIfEmpty();

app.listen(PORT, () => {
  console.log('');
  console.log('  🚲 EcoCommute is running!');
  console.log(`  ➜  Open http://localhost:${PORT} in your browser`);
  console.log('  (press Ctrl+C to stop)');
  console.log('');
});
