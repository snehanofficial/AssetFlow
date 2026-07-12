import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Providers from './components/common/Providers.jsx';
import AppLayout from './components/common/AppLayout.jsx';
import AuthLayout from './components/common/AuthLayout.jsx';
import ProtectedLayout from './components/common/ProtectedLayout.jsx';

// Feature Views
import Login from './features/auth/Login.jsx';
import Signup from './features/auth/Signup.jsx';
import Dashboard from './features/dashboard/Dashboard.jsx';
import AssetsPage from './features/assets/AssetsPage.jsx';
import AllocationsPage from './features/allocation/AllocationsPage.jsx';
import BookingCalendar from './features/booking/BookingCalendar.jsx';
import MaintenanceKanban from './features/maintenance/MaintenanceKanban.jsx';
import AuditList from './features/audit/AuditList.jsx';
import AnalyticsDashboard from './features/reports/AnalyticsDashboard.jsx';
import NotificationFeed from './features/notifications/NotificationFeed.jsx';
import Organization from './features/organization/Organization.jsx';
import OrganizationSetup from './features/admin/OrganizationSetup.jsx';

export const App = () => {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          {/* Public Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Protected Application routes */}
          <Route element={<ProtectedLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Asset & Allocation Management — ADMIN, ASSET_MANAGER, DEPT_HEAD only */}
              <Route
                element={<ProtectedLayout allowedRoles={['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD']} />}
              >
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/allocations" element={<AllocationsPage />} />
              </Route>

              <Route path="/bookings" element={<BookingCalendar />} />
              <Route path="/maintenance" element={<MaintenanceKanban />} />

              {/* Audits & Reports — ADMIN, ASSET_MANAGER only */}
              <Route element={<ProtectedLayout allowedRoles={['ADMIN', 'ASSET_MANAGER']} />}>
                <Route path="/audits" element={<AuditList />} />
                <Route path="/reports" element={<AnalyticsDashboard />} />
              </Route>

              <Route path="/notifications" element={<NotificationFeed />} />
              <Route path="/organization" element={<Organization />} />

              {/* Admin Only Routes */}
              <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
                <Route path="/admin/org-setup" element={<OrganizationSetup />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
};

export default App;
