// src/pages/QuotationsList.jsx — quotation pipeline (Kanban & Table Views)
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listQuotations } from "../services/mockApi";
import { formatCurrency } from "../utils/formatting";
import Layout from "../components/Layout";

const COLUMNS = [
  { key: "DRAFT", label: "Draft", badge: "bg-gray-100 text-gray-700 border-gray-200" },
  { key: "PENDING_APPROVAL", label: "Pending Approval", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "APPROVED", label: "Approved", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "NEGOTIATION", label: "Negotiation", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { key: "CONFIRMED", label: "Confirmed", badge: "bg-blue-50 text-blue-700 border-blue-200" },
];

function getStatusBadge(status) {
  const norm = (status || "DRAFT").toUpperCase();
  const match = COLUMNS.find((c) => c.key === norm);
  if (match) return match.badge;
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function formatQuotationRef(id) {
  const str = String(id);
  if (str.startsWith("Q-")) return str;
  return `Q-${str.padStart(3, "0")}`;
}

function getApprovalStatusInfo(q) {
  const norm = (q.status || "DRAFT").toUpperCase();
  if (norm === "PENDING_APPROVAL") {
    const isFinance = q.level === "finance" || (q.risk_score && q.risk_score >= 15) || (q.discount_given && q.discount_given >= 15);
    return {
      status: "PENDING",
      stage: isFinance ? "Pending: Finance" : "Pending: Sales Manager",
      badge: "bg-amber-50 text-amber-800 border-amber-300",
      dot: "bg-amber-500",
      icon: "⏳"
    };
  }
  if (norm === "REAPPROVAL_REQUIRED") {
    return {
      status: "REAPPROVAL",
      stage: "Re-approval Required",
      badge: "bg-orange-50 text-orange-800 border-orange-300",
      dot: "bg-orange-500",
      icon: "⚠️"
    };
  }
  if (norm === "APPROVED" || norm === "CONFIRMED") {
    return {
      status: "APPROVED",
      stage: "Approved (Mgr & Finance)",
      badge: "bg-emerald-50 text-emerald-800 border-emerald-300",
      dot: "bg-emerald-500",
      icon: "✓"
    };
  }
  if (norm === "REJECTED") {
    return {
      status: "REJECTED",
      stage: "Rejected",
      badge: "bg-red-50 text-red-800 border-red-300",
      dot: "bg-red-500",
      icon: "✕"
    };
  }
  if (norm === "NEGOTIATION") {
    return {
      status: "NEGOTIATION",
      stage: "In Negotiation",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
      dot: "bg-indigo-500",
      icon: "💬"
    };
  }
  return {
    status: "DRAFT",
    stage: "Not Submitted",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    icon: "📝"
  };
}

function QuotationsList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "table"
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copyToast, setCopyToast] = useState(null);

  useEffect(() => {
    listQuotations()
      .then((res) => setQuotations(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const openQuotation = (id) => navigate(`/quotations/builder/${id}`);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const cust = (q.customer || q.customer_name || "").toLowerCase();
      const qId = String(q.id || "").toLowerCase();
      const matchesSearch = !searchTerm || cust.includes(searchTerm.toLowerCase()) || qId.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || (q.status || "DRAFT") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  return (
    <Layout>
      {copyToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900/90 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-fade-in backdrop-blur-xs">
          <span>✓</span>
          <span>{copyToast}</span>
        </div>
      )}

      {/* Header section with view switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Quotations Pipeline</h1>
          <p className="text-gray-500 text-sm">
            Manage, track, and review sales quotations across every negotiation stage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openQuotation("new")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all duration-150 btn-press"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Quotation
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Filter:</span>
          {["ALL", ...COLUMNS.map((c) => c.key)].map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                statusFilter === key
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
              }`}
            >
              {key === "ALL" ? "All Statuses" : COLUMNS.find((c) => c.key === key)?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading quotations pipeline...</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* ================= KANBAN VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {COLUMNS.map((col) => {
            const colQuotes = filteredQuotations.filter((q) => (q.status || "DRAFT") === col.key);
            return (
              <div
                key={col.key}
                className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-3.5 min-h-[420px] flex flex-col shadow-xs"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-gray-800 font-semibold text-sm">{col.label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 shadow-2xs">
                    {colQuotes.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                  {colQuotes.map((q) => {
                    const lines = Array.isArray(q.lines) ? q.lines : [];
                    const total = q.total_amount ?? lines.reduce(
                      (sum, l) => sum + (l.unit_price || 0) * (l.quantity || 1) * (1 - (l.discount_percent || 0) / 100), 0
                    );
                    const qRef = formatQuotationRef(q.id);
                    const appr = getApprovalStatusInfo(q);

                    return (
                      <div
                        key={q.id}
                        onClick={() => openQuotation(q.id)}
                        className="w-full text-left bg-white border border-gray-200/90 rounded-xl p-3.5 glass-card card-interactive cursor-pointer group shadow-2xs hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-200/80">
                            {qRef}
                          </span>
                          <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                            Open →
                          </span>
                        </div>
                        <p className="text-gray-900 text-sm font-semibold truncate mb-1">
                          {q.customer || q.customer_name || `Customer #${q.customer_id}`}
                        </p>
                        <p className="text-emerald-700 font-bold text-sm tracking-tight mb-2">
                          {formatCurrency(total)}
                        </p>

                        {/* Approval Status Badge */}
                        <div className="mb-2">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${appr.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${appr.dot}`}></span>
                            <span>{appr.stage}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                          <span>{lines.length} {lines.length === 1 ? "item" : "items"}</span>
                          {q.created_by && <span className="truncate max-w-[90px]">by {q.created_by}</span>}
                        </div>

                        {(q.status === "PENDING_APPROVAL" || q.status === "REAPPROVAL_REQUIRED") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/approvals/${q.id}`);
                            }}
                            className="w-full mt-2.5 py-1.5 px-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow btn-press"
                          >
                            <span>⚖️ Review Approval →</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {colQuotes.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200/80 rounded-xl flex items-center justify-center text-xs text-gray-400">
                      No quotations
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm mb-6 animate-fade-in">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Quotation Ref</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Pipeline Stage</th>
                <th className="px-5 py-3.5">Approval Status</th>
                <th className="px-5 py-3.5">Sales Rep</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotations.map((q) => {
                const lines = Array.isArray(q.lines) ? q.lines : [];
                const total = q.total_amount ?? lines.reduce(
                  (sum, l) => sum + (l.unit_price || 0) * (l.quantity || 1) * (1 - (l.discount_percent || 0) / 100), 0
                );
                const qRef = formatQuotationRef(q.id);
                const appr = getApprovalStatusInfo(q);

                return (
                  <tr
                    key={q.id}
                    onClick={() => openQuotation(q.id)}
                    className="hover:bg-blue-50/40 even:bg-gray-50/30 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="px-5 py-4 font-mono">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(qRef);
                          setCopyToast(`Copied ${qRef} to clipboard!`);
                          setTimeout(() => setCopyToast(null), 3000);
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-100 inline-flex items-center gap-1.5 transition-colors cursor-copy group/copy"
                        title="Click to copy Quotation Reference"
                      >
                        <span>{qRef}</span>
                        <span className="text-3xs text-gray-400 group-hover/copy:text-blue-600">📋</span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors" title={q.customer || q.customer_name}>
                        {q.customer || q.customer_name || `Customer #${q.customer_id}`}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {lines.length} {lines.length === 1 ? "line" : "lines"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded-full ${getStatusBadge(q.status)}`}>
                        {(q.status || "DRAFT").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border rounded-full ${appr.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${appr.dot}`}></span>
                        <span>{appr.stage}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {q.created_by || "Sales Rep"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(q.status === "PENDING_APPROVAL" || q.status === "REAPPROVAL_REQUIRED") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/approvals/${q.id}`);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs hover:shadow transition-all duration-150 btn-press flex items-center gap-1 shrink-0"
                            title="Review quotation approval workflow"
                          >
                            <span>⚖️</span>
                            <span>Review Approval →</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQuotation(q.id);
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 rounded-lg text-xs font-semibold shadow-2xs transition-all duration-150 btn-press shrink-0"
                        >
                          Open Builder →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredQuotations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No quotations match the active search or status filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => openQuotation("new")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow btn-press"
          >
            + New Quotation
          </button>
          <button
            onClick={() => setViewMode(viewMode === "kanban" ? "table" : "kanban")}
            className="px-5 py-2.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium rounded-xl text-sm transition-all duration-150 shadow-2xs hover:bg-gray-50 btn-press"
          >
            {viewMode === "kanban" ? "Switch to Table View" : "Switch to Kanban View"}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Showing {filteredQuotations.length} of {quotations.length} total quotations
        </p>
      </div>
    </Layout>
  );
}

export default QuotationsList;