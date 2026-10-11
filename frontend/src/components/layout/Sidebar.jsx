import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileWarning, PlusCircle, Search,
  Activity, BarChart2, Users, FileText, BrainCircuit,
  Settings, LogOut, ShieldCheck, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard',       path: '/dashboard',     icon: LayoutDashboard, roles: ['admin','analyst','viewer'] },
  { label: 'Incidents',       path: '/incidents',     icon: FileWarning,     roles: ['admin','analyst','viewer'] },
  { label: 'Create Incident', path: '/incidents/new', icon: PlusCircle,      roles: ['admin','analyst'] },
  { label: 'Investigation',   path: '/investigation', icon: Search,          roles: ['admin','analyst'] },
  { label: 'AI Assistant',    path: '/ai-assistant',  icon: BrainCircuit,    roles: ['admin','analyst'] },
  { label: 'Reports',         path: '/reports',       icon: FileText,        roles: ['admin','analyst','viewer'] },
  { label: 'Analytics',       path: '/analytics',     icon: BarChart2,       roles: ['admin','analyst','viewer'] },
  { label: 'Users',           path: '/users',         icon: Users,           roles: ['admin'] },
  { label: 'Settings',        path: '/settings',      icon: Settings,        roles: ['admin','analyst','viewer'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const allowed = navItems.filter(n => n.roles.includes(user?.role));
  const mainNav = allowed.slice(0, 5);
  const mgmtNav = allowed.slice(5);

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          style={{ display: 'block' }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} color="#2563EB" />
            <span className="sidebar-logo-title">IRMS</span>
          </div>
          <div className="sidebar-logo-sub">Incident Response Management</div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {mainNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}

          {mgmtNav.length > 0 && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Management</div>
              {mgmtNav.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon size={15} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%' }}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile trigger (rendered outside sidebar so always visible) */}
      <button
        id="mobile-sidebar-toggle"
        className="mobile-menu-btn"
        style={{ display: 'none', position: 'fixed', top: 12, left: 12, zIndex: 300 }}
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle navigation"
      >
        <Menu size={18} />
      </button>
    </>
  );
}
