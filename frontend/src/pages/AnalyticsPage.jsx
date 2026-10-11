import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart2, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import api from '../services/api.js';
import { apiError } from '../utils/helpers.js';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = { Critical: '#DC2626', High: '#EA580C', Medium: '#CA8A04', Low: '#16A34A' };
const STATUS_COLORS = {
  New: '#2563EB', Investigating: '#EA580C', Contained: '#CA8A04',
  Resolved: '#16A34A', Closed: '#64748B', 'False Positive': '#7C3AED',
};
const TYPE_COLOR = '#2563EB';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const loadData = () => {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (severityFilter) params.severity = severityFilter;
    api.get('/analytics', { params })
      .then(r => setData(r.data))
      .catch(err => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="loading-center"><span className="spinner-lg spinner" /> Loading analytics…</div>;
  if (!data) return null;

  const statCards = [
    { label: 'Total Incidents', value: data.totals?.total || 0, icon: BarChart2, color: '#2563EB' },
    { label: 'Open / Active', value: data.totals?.open || 0, icon: Activity, color: '#EA580C' },
    { label: 'Resolved / Closed', value: data.totals?.resolved || 0, icon: CheckCircle, color: '#16A34A' },
    { label: 'Critical Severity', value: data.totals?.critical || 0, icon: AlertTriangle, color: '#DC2626' },
    { label: 'Avg Risk Score', value: typeof data.avgRisk === 'number' ? data.avgRisk.toFixed(1) : '—', icon: BarChart2, color: '#CA8A04' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-title">Analytics</span>
          <span className="page-header-sub">Incident statistics and trends</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>From:</label>
          <input type="date" className="filter-select" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 140 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>To:</label>
          <input type="date" className="filter-select" value={to} onChange={e => setTo(e.target.value)} style={{ width: 140 }} />
        </div>
        <select className="filter-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="">All Severities</option>
          {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={loadData}>Apply Filters</button>
        {(from || to || severityFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFrom(''); setTo(''); setSeverityFilter(''); loadData(); }}>Clear</button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: 20 }}>
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className="stat-card-label">
              {card.label}
              <span className="stat-card-icon"><card.icon size={16} color={card.color} /></span>
            </div>
            <div className="stat-card-value" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly Trend */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><span className="card-title">Monthly Incident Trend</span></div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {data.trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.trend} margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 4, fill: '#2563EB' }} name="Incidents" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}><p className="empty-state-desc">No trend data available for selected filters.</p></div>
            )}
          </div>
        </div>

        {/* By Type */}
        <div className="card">
          <div className="card-header"><span className="card-title">Incidents by Type</span></div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {data.byType?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.byType} margin={{ left: 0, right: 8, top: 4, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="incident_type" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill={TYPE_COLOR} radius={[3, 3, 0, 0]} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}><p className="empty-state-desc">No data.</p></div>
            )}
          </div>
        </div>

        {/* By Severity */}
        <div className="card">
          <div className="card-header"><span className="card-title">Incidents by Severity</span></div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {data.bySeverity?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.bySeverity}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%" cy="50%"
                    outerRadius={75}
                    label={({ severity, count }) => `${severity}: ${count}`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {data.bySeverity.map(e => <Cell key={e.severity} fill={SEVERITY_COLORS[e.severity] || '#94A3B8'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}><p className="empty-state-desc">No data.</p></div>
            )}
          </div>
        </div>

        {/* By Status */}
        <div className="card">
          <div className="card-header"><span className="card-title">Incidents by Status</span></div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {data.byStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.byStatus} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Incidents">
                    {data.byStatus.map(e => <Cell key={e.status} fill={STATUS_COLORS[e.status] || '#94A3B8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}><p className="empty-state-desc">No data.</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
