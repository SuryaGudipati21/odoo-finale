// src/pages/CustomerPortal.jsx
// Owner: Sanjay — restricted customer-facing negotiation view (B8)
// Location: frontend/src/pages/CustomerPortal.jsx

import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CustomerNegotiation from "../components/CustomerNegotiation";

function CustomerPortal() {
  const { id } = useParams();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Portal-specific header — intentionally NOT the internal Navigation
          component, since this route must stay a separate, restricted
          experience from the sales workspace (see section 7). */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">DealFlow360</p>
            <p className="text-xs text-gray-500">Customer Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg border border-gray-700/50 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <CustomerNegotiation quotationId={id} />
    </div>
  );
}

export default CustomerPortal;