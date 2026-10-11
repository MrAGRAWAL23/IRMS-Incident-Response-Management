const bcrypt = require('bcryptjs');
const { getDb } = require('../database/schema');
const { generateToken } = require('../middleware/auth');

function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);

  // Audit
  db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(user.id, 'login', 'user', user.id);

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

function logout(req, res) {
  if (req.user) {
    const db = getDb();
    db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(req.user.id, 'logout', 'user', req.user.id);
  }
  return res.json({ message: 'Logged out successfully' });
}

function me(req, res) {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
}

module.exports = { login, logout, me };
