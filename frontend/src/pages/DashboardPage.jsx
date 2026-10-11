import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileWarning, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { severityBadge, statusBadge, formatDate, formatDateTime, riskClass, riskCategory } from '../utils/helpers';

const SEVERITY_COLORS = { Critical: '#DC2626', High: '#EA580C', Medium: '#CA8A04', Low: '#16A34A' };
const STATUS_COLORS = {
  New: '#2563EB', Investigating: '#EA580C', Contained: '#CA8A04',
  Resolved: '#16A34A', Closed: '#64748B', 'False Positive': '#7C3AED',
};

const TIMELINE_LABELS = {
  incident_created: 'Incident created',
  incident_assigned: 'Incident assigned',
  severity_updated: 'Severity updated',
  note_added: 'Note added',
  evidence_added: 'Evidence added',
  ai_analysis: 'AI analysis run',
  action_recorded: 'Response action recorded',
  status_changed: 'Status changed',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-incidents'),
      api.get('/dashboard/activity'),
    ]).then(([s, r, a]) => {
      setStats(s.data);
      setRecent(r.data);
      setActivity(a.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><span className="spinner-lg spinner" /> Loading dashboard…</div>;

  const statCards = [
    { label: 'Total Incidents', value: stats?.total || 0, icon: FileWarning, filter: {} },
    { label: 'Open Incidents', value: stats?.open || 0, icon: Clock, filter: { status: 'New' } },
    { label: 'Critical', value: stats?.critical || 0, icon: AlertTriangle, filter: { severity: 'Critical' } },
    { label: 'Investigating', value: stats?.investigating || 0, icon: Activity, filter: { status: 'Investigating' } },
    { label: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle, filter: { status: 'Resolved' } },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {statCards.map(card => (
          <div
            key={card.label}
            className="stat-card"
            onClick={() => navigate('/incidents', { state: card.filter })}
          >
            <div className="stat-card-label">
              {card.label}
              <span className="stat-card-icon"><card.icon size={16} /></span>
            </div>
            <div className="stat-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Incident Trends */}
        <div className="card">
          <div className="card-header"><span className="card-title">Incidents Over Time</span></div>
          <div className="card-body" style={{ padding: '12px 0' }}>
            {stats?.trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.trend} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} name="Incidents" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 24 }}><p className="empty-state-desc">No trend data yet.</p></div>}
          </div>
        </div>

        {/* By Severity */}
        <div className="card">
          <div className="card-header"><span className="card-title">By Severity</span></div>
          <div className="card-body" style={{ padding: '12px 0' }}>
            {stats?.bySeverity?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats.bySeverity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={65} label={({ severity, count }) => `${severity}: ${count}`} labelLine={false} fontSize={11}>
                    {stats.bySeverity.map((e) => <Cell key={e.severity} fill={SEVERITY_COLORS[e.severity] || '#94A3B8'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 24 }}><p className="empty-state-desc">No severity data.</p></div>}
          </div>
        </div>

        {/* By Type */}
        <div className="card">
          <div className="card-header"><span className="card-title">By Incident Type</span></div>
          <div className="card-body" style={{ padding: '12px 0' }}>
            {stats?.byType?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.byType} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="incident_type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[3, 3, 0, 0]} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 24 }}><p className="empty-state-desc">No type data.</p></div>}
          </div>
        </div>

        {/* By Status */}
        <div className="card">
          <div className="card-header"><span className="card-title">By Status</span></div>
          <div className="card-body" style={{ padding: '12px 0' }}>
            {stats?.byStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.byStatus} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Incidents">
                    {stats.byStatus.map(e => <Cell key={e.status} fill={STATUS_COLORS[e.status] || '#94A3B8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 24 }}><p className="empty-state-desc">No status data.</p></div>}
          </div>
        </div>
      </div>

      {/* Recent Incidents + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Incidents</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/incidents')}>View All</button>
          </div>
          <div className="table-wrapper">
            {recent.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(inc => (
                    <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/incidents/${inc.id}`)}>
                      <td><span className="incident-id">{inc.incident_code}</span></td>
                      <td style={{ maxWidth: 180 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inc.title}
                        </span>
                      </td>
                      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inc.incident_type}</span></td>
                      <td><span className={`badge ${severityBadge(inc.severity)}`}>{inc.severity}</span></td>
                      <td>
                        <div className="risk-bar-wrapper" style={{ minWidth: 80 }}>
                          <div className="risk-bar-track" style={{ width: 48 }}>
                            <div className={`risk-bar-fill ${riskClass(inc.risk_score)}`} style={{ width: `${inc.risk_score}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{inc.risk_score}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${statusBadge(inc.status)}`}>{inc.status}</span></td>
                      <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(inc.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p className="empty-state-title">No incidents recorded</p>
                <p className="empty-state-desc">Create your first incident to see it here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Activity</span></div>
          <div className="card-body" style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 16px' }}>
            {activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activity.map((ev, i) => (
                  <div key={ev.id} style={{ padding: '8px 0', borderBottom: i < activity.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {ev.description}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {ev.actor_name || 'System'} · {ev.incident_code && <span style={{ color: 'var(--action-primary)' }}>{ev.incident_code}</span>}
                      {' '}· {formatDateTime(ev.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 24 }}>
                <p className="empty-state-desc">No activity yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
