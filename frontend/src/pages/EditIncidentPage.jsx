import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
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
  return Math.min(100,
    (RISK_FORMULA.severity[form.severity] || 0) +
    (RISK_FORMULA.asset_importance[form.asset_importance] || 0) +
    (RISK_FORMULA.potential_impact[form.potential_impact] || 0) +
    (RISK_FORMULA.threat_confidence[form.threat_confidence] || 0)
  );
}

export default function EditIncidentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysts, setAnalysts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [incident, setIncident] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', incident_type: '', severity: '',
    source: '', affected_asset: '', affected_user: '',
    asset_importance: 'Medium', potential_impact: 'Medium',
    threat_confidence: 'Medium', assigned_analyst_id: '',
    resolution_summary: '',
  });

  useEffect(() => {
    Promise.all([
      api.get(`/incidents/${id}`),
      api.get('/analysts'),
    ]).then(([iRes, aRes]) => {
      const inc = iRes.data;
      setIncident(inc);
      setForm({
        title: inc.title || '',
        description: inc.description || '',
        incident_type: inc.incident_type || '',
        severity: inc.severity || '',
        source: inc.source || '',
        affected_asset: inc.affected_asset || '',
        affected_user: inc.affected_user || '',
        asset_importance: inc.asset_importance || 'Medium',
        potential_impact: inc.potential_impact || 'Medium',
        threat_confidence: inc.threat_confidence || 'Medium',
        assigned_analyst_id: inc.assigned_analyst_id ? String(inc.assigned_analyst_id) : '',
        resolution_summary: inc.resolution_summary || '',
      });
      setAnalysts(aRes.data);
    }).catch(err => {
      toast.error(apiError(err));
      navigate('/incidents');
    }).finally(() => setLoading(false));
  }, [id]);

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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_analyst_id) payload.assigned_analyst_id = null;
      else payload.assigned_analyst_id = parseInt(payload.assigned_analyst_id);
      await api.put(`/incidents/${id}`, payload);
      toast.success('Incident updated successfully');
      navigate(`/incidents/${id}`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center"><span className="spinner-lg spinner" /> Loading incident…</div>;

  const previewRisk = calcPreviewRisk(form);
  const riskColor = previewRisk >= 81 ? '#DC2626' : previewRisk >= 61 ? '#EA580C' : previewRisk >= 31 ? '#CA8A04' : '#16A34A';
  const canEdit = user?.role === 'admin' ||
    (user?.role === 'analyst' && (incident?.assigned_analyst_id === user?.id || incident?.created_by === user?.id));

  if (!canEdit) {
    return (
      <div className="card"><div className="card-body">
        <div className="alert alert-danger">You do not have permission to edit this incident.</div>
        <button className="btn btn-secondary" onClick={() => navigate(`/incidents/${id}`)}>
          <ArrowLeft size={14} /> Back
        </button>
      </div></div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-title">Edit Incident</span>
          <span className="page-header-sub">{incident?.incident_code} — {incident?.title}</span>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(`/incidents/${id}`)}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Incident Information</span></div>
            <div className="card-body" style={{ display: 'grid', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Title<span className="form-required">*</span></label>
                <input className={`form-input${errors.title ? ' error' : ''}`} value={form.title} onChange={e => set('title', e.target.value)} maxLength={200} />
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description<span className="form-required">*</span></label>
                <textarea className="form-textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
                {errors.description && <div className="form-error">{errors.description}</div>}
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Incident Type<span className="form-required">*</span></label>
                  <select className="form-select" value={form.incident_type} onChange={e => set('incident_type', e.target.value)}>
                    <option value="">Select type…</option>
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  {errors.incident_type && <div className="form-error">{errors.incident_type}</div>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Severity<span className="form-required">*</span></label>
                  <select className="form-select" value={form.severity} onChange={e => set('severity', e.target.value)}>
                    {SEVERITY_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Alert Source</label>
                <input className="form-input" value={form.source} onChange={e => set('source', e.target.value)} />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Affected Asset</label>
                  <input className="form-input" value={form.affected_asset} onChange={e => set('affected_asset', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Affected User</label>
                  <input className="form-input" value={form.affected_user} onChange={e => set('affected_user', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Analyst</label>
                <select className="form-select" value={form.assigned_analyst_id} onChange={e => set('assigned_analyst_id', e.target.value)}>
                  <option value="">Unassigned</option>
                  {analysts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Resolution Summary</label>
                <textarea className="form-textarea" rows={3} value={form.resolution_summary} onChange={e => set('resolution_summary', e.target.value)} placeholder="Document the resolution steps taken (required when marking Resolved or Closed)" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Risk Assessment Factors</span>
              <span style={{ fontSize: 12, color: riskColor, fontWeight: 600 }}>
                Preview Risk Score: {previewRisk}/100
              </span>
            </div>
            <div className="card-body">
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

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/incidents/${id}`)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner" /> Saving…</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
