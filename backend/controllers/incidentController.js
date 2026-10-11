const { getDb } = require('../database/schema');
const { calculateRiskScore } = require('../services/riskScoring');

const VALID_TYPES = ['Phishing', 'Malware', 'Brute Force', 'Suspicious Login', 'Data Breach', 'Unauthorized Access', 'Ransomware', 'Other'];
const VALID_SEVERITY = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUS = ['New', 'Investigating', 'Contained', 'Resolved', 'Closed', 'False Positive'];
const VALID_ASSET_IMPORTANCE = ['Low', 'Medium', 'High', 'Critical'];
const VALID_CONFIDENCE = ['Low', 'Medium', 'High'];

function generateIncidentCode(db) {
  const year = new Date().getFullYear();
  const result = db.prepare(`
    INSERT INTO incident_sequence (year, last_seq) VALUES (?, 1)
    ON CONFLICT(year) DO UPDATE SET last_seq = last_seq + 1
    RETURNING last_seq
  `).get(year);
  return `INC-${year}-${String(result.last_seq).padStart(4, '0')}`;
}

function addTimeline(db, incidentId, actorId, eventType, description) {
  db.prepare('INSERT INTO timeline_events (incident_id, actor_id, event_type, description) VALUES (?, ?, ?, ?)').run(incidentId, actorId, eventType, description);
}

function addAuditLog(db, actorId, action, entityType, entityId, details) {
  db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)').run(actorId, action, entityType, entityId, details || null);
}

