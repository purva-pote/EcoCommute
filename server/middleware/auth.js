// Verifies the JWT sent as "Authorization: Bearer <token>"
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ecocommute-dev-secret-change-me';

function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

/** Sets req.user if a valid token is present, but never blocks the request */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), JWT_SECRET); } catch { /* ignore */ }
  }
  next();
}

module.exports = { requireAuth, optionalAuth, signToken };
