// src/pages/LoginPage.jsx
import { useState } from "react";
import { login } from "../services/api";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await login(email, password); // Call from api.js
      
      // Extract role from response and store
      const userRole = response.role || response.user?.role || 'sales_rep';
      authLogin(response.access_token, userRole, response.user);

      // Redirect to dashboard
      const onLoginSuccess = () => {  navigate('/dashboard'); };
      onLoginSuccess?.();
      // If no onLoginSuccess, redirect via router (handled by Router component)
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
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
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        <div className="login-info">
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: rep@example.com</p>
          <p>Password: password123</p>
          <p><strong>Roles:</strong> sales_rep, sales_manager, finance, admin</p>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;