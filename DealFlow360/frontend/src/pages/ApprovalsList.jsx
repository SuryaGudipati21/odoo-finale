// src/pages/ApprovalsList.jsx — Approval pipeline & queue
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApprovals } from "../services/mockApi";
import { getApprovals } from "../services/api";
import Layout from "../components/Layout";

function ApprovalsList() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getApprovals()
      .then((data) => setApprovals(data || []))
      .catch(() => fetchApprovals().then((res) => setApprovals(res.data || [])))
      .finally(() => setLoading(false));
  }, []);

  const riskLabel = (score) => (score >= 15 ? "HIGH" : score >= 8 ? "MEDIUM" : "LOW");
  const riskBadge = (score) =>
    score >= 15
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : score >= 8
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => {
      const matchesFilter = filter === "all" || (a.status || "pending").toLowerCase() === filter.toLowerCase();
      const cust = (a.customer_name || a.customer || "Acme Corp").toLowerCase();
      const qId = String(a.quotation_id || "").toLowerCase();
      const matchesSearch = !searchTerm || cust.includes(searchTerm.toLowerCase()) || qId.includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [approvals, filter, searchTerm]);

  const pendingCount = approvals.filter((a) => (a.status || "pending").toLowerCase() === "pending").length;
  const approvedCount = approvals.filter((a) => (a.status || "").toLowerCase() === "approved").length;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Approvals Queue</h1>
          <p className="text-gray-500 text-sm">
            Quotations requiring sales manager or executive finance authorization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filter === "all"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All ({approvals.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filter === "pending"
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filter === "approved"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by customer or Quote ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "46px" }}
            className="w-full pr-9 py-2.5 bg-gray-50/90 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Tip: Click Quotation Ref button to open quotation in builder.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading approvals queue...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Quotation Ref</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5">Approval Stage</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApprovals.map((a) => {
                const targetId = a.id || a.quotation_id || 1;
                const qRef = String(a.quotation_id).startsWith("Q-") ? a.quotation_id : `Q-${a.quotation_id}`;
                return (
                  <tr
                    key={a.id || a.quotation_id}
                    className="hover:bg-gray-50/70 transition-colors duration-150"
                  >
                    <td className="px-5 py-4">
                      {/* Active Clickable Quotation Link that redirects to quotation builder */}
                      <button
                        type="button"
                        onClick={() => navigate(`/quotations/builder/${a.quotation_id}`)}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200/80 inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Open Quotation Builder for this quote"
                      >
                        <span>{qRef}</span>
                        <span className="text-xs font-normal">↗</span>
                      </button>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 select-text">
                      {a.customer_name || a.customer || "Acme Corp"}
                    </td>
                    <td className="px-5 py-4 select-text">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-bold border rounded-full ${riskBadge(a.blended_risk_score)}`}>
                        {riskLabel(a.blended_risk_score)} ({a.blended_risk_score ?? 14} pts)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 capitalize font-medium select-text">
                      {a.level === "finance" ? "Finance Director" : "Sales Manager"}
                    </td>
                    <td className="px-5 py-4 select-text">
                      {(() => {
                        const s = (a.status || "pending").toLowerCase();
                        return (
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                              s === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : s === "rejected"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : s === "revision_requested"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            }`}
                          >
                            {s.replace(/_/g, " ").toUpperCase()}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const s = (a.status || "pending").toLowerCase();
                          if (s === "approved") {
                            return (
                              <button
                                type="button"
                                onClick={() => navigate(`/approvals/${targetId}`)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs transition-all btn-press flex items-center gap-1"
                                title="View Approved Decision & Audit Details"
                              >
                                <span>✓</span>
                                <span>View Approved →</span>
                              </button>
                            );
                          }
                          if (s === "rejected") {
                            return (
                              <button
                                type="button"
                                onClick={() => navigate(`/approvals/${targetId}`)}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold shadow-2xs transition-all btn-press flex items-center gap-1"
                                title="View Rejection Reason & Audit Details"
                              >
                                <span>✕</span>
                                <span>View Rejected →</span>
                              </button>
                            );
                          }
                          if (s === "revision_requested") {
                            return (
                              <button
                                type="button"
                                onClick={() => navigate(`/approvals/${targetId}`)}
                                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold shadow-2xs transition-all btn-press flex items-center gap-1"
                                title="View Revision Request & Notes"
                              >
                                <span>↺</span>
                                <span>View Revision →</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => navigate(`/approvals/${targetId}`)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all btn-press flex items-center gap-1"
                              title="Review and Submit Approval Decision"
                            >
                              <span>⚖️</span>
                              <span>Review Approval →</span>
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredApprovals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No approval requests found matching active criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export default ApprovalsList;