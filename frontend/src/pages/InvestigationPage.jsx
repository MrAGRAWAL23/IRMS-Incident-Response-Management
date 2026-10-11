import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import api from '../services/api.js';
import { severityBadge, statusBadge, formatDateTime, riskClass, apiError } from '../utils/helpers.js';
import toast from 'react-hot-toast';

export default function InvestigationPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/incidents', { params: { status: 'Investigating', limit: 50, sort: 'updated_at', order: 'DESC' } })
      .then(r => setIncidents(r.data.incidents || []))
      .catch(err => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = incidents.filter(inc =>
    !search || inc.title.toLowerCase().includes(search.toLowerCase()) ||
    inc.incident_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-title">Investigation Workspace</span>
          <span className="page-header-sub">Incidents currently under active investigation</span>
        </div>
      </div>

      {incidents.length > 0 && (
        <div className="filter-bar" style={{ marginBottom: 14 }}>
          <div className="search-input-wrap">
            <Search size={14} />
            <input type="text" className="search-input" placeholder="Filter by ID or title…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><span className="spinner" /> Loading active investigations…</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon"><Search size={36} /></div>
            <p className="empty-state-title">No active investigations</p>
            <p className="empty-state-desc">
              {incidents.length === 0
                ? 'No incidents are currently in "Investigating" status. Open an incident and change its status to begin an investigation.'
                : 'No incidents match your search.'}
            </p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/incidents')}>
              View All Incidents
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <div className="alert alert-info">
            Showing {filtered.length} incident{filtered.length !== 1 ? 's' : ''} with <strong>Investigating</strong> status.
            Click an incident to open the full investigation workspace with notes, evidence, actions, and AI analysis.
          </div>
          {filtered.map(inc => (
            <div
              key={inc.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => navigate(`/incidents/${inc.id}?tab=investigate`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--action-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="incident-id">{inc.incident_code}</span>
                      <span className={`badge ${severityBadge(inc.severity)}`}>{inc.severity}</span>
                      <span className={`badge ${statusBadge(inc.status)}`}>{inc.status}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{inc.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>Type: {inc.incident_type}</span>
                      {inc.analyst_name && <span>Analyst: {inc.analyst_name}</span>}
                      <span>Updated: {formatDateTime(inc.updated_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="risk-bar-wrapper" style={{ minWidth: 90 }}>
                      <div className="risk-bar-track" style={{ width: 52 }}>
                        <div className={`risk-bar-fill ${riskClass(inc.risk_score)}`} style={{ width: `${inc.risk_score}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{inc.risk_score}</span>
                    </div>
                    <ExternalLink size={15} color="var(--text-muted)" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
