import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatting";
import Layout from "../components/Layout";

function InvoicesList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getInvoices().then(setInvoices).catch((e) => setError(e.message));
  }, []);

  const unpaid = invoices.filter((i) => i.status === "UNPAID").length;
  const paid = invoices.filter((i) => i.status === "PAID").length;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Invoices (List)</h1>
      <p className="text-gray-500 text-sm mb-6">Every invoice generated from one-time and recurring orders</p>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="flex gap-3 mb-6">
        <span className="px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg text-sm">{unpaid} Unpaid</span>
        <span className="px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg text-sm">{paid} Paid</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Invoice #</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-gray-600">{inv.customer_name}</td>
                <td className="px-4 py-3 text-gray-600">{formatCurrency(inv.amount)}</td>
                <td className={`px-4 py-3 font-medium ${inv.status === "PAID" ? "text-green-600" : "text-red-600"}`}>
                  {inv.status === "PAID" ? "Paid" : "Unpaid"}
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(inv.due_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        Click an invoice row to open its full payment and delivery reconciliation detail.
      </div>
    </Layout>
  );
}

export default InvoicesList;
