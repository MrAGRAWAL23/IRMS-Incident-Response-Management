import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const PAGE_TITLES = {
  '/dashboard':       { title: 'Dashboard',          subtitle: 'Security incident overview' },
  '/incidents':       { title: 'Incidents',           subtitle: 'All recorded security incidents' },
  '/incidents/new':   { title: 'Create Incident',     subtitle: 'Record a new security incident' },
  '/investigation':   { title: 'Investigation',       subtitle: 'Active investigation workspace' },
  '/ai-assistant':    { title: 'AI Assistant',        subtitle: 'IRMS AI-powered incident analysis' },
  '/reports':         { title: 'Reports',             subtitle: 'Incident reports and exports' },
  '/analytics':       { title: 'Analytics',           subtitle: 'Incident trends and statistics' },
  '/users':           { title: 'User Management',     subtitle: 'Manage IRMS users and roles' },
  '/settings':        { title: 'Settings',            subtitle: 'Application information' },
};

function getPageInfo(pathname) {
  // Exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Edit page
  if (pathname.match(/^\/incidents\/\d+\/edit$/)) return { title: 'Edit Incident', subtitle: 'Update incident details' };
  // Reports detail
  if (pathname.match(/^\/reports\/\d+$/)) return { title: 'Incident Report', subtitle: 'Detailed incident report' };
  // Incident detail
  if (pathname.match(/^\/incidents\/\d+$/)) return { title: 'Incident Details', subtitle: 'Incident investigation and analysis' };
  return { title: 'IRMS', subtitle: '' };
}

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const pageInfo = getPageInfo(location.pathname);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
