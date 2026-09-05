import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFulfillmentOrder, acceptSuggestedSplit } from "../services/api";
import { formatCurrency } from "../utils/formatting";
import Layout from "../components/Layout";

function FulfillmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => getFulfillmentOrder(id).then(setOrder).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAccept = async () => {
    setBusy(true);
    try {
      await acceptSuggestedSplit(id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Layout><div className="text-red-600">{error}</div></Layout>;
  if (!order) return <Layout><div className="text-gray-500">Loading…</div></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Fulfillment Detail: Q-{order.quotation_id} ({order.customer_name})
      </h1>
      <p className="text-gray-500 text-sm mb-6">Opened by clicking an order row on the Fulfillment list</p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Warehouse</th>
              <th className="text-left px-4 py-3">Qty Fulfilled</th>
              <th className="text-left px-4 py-3">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.allocations.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 text-gray-900 font-medium">{a.warehouse_name}</td>
                <td className="px-4 py-3 text-gray-600">{a.quantity} units</td>
                <td className="px-4 py-3 text-gray-600">{formatCurrency(a.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4">
        "Consolidate Remaining Backorder" prompt appears automatically once the short warehouse restocks.
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={busy || order.status === "FULFILLED"}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {order.status === "FULFILLED" ? "Fulfilled" : busy ? "Accepting…" : "Accept Suggested Split"}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700"
        >
          Manual Override
        </button>
      </div>
    </Layout>
  );
}

export default FulfillmentDetail;
