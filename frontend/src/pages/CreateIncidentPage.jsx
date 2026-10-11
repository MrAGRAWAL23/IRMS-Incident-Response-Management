import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import {
  TYPE_OPTIONS, SEVERITY_OPTIONS, ASSET_IMPORTANCE_OPTIONS,
  THREAT_CONFIDENCE_OPTIONS, apiError
} from '../utils/helpers.js';

const RISK_FORMULA = {
  severity:         { Low: 5, Medium: 12, High: 20, Critical: 25 },
  asset_importance: { Low: 5, Medium: 12, High: 20, Critical: 25 },
  potential_impact: { Low: 5, Medium: 12, High: 20, Critical: 25 },
  threat_confidence:{ Low: 8, Medium: 17, High: 25 },
};

function calcPreviewRisk(form) {
  const s = RISK_FORMULA.severity[form.severity] || 0;
  const a = RISK_FORMULA.asset_importance[form.asset_importance] || 0;
  const p = RISK_FORMULA.potential_impact[form.potential_impact] || 0;
  const t = RISK_FORMULA.threat_confidence[form.threat_confidence] || 0;
  return Math.min(100, s + a + p + t);
}

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const [analysts, setAnalysts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    incident_type: '',
    severity: '',
    source: '',
    affected_asset: '',
    affected_user: '',
    asset_importance: 'Medium',
    potential_impact: 'Medium',
    threat_confidence: 'Medium',
    assigned_analyst_id: '',
  });

  useEffect(() => {
    api.get('/analysts').then(r => setAnalysts(r.data)).catch(() => {});
  }, []);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.incident_type) e.incident_type = 'Incident type is required';
    if (!form.severity) e.severity = 'Severity is required';
    if (form.title.length > 200) e.title = 'Title too long (max 200 characters)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_analyst_id) delete payload.assigned_analyst_id;
      const res = await api.post('/incidents', payload);
      toast.success(`Incident ${res.data.incident_code} created successfully`);
      navigate(`/incidents/${res.data.id}`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const previewRisk = form.severity ? calcPreviewRisk(form) : null;
  const riskColor = previewRisk >= 81 ? '#DC2626' : previewRisk >= 61 ? '#EA580C' : previewRisk >= 31 ? '#CA8A04' : '#16A34A';

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-title">Create New Incident</span>
          <span className="page-header-sub">Record a new cybersecurity incident</span>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/incidents')}>
          <ArrowLeft size={14} /> Back to Incidents
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Basic Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Incident Information</span></div>
            <div className="card-body" style={{ display: 'grid', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Title<span className="form-required">*</span></label>
                <input className={`form-input${errors.title ? ' error' : ''}`} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief description of the incident" maxLength={200} />
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description<span className="form-required">*</span></label>
                <textarea className={`form-textarea${errors.description ? ' error' : ''}`} rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed description of what occurred, affected systems, and initial observations..." />
                {errors.description && <div className="form-error">{errors.description}</div>}
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Incident Type<span className="form-required">*</span></label>
                  <select className={`form-select${errors.incident_type ? ' error' : ''}`} value={form.incident_type} onChange={e => set('incident_type', e.target.value)}>
                    <option value="">Select type…</option>
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  {errors.incident_type && <div className="form-error">{errors.incident_type}</div>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Severity<span className="form-required">*</span></label>
                  <select className={`form-select${errors.severity ? ' error' : ''}`} value={form.severity} onChange={e => set('severity', e.target.value)}>
                    <option value="">Select severity…</option>
                    {SEVERITY_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {errors.severity && <div className="form-error">{errors.severity}</div>}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Alert Source</label>
                <input className="form-input" value={form.source} onChange={e => set('source', e.target.value)} placeholder="e.g. SIEM Alert, Email Gateway, Employee Report" />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Affected Asset</label>
                  <input className="form-input" value={form.affected_asset} onChange={e => set('affected_asset', e.target.value)} placeholder="e.g. Workstation WS-042, Email System" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Affected User</label>
                  <input className="form-input" value={form.affected_user} onChange={e => set('affected_user', e.target.value)} placeholder="e.g. john.doe@corp.com" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Analyst</label>
                <select className="form-select" value={form.assigned_analyst_id} onChange={e => set('assigned_analyst_id', e.target.value)}>
                  <option value="">Unassigned</option>
                  {analysts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Risk Assessment Factors</span>
              {previewRisk !== null && (
                <span style={{ fontSize: 12, color: riskColor, fontWeight: 600 }}>
                  Preview Risk Score: {previewRisk}/100
                </span>
              )}
            </div>
            <div className="card-body">
              <div className="alert alert-info" style={{ marginBottom: 14 }}>
                These factors are used to calculate the risk score using the formula: Severity + Asset Importance + Potential Impact + Threat Confidence (max 100).
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Asset Importance</label>
                  <select className="form-select" value={form.asset_importance} onChange={e => set('asset_importance', e.target.value)}>
                    {ASSET_IMPORTANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Potential Impact</label>
                  <select className="form-select" value={form.potential_impact} onChange={e => set('potential_impact', e.target.value)}>
                    {ASSET_IMPORTANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Threat Confidence</label>
                  <select className="form-select" value={form.threat_confidence} onChange={e => set('threat_confidence', e.target.value)}>
                    {THREAT_CONFIDENCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/incidents')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner" /> Creating…</> : <><Save size={14} /> Create Incident</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
