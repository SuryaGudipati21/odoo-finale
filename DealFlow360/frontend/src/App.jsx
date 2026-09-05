// Owner: Shared — route definitions, wires pages together with role-based protection
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import SalesWorkspace from './pages/SalesWorkspace';
import QuotationBuilder from './pages/QuotationBuilder';
import ApprovalScreen from './pages/ApprovalScreen';
import CustomerPortal from './pages/CustomerPortal';
import DealHealthDashboard from './pages/DealHealthDashboard';
import BackendConfig from './pages/BackendConfig';
import ReportingDashboard from './pages/ReportingDashboard';

// Components
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Context
import { AuthProvider } from './context/AuthContext';

// Layout wrapper that includes navigation
function LayoutWithNav() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navigation />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}

// 404 Page
function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/dashboard">Back to Dashboard</a>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            {/* Login page - no nav */}
            <Route path="/login" element={<LoginPage />} />

            {/* All other routes - with nav */}
            <Route element={<LayoutWithNav />}>
              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <SalesWorkspace />
                  </ProtectedRoute>
                }
              />

              {/* Quotations */}
              <Route
                path="/quotations/builder/:id?"
                element={
                  <ProtectedRoute roles={['sales_rep', 'sales_manager', 'admin']}>
                    <QuotationBuilder />
                  </ProtectedRoute>
                }
              />

              {/* Approvals */}
              <Route
                path="/approvals/:id"
                element={
                  <ProtectedRoute roles={['sales_manager', 'finance']}>
                    <ApprovalScreen />
                  </ProtectedRoute>
                }
              />

              {/* Customer Portal */}
              <Route
                path="/portal/quotations/:id"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <CustomerPortal />
                  </ProtectedRoute>
                }
              />

              {/* Deal Health Dashboard */}
              <Route
                path="/deal-health"
                element={
                  <ProtectedRoute roles={['sales_manager', 'admin']}>
                    <DealHealthDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Configuration */}
              <Route
                path="/config"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <BackendConfig />
                  </ProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={['sales_manager', 'finance', 'admin']}>
                    <ReportingDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;