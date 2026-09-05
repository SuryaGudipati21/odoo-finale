// Owner: Shared — top navigation, matches mockup exactly (solid blue bar, white active tab)
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALL_ITEMS = [
  { label: "Dashboard", path: "/dashboard", roles: ["sales_rep", "sales_manager", "admin", "customer"] },
  { label: "Quotations", path: "/quotations", roles: ["sales_rep", "sales_manager", "admin"] },
  { label: "Approvals", path: "/approvals", roles: ["sales_manager", "finance"] },
  { label: "Fulfillment", path: "/fulfillment", roles: ["sales_manager", "admin"] },
  { label: "Subscriptions", path: "/subscriptions", roles: ["sales_manager", "admin"] },
  { label: "Invoices", path: "/invoices", roles: ["sales_manager", "finance", "admin"] },
  { label: "Deal Health", path: "/deal-health", roles: ["sales_manager", "admin"] },
  { label: "Reports", path: "/reports", roles: ["sales_manager", "finance", "admin"] },
  { label: "Product", path: "/config", roles: ["admin"] },
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

  return (
    <nav className="bg-blue-600 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="text-xl font-bold shrink-0">
          DealFlow360
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-wrap">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive(item.path)
                  ? "bg-white text-blue-700"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <span className="text-sm text-white/90">
            {user?.full_name || "User"} ({userRole})
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            Logout
          </button>
        </div>

        <button className="md:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-blue-700 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(item.path) ? "bg-white text-blue-700" : "text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-white text-sm">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navigation;