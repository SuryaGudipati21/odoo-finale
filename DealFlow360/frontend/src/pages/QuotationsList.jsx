// src/pages/QuotationsList.jsx — Owner: Pardha — quotation pipeline (Kanban)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listQuotations } from "../services/mockApi";
import { formatCurrency } from "../utils/formatting";
import Layout from "../components/Layout";

const COLUMNS = [
  { key: "DRAFT", label: "Draft" },
  { key: "PENDING_APPROVAL", label: "Pending Approval" },
  { key: "APPROVED", label: "Approved" },
  { key: "NEGOTIATION", label: "Negotiation" },
  { key: "CONFIRMED", label: "Confirmed" },
];

function QuotationsList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listQuotations().then((res) => setQuotations(res.data || [])).finally(() => setLoading(false));
  }, []);

  const openQuotation = (id) => navigate(`/quotations/builder/${id}`);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Quotations (List)</h1>
      <p className="text-gray-500 text-sm mb-6">Every quotation in the system, one row per quotation, click a row to open it</p>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {COLUMNS.map((col) => (
            <div key={col.key} className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[300px]">
              <p className="text-gray-700 font-semibold text-sm mb-3">{col.label}</p>
              <div className="space-y-2">
                {quotations
                  .filter((q) => (q.status || "DRAFT") === col.key)
                  .map((q) => {
                    const total = q.lines.reduce(
                      (sum, l) => sum + l.unit_price * l.quantity * (1 - (l.discount_percent || 0) / 100), 0
                    );
                    return (
                      <button
                        key={q.id}
                        onClick={() => openQuotation(q.id)}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors duration-150 shadow-sm"
                      >
                        <p className="text-gray-900 text-sm font-medium">{q.customer}</p>
                        <p className="text-gray-500 text-xs">{formatCurrency(total)}</p>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => openQuotation("new")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-150"
        >
          + New Quotation
        </button>
        <button className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm">
          Switch to Table View
        </button>
      </div>
    </Layout>
  );
}

export default QuotationsList;