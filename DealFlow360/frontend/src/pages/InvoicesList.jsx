import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatting";
import Layout from "../components/Layout";

function InvoicesList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadInvoices = () => {
    setLoading(true);
    setError(null);
    getInvoices()
      .then((data) => setInvoices(data || []))
      .catch((e) => setError(e.message || "Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const unpaid = invoices.filter((i) => i.status === "UNPAID").length;
  const paid = invoices.filter((i) => i.status === "PAID").length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !searchTerm ||
      (inv.invoice_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || (inv.status || "").toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Invoices & Receivables</h1>
          <p className="text-gray-500 text-sm">Every invoice generated from one-time orders and recurring subscriptions</p>
        </div>

        {/* KPI Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-800 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{unpaid} Unpaid</span>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{paid} Paid</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadInvoices}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            Retry
          </button>
        </div>
      )}

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
            placeholder="Search by invoice # or customer..."
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400 font-medium">Status:</span>
          {["ALL", "UNPAID", "PAID"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st === "ALL" ? "All Invoices" : st === "PAID" ? "Paid" : "Unpaid"}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm mb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400 text-sm animate-pulse">Loading invoices ledger...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="hover:bg-blue-50/40 even:bg-gray-50/30 transition-colors duration-150 cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                    {inv.invoice_number}
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900" title={inv.customer_name}>
                    {inv.customer_name}
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900 font-mono">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                      }`}
                    >
                      {inv.status === "PAID" ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-mono text-xs">
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/${inv.id}`);
                      }}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 rounded-lg text-xs font-semibold shadow-2xs transition-all duration-150 btn-press inline-flex items-center gap-1 group-hover:border-blue-400 group-hover:text-blue-600"
                    >
                      <span>Reconcile</span>
                      <span>→</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No invoices found matching active criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center gap-2">
        <span>💡</span>
        <span>Click any invoice row to record payments, inspect line-item reconciliation, and review delivery status.</span>
      </div>
    </Layout>
  );
}

export default InvoicesList;
