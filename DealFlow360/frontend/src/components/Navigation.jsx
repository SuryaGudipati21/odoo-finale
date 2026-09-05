// Owner: Shared — top navigation bar with links to all modules (shown after login)
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const { userRole, user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on user role
  const getNavItems = () => {
    if (loading || !userRole) return [];

    const baseItems = [
      { label: 'Dashboard', path: '/dashboard', roles: ['sales_rep', 'sales_manager', 'admin', 'customer'] },
      { label: 'Quotations', path: '/quotations/builder', roles: ['sales_rep', 'sales_manager', 'admin'] },
      { label: 'Approvals', path: '/approvals', roles: ['sales_manager', 'finance'] },
      { label: 'Deal Health', path: '/deal-health', roles: ['sales_manager', 'admin'] },
      { label: 'Reports', path: '/reports', roles: ['sales_manager', 'finance', 'admin'] },
      { label: 'Config', path: '/config', roles: ['admin'] },
    ];

    return baseItems.filter(item => item.roles.includes(userRole));
  };

  const navItems = getNavItems();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <Link to="/dashboard">DealFlow360</Link>
        </div>

        {/* Desktop Menu */}
        <div className="nav-menu-desktop">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="nav-user-menu">
          <span className="user-info">
            {user?.full_name || 'User'} ({userRole || 'loading'})
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="menu-toggle-mobile"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="nav-menu-mobile">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link-mobile ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button className="logout-btn-mobile" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navigation;