import { useState, useEffect } from 'react';
import { Users, PlusCircle, UserCheck, UserX, Edit2 } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { roleBadge, formatDate, apiError } from '../utils/helpers.js';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'analyst', 'viewer'];

function UserModal({ user: editUser, onClose, onSave }) {
  const isNew = !editUser?.id;
  const [form, setForm] = useState({
    name: editUser?.name || '',
    email: editUser?.email || '',
    role: editUser?.role || 'analyst',
    password: '',
    is_active: editUser?.is_active !== undefined ? editUser.is_active : 1,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (isNew && !form.email.trim()) e.email = 'Email is required';
    if (isNew && form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/users', { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role });
        toast.success('User created successfully');
      } else {
        await api.patch(`/users/${editUser.id}`, { name: form.name.trim(), role: form.role, is_active: form.is_active });
        toast.success('User updated successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isNew ? 'Create New User' : `Edit User — ${editUser.name}`}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name<span className="form-required">*</span></label>
            <input className={`form-input${errors.name ? ' error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Jane Smith" />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          {isNew && (
            <div className="form-group">
              <label className="form-label">Email Address<span className="form-required">*</span></label>
              <input type="email" className={`form-input${errors.email ? ' error' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@example.com" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
          )}
          {isNew && (
            <div className="form-group">
              <label className="form-label">Password<span className="form-required">*</span></label>
              <input type="password" className={`form-input${errors.password ? ' error' : ''}`} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <div className="form-error" style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 11 }}>
              Admin: full access · Analyst: create/edit incidents · Viewer: read-only
            </div>
          </div>
          {!isNew && (
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select className="form-select" value={form.is_active} onChange={e => set('is_active', Number(e.target.value))}>
                <option value={1}>Active</option>
                <option value={0}>Inactive (cannot log in)</option>
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? <><span className="spinner" /> Saving…</> : isNew ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | user object

  const loadUsers = () => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(err => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-title">User Management</span>
          <span className="page-header-sub">{users.length} registered users</span>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <PlusCircle size={14} /> Create User
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><span className="spinner" /> Loading users…</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--action-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                          {u.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <span style={{ fontWeight: 500 }}>
                          {u.name}
                          {u.id === currentUser?.id && <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--text-muted)' }}>(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.email}</td>
                    <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                    <td>
                      {u.is_active ? (
                        <span style={{ fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <UserCheck size={13} /> Active
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <UserX size={13} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(u.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={loadUsers}
        />
      )}
    </div>
  );
}
