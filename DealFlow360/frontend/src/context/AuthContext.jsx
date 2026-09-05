// Owner: Shared — manages authentication state globally (current user, role, token)
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Check if user is logged in on mount (restore session from localStorage)
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      // TODO: Call /auth/me endpoint to get full user info
      // For now, assume token is valid
    }
    setLoading(false);
  }, []);

  const login = (token, role, userInfo) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', role);
    setUser(userInfo);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  const hasRole = (requiredRoles) => {
    if (!userRole) return false;
    if (typeof requiredRoles === 'string') return userRole === requiredRoles;
    return requiredRoles.includes(userRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        userRole,
        loading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}