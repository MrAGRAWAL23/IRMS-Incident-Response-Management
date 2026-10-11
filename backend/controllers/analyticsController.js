const { getDb } = require('../database/schema');

function getAnalytics(req, res) {
  const db = getDb();
  const { from, to, severity } = req.query;

  let where = ['deleted_at IS NULL'];
  const params = [];
  if (from) { where.push('created_at >= ?'); params.push(from); }
  if (to) { where.push('created_at <= ?'); params.push(to + ' 23:59:59'); }
  if (severity) { where.push('severity = ?'); params.push(severity); }

  const wc = where.join(' AND ');

  const totals = db.prepare(`SELECT COUNT(*) as total,
    SUM(CASE WHEN status IN ('New','Investigating') THEN 1 ELSE 0 END) as open,
    SUM(CASE WHEN status IN ('Resolved','Closed') THEN 1 ELSE 0 END) as resolved,
    SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical
    FROM incidents WHERE ${wc}`).get(...params);

  const byType = db.prepare(`SELECT incident_type, COUNT(*) as count FROM incidents WHERE ${wc} GROUP BY incident_type ORDER BY count DESC`).all(...params);
  const bySeverity = db.prepare(`SELECT severity, COUNT(*) as count FROM incidents WHERE ${wc} GROUP BY severity`).all(...params);
  const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM incidents WHERE ${wc} GROUP BY status`).all(...params);
  const trend = db.prepare(`SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM incidents WHERE ${wc} GROUP BY month ORDER BY month ASC`).all(...params);
  const avgRisk = db.prepare(`SELECT ROUND(AVG(risk_score), 1) as avg_risk FROM incidents WHERE ${wc}`).get(...params);

  return res.json({ totals, byType, bySeverity, byStatus, trend, avgRisk: avgRisk?.avg_risk || 0 });
}

module.exports = { getAnalytics };
