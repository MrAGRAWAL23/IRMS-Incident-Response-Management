const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'irms.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeSchema() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'analyst', 'viewer')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      incident_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('Low', 'Medium', 'High', 'Critical')),
      status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'Investigating', 'Contained', 'Resolved', 'Closed', 'False Positive')),
      source TEXT,
      affected_asset TEXT,
      affected_user TEXT,
      asset_importance TEXT DEFAULT 'Medium' CHECK(asset_importance IN ('Low', 'Medium', 'High', 'Critical')),
      potential_impact TEXT DEFAULT 'Medium' CHECK(potential_impact IN ('Low', 'Medium', 'High', 'Critical')),
      threat_confidence TEXT DEFAULT 'Medium' CHECK(threat_confidence IN ('Low', 'Medium', 'High')),
      risk_score INTEGER NOT NULL DEFAULT 0,
      assigned_analyst_id INTEGER REFERENCES users(id),
      created_by INTEGER NOT NULL REFERENCES users(id),
      resolution_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      closed_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS investigation_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id),
      author_id INTEGER NOT NULL REFERENCES users(id),
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id),
      name TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      description TEXT,
      reference TEXT,
      added_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS response_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id),
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      result TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Completed', 'Failed')),
      performed_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id),
      actor_id INTEGER REFERENCES users(id),
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id),
      provider_mode TEXT NOT NULL DEFAULT 'demo',
      summary TEXT,
      attack_type TEXT,
      risk_explanation TEXT,
      findings_json TEXT,
      recommendations_json TEXT,
      evidence_recommendations_json TEXT,
      confidence_notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS incident_sequence (
      year INTEGER PRIMARY KEY,
      last_seq INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
    CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);
    CREATE INDEX IF NOT EXISTS idx_incidents_assigned_analyst ON incidents(assigned_analyst_id);
    CREATE INDEX IF NOT EXISTS idx_notes_incident ON investigation_notes(incident_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_incident ON evidence(incident_id);
    CREATE INDEX IF NOT EXISTS idx_actions_incident ON response_actions(incident_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_incident ON timeline_events(incident_id);
    CREATE INDEX IF NOT EXISTS idx_ai_analyses_incident ON ai_analyses(incident_id);
  `);

  console.log('Database schema initialized.');
  return database;
}

module.exports = { getDb, initializeSchema };