// GET /api/incidents
function listIncidents(req, res) {
  const db = getDb();
  const { search, severity, status, incident_type, analyst, sort = 'created_at', order = 'DESC', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['i.deleted_at IS NULL'];
  const params = [];

  if (search) { where.push("(i.incident_code LIKE ? OR i.title LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (severity) { where.push('i.severity = ?'); params.push(severity); }
  if (status) { where.push('i.status = ?'); params.push(status); }
  if (incident_type) { where.push('i.incident_type = ?'); params.push(incident_type); }
  if (analyst) { where.push('i.assigned_analyst_id = ?'); params.push(parseInt(analyst)); }

  const validSorts = ['created_at', 'risk_score', 'severity', 'status', 'updated_at'];
  const sortCol = validSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  const whereClause = where.join(' AND ');
  const countRow = db.prepare(`SELECT COUNT(*) as c FROM incidents i WHERE ${whereClause}`).get(...params);
  const total = countRow.c;

  const incidents = db.prepare(`
    SELECT i.*, u.name as analyst_name, cb.name as created_by_name
    FROM incidents i
    LEFT JOIN users u ON i.assigned_analyst_id = u.id
    LEFT JOIN users cb ON i.created_by = cb.id
    WHERE ${whereClause}
    ORDER BY i.${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  return res.json({ incidents, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
}

// GET /api/incidents/:id
function getIncident(req, res) {
  const db = getDb();
  const incident = db.prepare(`
    SELECT i.*, u.name as analyst_name, cb.name as created_by_name
    FROM incidents i
    LEFT JOIN users u ON i.assigned_analyst_id = u.id
    LEFT JOIN users cb ON i.created_by = cb.id
    WHERE i.id = ? AND i.deleted_at IS NULL
  `).get(req.params.id);

  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  return res.json(incident);
}

// POST /api/incidents
function createIncident(req, res) {
  const db = getDb();
  const { title, description, incident_type, severity, source, affected_asset, affected_user, assigned_analyst_id, asset_importance = 'Medium', potential_impact = 'Medium', threat_confidence = 'Medium' } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' });

  if (!VALID_TYPES.includes(incident_type)) return res.status(400).json({ error: 'Invalid incident type' });
  if (!VALID_SEVERITY.includes(severity)) return res.status(400).json({ error: 'Invalid severity' });
  if (!VALID_ASSET_IMPORTANCE.includes(asset_importance)) return res.status(400).json({ error: 'Invalid asset importance' });
  if (!VALID_ASSET_IMPORTANCE.includes(potential_impact)) return res.status(400).json({ error: 'Invalid potential impact' });
  if (!VALID_CONFIDENCE.includes(threat_confidence)) return res.status(400).json({ error: 'Invalid threat confidence' });

  if (assigned_analyst_id) {
    const analyst = db.prepare('SELECT id, role FROM users WHERE id = ? AND is_active = 1').get(assigned_analyst_id);
    if (!analyst || analyst.role === 'viewer') return res.status(400).json({ error: 'Invalid analyst assignment' });
  }

  const risk_score = calculateRiskScore({ severity, asset_importance, potential_impact, threat_confidence });
  const incident_code = generateIncidentCode(db);

  const result = db.prepare(`
    INSERT INTO incidents (incident_code, title, description, incident_type, severity, source, affected_asset, affected_user, asset_importance, potential_impact, threat_confidence, risk_score, assigned_analyst_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(incident_code, title.trim(), description.trim(), incident_type, severity, source?.trim() || null, affected_asset?.trim() || null, affected_user?.trim() || null, asset_importance, potential_impact, threat_confidence, risk_score, assigned_analyst_id || null, req.user.id);

  const incId = result.lastInsertRowid;

  addTimeline(db, incId, req.user.id, 'incident_created', `Incident ${incident_code} created: ${title.trim()}`);
  if (assigned_analyst_id) {
    const analyst = db.prepare('SELECT name FROM users WHERE id = ?').get(assigned_analyst_id);
    addTimeline(db, incId, req.user.id, 'incident_assigned', `Incident assigned to ${analyst?.name || 'Analyst'}`);
  }
  addAuditLog(db, req.user.id, 'create_incident', 'incident', incId, incident_code);

  const created = db.prepare('SELECT i.*, u.name as analyst_name FROM incidents i LEFT JOIN users u ON i.assigned_analyst_id = u.id WHERE i.id = ?').get(incId);
  return res.status(201).json(created);
}

// PUT /api/incidents/:id
function updateIncident(req, res) {
  const db = getDb();
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  // Viewers cannot edit
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });
  // Analysts can only edit their assigned incidents
  if (req.user.role === 'analyst' && incident.assigned_analyst_id !== req.user.id && incident.created_by !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit incidents assigned to you' });
  }

  const { title, description, incident_type, severity, source, affected_asset, affected_user, assigned_analyst_id, asset_importance, potential_impact, threat_confidence } = req.body;

  const newTitle = title?.trim() || incident.title;
  const newDesc = description?.trim() || incident.description;
  const newType = VALID_TYPES.includes(incident_type) ? incident_type : incident.incident_type;
  const newSeverity = VALID_SEVERITY.includes(severity) ? severity : incident.severity;
  const newSource = source !== undefined ? source?.trim() : incident.source;
  const newAsset = affected_asset !== undefined ? affected_asset?.trim() : incident.affected_asset;
  const newUser = affected_user !== undefined ? affected_user?.trim() : incident.affected_user;
  const newAssetImp = VALID_ASSET_IMPORTANCE.includes(asset_importance) ? asset_importance : incident.asset_importance;
  const newImpact = VALID_ASSET_IMPORTANCE.includes(potential_impact) ? potential_impact : incident.potential_impact;
  const newConfidence = VALID_CONFIDENCE.includes(threat_confidence) ? threat_confidence : incident.threat_confidence;

  let newAnalyst = incident.assigned_analyst_id;
  if (assigned_analyst_id !== undefined) {
    if (assigned_analyst_id === null || assigned_analyst_id === '') {
      newAnalyst = null;
    } else {
      const analyst = db.prepare('SELECT id, role FROM users WHERE id = ? AND is_active = 1').get(assigned_analyst_id);
      if (!analyst || analyst.role === 'viewer') return res.status(400).json({ error: 'Invalid analyst assignment' });
      newAnalyst = assigned_analyst_id;
    }
  }

  const newRisk = calculateRiskScore({ severity: newSeverity, asset_importance: newAssetImp, potential_impact: newImpact, threat_confidence: newConfidence });

  db.prepare(`
    UPDATE incidents SET title=?, description=?, incident_type=?, severity=?, source=?, affected_asset=?, affected_user=?,
    asset_importance=?, potential_impact=?, threat_confidence=?, risk_score=?, assigned_analyst_id=?, updated_at=datetime('now')
    WHERE id=?
  `).run(newTitle, newDesc, newType, newSeverity, newSource, newAsset, newUser, newAssetImp, newImpact, newConfidence, newRisk, newAnalyst, incident.id);

  if (newSeverity !== incident.severity) addTimeline(db, incident.id, req.user.id, 'severity_updated', `Severity changed from ${incident.severity} to ${newSeverity}`);
  if (newAnalyst !== incident.assigned_analyst_id) {
    const analystName = newAnalyst ? db.prepare('SELECT name FROM users WHERE id = ?').get(newAnalyst)?.name : 'Unassigned';
    addTimeline(db, incident.id, req.user.id, 'incident_assigned', `Analyst assignment changed to ${analystName}`);
  }
  addAuditLog(db, req.user.id, 'update_incident', 'incident', incident.id, incident.incident_code);

  const updated = db.prepare('SELECT i.*, u.name as analyst_name FROM incidents i LEFT JOIN users u ON i.assigned_analyst_id = u.id WHERE i.id = ?').get(incident.id);
  return res.json(updated);
}

// PATCH /api/incidents/:id/status
function updateStatus(req, res) {
  const db = getDb();
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

  const { status, resolution_summary } = req.body;
  if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  // Validation rules
  if (status === 'Resolved' && !resolution_summary?.trim()) {
    return res.status(400).json({ error: 'A resolution summary is required to mark an incident as Resolved' });
  }
  if (status === 'False Positive' && !resolution_summary?.trim()) {
    return res.status(400).json({ error: 'An explanation is required when marking an incident as False Positive' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  let resolved_at = incident.resolved_at;
  let closed_at = incident.closed_at;

  if (status === 'Resolved' || status === 'False Positive') resolved_at = now;
  if (status === 'Closed') closed_at = now;

  db.prepare(`
    UPDATE incidents SET status=?, resolution_summary=COALESCE(?, resolution_summary), resolved_at=?, closed_at=?, updated_at=datetime('now')
    WHERE id=?
  `).run(status, resolution_summary?.trim() || null, resolved_at, closed_at, incident.id);

  addTimeline(db, incident.id, req.user.id, 'status_changed', `Status changed from ${incident.status} to ${status}`);
  addAuditLog(db, req.user.id, 'update_status', 'incident', incident.id, `${incident.incident_code}: ${incident.status} -> ${status}`);

  const updated = db.prepare('SELECT i.*, u.name as analyst_name FROM incidents i LEFT JOIN users u ON i.assigned_analyst_id = u.id WHERE i.id = ?').get(incident.id);
  return res.json(updated);
}

// DELETE /api/incidents/:id (soft delete, admin only)
function deleteIncident(req, res) {
  const db = getDb();
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete incidents' });

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  db.prepare("UPDATE incidents SET deleted_at=datetime('now'), updated_at=datetime('now') WHERE id=?").run(incident.id);
  addAuditLog(db, req.user.id, 'delete_incident', 'incident', incident.id, incident.incident_code);

  return res.json({ message: 'Incident deleted' });
}

// GET /api/incidents/:id/notes
function getNotes(req, res) {
  const db = getDb();
  const notes = db.prepare(`
    SELECT n.*, u.name as author_name FROM investigation_notes n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.incident_id = ? ORDER BY n.created_at ASC
  `).all(req.params.id);
  return res.json(notes);
}

// POST /api/incidents/:id/notes
function addNote(req, res) {
  const db = getDb();
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const { note } = req.body;
  if (!note?.trim()) return res.status(400).json({ error: 'Note text is required' });
  if (note.length > 5000) return res.status(400).json({ error: 'Note too long (max 5000 characters)' });

  const result = db.prepare('INSERT INTO investigation_notes (incident_id, author_id, note) VALUES (?, ?, ?)').run(incident.id, req.user.id, note.trim());
  db.prepare("UPDATE incidents SET updated_at=datetime('now') WHERE id=?").run(incident.id);
  addTimeline(db, incident.id, req.user.id, 'note_added', 'Investigation note added');
  addAuditLog(db, req.user.id, 'add_note', 'incident', incident.id, incident.incident_code);

  const created = db.prepare('SELECT n.*, u.name as author_name FROM investigation_notes n LEFT JOIN users u ON n.author_id = u.id WHERE n.id = ?').get(result.lastInsertRowid);
  return res.status(201).json(created);
}

// GET /api/incidents/:id/evidence
function getEvidence(req, res) {
  const db = getDb();
  const evidence = db.prepare(`
    SELECT e.*, u.name as added_by_name FROM evidence e
    LEFT JOIN users u ON e.added_by = u.id
    WHERE e.incident_id = ? ORDER BY e.created_at ASC
  `).all(req.params.id);
  return res.json(evidence);
}

// POST /api/incidents/:id/evidence
function addEvidence(req, res) {
  const db = getDb();
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const VALID_EVIDENCE_TYPES = ['Log', 'Screenshot', 'IP Address', 'Domain', 'File Hash', 'Document', 'Other'];
  const { name, evidence_type, description, reference } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Evidence name is required' });
  if (!VALID_EVIDENCE_TYPES.includes(evidence_type)) return res.status(400).json({ error: 'Invalid evidence type' });

  const result = db.prepare('INSERT INTO evidence (incident_id, name, evidence_type, description, reference, added_by) VALUES (?, ?, ?, ?, ?, ?)').run(incident.id, name.trim(), evidence_type, description?.trim() || null, reference?.trim() || null, req.user.id);
  db.prepare("UPDATE incidents SET updated_at=datetime('now') WHERE id=?").run(incident.id);
  addTimeline(db, incident.id, req.user.id, 'evidence_added', `Evidence added: ${name.trim()}`);
  addAuditLog(db, req.user.id, 'add_evidence', 'incident', incident.id, incident.incident_code);

  const created = db.prepare('SELECT e.*, u.name as added_by_name FROM evidence e LEFT JOIN users u ON e.added_by = u.id WHERE e.id = ?').get(result.lastInsertRowid);
  return res.status(201).json(created);
}

// GET /api/incidents/:id/actions
function getActions(req, res) {
  const db = getDb();
  const actions = db.prepare(`
    SELECT ra.*, u.name as performed_by_name FROM response_actions ra
    LEFT JOIN users u ON ra.performed_by = u.id
    WHERE ra.incident_id = ? ORDER BY ra.created_at ASC
  `).all(req.params.id);
  return res.json(actions);
}

// POST /api/incidents/:id/actions
function addAction(req, res) {
  const db = getDb();
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const VALID_ACTIONS = ['Block IP', 'Reset Password', 'Disable Account', 'Isolate Device', 'Block Domain', 'Remove Malware', 'Restore System', 'Other'];
  const VALID_ACTION_STATUS = ['Pending', 'Completed', 'Failed'];

  const { action_type, description, result, status = 'Completed' } = req.body;
  if (!VALID_ACTIONS.includes(action_type)) return res.status(400).json({ error: 'Invalid action type' });
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' });
  if (!VALID_ACTION_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid action status' });

  const insertResult = db.prepare('INSERT INTO response_actions (incident_id, action_type, description, result, status, performed_by) VALUES (?, ?, ?, ?, ?, ?)').run(incident.id, action_type, description.trim(), result?.trim() || null, status, req.user.id);
  db.prepare("UPDATE incidents SET updated_at=datetime('now') WHERE id=?").run(incident.id);
  addTimeline(db, incident.id, req.user.id, 'action_recorded', `Response action recorded: ${action_type}`);
  addAuditLog(db, req.user.id, 'add_action', 'incident', incident.id, `${incident.incident_code}: ${action_type}`);

  const created = db.prepare('SELECT ra.*, u.name as performed_by_name FROM response_actions ra LEFT JOIN users u ON ra.performed_by = u.id WHERE ra.id = ?').get(insertResult.lastInsertRowid);
  return res.status(201).json(created);
}

// GET /api/incidents/:id/timeline
function getTimeline(req, res) {
  const db = getDb();
  const events = db.prepare(`
    SELECT tl.*, u.name as actor_name FROM timeline_events tl
    LEFT JOIN users u ON tl.actor_id = u.id
    WHERE tl.incident_id = ? ORDER BY tl.created_at ASC
  `).all(req.params.id);
  return res.json(events);
}

module.exports = {
  listIncidents, getIncident, createIncident, updateIncident, updateStatus, deleteIncident,
  getNotes, addNote, getEvidence, addEvidence, getActions, addAction, getTimeline,
};
