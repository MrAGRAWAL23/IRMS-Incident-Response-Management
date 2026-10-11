import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit2, ArrowLeft, RefreshCw, BrainCircuit, Plus, Clock,
  FileSearch, ShieldCheck, Zap, MessageSquare, AlertTriangle, Search
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  severityBadge, statusBadge, riskClass, riskCategory,
  formatDate, formatDateTime, timelineIcon, apiError,
  STATUS_OPTIONS, ACTION_TYPES, EVIDENCE_TYPES, SEVERITY_OPTIONS
} from '../utils/helpers.js';

// ── Sub-components ─────────────────────────────────────────────────────────────

function RiskBar({ score }) {
  return (
    <div className="risk-bar-wrapper" style={{ minWidth: 160 }}>
      <div className="risk-bar-track" style={{ flex: 1 }}>
        <div className={`risk-bar-fill ${riskClass(score)}`} style={{ width: `${score}%` }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40 }}>
        {score}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)' }}>/100</span>
      </span>
    </div>
  );
}

function DetailField({ label, children }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children || '—'}</div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ incident, onStatusChange, onSeverityChange, analysts, user }) {
  const navigate = useNavigate();
  const [statusModal, setStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: incident.status, resolution_summary: incident.resolution_summary || '' });
  const [saving, setSaving] = useState(false);

  const handleStatusSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/incidents/${incident.id}/status`, statusForm);
      toast.success('Status updated');
      setStatusModal(false);
      onStatusChange();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header bar */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className="incident-id" style={{ fontSize: 14 }}>{incident.incident_code}</span>
              <span className={`badge ${severityBadge(incident.severity)}`}>{incident.severity}</span>
              <span className={`badge ${statusBadge(incident.status)}`}>{incident.status}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {incident.title}
            </h2>
          </div>
          {['admin', 'analyst'].includes(user?.role) && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(true)}>
                <RefreshCw size={13} /> Change Status
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/incidents/${incident.id}/edit`)}>
                <Edit2 size={13} /> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Risk score */}
      <div className="card">
        <div className="card-header"><span className="card-title">Risk Score</span></div>
        <div className="card-body">
          <RiskBar score={incident.risk_score} />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            Category: <strong style={{ color: incident.risk_score >= 81 ? '#DC2626' : incident.risk_score >= 61 ? '#EA580C' : incident.risk_score >= 31 ? '#CA8A04' : '#16A34A' }}>
              {riskCategory(incident.risk_score)}
            </strong>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="card">
        <div className="card-header"><span className="card-title">Incident Details</span></div>
        <div className="card-body">
          <div className="detail-grid" style={{ marginBottom: 16 }}>
            <DetailField label="Incident Type">{incident.incident_type}</DetailField>
            <DetailField label="Assigned Analyst">{incident.analyst_name || 'Unassigned'}</DetailField>
            <DetailField label="Affected Asset">{incident.affected_asset}</DetailField>
            <DetailField label="Affected User">{incident.affected_user}</DetailField>
            <DetailField label="Alert Source">{incident.source}</DetailField>
            <DetailField label="Asset Importance">{incident.asset_importance}</DetailField>
            <DetailField label="Potential Impact">{incident.potential_impact}</DetailField>
            <DetailField label="Threat Confidence">{incident.threat_confidence}</DetailField>
            <DetailField label="Created">{formatDateTime(incident.created_at)}</DetailField>
            <DetailField label="Last Updated">{formatDateTime(incident.updated_at)}</DetailField>
            {incident.resolved_at && <DetailField label="Resolved At">{formatDateTime(incident.resolved_at)}</DetailField>}
            {incident.closed_at && <DetailField label="Closed At">{formatDateTime(incident.closed_at)}</DetailField>}
          </div>
          <div>
            <div className="detail-label">Description</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 4 }}>
              {incident.description}
            </div>
          </div>
          {incident.resolution_summary && (
            <div style={{ marginTop: 14 }}>
              <div className="detail-label">Resolution Summary</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 4 }}>
                {incident.resolution_summary}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      {statusModal && (
        <div className="modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Update Incident Status</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setStatusModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-select" value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {['Resolved', 'Closed', 'False Positive'].includes(statusForm.status) && (
                <div className="form-group">
                  <label className="form-label">Resolution / Explanation<span className="form-required">*</span></label>
                  <textarea className="form-textarea" rows={3} value={statusForm.resolution_summary} onChange={e => setStatusForm(f => ({ ...f, resolution_summary: e.target.value }))} placeholder="Document the resolution steps or reason for this status..." />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStatusModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleStatusSave}>
                {saving ? <><span className="spinner" /> Saving…</> : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Investigation Tab ─────────────────────────────────────────────────────────

function InvestigationTab({ incidentId, user }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get(`/incidents/${incidentId}/notes`).then(r => setNotes(r.data)).finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => { load(); }, [load]);

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/incidents/${incidentId}/notes`, { note: noteText.trim() });
      toast.success('Note added');
      setNoteText('');
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><span className="spinner" /> Loading notes…</div>;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {['admin', 'analyst'].includes(user?.role) && (
        <div className="card">
          <div className="card-header"><span className="card-title">Add Investigation Note</span></div>
          <div className="card-body">
            <textarea
              className="form-textarea"
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Document your findings, observations, or investigative steps…"
              maxLength={5000}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{noteText.length}/5000</span>
              <button className="btn btn-primary btn-sm" disabled={saving || !noteText.trim()} onClick={addNote}>
                {saving ? <><span className="spinner" /> Saving…</> : <><Plus size={13} /> Add Note</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Investigation Notes</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        </div>
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><MessageSquare size={28} /></div>
            <p className="empty-state-title">No notes yet</p>
            <p className="empty-state-desc">Add an investigation note to document your findings.</p>
          </div>
        ) : (
          <div style={{ padding: '0 0 8px' }}>
            {notes.map((note, i) => (
              <div key={note.id} style={{ padding: '14px 16px', borderBottom: i < notes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{note.author_name || 'Unknown'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(note.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Evidence Tab ──────────────────────────────────────────────────────────────

function EvidenceTab({ incidentId, user }) {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', evidence_type: '', description: '', reference: '' });

  const load = useCallback(() => {
    api.get(`/incidents/${incidentId}/evidence`).then(r => setEvidence(r.data)).finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => { load(); }, [load]);

  const addEvidence = async () => {
    if (!form.name.trim() || !form.evidence_type) return toast.error('Name and type are required');
    setSaving(true);
    try {
      await api.post(`/incidents/${incidentId}/evidence`, form);
      toast.success('Evidence record added');
      setForm({ name: '', evidence_type: '', description: '', reference: '' });
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><span className="spinner" /> Loading evidence…</div>;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="alert alert-info">
        <span>Evidence records document metadata only — filenames, IP addresses, hashes, references. No file uploads are stored.</span>
      </div>
      {['admin', 'analyst'].includes(user?.role) && (
        <div className="card">
          <div className="card-header"><span className="card-title">Add Evidence Record</span></div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Evidence Name<span className="form-required">*</span></label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. auth.log extract, Screenshot" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type<span className="form-required">*</span></label>
                <select className="form-select" value={form.evidence_type} onChange={e => setForm(f => ({ ...f, evidence_type: e.target.value }))}>
                  <option value="">Select type…</option>
                  {EVIDENCE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what this evidence shows" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reference / Location</label>
              <input className="form-input" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="File path, URL, IP address, file hash, or storage reference" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={addEvidence}>
                {saving ? <><span className="spinner" /> Saving…</> : <><Plus size={13} /> Add Evidence</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Evidence Records</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{evidence.length} item{evidence.length !== 1 ? 's' : ''}</span>
        </div>
        {evidence.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileSearch size={28} /></div>
            <p className="empty-state-title">No evidence recorded</p>
            <p className="empty-state-desc">Add evidence metadata to support the investigation.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Reference</th><th>Added By</th><th>Date</th></tr></thead>
              <tbody>
                {evidence.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ fontWeight: 500 }}>{ev.name}</td>
                    <td><span className="badge badge-new">{ev.evidence_type}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{ev.description || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{ev.reference || '—'}</td>
                    <td>{ev.added_by_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(ev.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Response Actions Tab ──────────────────────────────────────────────────────

function ActionsTab({ incidentId, user }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ action_type: '', description: '', result: '', status: 'Completed' });

  const load = useCallback(() => {
    api.get(`/incidents/${incidentId}/actions`).then(r => setActions(r.data)).finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => { load(); }, [load]);

  const addAction = async () => {
    if (!form.action_type || !form.description.trim()) return toast.error('Action type and description are required');
    setSaving(true);
    try {
      await api.post(`/incidents/${incidentId}/actions`, form);
      toast.success('Response action recorded');
      setForm({ action_type: '', description: '', result: '', status: 'Completed' });
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><span className="spinner" /> Loading actions…</div>;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="alert alert-warning">
        <AlertTriangle size={15} />
        <span>Response actions recorded here are <strong>simulated log entries</strong> for IRMS tracking purposes only. They do not execute real commands, modify firewall rules, or affect external systems.</span>
      </div>
      {['admin', 'analyst'].includes(user?.role) && (
        <div className="card">
          <div className="card-header"><span className="card-title">Record Response Action</span></div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Action Type<span className="form-required">*</span></label>
                <select className="form-select" value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}>
                  <option value="">Select action…</option>
                  {ACTION_TYPES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Outcome Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {['Pending', 'Completed', 'Failed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description<span className="form-required">*</span></label>
              <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was done? Include specifics (e.g. blocked IP 192.168.1.100 at perimeter firewall)" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Result / Notes</label>
              <input className="form-input" value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))} placeholder="Outcome or observed result of this action" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={addAction}>
                {saving ? <><span className="spinner" /> Saving…</> : <><Zap size={13} /> Record Action</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recorded Actions</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
        </div>
        {actions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Zap size={28} /></div>
            <p className="empty-state-title">No actions recorded</p>
            <p className="empty-state-desc">Record the response actions taken for this incident.</p>
          </div>
        ) : (
          <div style={{ padding: '0 0 8px' }}>
            {actions.map((act, i) => (
              <div key={act.id} style={{ padding: '12px 16px', borderBottom: i < actions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{act.action_type}</span>
                    <span className={`badge ${act.status === 'Completed' ? 'badge-resolved' : act.status === 'Failed' ? 'badge-critical' : 'badge-new'}`}>{act.status}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{act.performed_by_name} · {formatDateTime(act.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{act.description}</div>
                {act.result && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Result: {act.result}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────

function TimelineTab({ incidentId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/incidents/${incidentId}/timeline`)
      .then(r => setEvents(r.data))
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) return <div className="loading-center"><span className="spinner" /> Loading timeline…</div>;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Incident Timeline</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="card-body">
        {events.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon"><Clock size={28} /></div>
            <p className="empty-state-title">No timeline events</p>
          </div>
        ) : (
          <div className="timeline">
            {events.map(ev => (
              <div key={ev.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-time">{formatDateTime(ev.created_at)}</div>
                <div className="timeline-desc">
                  <span style={{ marginRight: 6 }}>{timelineIcon(ev.event_type)}</span>
                  {ev.description}
                </div>
                {ev.actor_name && <div className="timeline-actor">by {ev.actor_name}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Analysis Tab ───────────────────────────────────────────────────────────

function AIAnalysisTab({ incidentId, user }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const load = useCallback(() => {
    api.get(`/incidents/${incidentId}/ai-analysis`)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : r.data.analyses || [];
        setAnalyses(data);
        setActiveIdx(0);
      })
      .finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => { load(); }, [load]);

  const runAnalysis = async () => {
    setRunning(true);
    try {
      await api.post(`/incidents/${incidentId}/ai-analysis`);
      toast.success('AI analysis complete');
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="loading-center"><span className="spinner" /> Loading AI analyses…</div>;

  const current = analyses[activeIdx];

  const safeJson = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return [val]; }
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Controls */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrainCircuit size={20} color="var(--action-primary)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>IRMS AI Assistant</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {analyses.length === 0 ? 'No analyses run yet' : `${analyses.length} analysis run${analyses.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {current && (
              <span className={`ai-mode-badge ${current.provider_mode === 'demo' ? 'ai-mode-demo' : 'ai-mode-live'}`}>
                {current.provider_mode === 'demo' ? '⚙ Demo AI Mode — rule-based recommendations' : `⚡ AI Mode: ${current.provider_mode}`}
              </span>
            )}
            {['admin', 'analyst'].includes(user?.role) && (
              <button className="btn btn-primary btn-sm" disabled={running} onClick={runAnalysis}>
                {running ? <><span className="spinner" /> Analysing…</> : <><BrainCircuit size={13} /> {analyses.length > 0 ? 'Re-analyse' : 'Analyse with AI'}</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History selector */}
      {analyses.length > 1 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {analyses.map((a, i) => (
            <button key={a.id} className={`btn btn-sm ${i === activeIdx ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveIdx(i)}>
              Run {analyses.length - i} — {formatDate(a.created_at)}
            </button>
          ))}
        </div>
      )}

      {/* No analyses yet */}
      {!current ? (
        <div className="card">
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon"><BrainCircuit size={36} /></div>
            <p className="empty-state-title">No AI analysis yet</p>
            <p className="empty-state-desc">Click "Analyse with AI" to generate recommendations and findings for this incident. Works without an API key using the built-in demo mode.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="card">
            <div className="card-header"><span className="card-title">Incident Summary</span></div>
            <div className="card-body">
              {current.attack_type && (
                <div style={{ marginBottom: 10 }}>
                  <span className="ai-section-label">Possible Attack Type</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--action-primary)' }}>{current.attack_type}</div>
                </div>
              )}
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{current.summary}</div>
              {current.risk_explanation && (
                <div style={{ marginTop: 14, padding: 10, background: '#F8FAFC', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong>Risk Explanation:</strong> {current.risk_explanation}
                </div>
              )}
            </div>
          </div>

          {/* Findings */}
          {safeJson(current.findings_json).length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Key Findings</span></div>
              <div className="card-body">
                <ul className="ai-finding-list">
                  {safeJson(current.findings_json).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {safeJson(current.recommendations_json).length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Recommended Actions</span></div>
              <div className="card-body">
                <ol className="ai-rec-list">
                  {safeJson(current.recommendations_json).map((r, i) => <li key={i}>{r}</li>)}
                </ol>
              </div>
            </div>
          )}

          {/* Evidence to collect */}
          {safeJson(current.evidence_recommendations_json).length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Evidence to Collect</span></div>
              <div className="card-body">
                <ul className="ai-finding-list">
                  {safeJson(current.evidence_recommendations_json).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Confidence notes */}
          {current.confidence_notes && (
            <div className="card">
              <div className="card-header"><span className="card-title">Confidence & Limitations</span></div>
              <div className="card-body">
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{current.confidence_notes}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview', label: 'Overview', icon: ShieldCheck },
  { key: 'investigate', label: 'Investigation', icon: Search },
  { key: 'evidence', label: 'Evidence', icon: FileSearch },
  { key: 'actions', label: 'Response Actions', icon: Zap },
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'ai', label: 'AI Analysis', icon: BrainCircuit },
];

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [analysts, setAnalysts] = useState([]);

  const loadIncident = useCallback(() => {
    api.get(`/incidents/${id}`).then(r => setIncident(r.data)).catch(err => {
      toast.error(apiError(err));
      navigate('/incidents');
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadIncident(); }, [loadIncident]);
  useEffect(() => { api.get('/analysts').then(r => setAnalysts(r.data)).catch(() => { }); }, []);

  if (loading) return <div className="loading-center"><span className="spinner-lg spinner" /> Loading incident…</div>;
  if (!incident) return null;

  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/incidents')}>
          <ArrowLeft size={14} /> All Incidents
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab incident={incident} onStatusChange={loadIncident} analysts={analysts} user={user} />
      )}
      {tab === 'investigate' && <InvestigationTab incidentId={id} user={user} />}
      {tab === 'evidence' && <EvidenceTab incidentId={id} user={user} />}
      {tab === 'actions' && <ActionsTab incidentId={id} user={user} />}
      {tab === 'timeline' && <TimelineTab incidentId={id} />}
      {tab === 'ai' && <AIAnalysisTab incidentId={id} user={user} />}
    </div>
  );
}
