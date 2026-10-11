const { getDb } = require('../database/schema');

function getStats(req, res) {
  const db = getDb();

  const total = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE deleted_at IS NULL").get().c;
  const open = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE status IN ('New', 'Investigating') AND deleted_at IS NULL").get().c;
  const critical = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE severity = 'Critical' AND deleted_at IS NULL").get().c;
  const investigating = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE status = 'Investigating' AND deleted_at IS NULL").get().c;
  const resolved = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE status IN ('Resolved', 'Closed') AND deleted_at IS NULL").get().c;

  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count FROM incidents WHERE deleted_at IS NULL GROUP BY severity
  `).all();

  const byType = db.prepare(`
    SELECT incident_type, COUNT(*) as count FROM incidents WHERE deleted_at IS NULL GROUP BY incident_type
  `).all();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM incidents WHERE deleted_at IS NULL GROUP BY status
  `).all();

  const trend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM incidents WHERE deleted_at IS NULL
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all().reverse();

  return res.json({ total, open, critical, investigating, resolved, bySeverity, byType, byStatus, trend });
}

function getRecentIncidents(req, res) {
  const db = getDb();
  const incidents = db.prepare(`
    SELECT i.*, u.name as analyst_name
    FROM incidents i
    LEFT JOIN users u ON i.assigned_analyst_id = u.id
    WHERE i.deleted_at IS NULL
    ORDER BY i.created_at DESC LIMIT 10
  `).all();
  return res.json(incidents);
}

function getActivity(req, res) {
  const db = getDb();
  const activity = db.prepare(`
    SELECT tl.*, u.name as actor_name, i.incident_code, i.title as incident_title
    FROM timeline_events tl
    LEFT JOIN users u ON tl.actor_id = u.id
    LEFT JOIN incidents i ON tl.incident_id = i.id
    ORDER BY tl.created_at DESC LIMIT 20
  `).all();
  return res.json(activity);
}

module.exports = { getStats, getRecentIncidents, getActivity };
