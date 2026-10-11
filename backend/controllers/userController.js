const bcrypt = require('bcryptjs');
const { getDb } = require('../database/schema');

const VALID_ROLES = ['admin', 'analyst', 'viewer'];

function listUsers(req, res) {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC').all();
  return res.json(users);
}

function createUser(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create users' });
  const db = getDb();
  const { name, email, password, role } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (exists) return res.status(409).json({ error: 'Email already in use' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name.trim(), email.toLowerCase().trim(), hash, role);
  db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(req.user.id, 'create_user', 'user', result.lastInsertRowid);

  const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(user);
}

function updateUser(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can update users' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, role, is_active } = req.body;

  // Prevent removing last active admin
  if (role && role !== 'admin' && user.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND is_active = 1").get().c;
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot demote the last active administrator' });
  }
  if (is_active === 0 && user.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND is_active = 1").get().c;
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot deactivate the last active administrator' });
  }

  const newName = name?.trim() || user.name;
  const newRole = VALID_ROLES.includes(role) ? role : user.role;
  const newActive = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;

  db.prepare('UPDATE users SET name=?, role=?, is_active=? WHERE id=?').run(newName, newRole, newActive, user.id);
  db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(req.user.id, 'update_user', 'user', user.id);

  const updated = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(user.id);
  return res.json(updated);
}

function getAnalysts(req, res) {
  const db = getDb();
  const analysts = db.prepare("SELECT id, name, email, role FROM users WHERE role IN ('admin','analyst') AND is_active = 1 ORDER BY name").all();
  return res.json(analysts);
}

module.exports = { listUsers, createUser, updateUser, getAnalysts };
