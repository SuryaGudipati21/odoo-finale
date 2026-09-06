import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getFulfillmentOrder, acceptSuggestedSplit, manualOverrideSplit } from "../services/api";
import { formatCurrency } from "../utils/formatting";
import Layout from "../components/Layout";

function FulfillmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [overrideMode, setOverrideMode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    getFulfillmentOrder(id)
      .then((data) => {
        setOrder(data);
        setAllocations(data.allocations || []);
      })
      .catch((e) => setError(e.message || "Failed to load fulfillment order"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAccept = async () => {
    setBusy(true);
    setError(null);
    try {
      await acceptSuggestedSplit(id);
      setSuccess("Split successfully accepted and stock fulfilled.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleQtyChange = (idx, val) => {
    const qty = Math.max(0, parseInt(val, 10) || 0);
    setAllocations((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, quantity: qty, cost: qty * 1.5 } : a))
    );
  };

  const handleSaveOverride = async () => {
    setBusy(true);
    setError(null);
    try {
      const payloadAllocations = allocations.map((a) => ({
        warehouse_id: a.warehouse_id,
        quantity: a.quantity,
        cost: a.cost,
      }));
      await manualOverrideSplit(id, payloadAllocations);
      setOverrideMode(false);
      setSuccess("Manual split override saved and stock allocated successfully.");
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
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Fulfillment Order</h3>
          <p className="text-sm text-red-700 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={load}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
            >
              Retry
            </button>
            <Link
              to="/fulfillment"
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all"
            >
              ← Back to Fulfillment
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading || !order) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-96 mb-6"></div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-64"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.quantity || 0), 0);
  const orderRef = String(order.quotation_id).startsWith("Q-") ? order.quotation_id : `Q-${order.quotation_id}`;
  const isFulfilled = (order.status || "").toLowerCase().includes("fulfilled");

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          to="/fulfillment"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to Fulfillment List</span>
        </Link>

        <Link
          to={`/quotations/builder/${order.quotation_id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <span>Open in Quotation Builder</span>
          <span>↗</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Fulfillment Detail: <span className="font-mono text-blue-600">{orderRef}</span> ({order.customer_name})
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isFulfilled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
              }`}
            >
              {(order.status || "split_pending").replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Optimal multi-warehouse inventory split and dispatch tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs">
            Total Allocated: {totalAllocated} units
          </span>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

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
            {allocations.map((a, idx) => (
              <tr key={a.id || idx}>
                <td className="px-4 py-3 text-gray-900 font-medium">{a.warehouse_name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {overrideMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={a.quantity}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        className="w-24 px-2 py-1 border border-blue-400 rounded text-right font-medium"
                      />
                      <span>units</span>
                    </div>
                  ) : (
                    `${a.quantity} units`
                  )}
                </td>
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
        {!overrideMode ? (
          <>
            <button
              onClick={handleAccept}
              disabled={busy || order.status === "FULFILLED"}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              {order.status === "FULFILLED" ? "Fulfilled" : busy ? "Accepting…" : "Accept Suggested Split"}
            </button>
            <button
              onClick={() => setOverrideMode(true)}
              disabled={busy || order.status === "FULFILLED"}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Manual Override
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSaveOverride}
              disabled={busy}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Split Override"}
            </button>
            <button
              onClick={() => {
                setOverrideMode(false);
                setAllocations(order.allocations || []);
              }}
              disabled={busy}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}

export default FulfillmentDetail;
