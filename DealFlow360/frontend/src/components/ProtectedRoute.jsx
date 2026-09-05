// Owner: Shared — wraps routes that require authentication + specific roles
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, roles = null }) {
  const { isAuthenticated, userRole, loading } = useAuth();

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

  // If specific roles required, check if user has one
  if (roles && roles.length > 0) {
    if (!roles.includes(userRole)) {
      return (
        <div className="access-denied-page">
          <h1>Access Denied</h1>
          <p>You don't have permission to view this page.</p>
          <p className="required-roles">Required roles: {roles.join(', ')}</p>
          <p className="user-role">Your role: {userRole}</p>
          <a href="/dashboard">Back to Dashboard</a>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;