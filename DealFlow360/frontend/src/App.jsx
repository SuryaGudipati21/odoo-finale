// src/App.jsx
// Owner: Shared — route definitions, wires pages together with role-based protection

import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages — converted to light theme, each renders its own <Layout> (nav included)
import LoginPage from "./pages/LoginPage";
import SalesWorkspace from "./pages/SalesWorkspace";
import QuotationsList from "./pages/QuotationsList";
import QuotationBuilder from "./pages/QuotationBuilder";
import ApprovalsList from "./pages/ApprovalsList";
import ApprovalScreen from "./pages/ApprovalScreen";
import CustomerPortal from "./pages/CustomerPortal";

// Pages — not yet converted (Sanjay's/Admin's), still rely on outer nav wrapper
import DealHealthDashboard from "./pages/DealHealthDashboard";
import BackendConfig from "./pages/BackendConfig";
import ReportingDashboard from "./pages/ReportingDashboard";

// Components
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";

// Layout wrapper for pages that DON'T have their own <Layout> yet
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

            {/* Login — no navigation */}
            <Route path="/login" element={<LoginPage />} />

            {/* Customer Portal — separate, restricted, no internal sales nav */}
            <Route
              path="/portal/quotations/:id"
              element={
                <ProtectedRoute roles={["customer"]}>
                  <CustomerPortal />
                </ProtectedRoute>
              }
            />

            {/* Converted pages — each renders its own <Layout>/<Navigation>, so NO outer wrapper here */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={["sales_rep", "sales_manager", "admin"]}>
                  <SalesWorkspace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute roles={["sales_rep", "sales_manager", "admin"]}>
                  <QuotationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/builder/:id?"
              element={
                <ProtectedRoute roles={["sales_rep", "sales_manager", "admin"]}>
                  <QuotationBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute roles={["sales_manager", "finance"]}>
                  <ApprovalsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals/:id"
              element={
                <ProtectedRoute roles={["sales_manager", "finance"]}>
                  <ApprovalScreen />
                </ProtectedRoute>
              }
            />

            {/* Not-yet-converted pages — still need the outer LayoutWithNav wrapper */}
            <Route element={<LayoutWithNav />}>
              <Route
                path="/deal-health"
                element={
                  <ProtectedRoute roles={["sales_manager", "admin"]}>
                    <DealHealthDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/config"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <BackendConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={["sales_manager", "finance", "admin"]}>
                    <ReportingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>

          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;