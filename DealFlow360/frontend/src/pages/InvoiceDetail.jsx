import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getInvoice, recordPayment } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatting";
import Layout from "../components/Layout";

const STAGES = [
  { key: "ORDER_CONFIRMED", label: "Order Confirmed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "INVOICED", label: "Invoiced" },
  { key: "PAID", label: "Paid" },
];

function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(null);
    getInvoice(id).then(setInvoice).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRecordPayment = async () => {
    setBusy(true);
    try {
      await recordPayment(id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12 shadow-sm">
          <span className="text-3xl mb-2 inline-block">⚠️</span>
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Invoice</h3>
          <p className="text-sm text-red-700 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={load}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
            >
              Retry
            </button>
            <Link
              to="/invoices"
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all"
            >
              ← Back to Invoices
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading invoice details...</p>
        </div>
      </Layout>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === invoice.pipeline_stage);

  return (
    <Layout>
      <div className="mb-4">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to Invoices</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Invoice Detail: {invoice.invoice_number} ({invoice.customer_name})
      </h1>
      <p className="text-gray-500 text-sm mb-6">Opened by clicking a row on the Invoices list</p>

      <div className="flex items-center mb-8">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full ${
                  i <= currentIndex ? "bg-green-500" : "bg-gray-300"
                } ${i === currentIndex ? "!bg-blue-600" : ""}`}
              />
              <span className="text-xs text-gray-600 mt-2 whitespace-nowrap">{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${i < currentIndex ? "bg-green-500" : "bg-gray-300"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Invoice #</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-3 text-gray-900 font-medium">{invoice.invoice_number}</td>
              <td className="px-4 py-3 text-gray-600">{formatCurrency(invoice.amount)}</td>
              <td className={`px-4 py-3 font-medium ${invoice.status === "PAID" ? "text-green-600" : "text-red-600"}`}>
                {invoice.status === "PAID" ? "Paid" : "Unpaid"}
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(invoice.due_date)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleRecordPayment}
          disabled={busy || invoice.status === "PAID"}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {invoice.status === "PAID" ? "Paid" : busy ? "Recording…" : "Record Payment"}
        </button>
        <button className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700">
          Download Summary
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        Partial invoicing stays reconciled with partial delivery, nothing is billed before it ships.
      </div>
    </Layout>
  );
}

export default InvoiceDetail;
