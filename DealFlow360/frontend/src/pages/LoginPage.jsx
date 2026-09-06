// src/pages/LoginPage.jsx
// Owner: Shared
// Redesigned to match the wireframe (Screen 1: Login / Signup) — Log In / Sign Up
// tabs, side-by-side email+password fields, a Forgot Password action, a company/team
// selector for multi-team setups, and basic client-side validation. Still uses the
// mock auth flow (services/mockApi.js) so the app works with no backend running.

import { useState } from "react";
import { login, signup, customerLogin } from "../services/api";
import * as mockApi from "../services/mockApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TEAMS = [
  { value: "sales_rep", label: "Sales" },
  { value: "sales_manager", label: "Sales Management" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin / Ops" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [accountType, setAccountType] = useState("internal"); // "internal" | "customer"
  const [team, setTeam] = useState("sales_rep");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("rep@dealflow.com");
  const [password, setPassword] = useState("pass123");

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setFieldErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (!password || password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (mode === "signup" && !fullName.trim()) {
      errors.fullName = "Full name is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const DEMO_CREDENTIALS = {
    sales_rep: { email: "rep@dealflow.com", password: "pass123" },
    sales_manager: { email: "manager@dealflow.com", password: "pass123" },
    finance: { email: "finance@dealflow.com", password: "pass123" },
    admin: { email: "admin@dealflow.com", password: "pass123" },
  };

  const handleTeamChange = (newTeam) => {
    setTeam(newTeam);
    const demoEmails = Object.values(DEMO_CREDENTIALS).map((c) => c.email);
    if (!email || demoEmails.includes(email)) {
      setEmail(DEMO_CREDENTIALS[newTeam]?.email || "rep@dealflow.com");
      setPassword("pass123");
    }
  };

  const handleDemoSelect = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword("pass123");
    setTeam(demoRole);
    setAccountType("internal");
    setError(null);
    setFieldErrors({});
  };

  const getRoleDashboard = (role) => {
    switch (role) {
      case "customer":
        return "/portal/quotations/Q-2024-001";
      case "sales_manager":
        return "/deal-health";
      case "finance":
        return "/invoices";
      case "admin":
        return "/config";
      case "sales_rep":
      default:
        return "/dashboard";
    }
  };

  const routeAfterLogin = (user, selectedTeam) => {
    const role = user?.role || selectedTeam || "sales_rep";
    navigate(getRoleDashboard(role));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      let res;
      if (mode === "signup") {
        res = await signup(email, password, fullName, team);
      } else if (accountType === "customer") {
        res = await customerLogin(email, password);
      } else {
        res = await login(email, password);
      }

      const access_token = res.access_token || res.data?.access_token;
      const user = res.user || res.data?.user || res.customer || { email, role: team };
      authLogin(access_token, user.role || team, user);
      routeAfterLogin(user, team);
    } catch (err) {
      console.warn("Real auth failed, falling back to mock:", err);
      try {
        const role = accountType === "customer" ? "customer" : team;
        const res =
          mode === "signup"
            ? await mockApi.signup(email, password, fullName, role)
            : await mockApi.login(email, password, role);

        const { access_token, user } = res.data;
        authLogin(access_token, user.role, user);
        routeAfterLogin(user, team);
      } catch (mockErr) {
        setError(err.message || mockErr.message || (mode === "signup" ? "Sign up failed" : "Login failed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <span className="login-header-title">DealFlow360</span>
      </header>

      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2>Login / Signup</h2>
          <p className="login-subtitle">
            Entry point for internal users and customers
          </p>

          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`login-tab ${mode === "login" ? "login-tab-active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Log In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`login-tab ${mode === "signup" ? "login-tab-active" : ""}`}
              onClick={() => switchMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {mode === "signup" && (
            <div className="login-field-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {fieldErrors.fullName && (
                <span className="field-error">{fieldErrors.fullName}</span>
              )}
            </div>
          )}

          <div className="login-row">
            <div className="login-field-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>
            <div className="login-field-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>
          </div>

          {mode === "signup" && (
            <div className="login-field-group">
              <label htmlFor="accountType">Account Type</label>
              <select
                id="accountType"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="internal">Internal user</option>
                <option value="customer">Customer (Portal)</option>
              </select>
            </div>
          )}

          {accountType === "internal" && (
            <div className="login-field-group">
              <label htmlFor="team">Company / Team</label>
              <select
                id="team"
                value={team}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                {TEAMS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="login-actions">
            <button type="submit" className="login-btn-primary" disabled={submitting}>
              {submitting
                ? mode === "signup"
                  ? "Creating account..."
                  : "Logging in..."
                : mode === "signup"
                ? "Create Account"
                : "Log In"}
            </button>
            {mode === "login" && (
              <button type="button" className="login-btn-secondary">
                Forgot Password?
              </button>
            )}
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="pt-3 border-t border-gray-100 my-4 text-left">
            <p className="text-xs font-semibold text-gray-500 mb-2">⚡ Quick Demo Access (Click to Fill & Login):</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSelect("rep@dealflow.com", "sales_rep")}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-left font-medium border border-blue-200 transition-colors"
              >
                💼 Sales Rep<br/><span className="text-3xs text-gray-500">rep@dealflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect("manager@dealflow.com", "sales_manager")}
                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-left font-medium border border-amber-200 transition-colors"
              >
                ⚖️ Manager<br/><span className="text-3xs text-gray-500">manager@dealflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect("admin@dealflow.com", "admin")}
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-left font-medium border border-purple-200 transition-colors"
              >
                ⚡ Admin<br/><span className="text-3xs text-gray-500">admin@dealflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect("finance@dealflow.com", "finance")}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-left font-medium border border-emerald-200 transition-colors"
              >
                💰 Finance<br/><span className="text-3xs text-gray-500">finance@dealflow.com</span>
              </button>
            </div>
          </div>

          <ul className="login-notes">
            <li>Company / team selector shown for multi-team setups</li>
            <li>Basic validation on email and password fields</li>
            <li>Sign Up link creates a new internal or customer account</li>
          </ul>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;