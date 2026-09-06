// src/pages/QuotationsList.jsx — modern, executive-grade quotation pipeline (Kanban & Table Views)
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listQuotations } from "../services/mockApi";
import { getQuotations, updateQuotationStatus } from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/formatting";
import Layout from "../components/Layout";

const STAGES = [
  { key: "DRAFT", label: "Draft", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  { key: "PENDING_APPROVAL", label: "Pending Approval", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "APPROVED", label: "Approved", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { key: "SENT_TO_CUSTOMER", label: "Sent to Customer", badge: "bg-purple-50 text-purple-800 border-purple-200" },
  { key: "NEGOTIATION", label: "Negotiation", badge: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { key: "CONFIRMED", label: "Confirmed", badge: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "FULFILLMENT", label: "Fulfillment", badge: "bg-teal-50 text-teal-800 border-teal-200" },
  { key: "COMPLETED", label: "Completed", badge: "bg-green-50 text-green-800 border-green-200" },
];

const KANBAN_COLUMNS = [
  { key: "DRAFT", label: "Draft", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  { key: "PENDING_APPROVAL", label: "Pending Approval", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "APPROVED", label: "Approved", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { key: "NEGOTIATION", label: "Negotiation", badge: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { key: "CONFIRMED", label: "Confirmed", badge: "bg-blue-50 text-blue-800 border-blue-200" },
];

function getStatusBadge(status) {
  const norm = (status || "DRAFT").toUpperCase();
  const match = STAGES.find((c) => c.key === norm);
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
      stage: isFinance ? "Pending: Finance" : "Pending: Manager",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
      icon: "⏳",
    };
  }
  if (norm === "REAPPROVAL_REQUIRED") {
    return {
      status: "REAPPROVAL",
      stage: "Re-approval Required",
      badge: "bg-orange-50 text-orange-800 border-orange-200",
      dot: "bg-orange-500",
      icon: "⚠️",
    };
  }
  if (norm === "APPROVED" || norm === "CONFIRMED") {
    return {
      status: "APPROVED",
      stage: "Approved",
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
      icon: "✓",
    };
  }
  if (norm === "REJECTED") {
    return {
      status: "REJECTED",
      stage: "Rejected",
      badge: "bg-rose-50 text-rose-800 border-rose-200",
      dot: "bg-rose-500",
      icon: "✕",
    };
  }
  if (norm === "NEGOTIATION") {
    return {
      status: "NEGOTIATION",
      stage: "In Negotiation",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
      dot: "bg-indigo-500",
      icon: "💬",
    };
  }
  return {
    status: "DRAFT",
    stage: "Draft",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    icon: "📝",
  };
}

function QuotationsList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // Default to clean table view
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copyToast, setCopyToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchList = () => {
    setLoading(true);
    getQuotations()
      .then((data) => {
        if (Array.isArray(data)) {
          setQuotations(data);
        } else {
          listQuotations().then((res) => setQuotations(res.data || []));
        }
      })
      .catch(() => {
        listQuotations().then((res) => setQuotations(res.data || []));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openQuotation = (id) => navigate(`/quotations/builder/${id}`);

  const handleStatusChange = async (quotationId, newStatus) => {
    const prevList = [...quotations];
    setQuotations((prev) =>
      prev.map((q) => (q.id === quotationId ? { ...q, status: newStatus } : q))
    );
    try {
      await updateQuotationStatus(quotationId, newStatus);
      setCopyToast(`Quotation #${quotationId} status updated to ${newStatus.replace(/_/g, " ")}`);
      setTimeout(() => setCopyToast(null), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setQuotations(prevList);
      setCopyToast(`Failed to update status: ${err.message || "Error"}`);
      setTimeout(() => setCopyToast(null), 4000);
    }
  };

  // Pipeline Metric Calculations
  const metrics = useMemo(() => {
    const totalPipeline = quotations.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);
    const totalCount = quotations.length;
    const pendingCount = quotations.filter((q) => {
      const s = (q.status || "").toUpperCase();
      return s === "PENDING_APPROVAL" || s === "REAPPROVAL_REQUIRED";
    }).length;
    const confirmedCount = quotations.filter((q) => {
      const s = (q.status || "").toUpperCase();
      return s === "CONFIRMED" || s === "COMPLETED" || s === "FULFILLMENT";
    }).length;

    return {
      totalPipeline,
      totalCount,
      pendingCount,
      confirmedCount,
    };
  }, [quotations]);

  // Filtered list
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const cust = (q.customer || q.customer_name || "").toLowerCase();
      const qId = String(q.id || "").toLowerCase();
      const ref = formatQuotationRef(q.id).toLowerCase();
      const rep = (q.created_by || "").toLowerCase();
      const matchesSearch =
        !searchTerm ||
        cust.includes(searchTerm.toLowerCase()) ||
        qId.includes(searchTerm.toLowerCase()) ||
        ref.includes(searchTerm.toLowerCase()) ||
        rep.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || (q.status || "DRAFT") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  // Reset to page 1 whenever filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / pageSize));
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  return (
    <Layout>
      {copyToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900/95 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 z-50 animate-fade-in backdrop-blur-md border border-gray-800">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
          <span>{copyToast}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Quotations Pipeline
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Enterprise sales pipeline with automated discount limits, blended margin scoring, and real-time approvals.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* View Mode Switcher */}
          <div className="bg-gray-100/90 p-1 rounded-xl border border-gray-200/80 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              title="Table View"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              title="Kanban Board View"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Kanban</span>
            </button>
          </div>

          {/* New Quotation Button */}
          <button
            onClick={() => openQuotation("new")}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow transition-all duration-150 btn-press cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pipeline Value</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              $
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(metrics.totalPipeline)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Across all active negotiation stages</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Quotations</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              📄
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {metrics.totalCount} Quotes
          </div>
          <p className="text-xs text-gray-400 mt-1">Managed across database catalog</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              ⚖️
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">
            {metrics.pendingCount}
          </div>
          <p className="text-xs text-gray-400 mt-1">Requires manager / finance decision</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirmed / Won</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            {metrics.confirmedCount}
          </div>
          <p className="text-xs text-gray-400 mt-1">Ready for fulfillment & billing</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 mb-6 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by customer, quote ref (e.g. Q-261), or rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "42px" }}
            className="w-full pr-9 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap mr-1">Stage:</span>
          {["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "NEGOTIATION", "CONFIRMED"].map((key) => {
            const count =
              key === "ALL"
                ? quotations.length
                : quotations.filter((q) => (q.status || "DRAFT") === key).length;
            const label = key === "ALL" ? "All" : STAGES.find((s) => s.key === key)?.label || key;
            const isActive = statusFilter === key;

            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/70"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-2xs px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-gray-500 border border-gray-200/80"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200/90 rounded-2xl shadow-2xs">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading quotations pipeline...</p>
        </div>
      ) : viewMode === "table" ? (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-2xs overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/90 border-b border-gray-200/80 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Quotation Ref</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Pipeline Stage</th>
                  <th className="px-5 py-3.5">Approval Status</th>
                  <th className="px-5 py-3.5">Sales Rep</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedQuotations.map((q) => {
                  const lines = Array.isArray(q.lines) ? q.lines : [];
                  const lineCount = q.line_count ?? lines.length;
                  const total = q.total_amount ?? lines.reduce(
                    (sum, l) => sum + (l.unit_price || 0) * (l.quantity || 1) * (1 - (l.discount_percent || 0) / 100), 0
                  );
                  const qRef = formatQuotationRef(q.id);
                  const appr = getApprovalStatusInfo(q);

                  return (
                    <tr
                      key={q.id}
                      onClick={() => openQuotation(q.id)}
                      className="hover:bg-blue-50/30 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-mono">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard?.writeText(qRef);
                            setCopyToast(`Copied ${qRef} to clipboard!`);
                            setTimeout(() => setCopyToast(null), 3000);
                          }}
                          className="font-bold text-blue-600 hover:text-blue-800 bg-blue-50/90 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200/70 inline-flex items-center gap-1.5 transition-colors cursor-copy group/copy text-xs"
                          title="Click to copy Quotation Reference"
                        >
                          <span>{qRef}</span>
                          <span className="text-3xs text-gray-400 group-hover/copy:text-blue-600">📋</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {q.customer || q.customer_name || `Customer #${q.customer_id}`}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {lineCount} {lineCount === 1 ? "line" : "lines"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={q.status || "DRAFT"}
                            onChange={(e) => handleStatusChange(q.id, e.target.value)}
                            className={`text-xs font-semibold border rounded-lg px-2.5 py-1 appearance-none pr-6 cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all ${getStatusBadge(q.status)}`}
                            title="Change stage"
                          >
                            {STAGES.map((opt) => (
                              <option key={opt.key} value={opt.key} className="bg-white text-gray-900 font-normal">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400 text-3xs">
                            ▼
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-full ${appr.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${appr.dot}`}></span>
                          <span>{appr.stage}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {q.created_by || "Sales Rep"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(q.status === "PENDING_APPROVAL" || q.status === "REAPPROVAL_REQUIRED") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/approvals/${q.id}`);
                              }}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs hover:shadow transition-all duration-150 btn-press flex items-center gap-1 shrink-0"
                              title="Review quotation approval workflow"
                            >
                              <span>⚖️</span>
                              <span>Review</span>
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
                            Open →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredQuotations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">🔍</span>
                        <p className="font-semibold text-gray-600">No quotations match your filters</p>
                        <p className="text-xs text-gray-400">Try clearing your search term or adjusting the stage filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Clean Pagination Footer */}
          {filteredQuotations.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>
                  Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-gray-800">
                    {Math.min(currentPage * pageSize, filteredQuotations.length)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-800">{filteredQuotations.length}</span> quotations
                </span>

                <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 outline-none cursor-pointer"
                  >
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  « Prev
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next »
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= KANBAN VIEW (DECLUTTERED) ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {KANBAN_COLUMNS.map((col) => {
            const colQuotes = filteredQuotations.filter((q) => (q.status || "DRAFT") === col.key);
            const colTotal = colQuotes.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

            return (
              <div
                key={col.key}
                className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-3.5 flex flex-col shadow-2xs h-[640px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-sm tracking-tight">{col.label}</span>
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 shadow-2xs">
                      {colQuotes.length}
                    </span>
                  </div>
                  <span className="text-2xs font-semibold text-gray-400">
                    {formatCurrency(colTotal)}
                  </span>
                </div>

                {/* Cards Container with clean scrollbar */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {colQuotes.map((q) => {
                    const lines = Array.isArray(q.lines) ? q.lines : [];
                    const lineCount = q.line_count ?? lines.length;
                    const total = q.total_amount ?? lines.reduce(
                      (sum, l) => sum + (l.unit_price || 0) * (l.quantity || 1) * (1 - (l.discount_percent || 0) / 100), 0
                    );
                    const qRef = formatQuotationRef(q.id);
                    const appr = getApprovalStatusInfo(q);

                    return (
                      <div
                        key={q.id}
                        onClick={() => openQuotation(q.id)}
                        className="w-full text-left bg-white border border-gray-200/90 rounded-xl p-3 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-2xs font-mono font-bold text-blue-600 bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-200/70">
                            {qRef}
                          </span>
                          <span className="text-2xs font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">
                            Open →
                          </span>
                        </div>

                        <p className="text-gray-900 text-sm font-semibold truncate mb-1" title={q.customer || q.customer_name}>
                          {q.customer || q.customer_name || `Customer #${q.customer_id}`}
                        </p>

                        <p className="text-emerald-700 font-bold text-sm tracking-tight mb-2">
                          {formatCurrency(total)}
                        </p>

                        {/* Approval pill */}
                        <div className="mb-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-2xs font-semibold border ${appr.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${appr.dot}`}></span>
                            <span>{appr.stage}</span>
                          </span>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between text-2xs text-gray-400 pt-2 border-t border-gray-100">
                          <span>{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
                          <span className="truncate max-w-[90px]">{q.created_by || "Rep"}</span>
                        </div>

                        {(q.status === "PENDING_APPROVAL" || q.status === "REAPPROVAL_REQUIRED") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/approvals/${q.id}`);
                            }}
                            className="w-full mt-2 py-1 px-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white rounded-lg text-2xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <span>⚖️ Review Approval</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {colQuotes.length === 0 && (
                    <div className="h-28 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400">
                      No quotations
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default QuotationsList;