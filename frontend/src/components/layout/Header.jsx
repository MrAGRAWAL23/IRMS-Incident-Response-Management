import { useAuth } from '../../context/AuthContext.jsx';
import { getInitials } from '../../utils/helpers.js';

export default function Header({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div>
        <div className="header-title">{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div className="header-right">
        <div className="user-badge">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
