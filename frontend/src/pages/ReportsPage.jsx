import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, Search } from 'lucide-react';
import api from '../services/api.js';
import { severityBadge, statusBadge, formatDate, riskClass, apiError } from '../utils/helpers.js';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/reports')
      .then(r => setReports(r.data || []))
      .catch(err => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r =>
    !search ||
    r.incident_code?.toLowerCase().includes(search.toLowerCase()) ||
    r.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-title">Reports</span>
          <span className="page-header-sub">Generate and view incident reports</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={14} />
          <input type="text" className="search-input" placeholder="Search by ID or title…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><span className="spinner" /> Loading reports…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={32} /></div>
            <p className="empty-state-title">No reports found</p>
            <p className="empty-state-desc">Reports are generated from recorded incidents. Create and investigate incidents first.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td><span className="incident-id">{r.incident_code}</span></td>
                    <td style={{ maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={r.title}>
                        {r.title}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.incident_type}</td>
                    <td><span className={`badge ${severityBadge(r.severity)}`}>{r.severity}</span></td>
                    <td>
                      <div className="risk-bar-wrapper" style={{ minWidth: 80 }}>
                        <div className="risk-bar-track" style={{ width: 48 }}>
                          <div className={`risk-bar-fill ${riskClass(r.risk_score)}`} style={{ width: `${r.risk_score}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.risk_score}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(r.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/reports/${r.id}`)}
                      >
                        <ExternalLink size={12} /> View Report
                      </button>
                    </td>
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
