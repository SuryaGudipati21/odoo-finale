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
import FulfillmentList from "./pages/FulfillmentList";
import FulfillmentDetail from "./pages/FulfillmentDetail";
import SubscriptionsList from "./pages/SubscriptionsList";
import BillingDetail from "./pages/BillingDetail";
import InvoicesList from "./pages/InvoicesList";
import InvoiceDetail from "./pages/InvoiceDetail";

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
      <a href="/login">Back to Login</a>
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
                <ProtectedRoute roles={["sales_rep", "sales_manager", "admin", "finance"]}>
                  <SalesWorkspace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute roles={["sales_rep", "sales_manager", "admin", "finance"]}>
                  <QuotationsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/builder/:id?"
              element={
                <ProtectedRoute roles={["sales_rep", "sales_manager", "admin", "finance"]}>
                  <QuotationBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute roles={["sales_manager", "admin", "finance"]}>
                  <ApprovalsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals/:id"
              element={
                <ProtectedRoute roles={["sales_manager", "admin", "finance"]}>
                  <ApprovalScreen />
                </ProtectedRoute>
              }
            />

            {/* These pages already render their own <Layout> (nav included) —
                same as the "converted" block above, so NO outer wrapper here.
                Wrapping them in LayoutWithNav as well was causing a duplicate
                nav bar / double frame. */}
            <Route
              path="/fulfillment"
              element={
                <ProtectedRoute roles={["sales_manager", "admin", "finance"]}>
                  <FulfillmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fulfillment/:id"
              element={
                <ProtectedRoute roles={["sales_manager", "admin", "finance"]}>
                  <FulfillmentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute roles={["sales_manager", "admin"]}>
                  <SubscriptionsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions/:id"
              element={
                <ProtectedRoute roles={["sales_manager", "admin"]}>
                  <BillingDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute roles={["sales_manager", "finance", "admin"]}>
                  <InvoicesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute roles={["sales_manager", "finance", "admin"]}>
                  <InvoiceDetail />
                </ProtectedRoute>
              }
            />

            {/* Converted deal health, reporting, and config pages */}
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

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;