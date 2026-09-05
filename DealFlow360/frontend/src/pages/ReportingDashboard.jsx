// src/pages/ReportingDashboard.jsx
// Owner: Sales performance reporting with filters (A7)
// Location: frontend/src/pages/ReportingDashboard.jsx

import { useState, useEffect, useMemo } from "react";
import { listQuotations } from "../services/mockApi";
import { formatCurrency, formatDate } from "../utils/formatting";

const STATUS_OPTIONS = ["All", "DRAFT", "PENDING_APPROVAL", "NEGOTIATION", "SENT_TO_CUSTOMER", "CONFIRMED"];

function ReportingDashboard() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");

  useEffect(() => {
    listQuotations()
      .then((res) => setQuotations(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const productOptions = useMemo(() => {
    const names = new Set();
    quotations.forEach((q) => q.lines.forEach((l) => names.add(l.product_name)));
    return ["All", ...Array.from(names)];
  }, [quotations]);

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== "All" && q.status !== statusFilter) return false;
      if (productFilter !== "All" && !q.lines.some((l) => l.product_name === productFilter)) return false;
      return true;
    });
  }, [quotations, statusFilter, productFilter]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce(
      (sum, q) =>
        sum +
        q.lines.reduce(
          (lineSum, l) => lineSum + l.unit_price * l.quantity * (1 - (l.discount_percent || 0) / 100),
          0
        ),
      0
    );
    const avgDiscount =
      filtered.length === 0
        ? 0
        : filtered.reduce((sum, q) => {
            const lineDiscounts = q.lines.map((l) => l.discount_percent || 0);
            return sum + lineDiscounts.reduce((a, b) => a + b, 0) / (lineDiscounts.length || 1);
          }, 0) / filtered.length;

    return { revenue, count: filtered.length, avgDiscount: Math.round(avgDiscount * 10) / 10 };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-400/5 border border-blue-500/20 rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Reporting Dashboard</h1>
          <p className="text-gray-400 text-sm">Filter and export quotation performance data</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm font-medium rounded-lg border border-gray-700/50 transition-colors duration-200">
            Export PDF
          </button>
          <button className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm font-medium rounded-lg border border-gray-700/50 transition-colors duration-200">
            Export XLS
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
            Approval Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
            Product / Category
          </label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
          >
            {productOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
            Period
          </label>
          <select
            disabled
            className="w-full px-3 py-2.5 bg-gray-800/30 border border-gray-700/50 text-gray-500 rounded-lg cursor-not-allowed"
          >
            <option>All time (date filtering pending backend)</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/30 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Filtered Revenue</p>
          <p className="text-3xl font-bold text-blue-300">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border border-purple-500/30 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Quotations</p>
          <p className="text-3xl font-bold text-purple-300">{totals.count}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-amber-400/10 border border-amber-500/30 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Avg. Discount</p>
          <p className="text-3xl font-bold text-amber-300">{totals.avgDiscount}%</p>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/60 text-gray-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Quotation</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => {
              const total = q.lines.reduce(
                (sum, l) => sum + l.unit_price * l.quantity * (1 - (l.discount_percent || 0) / 100),
                0
              );
              return (
                <tr key={q.id} className="border-t border-gray-700/30">
                  <td className="px-4 py-3 text-white font-medium">{q.id}</td>
                  <td className="px-4 py-3 text-gray-300">{q.customer}</td>
                  <td className="px-4 py-3 text-gray-400">{(q.status || "").replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-right text-green-300 font-semibold">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No quotations match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportingDashboard;