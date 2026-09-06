// Owner: Shared — top navigation, matches mockup exactly (solid blue bar, white active tab)
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALL_ITEMS = [
  { label: "Dashboard", path: "/dashboard", roles: ["sales_rep", "sales_manager", "admin", "finance", "customer"] },
  { label: "Quotations", path: "/quotations", roles: ["sales_rep", "sales_manager", "admin", "finance"] },
  { label: "Approvals", path: "/approvals", roles: ["sales_manager", "admin", "finance"] },
  { label: "Fulfillment", path: "/fulfillment", roles: ["sales_manager", "admin", "finance"] },
  { label: "Subscriptions", path: "/subscriptions", roles: ["sales_manager", "admin"] },
  { label: "Invoices", path: "/invoices", roles: ["sales_manager", "finance", "admin"] },
  { label: "Deal Health", path: "/deal-health", roles: ["sales_manager", "admin"] },
  { label: "Reports", path: "/reports", roles: ["sales_manager", "finance", "admin"] },
  { label: "Product", path: "/config", roles: ["admin"] },
  { label: "Customer Portal", path: "/portal/quote/1", roles: ["customer"] },
];

function Navigation() {
  const { userRole, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = ALL_ITEMS.filter((i) => i.roles.includes(userRole));
  const isActive = (path) => location.pathname.startsWith(path);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin": return "bg-purple-400/20 text-purple-100 border-purple-300/30";
      case "sales_manager": return "bg-amber-400/20 text-amber-100 border-amber-300/30";
      case "finance": return "bg-emerald-400/20 text-emerald-100 border-emerald-300/30";
      default: return "bg-blue-400/20 text-blue-100 border-blue-300/30";
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white sticky top-0 z-40 backdrop-blur-md shadow-md shadow-blue-950/10 border-b border-blue-500/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight">DealFlow</span>
              <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-white text-blue-700 shadow-2xs">360</span>
            </div>
            <p className="text-3xs text-blue-200 tracking-wider uppercase font-semibold hidden sm:block">
              Sales Ops Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links - Single Row (No Wrap) */}
        <div className="hidden md:flex items-center gap-0.5 lg:gap-1 flex-nowrap shrink-0">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
                  active
                    ? "bg-white text-blue-700 shadow-xs scale-100"
                    : "text-white/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User Chip & Actions */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs shrink-0">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {(user?.full_name || "U")[0].toUpperCase()}
            </div>
            <div className="text-left shrink-0">
              <p className="text-xs font-semibold leading-tight text-white whitespace-nowrap">
                {user?.full_name || "User"}
              </p>
              <span className={`inline-block text-3xs font-semibold px-1.5 py-0.2 rounded border whitespace-nowrap ${getRoleBadgeColor(userRole)}`}>
                {userRole.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="px-2.5 py-1.5 bg-white/10 hover:bg-rose-500/80 rounded-xl text-xs font-semibold transition-all duration-150 border border-white/15 btn-press flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <span>⎋</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-blue-800/95 backdrop-blur-md px-4 py-3 space-y-1.5 border-t border-blue-600 animate-slide-up">
          <div className="px-3 py-2 mb-2 rounded-xl bg-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold">{user?.full_name || "User"}</span>
            <span className="text-3xs uppercase px-2 py-0.5 rounded bg-white/20 font-bold">{userRole}</span>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive(item.path) ? "bg-white text-blue-700 shadow-xs" : "text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 text-rose-200 hover:text-white text-sm font-semibold pt-3 border-t border-blue-700"
          >
            ⎋ Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navigation;