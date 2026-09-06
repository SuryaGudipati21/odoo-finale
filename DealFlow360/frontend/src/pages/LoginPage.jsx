// src/pages/LoginPage.jsx
// Owner: Shared
// Redesigned to match the wireframe (Screen 1: Login / Signup) — Log In / Sign Up
// tabs, side-by-side email+password fields, a Forgot Password action, a company/team
// selector for multi-team setups, and basic client-side validation. Still uses the
// mock auth flow (services/mockApi.js) so the app works with no backend running.

import { useState } from "react";
import { login, signup } from "../services/mockApi";
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
  const [email, setEmail] = useState("rep@example.com");
  const [password, setPassword] = useState("password123");

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

  const routeAfterLogin = (user) => {
    if (user.role === "customer") {
      navigate("/portal/quotations/Q-2024-001"); // demo quotation — real flow would use the customer's own quotation id
    } else {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const role = accountType === "customer" ? "customer" : team;
      const res =
        mode === "signup"
          ? await signup(email, password, fullName, role)
          : await login(email, password, role);

      const { access_token, user } = res.data;
      authLogin(access_token, user.role, user);
      routeAfterLogin(user);
    } catch (err) {
      setError(err.message || (mode === "signup" ? "Sign up failed" : "Login failed"));
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
                onChange={(e) => setTeam(e.target.value)}
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

          <div className="login-info">
            <p>
              After login, internal users land on the Sales Dashboard. Customers
              land on their Quotation Portal.
            </p>
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