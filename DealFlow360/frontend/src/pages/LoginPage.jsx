// src/pages/LoginPage.jsx
// Owner: Shared
// FIXED: was importing `login` from services/api.js (real backend call to a
// server that isn't running), which meant login always failed and the app
// was completely unreachable past this screen. Switched to mockApi to match
// the rest of the app. Also removed a duplicated inner `onLoginSuccess`
// function that was shadowing the prop and never actually used it.

import { useState } from "react";
import { login } from "../services/mockApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DEMO_ROLES = [
  { value: "sales_rep", label: "Sales Rep" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin" },
  { value: "customer", label: "Customer (Portal)" },
];

function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("rep@example.com");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("sales_rep");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await login(email, password, role);
      const { access_token, user } = res.data;
      authLogin(access_token, user.role, user);

      // Customers land in their restricted portal, never the internal workspace.
      if (user.role === "customer") {
        navigate("/portal/quotations/Q-2024-001"); // demo quotation — real flow would use the customer's own quotation id
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>DealFlow360 Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <select
          className="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {DEMO_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              Log in as {r.label}
            </option>
          ))}
        </select>

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
        {error && <p>{error}</p>}

        <div className="login-info">
          <p><strong>Demo mode:</strong> any email/password works.</p>
          <p>Pick a role above to test that role's screens (Approvals needs Sales Manager or Finance, Config needs Admin, etc).</p>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;