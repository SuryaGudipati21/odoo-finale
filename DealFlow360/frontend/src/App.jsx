// src/App.jsx
// Owner: Shared — route definitions, wires pages together with role-based protection
// FIXED: /portal/quotations/:id was nested inside LayoutWithNav, so customers saw
// the internal sales Navigation bar (Quotations/Approvals/Deal Health/Config) above
// their negotiation screen — the opposite of the "separate, restricted view"
// requirement. Moved it to its own top-level route, same pattern as /login.

import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import SalesWorkspace from "./pages/SalesWorkspace";
import QuotationBuilder from "./pages/QuotationBuilder";
import ApprovalScreen from "./pages/ApprovalScreen";
import CustomerPortal from "./pages/CustomerPortal";
import DealHealthDashboard from "./pages/DealHealthDashboard";
import BackendConfig from "./pages/BackendConfig";
import ReportingDashboard from "./pages/ReportingDashboard";

// Components
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";

// Layout wrapper that includes navigation — internal (sales-side) routes only
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

            {/* Login page - no navigation */}
            <Route path="/login" element={<LoginPage />} />

            {/* Customer Portal — deliberately OUTSIDE LayoutWithNav. This must
                stay a separate, restricted experience with no internal sales
                nav, per the problem statement's explicit requirement. */}
            <Route
              path="/portal/quotations/:id"
              element={
                <ProtectedRoute roles={["customer"]}>
                  <CustomerPortal />
                </ProtectedRoute>
              }
            />

            {/* All internal (sales-side) authenticated routes - with navigation */}
            <Route element={<LayoutWithNav />}>

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={["sales_rep", "sales_manager", "admin"]}>
                    <SalesWorkspace />
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
                path="/approvals/:id"
                element={
                  <ProtectedRoute roles={["sales_manager", "finance"]}>
                    <ApprovalScreen />
                  </ProtectedRoute>
                }
              />

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