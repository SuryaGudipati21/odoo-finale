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
  const [view, setView] = useState("kanban"); // "kanban" | "table"
  const quotationTotal = (q) =>
  q.lines.reduce(
    (sum, l) => sum + l.unit_price * l.quantity * (1 - (l.discount_percent || 0) / 100), 0
  );
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
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {COLUMNS.map((col) => (
            <div key={col.key} className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[300px]">
              <p className="text-gray-700 font-semibold text-sm mb-3">{col.label}</p>
              <div className="space-y-2">
                {quotations
                  .filter((q) => (q.status || "DRAFT") === col.key)
                  .map((q) => (
                    <button
                      key={q.id}
                      onClick={() => openQuotation(q.id)}
                      className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors duration-150 shadow-sm"
                    >
                      <p className="text-gray-900 text-sm font-medium">{q.customer}</p>
                      <p className="text-gray-500 text-xs">{formatCurrency(quotationTotal(q))}</p>
                      {q.created_by && (
                        <p className="text-gray-400 text-xs mt-1">by {q.created_by}</p>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((q) => {
                const col = COLUMNS.find((c) => c.key === (q.status || "DRAFT"));
                return (
                  <tr
                    key={q.id}
                    onClick={() => openQuotation(q.id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900 font-medium">{q.customer}</td>
                    <td className="px-4 py-3 text-gray-600">{col ? col.label : q.status || "Draft"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(quotationTotal(q))}</td>
                    <td className="px-4 py-3 text-gray-500">{q.created_by || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => openQuotation("new")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-150"
        >
          + New Quotation
        </button>
                <button
          onClick={() => setView(view === "kanban" ? "table" : "kanban")}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm"
        >
          Switch to {view === "kanban" ? "Table" : "Kanban"} View
        </button>
      </div>
    </Layout>
  );
}

export default QuotationsList;