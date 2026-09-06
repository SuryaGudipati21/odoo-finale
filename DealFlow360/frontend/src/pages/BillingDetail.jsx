import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getBillingDetail, modifySubscription, cancelSubscription } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatting";
import Layout from "../components/Layout";

function BillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Modify modal
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [modifyCycle, setModifyCycle] = useState("MONTHLY");
  const [modifyAmount, setModifyAmount] = useState("3500");
  const [isProcessing, setIsProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBillingDetail(id);
      setDetail(data);
      if (data) {
        setModifyCycle(data.cycle || "MONTHLY");
        setModifyAmount(String(data.amount || 3500));
      }
    } catch (e) {
      setError(e.message || "Failed to load billing detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this recurring subscription?")) return;
    setIsProcessing(true);
    try {
      await cancelSubscription(id);
      setNotice({ type: "success", text: "Subscription cancelled successfully." });
      await load();
    } catch (e) {
      setNotice({ type: "error", text: e.message || "Failed to cancel subscription." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await modifySubscription(id, {
        cycle: modifyCycle,
        amount: Number(modifyAmount) || 0,
      });
      setIsModifyOpen(false);
      setNotice({ type: "success", text: "Subscription plan updated successfully." });
      await load();
    } catch (e) {
      setNotice({ type: "error", text: e.message || "Failed to modify subscription." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading billing details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !detail) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12 shadow-sm">
          <span className="text-3xl mb-2 inline-block">⚠️</span>
          <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Billing Detail</h3>
          <p className="text-sm text-red-700 mb-6">{error || "Subscription was not found."}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={load}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
            >
              Retry
            </button>
            <Link
              to="/subscriptions"
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all"
            >
              ← Back to Subscriptions
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const oneTimeLines = detail.one_time_lines || [];
  const recurringLines = detail.recurring_lines || [];

  return (
    <Layout>
      {/* Top Breadcrumb / Back Link */}
      <div className="mb-4">
        <Link
          to="/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to Subscriptions</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
              {detail.subscription_id ? `ID: ${detail.subscription_id}` : `SUB-${id}`}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {detail.customer_name} — {detail.plan_name}
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            Originating order breakdown, prorated recurring lines, and subscription billing schedule
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModifyOpen(true)}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-600 text-xs font-semibold rounded-xl shadow-2xs transition-all btn-press"
          >
            ✏️ Modify Plan
          </button>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-xl transition-all btn-press disabled:opacity-50"
          >
            Cancel Plan
          </button>
        </div>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between shadow-2xs animate-fade-in ${
            notice.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notice.type === "success" ? "✓" : "⚠"}</span>
            <span className="font-medium">{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider block mb-1">Fixed Plan Rate</span>
          <p className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(detail.amount || 3500)}
            <span className="text-xs font-normal text-gray-500 ml-1">/ {(detail.cycle || "Monthly").toLowerCase()}</span>
          </p>
        </div>
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider block mb-1">Billing Cycle</span>
          <p className="text-xl font-bold text-blue-600 capitalize">
            {(detail.cycle || "Monthly").toLowerCase()}
          </p>
        </div>
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider block mb-1">Originating Customer</span>
          <p className="text-xl font-bold text-gray-900 truncate">
            {detail.customer_name}
          </p>
        </div>
      </div>

      {/* One-Time Lines Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>One-Time Lines (Originating Order)</span>
          </h2>
          <span className="text-xs text-gray-400">{oneTimeLines.length} item{oneTimeLines.length === 1 ? "" : "s"}</span>
        </div>
        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {oneTimeLines.map((l, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{l.product_name}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono">{l.quantity}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-gray-900 font-mono">
                    {formatCurrency(l.amount)}
                  </td>
                </tr>
              ))}
              {oneTimeLines.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-xs">
                    No one-time hardware or service lines in originating quotation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recurring Lines Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Active Recurring Lines & Proration</span>
          </h2>
          <span className="text-xs text-gray-400">{recurringLines.length} plan{recurringLines.length === 1 ? "" : "s"}</span>
        </div>
        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Recurring Plan</th>
                <th className="px-5 py-3.5">Cycle</th>
                <th className="px-5 py-3.5">Next Billing Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Fixed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recurringLines.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{l.plan_name}</td>
                  <td className="px-5 py-3.5 capitalize text-gray-600">
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded-md font-medium">
                      {(l.cycle || "Monthly").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">
                    {l.next_bill_date ? formatDate(l.next_bill_date) : "-"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        l.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : l.status === "PAUSED"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {String(l.status || "ACTIVE").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-gray-900 font-mono">
                    {formatCurrency(l.amount)}
                  </td>
                </tr>
              ))}
              {recurringLines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-xs">
                    No active recurring lines registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
        <Link
          to="/subscriptions"
          className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-all"
        >
          ← Return to Subscriptions List
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModifyOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all btn-press"
          >
            Modify Subscription
          </button>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all btn-press disabled:opacity-50"
          >
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {isModifyOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Modify Subscription Plan
              </h3>
              <button
                onClick={() => setIsModifyOpen(false)}
                className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Billing Cycle
                </label>
                <select
                  value={modifyCycle}
                  onChange={(e) => setModifyCycle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Fixed Plan Rate ($)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={modifyAmount}
                  onChange={(e) => setModifyAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Standard fixed rate applied to next automated invoicing cycle.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModifyOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-xs transition-all btn-press"
                >
                  {isProcessing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default BillingDetail;
