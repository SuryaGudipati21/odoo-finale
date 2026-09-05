import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchBillingDetail, modifySubscription, cancelSubscription } from "../services/mockApi";
import { formatCurrency, formatDate } from "../utils/formatting";
import Layout from "../components/Layout";

function BillingDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  
const load = () => fetchBillingDetail(id).then((res) => setDetail(res.data)).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    try {
      await cancelSubscription(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <Layout><div className="text-red-600">{error}</div></Layout>;
  if (!detail) return <Layout><div className="text-gray-500">Loading…</div></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Billing Detail: {detail.customer_name} - {detail.plan_name}
      </h1>
      <p className="text-gray-500 text-sm mb-6">Opened by clicking a row on the Subscriptions list</p>

      <h2 className="text-lg font-semibold text-blue-600 mb-3">One-Time Lines (from originating order)</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {detail.one_time_lines.map((l, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-gray-900 font-medium">{l.product_name}</td>
                <td className="px-4 py-3 text-gray-600">{l.quantity}</td>
                <td className="px-4 py-3 text-gray-600">{formatCurrency(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-blue-600 mb-3">Recurring Lines</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Cycle</th>
              <th className="text-left px-4 py-3">Next Bill Date</th>
              <th className="text-left px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {detail.recurring_lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-gray-900 font-medium">{l.plan_name}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{l.cycle.toLowerCase()}</td>
                <td className="px-4 py-3 text-gray-600">{l.next_bill_date ? formatDate(l.next_bill_date) : "-"}</td>
                <td className="px-4 py-3 text-gray-600">{formatCurrency(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700">
          Modify Subscription
        </button>
        <button
          onClick={handleCancel}
          className="px-5 py-2.5 border border-red-300 text-red-600 rounded-lg font-medium"
        >
          Cancel Subscription
        </button>
      </div>
    </Layout>
  );
}

export default BillingDetail;
