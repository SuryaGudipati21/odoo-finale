import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSubscriptions } from "../services/mockApi";
import { formatDate } from "../utils/formatting";
import Layout from "../components/Layout";

function SubscriptionsList() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState(null);

 const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchSubscriptions()
    .then((res) => setSubs(res.data || []))
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
}, []);

  const count = (status) => subs.filter((s) => s.status === status).length;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Subscriptions (List)</h1>
      <p className="text-gray-500 text-sm mb-6">Every recurring plan across every customer, regardless of which order it came from</p>
      {loading ? (
        <p className="text-gray-400 text-sm mb-4">Loading...</p>
      ) : (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        ...existing table unchanged...
      </div>
      )}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="flex gap-3 mb-6">
        <span className="px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg text-sm">{count("ACTIVE")} Active</span>
        <span className="px-4 py-2 bg-amber-100 text-amber-800 font-semibold rounded-lg text-sm">{count("PAUSED")} Paused</span>
        <span className="px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg text-sm">{count("CANCELLED")} Cancelled</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Cycle</th>
              <th className="text-left px-4 py-3">Next Bill</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subs.map((s) => (
              <tr key={s.id} onClick={() => navigate(`/subscriptions/${s.id}`)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{s.customer_name}</td>
                <td className="px-4 py-3 text-gray-600">{s.plan_name}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{s.cycle.toLowerCase()}</td>
                <td className="px-4 py-3 text-gray-600">{s.next_bill_date ? formatDate(s.next_bill_date) : "-"}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{s.status.toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4">
        Click a subscription row to open its billing detail and proration history.
      </div>

      <button className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm">
        + New Plan (Admin)
      </button>
    </Layout>
  );
}

export default SubscriptionsList;
