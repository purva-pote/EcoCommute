// Verifies the JWT, then re-checks the database so a stale token cannot grant admin access
const db = require('../db');
const { requireAuth } = require('./auth');

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access only.' });
    req.user.role = user.role;
    next();
  });
}

module.exports = requireAdmin;
