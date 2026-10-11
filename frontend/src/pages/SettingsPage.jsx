import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, User, Mail, Shield, Clock, BrainCircuit, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const appInfo = [
    { label: 'Application', value: 'IRMS — Incident Response Management System' },
    { label: 'Version', value: '1.0.0' },
    { label: 'Project Type', value: 'College Cybersecurity Project' },
    { label: 'Database', value: 'SQLite (local file, persistent)' },
    { label: 'Backend Port', value: '3001' },
    { label: 'Frontend Port', value: '5173 (Vite dev server)' },
  ];

  const userInfo = user ? [
    { label: 'Name', value: user.name, icon: User },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1), icon: Shield },
    { label: 'Session', value: 'Active (JWT, expires in 8 hours)', icon: Clock },
  ] : [];

  const featureInfo = [
    { label: 'AI Mode', value: 'Demo (rule-based fallback active — no API key configured). Set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env for live AI.' },
    { label: 'Incident Lifecycle', value: 'New → Investigating → Contained → Resolved / False Positive → Closed' },
    { label: 'Risk Formula', value: 'Severity + Asset Importance + Potential Impact + Threat Confidence (max 100)' },
    { label: 'Response Actions', value: 'Simulated — recorded in IRMS only, do not execute real system commands' },
    { label: 'Data Persistence', value: 'All data stored in backend/data/irms.db (SQLite). Survives restarts.' },
  ];

  return (
    <div style={{ maxWidth: 700 }}>
      {/* User Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={15} /> Your Account
          </span>
        </div>
        <div className="card-body">
          {userInfo.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <item.icon size={14} style={{ color: 'var(--text-muted)', marginRight: 10, flexShrink: 0 }} />
              <span style={{ minWidth: 80, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', marginLeft: 16 }}>
                {item.label === 'Role' ? (
                  <span className={`badge ${item.value === 'Admin' ? 'badge-role-admin' : item.value === 'Analyst' ? 'badge-role-analyst' : 'badge-role-viewer'}`}>
                    {item.value}
                  </span>
                ) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Application Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={15} color="var(--action-primary)" /> Application Information
          </span>
        </div>
        <div className="card-body">
          {appInfo.map(item => (
            <div key={item.label} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ minWidth: 150, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', marginLeft: 16 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={15} /> System Behaviour
          </span>
        </div>
        <div className="card-body">
          {featureInfo.map(item => (
            <div key={item.label} style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Mode info */}
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrainCircuit size={15} /> AI Configuration
          </span>
        </div>
        <div className="card-body">
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            The AI assistant operates in <strong>Demo Mode</strong> (rule-based recommendations) when no API key is configured.
            This mode provides complete, realistic recommendations based on incident type without requiring any external service.
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px 0' }}>To enable live AI (Gemini or OpenAI), add to <code style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 3 }}>backend/.env</code>:</p>
            <code style={{ display: 'block', background: '#172433', color: '#CBD5E1', padding: 12, borderRadius: 6, fontSize: 12, lineHeight: 1.8 }}>
              GEMINI_API_KEY=your-gemini-key-here<br />
              # or<br />
              OPENAI_API_KEY=your-openai-key-here
            </code>
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Restart the backend after adding the key. The AI mode indicator will update automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
