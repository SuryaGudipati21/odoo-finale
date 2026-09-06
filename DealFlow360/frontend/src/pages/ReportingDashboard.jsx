// src/pages/ReportingDashboard.jsx
// Owner: Sales performance reporting with filters (A7)
// Location: frontend/src/pages/ReportingDashboard.jsx

import { useState, useEffect, useMemo } from "react";
import { listQuotations } from "../services/mockApi";
import { formatCurrency, formatDate } from "../utils/formatting";
import Layout from "../components/Layout";

const STATUS_OPTIONS = ["All", "DRAFT", "PENDING_APPROVAL", "APPROVED", "NEGOTIATION", "CONFIRMED"];

function getStatusBadge(status) {
  switch ((status || "").toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CONFIRMED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "NEGOTIATION":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function ReportingDashboard() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [viewMode, setViewMode] = useState("summary"); // "summary" | "detailed"
  const [exportNotice, setExportNotice] = useState(null);

  useEffect(() => {
    listQuotations()
      .then((res) => setQuotations(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const productOptions = useMemo(() => {
    const names = new Set();
    quotations.forEach((q) => (q.lines || []).forEach((l) => names.add(l.product_name)));
    return ["All", ...Array.from(names)];
  }, [quotations]);

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== "All" && (q.status || "DRAFT") !== statusFilter) return false;
      if (productFilter !== "All" && !(q.lines || []).some((l) => l.product_name === productFilter)) return false;
      return true;
    });
  }, [quotations, statusFilter, productFilter]);

  const totals = useMemo(() => {
    let gross = 0;
    let net = 0;
    let totalItems = 0;
    filtered.forEach((q) => {
      const lines = q.lines || [];
      lines.forEach((l) => {
        const qty = l.quantity || 1;
        const up = l.unit_price || 0;
        const disc = l.discount_percent || 0;
        gross += up * qty;
        net += up * qty * (1 - disc / 100);
        totalItems += qty;
      });
    });

    const avgDiscount =
      filtered.length === 0
        ? 0
        : filtered.reduce((sum, q) => {
            const lines = q.lines || [];
            const lineDiscounts = lines.map((l) => l.discount_percent || 0);
            return sum + (lineDiscounts.length ? lineDiscounts.reduce((a, b) => a + b, 0) / lineDiscounts.length : 0);
          }, 0) / filtered.length;

    return {
      revenue: net,
      grossRevenue: gross,
      concessions: gross - net,
      totalItems,
      count: filtered.length,
      avgDiscount: Math.round(avgDiscount * 10) / 10,
    };
  }, [filtered]);

  const handleExportXLS = () => {
    try {
      const now = new Date().toLocaleString();
      const filename = `dealflow-detailed-report-${new Date().toISOString().slice(0, 10)}.csv`;
      
      const linesOut = [];
      // 1. Report Header
      linesOut.push(`"DEALFLOW360 EXECUTIVE SALES & QUOTATIONS AUDIT REPORT"`);
      linesOut.push(`"Generated At","${now}"`);
      linesOut.push(`"Status Filter","${statusFilter}","Product Filter","${productFilter}"`);
      linesOut.push(`""`);
      
      // 2. Executive KPI Summary Block
      linesOut.push(`"EXECUTIVE SUMMARY METRICS"`);
      linesOut.push(`"Total Quotations In Scope","${filtered.length}"`);
      linesOut.push(`"Total Gross Pipeline Value","${formatCurrency(totals.grossRevenue)}"`);
      linesOut.push(`"Total Discount Concessions Given","${formatCurrency(totals.concessions)}"`);
      linesOut.push(`"Net Contracted Revenue","${formatCurrency(totals.revenue)}"`);
      linesOut.push(`"Average Concession Rate","${totals.avgDiscount}%"`);
      linesOut.push(`"Total Product Unit Volume","${totals.totalItems} units"`);
      linesOut.push(`""`);

      // 3. Master Quotation List
      linesOut.push(`"QUOTATIONS MASTER SUMMARY"`);
      linesOut.push(`"Quotation Ref","Customer Name","Workflow Status","Line Items Count","Created Date","Net Total ($)"`);
      filtered.forEach((q) => {
        const lines = Array.isArray(q.lines) ? q.lines : [];
        const total = q.total_amount ?? lines.reduce(
          (sum, l) => sum + (l.unit_price || 0) * (l.quantity || 1) * (1 - (l.discount_percent || 0) / 100),
          0
        );
        const ref = `Q-${String(q.id).padStart(3, "0")}`;
        const cust = (q.customer || q.customer_name || `Customer #${q.customer_id}`).replace(/"/g, '""');
        const st = (q.status || "DRAFT").replace(/_/g, " ");
        const date = q.created_at || q.date || "2026-09-01";
        linesOut.push(`"${ref}","${cust}","${st}",${lines.length},"${date}",${Number(total).toFixed(2)}`);
      });
      linesOut.push(`""`);

      // 4. Detailed Line-Item Breakdown Table
      linesOut.push(`"DETAILED LINE-ITEM AUDIT BREAKDOWN"`);
      linesOut.push(`"Quotation Ref","Customer Name","Product Name","Category","Quantity","List Price ($)","Discount (%)","Discount Concession ($)","Net Line Total ($)"`);
      filtered.forEach((q) => {
        const ref = `Q-${String(q.id).padStart(3, "0")}`;
        const cust = (q.customer || q.customer_name || `Customer #${q.customer_id}`).replace(/"/g, '""');
        const lines = Array.isArray(q.lines) ? q.lines : [];
        lines.forEach((l) => {
          const pName = (l.product_name || l.product || "Product").replace(/"/g, '""');
          const cat = (l.category || "General").replace(/"/g, '""');
          const qty = l.quantity || 1;
          const up = l.unit_price || l.price || 0;
          const disc = l.discount_percent || l.discount || 0;
          const discAmt = up * qty * (disc / 100);
          const lineNet = up * qty - discAmt;
          linesOut.push(`"${ref}","${cust}","${pName}","${cat}",${qty},${up.toFixed(2)},${disc}%,${discAmt.toFixed(2)},${lineNet.toFixed(2)}`);
        });
      });

      const csvContent = "\uFEFF" + linesOut.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice(`Comprehensive detailed report with ${filtered.length} quotations & granular line items exported successfully to ${filename}!`);
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      setExportNotice(`Export failed: ${err.message}`);
    }
  };

  const handleExportPDF = () => {
    setExportNotice("Preparing executive detailed print-ready report preview...");
    setTimeout(() => {
      window.print();
      setExportNotice(null);
    }, 250);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Aggregating revenue & margin metrics...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Printable Executive Title & KPI Banner */}
      <div className="hidden print:block mb-6 border-b-2 border-blue-600 pb-4">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold text-gray-900">DealFlow360 Executive Quotations & Sales Intelligence Report</h1>
          <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded">CONFIDENTIAL</span>
        </div>
        <p className="text-xs text-gray-500">
          Generated: {new Date().toLocaleString()} | Filter Status: {statusFilter} | Category: {productFilter}
        </p>
        <div className="grid grid-cols-4 gap-3 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
          <div><span className="text-gray-500">Gross Pipeline:</span> <span className="font-bold">{formatCurrency(totals.grossRevenue)}</span></div>
          <div><span className="text-gray-500">Discounts Conceded:</span> <span className="font-bold text-amber-700">{formatCurrency(totals.concessions)}</span></div>
          <div><span className="text-gray-500">Net Contract Revenue:</span> <span className="font-bold text-emerald-700">{formatCurrency(totals.revenue)}</span></div>
          <div><span className="text-gray-500">Avg Discount:</span> <span className="font-bold">{totals.avgDiscount}%</span></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Reports & Intelligence
            </h1>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full text-xs border border-blue-200">
              Live Pipeline
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Aggregate performance analytics, discount distribution, and financial pipeline export
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl shadow-2xs hover:shadow transition-all btn-press"
            title="Open Print Dialog / Save as PDF"
          >
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportXLS}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl shadow-2xs hover:shadow transition-all btn-press"
            title="Download CSV/Excel data table"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export XLS</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-4 rounded-xl mb-6 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-50 rounded-full blur-lg pointer-events-none"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Filtered Revenue</p>
          <p className="text-3xl font-extrabold text-blue-700 tracking-tight">{formatCurrency(totals.revenue)}</p>
          <p className="text-xs text-gray-400 mt-2">Sum of all filtered orders</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-50 rounded-full blur-lg pointer-events-none"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Quotations</p>
          <p className="text-3xl font-extrabold text-purple-700 tracking-tight">{totals.count}</p>
          <p className="text-xs text-gray-400 mt-2">Active records in view</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-50 rounded-full blur-lg pointer-events-none"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Average Discount</p>
          <p className="text-3xl font-extrabold text-amber-700 tracking-tight">{totals.avgDiscount}%</p>
          <p className="text-xs text-gray-400 mt-2">Mean concession given</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 mb-6 shadow-xs">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Filter Criteria
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Approval & Pipeline Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Product Category
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            >
              {productOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Reporting Period
            </label>
            <select
              disabled
              className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 text-gray-400 text-sm rounded-xl cursor-not-allowed"
            >
              <option>All Time (Current Fiscal Year)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Controls & View Mode Toggle (On-Screen) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Report View:</span>
          <button
            type="button"
            onClick={() => setViewMode("summary")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all btn-press ${
              viewMode === "summary"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Quotation Summary ({filtered.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("detailed")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all btn-press ${
              viewMode === "detailed"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Detailed Line Items ({totals.totalItems} items)
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Showing {viewMode === "summary" ? `${filtered.length} quotations` : `${totals.totalItems} line items across ${filtered.length} quotations`}
        </p>
      </div>

      {/* On-Screen Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm no-print mb-6">
        {viewMode === "summary" ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Quotation Ref</th>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Workflow Status</th>
                <th className="px-5 py-3.5 text-center">Lines</th>
                <th className="px-5 py-3.5 text-right">Net Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((q) => {
                const lines = Array.isArray(q.lines) ? q.lines : [];
                const total = q.total_amount ?? lines.reduce(
                  (sum, l) => sum + (l.unit_price || 0) * (l.quantity || 1) * (1 - (l.discount_percent || 0) / 100),
                  0
                );
                return (
                  <tr key={q.id} className="hover:bg-blue-50/40 transition-colors duration-150">
                    <td className="px-5 py-4 font-mono font-semibold text-blue-600">
                      Q-{String(q.id).padStart(3, "0")}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {q.customer || q.customer_name || `Customer #${q.customer_id}`}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded-full ${getStatusBadge(q.status)}`}>
                        {(q.status || "DRAFT").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-500 font-mono text-xs">
                      {lines.length} items
                    </td>
                    <td className="px-5 py-4 text-right text-emerald-700 font-bold">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    No quotations match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Quote</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Line Net Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.flatMap((q) => {
                const lines = Array.isArray(q.lines) ? q.lines : [];
                return lines.map((l, idx) => {
                  const qty = l.quantity || 1;
                  const up = l.unit_price || l.price || 0;
                  const disc = l.discount_percent || l.discount || 0;
                  const net = up * qty * (1 - disc / 100);
                  return (
                    <tr key={`${q.id}-${idx}`} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">
                        Q-{String(q.id).padStart(3, "0")}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800">
                        {q.customer || q.customer_name || `Customer #${q.customer_id}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-xs">
                        {l.product_name || l.product || "Product"}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{qty}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">{formatCurrency(up)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-amber-600 font-bold">{disc}%</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-emerald-700 font-bold">{formatCurrency(net)}</td>
                    </tr>
                  );
                });
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    No quotation items match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Complete Print-Only Executive Report Section (For PDF Print) */}
      <div className="hidden print:block space-y-6">
        {/* Section 1: Quotations Summary */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            1. Quotations Master Overview
          </h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="p-2">Ref</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Workflow Status</th>
                <th className="p-2 text-center">Items</th>
                <th className="p-2 text-right">Net Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const lines = Array.isArray(q.lines) ? q.lines : [];
                const total = q.total_amount ?? lines.reduce(
                  (sum, l) => sum + (l.unit_price || 0) * (l.quantity || 1) * (1 - (l.discount_percent || 0) / 100),
                  0
                );
                return (
                  <tr key={q.id}>
                    <td className="p-2 font-mono font-semibold">Q-{String(q.id).padStart(3, "0")}</td>
                    <td className="p-2">{q.customer || q.customer_name || `Customer #${q.customer_id}`}</td>
                    <td className="p-2">{(q.status || "DRAFT").replace(/_/g, " ")}</td>
                    <td className="p-2 text-center">{lines.length}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 2: Detailed Line Items Audit */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">
            2. Detailed Product Line-Item Audit Breakdown
          </h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="p-2">Quote</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Product Name</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">List Price</th>
                <th className="p-2 text-right">Discount</th>
                <th className="p-2 text-right">Line Net Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.flatMap((q) => {
                const lines = Array.isArray(q.lines) ? q.lines : [];
                return lines.map((l, idx) => {
                  const qty = l.quantity || 1;
                  const up = l.unit_price || l.price || 0;
                  const disc = l.discount_percent || l.discount || 0;
                  const net = up * qty * (1 - disc / 100);
                  return (
                    <tr key={`print-${q.id}-${idx}`}>
                      <td className="p-2 font-mono font-semibold">Q-{String(q.id).padStart(3, "0")}</td>
                      <td className="p-2">{q.customer || q.customer_name || `Customer #${q.customer_id}`}</td>
                      <td className="p-2 font-medium">{l.product_name || l.product || "Product"}</td>
                      <td className="p-2 text-center">{qty}</td>
                      <td className="p-2 text-right">{formatCurrency(up)}</td>
                      <td className="p-2 text-right">{disc}%</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(net)}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Sign-off & Audit Notice */}
        <div className="pt-4 border-t border-gray-300 text-2xs text-gray-500 flex justify-between">
          <span>DealFlow360 Enterprise CPQ & Automated Workflow Engine</span>
          <span>Official Audit Certified — Page 1 of 1</span>
        </div>
      </div>
    </Layout>
  );
}

export default ReportingDashboard;