import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiError } from '../utils/helpers';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDev = import.meta.env.DEV;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => setForm({ email, password: 'Demo@1234' });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F7FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <ShieldCheck size={32} color="#2563EB" />
            <span style={{ fontSize: 28, fontWeight: 700, color: '#202B38', letterSpacing: 1 }}>IRMS</span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Incident Response Management System</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-header">
            <h1 className="card-title" style={{ fontSize: 15 }}>Sign in to your account</h1>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address<span className="form-required">*</span></label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password<span className="form-required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0,
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 40 }} disabled={loading}>
                {loading ? <><span className="spinner" />Signing in…</> : 'Sign in'}
              </button>
            </form>

            {isDev && (
              <div style={{ marginTop: 20, padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Development Demo Accounts
                </p>
                {[
                  { label: 'Admin', email: 'admin@irms.com' },
                  { label: 'Analyst', email: 'analyst@irms.com' },
                  { label: 'Viewer', email: 'viewer@irms.com' },
                ].map(acc => (
                  <div key={acc.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#374151' }}>
                      <strong>{acc.label}:</strong> {acc.email}
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => fillDemo(acc.email)}>
                      Use
                    </button>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, marginBottom: 0 }}>Password: Demo@1234</p>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#94A3B8' }}>
          IRMS v1.0 — College Cybersecurity Project
        </p>
      </div>
    </div>
  );
}
