import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../services/api.js';
import {
  severityBadge, statusBadge, riskClass, riskCategory,
  formatDate, formatDateTime, timelineIcon, apiError
} from '../utils/helpers.js';
import toast from 'react-hot-toast';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid var(--border)', paddingBottom: 6, marginBottom: 14 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  );
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then(r => setReport(r.data))
      .catch(err => {
        toast.error(apiError(err));
        navigate('/reports');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const safeJson = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return [val]; }
  };

  if (loading) return <div className="loading-center"><span className="spinner-lg spinner" /> Loading report…</div>;
  if (!report) return null;

  const { incident, notes, evidence, actions, timeline, analysis } = report;

  return (
    <>
      {/* Print / nav controls — hidden on print */}
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
          <ArrowLeft size={14} /> Back to Reports
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={14} /> Print / Save as PDF
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
          Use browser print → Save as PDF for best results.
        </span>
      </div>

      {/* Report body */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div className="card" id="report-body">
          <div className="card-body" style={{ padding: 32 }}>
            {/* Report header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <ShieldCheck size={22} color="#2563EB" />
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#172433', letterSpacing: 0.5 }}>IRMS</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Incident Response Management System</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)' }}>
                <div><strong>Report Generated:</strong> {formatDateTime(new Date().toISOString())}</div>
                <div><strong>Incident Code:</strong> {incident.incident_code}</div>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid var(--border)' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>{incident.title}</h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className={`badge ${severityBadge(incident.severity)}`}>{incident.severity}</span>
                <span className={`badge ${statusBadge(incident.status)}`}>{incident.status}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Risk Score: <strong style={{ color: incident.risk_score >= 81 ? '#DC2626' : incident.risk_score >= 61 ? '#EA580C' : incident.risk_score >= 31 ? '#CA8A04' : '#16A34A' }}>{incident.risk_score}/100 ({riskCategory(incident.risk_score)})</strong></span>
              </div>
            </div>

            {/* Incident details */}
            <Section title="Incident Details">
              <FieldRow label="Incident Type" value={incident.incident_type} />
              <FieldRow label="Severity" value={incident.severity} />
              <FieldRow label="Status" value={incident.status} />
              <FieldRow label="Risk Score" value={`${incident.risk_score}/100 (${riskCategory(incident.risk_score)})`} />
              <FieldRow label="Affected Asset" value={incident.affected_asset} />
              <FieldRow label="Affected User" value={incident.affected_user} />
              <FieldRow label="Alert Source" value={incident.source} />
              <FieldRow label="Assigned Analyst" value={incident.analyst_name} />
              <FieldRow label="Asset Importance" value={incident.asset_importance} />
              <FieldRow label="Potential Impact" value={incident.potential_impact} />
              <FieldRow label="Threat Confidence" value={incident.threat_confidence} />
              <FieldRow label="Created" value={formatDateTime(incident.created_at)} />
              <FieldRow label="Last Updated" value={formatDateTime(incident.updated_at)} />
              {incident.resolved_at && <FieldRow label="Resolved" value={formatDateTime(incident.resolved_at)} />}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{incident.description}</div>
              </div>
              {incident.resolution_summary && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Resolution Summary</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{incident.resolution_summary}</div>
                </div>
              )}
            </Section>

            {/* AI Analysis */}
            {analysis && (
              <Section title="AI Analysis">
                <div style={{ padding: 12, background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Provider: {analysis.provider_mode === 'demo' ? 'Demo AI Mode (rule-based)' : analysis.provider_mode}</div>
                  {analysis.attack_type && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--action-primary)', marginBottom: 8 }}>Attack Type: {analysis.attack_type}</div>}
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>{analysis.summary}</div>
                </div>
                {(analysis.findings || []).length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Key Findings</div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                      {analysis.findings.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {(analysis.recommendations || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Recommended Actions</div>
                    <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                      {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                  </div>
                )}
              </Section>
            )}

            {/* Investigation Notes */}
            <Section title={`Investigation Notes (${notes.length})`}>
              {notes.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No investigation notes recorded.</p>
              ) : notes.map((n, i) => (
                <div key={n.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < notes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{n.author_name || 'Unknown'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(n.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.note}</div>
                </div>
              ))}
            </Section>

            {/* Evidence */}
            <Section title={`Evidence Records (${evidence.length})`}>
              {evidence.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No evidence recorded.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Name', 'Type', 'Description', 'Reference', 'Added By', 'Date'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.map(ev => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500 }}>{ev.name}</td>
                        <td style={{ padding: '6px 10px' }}>{ev.evidence_type}</td>
                        <td style={{ padding: '6px 10px' }}>{ev.description || '—'}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11 }}>{ev.reference || '—'}</td>
                        <td style={{ padding: '6px 10px' }}>{ev.added_by_name || '—'}</td>
                        <td style={{ padding: '6px 10px' }}>{formatDate(ev.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Response Actions */}
            <Section title={`Response Actions (${actions.length})`}>
              {actions.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No response actions recorded.</p>
              ) : actions.map((act, i) => (
                <div key={act.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < actions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{act.action_type}</span>
                    <span style={{ fontSize: 11, color: act.status === 'Completed' ? '#16A34A' : act.status === 'Failed' ? '#DC2626' : '#2563EB' }}>{act.status}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{act.performed_by_name} · {formatDateTime(act.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>{act.description}</div>
                  {act.result && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Result: {act.result}</div>}
                </div>
              ))}
            </Section>

            {/* Timeline */}
            <Section title={`Incident Timeline (${timeline.length} events)`}>
              {timeline.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No timeline events.</p>
              ) : (
                <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border)' }}>
                  {timeline.map(ev => (
                    <div key={ev.id} style={{ marginBottom: 12, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -20, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--action-primary)' }} />
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(ev.created_at)}</div>
                      <div style={{ fontSize: 13 }}>{timelineIcon(ev.event_type)} {ev.description}</div>
                      {ev.actor_name && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>by {ev.actor_name}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Footer */}
            <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              IRMS — Incident Response Management System | Report generated {formatDateTime(new Date().toISOString())} | For internal use only
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
