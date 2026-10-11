import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import CreateIncidentPage from './pages/CreateIncidentPage.jsx';
import EditIncidentPage from './pages/EditIncidentPage.jsx';
import IncidentDetailPage from './pages/IncidentDetailPage.jsx';
import InvestigationPage from './pages/InvestigationPage.jsx';
import AIAssistantPage from './pages/AIAssistantPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ReportDetailPage from './pages/ReportDetailPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected layout */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route
          path="/incidents/new"
          element={
            <RequireRole roles={['admin', 'analyst']}>
              <CreateIncidentPage />
            </RequireRole>
          }
        />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
        <Route
          path="/incidents/:id/edit"
          element={
            <RequireRole roles={['admin', 'analyst']}>
              <EditIncidentPage />
            </RequireRole>
          }
        />
        <Route path="/investigation" element={<InvestigationPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route
          path="/users"
          element={
            <RequireRole roles={['admin']}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
