const { getDb } = require('../database/schema');

function getReport(req, res) {
  const db = getDb();
  const incident = db.prepare(`
    SELECT i.*, u.name as analyst_name, cb.name as created_by_name
    FROM incidents i
    LEFT JOIN users u ON i.assigned_analyst_id = u.id
    LEFT JOIN users cb ON i.created_by = cb.id
    WHERE i.id = ? AND i.deleted_at IS NULL
  `).get(req.params.id);

  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const notes = db.prepare('SELECT n.*, u.name as author_name FROM investigation_notes n LEFT JOIN users u ON n.author_id = u.id WHERE n.incident_id = ? ORDER BY n.created_at ASC').all(incident.id);
  const evidence = db.prepare('SELECT e.*, u.name as added_by_name FROM evidence e LEFT JOIN users u ON e.added_by = u.id WHERE e.incident_id = ? ORDER BY e.created_at ASC').all(incident.id);
  const actions = db.prepare('SELECT ra.*, u.name as performed_by_name FROM response_actions ra LEFT JOIN users u ON ra.performed_by = u.id WHERE ra.incident_id = ? ORDER BY ra.created_at ASC').all(incident.id);
  const timeline = db.prepare('SELECT tl.*, u.name as actor_name FROM timeline_events tl LEFT JOIN users u ON tl.actor_id = u.id WHERE tl.incident_id = ? ORDER BY tl.created_at ASC').all(incident.id);
  const latestAI = db.prepare('SELECT a.*, u.name as created_by_name FROM ai_analyses a LEFT JOIN users u ON a.created_by = u.id WHERE a.incident_id = ? ORDER BY a.created_at DESC LIMIT 1').get(incident.id);

  const analysis = latestAI ? {
    ...latestAI,
    findings: safeJSON(latestAI.findings_json, []),
    recommendations: safeJSON(latestAI.recommendations_json, []),
    evidence_to_collect: safeJSON(latestAI.evidence_recommendations_json, []),
  } : null;

  return res.json({ incident, notes, evidence, actions, timeline, analysis });
}

function listReports(req, res) {
  const db = getDb();
  const incidents = db.prepare(`
    SELECT i.id, i.incident_code, i.title, i.incident_type, i.severity, i.status, i.risk_score, i.created_at, i.resolved_at, u.name as analyst_name
    FROM incidents i
    LEFT JOIN users u ON i.assigned_analyst_id = u.id
    WHERE i.deleted_at IS NULL
    ORDER BY i.created_at DESC
  `).all();
  return res.json(incidents);
}

function safeJSON(str, fallback) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

module.exports = { getReport, listReports };
