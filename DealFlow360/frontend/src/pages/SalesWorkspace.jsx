// Owner: Pardha — quotation list/pipeline entry point (B2)
// Location: frontend/src/pages/SalesWorkspace.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listQuotations } from "../services/mockApi";
import { formatCurrency } from "../utils/formatting";

const STATUS_STYLES = {
  DRAFT: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  PENDING_APPROVAL: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  NEGOTIATION: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  SENT_TO_CUSTOMER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CONFIRMED: "bg-green-500/20 text-green-300 border-green-500/30",
};

function SalesWorkspace() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listQuotations()
      .then((res) => setQuotations(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const openQuotation = (id) => navigate(`/quotations/builder/${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-400/5 border border-blue-500/20 rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Sales Workspace</h1>
          <p className="text-gray-400 text-sm">
            {quotations.length} active quotation{quotations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => openQuotation("new")}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200"
        >
          + New Quotation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotations.map((q) => {
          const total = q.lines.reduce(
            (sum, l) => sum + l.unit_price * l.quantity * (1 - (l.discount_percent || 0) / 100),
            0
          );
          return (
            <button
              key={q.id}
              onClick={() => openQuotation(q.id)}
              className="text-left bg-gray-800/30 border border-gray-700/50 hover:border-blue-500/40 rounded-xl p-5 transition-all duration-200 hover:bg-gray-800/50"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-white font-semibold">{q.customer}</p>
                  <p className="text-xs text-gray-400">Quotation #{q.id}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                    STATUS_STYLES[q.status] || STATUS_STYLES.DRAFT
                  }`}
                >
                  {(q.status || "DRAFT").replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-green-300 font-bold text-lg">{formatCurrency(total)}</p>
              <p className="text-xs text-gray-500 mt-1">{q.lines.length} line items</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SalesWorkspace;