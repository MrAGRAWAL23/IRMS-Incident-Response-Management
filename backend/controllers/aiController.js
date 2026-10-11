const { getDb } = require('../database/schema');
const { runAIAnalysis, runAIChat } = require('../services/aiService');

async function analyzeIncident(req, res) {
  const db = getDb();
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const notes = db.prepare('SELECT note FROM investigation_notes WHERE incident_id = ? ORDER BY created_at ASC').all(incident.id);
  const evidence = db.prepare('SELECT name, evidence_type, description FROM evidence WHERE incident_id = ?').all(incident.id);

  let analysis;
  try {
    analysis = await runAIAnalysis(incident, notes, evidence);
  } catch (err) {
    console.error('AI analysis error:', err);
    return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
  }

  const result = db.prepare(`
    INSERT INTO ai_analyses (incident_id, provider_mode, summary, attack_type, risk_explanation, findings_json, recommendations_json, evidence_recommendations_json, confidence_notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    incident.id,
    analysis.provider_mode,
    analysis.summary,
    analysis.attack_type,
    analysis.risk_explanation,
    JSON.stringify(analysis.findings || []),
    JSON.stringify(analysis.recommendations || []),
    JSON.stringify(analysis.evidence_to_collect || []),
    analysis.confidence_notes,
    req.user.id
  );

  db.prepare("UPDATE incidents SET updated_at=datetime('now') WHERE id=?").run(incident.id);
  db.prepare('INSERT INTO timeline_events (incident_id, actor_id, event_type, description) VALUES (?, ?, ?, ?)').run(incident.id, req.user.id, 'ai_analysis', `AI analysis completed (${analysis.provider_mode} mode)`);
  db.prepare('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(req.user.id, 'ai_analysis', 'incident', incident.id);

  const saved = db.prepare('SELECT * FROM ai_analyses WHERE id = ?').get(result.lastInsertRowid);
  return res.json(parseAnalysis(saved));
}

function getAnalyses(req, res) {
  const db = getDb();
  const analyses = db.prepare(`
    SELECT a.*, u.name as created_by_name FROM ai_analyses a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.incident_id = ? ORDER BY a.created_at DESC
  `).all(req.params.id);
  return res.json(analyses.map(parseAnalysis));
}

function parseAnalysis(a) {
  return {
    ...a,
    findings: safeParseJSON(a.findings_json, []),
    recommendations: safeParseJSON(a.recommendations_json, []),
    evidence_to_collect: safeParseJSON(a.evidence_recommendations_json, []),
  };
}

function safeParseJSON(str, fallback) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

async function chatWithAI(req, res) {
  const db = getDb();
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Insufficient permissions' });

  const incident = db.prepare('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const { question } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });
  if (question.length > 1000) return res.status(400).json({ error: 'Question too long' });

  const notes = db.prepare('SELECT note FROM investigation_notes WHERE incident_id = ? ORDER BY created_at ASC').all(incident.id);

  try {
    const result = await runAIChat(incident, question.trim(), notes);
    return res.json(result);
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'AI chat failed. Please try again.' });
  }
}

module.exports = { analyzeIncident, getAnalyses, chatWithAI };
