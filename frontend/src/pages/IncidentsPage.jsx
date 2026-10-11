import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Search, Trash2, Eye, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { severityBadge, statusBadge, formatDate, riskClass, TYPE_OPTIONS, SEVERITY_OPTIONS, STATUS_OPTIONS, apiError } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function IncidentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    severity: location.state?.severity || '',
    status: location.state?.status || '',
    incident_type: '',
    sort: 'created_at',
    order: 'DESC',
    page: 1,
    limit: 15,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [analysts, setAnalysts] = useState([]);

  const fetchIncidents = () => {
    setLoading(true);
    const params = { ...filters };
    if (search) params.search = search;
    Object.keys(params).forEach(k => !params[k] && delete params[k]);

    api.get('/incidents', { params }).then(res => {
      setIncidents(res.data.incidents);
      setTotal(res.data.total);
      setPages(res.data.pages);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchIncidents(); }, [filters]);
  useEffect(() => {
    const t = setTimeout(fetchIncidents, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api.get('/analysts').then(r => setAnalysts(r.data));
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/incidents/${deleteTarget.id}`);
      toast.success(`Incident ${deleteTarget.incident_code} deleted`);
      setDeleteTarget(null);
      fetchIncidents();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-title">Incidents</span>
          <span className="page-header-sub">{total} incidents found</span>
        </div>
        {['admin', 'analyst'].includes(user?.role) && (
          <button className="btn btn-primary" onClick={() => navigate('/incidents/new')}>
            <PlusCircle size={15} /> Create Incident
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={14} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID or title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filters.severity} onChange={e => setFilter('severity', e.target.value)}>
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>

        <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>

        <select className="filter-select" value={filters.incident_type} onChange={e => setFilter('incident_type', e.target.value)}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>

        <select className="filter-select" value={`${filters.sort}-${filters.order}`}
          onChange={e => {
            const [s, o] = e.target.value.split('-');
            setFilters(f => ({ ...f, sort: s, order: o, page: 1 }));
          }}>
          <option value="created_at-DESC">Newest First</option>
          <option value="created_at-ASC">Oldest First</option>
          <option value="risk_score-DESC">Highest Risk</option>
          <option value="risk_score-ASC">Lowest Risk</option>
        </select>

        {(search || filters.severity || filters.status || filters.incident_type) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilters(f => ({ ...f, severity: '', status: '', incident_type: '', page: 1 })); }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Loading incidents…</div>
          ) : incidents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={32} /></div>
              <p className="empty-state-title">No incidents found</p>
              <p className="empty-state-desc">Try adjusting your filters or create a new incident.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Analyst</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td>
                      <span className="incident-id" style={{ cursor: 'pointer' }} onClick={() => navigate(`/incidents/${inc.id}`)}>
                        {inc.incident_code}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <span
                        style={{ fontWeight: 500, cursor: 'pointer', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/incidents/${inc.id}`)}
                        title={inc.title}
                      >
                        {inc.title}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inc.incident_type}</span></td>
                    <td><span className={`badge ${severityBadge(inc.severity)}`}>{inc.severity}</span></td>
                    <td>
                      <div className="risk-bar-wrapper" style={{ minWidth: 90 }}>
                        <div className="risk-bar-track" style={{ width: 52 }}>
                          <div className={`risk-bar-fill ${riskClass(inc.risk_score)}`} style={{ width: `${inc.risk_score}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{inc.risk_score}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${statusBadge(inc.status)}`}>{inc.status}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inc.analyst_name || '—'}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(inc.created_at)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => navigate(`/incidents/${inc.id}`)}>
                          <Eye size={14} />
                        </button>
                        {['admin', 'analyst'].includes(user?.role) && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => navigate(`/incidents/${inc.id}/edit`)}>
                            <Edit2 size={14} />
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--action-danger)' }} onClick={() => setDeleteTarget(inc)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <span>Showing {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total}</span>
            <div className="pagination-controls">
              <button className="btn btn-secondary btn-sm btn-icon" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn btn-sm ${p === filters.page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilters(f => ({ ...f, page: p }))}>
                  {p}
                </button>
              ))}
              <button className="btn btn-secondary btn-sm btn-icon" disabled={filters.page >= pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Delete</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                Are you sure you want to delete <strong>{deleteTarget.incident_code}</strong> — "{deleteTarget.title}"?
                This action cannot be undone.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Incident</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
