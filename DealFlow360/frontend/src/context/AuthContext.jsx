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
    const storedUser = localStorage.getItem('user_info');

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore malformed stored user, fall through with role-only session
        }
      }
      // TODO: Call /auth/me endpoint to get full user info once a real backend session exists
    }
    setLoading(false);
  }, []);

  const login = (token, role, userInfo) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', role);
    if (userInfo) localStorage.setItem('user_info', JSON.stringify(userInfo));
    setUser(userInfo);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_info');
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