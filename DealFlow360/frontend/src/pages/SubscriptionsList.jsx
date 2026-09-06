import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSubscriptions, createSubscription, getCustomers } from "../services/api";
import { fetchSubscriptions } from "../services/mockApi";
import { formatDate, formatCurrency } from "../utils/formatting";
import Layout from "../components/Layout";

function SubscriptionsList() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_id: null,
    customer_name: "",
    plan_name: "",
    cycle: "MONTHLY",
    amount: "1500",
  });

  const loadSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubscriptions();
      setSubs(data || []);
    } catch (e) {
      console.warn("Real API unavailable, falling back to mock subscriptions:", e);
      try {
        const res = await fetchSubscriptions();
        const normalized = (res.data || []).map((s) => ({
          id: s.id,
          customer_name: s.customer || s.customer_name || "Acme Corp",
          plan_name: s.plan || s.plan_name || "Standard Plan",
          cycle: (s.cycle || "Monthly").toUpperCase(),
          next_bill_date: s.next_billing || s.next_bill_date || new Date().toISOString(),
          amount: s.amount_monthly || s.amount || 500,
          status: (s.status || "Active").toUpperCase(),
        }));
        setSubs(normalized);
      } catch (err) {
        setError(err.message || "Failed to load subscriptions");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
    getCustomers()
      .then((custs) => {
        setCustomers(custs || []);
        if (custs && custs.length > 0) {
          setForm((prev) => ({
            ...prev,
            customer_id: custs[0].id,
            customer_name: custs[0].name,
          }));
        }
      })
      .catch(console.error);
  }, []);

  const count = (status) => subs.filter((s) => (s.status || "").toUpperCase() === status).length;

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!form.plan_name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const custId = form.customer_id || (customers[0] ? customers[0].id : 1);
      const created = await createSubscription({
        customer_id: custId,
        plan_name: form.plan_name,
        cycle: form.cycle,
        amount: Number(form.amount) || 0,
      });

      setSubs((prev) => [created, ...prev]);
      setSuccessMsg(`Plan "${form.plan_name}" successfully created and saved to database!`);
      setIsModalOpen(false);
      setForm((prev) => ({
        ...prev,
        plan_name: "",
        cycle: "MONTHLY",
        amount: "1500",
      }));
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.message || "Failed to create subscription plan on backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Subscriptions & Recurring Revenue
          </h1>
          <p className="text-gray-500 text-sm">
            Every recurring plan across every customer, regardless of originating order
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all duration-150 btn-press"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          + New Plan (Admin)
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl mb-4 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-4">{error}</div>}

      {/* KPI Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {count("ACTIVE")} Active Plans
        </div>
        <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          {count("PAUSED")} Paused
        </div>
        <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-800 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          {count("CANCELLED")} Cancelled
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm mb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400 text-sm animate-pulse">Loading subscriptions...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Plan Name</th>
                <th className="px-5 py-3.5">Cycle</th>
                <th className="px-5 py-3.5">Fixed Plan Amount</th>
                <th className="px-5 py-3.5">Next Bill Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subs.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/subscriptions/${s.id}`)}
                  className="hover:bg-blue-50/40 transition-colors duration-150 cursor-pointer group"
                >
                  <td className="px-5 py-4 text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">
                    {s.customer_name}
                  </td>
                  <td className="px-5 py-4 text-gray-700 font-medium">
                    {s.plan_name}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg capitalize">
                      {String(s.cycle).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900 font-mono text-sm">
                    {formatCurrency(s.amount || 500)}
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      / {String(s.cycle).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-mono text-xs">
                    {s.next_bill_date ? formatDate(s.next_bill_date) : "-"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        s.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : s.status === "PAUSED"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {String(s.status).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/subscriptions/${s.id}`);
                      }}
                      className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-lg text-xs font-semibold shadow-2xs transition-all duration-150 btn-press inline-flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white"
                      title="View billing detail breakdown"
                    >
                      <span>Billing Detail</span>
                      <span>→</span>
                    </button>
                  </td>
                </tr>
              ))}

              {subs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No active subscription plans found. Click "+ New Plan (Admin)" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 mb-6 flex items-center gap-2">
        <span>💡</span>
        <span>Click any subscription row above to view recurring line proration, mid-cycle upgrades, and next invoice schedule.</span>
      </div>

      {/* Modal Dialog for + New Plan (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Create New Subscription Plan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-semibold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Fixed Plan Package (Preset)
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "starter") setForm((prev) => ({ ...prev, plan_name: "Starter SLA", cycle: "MONTHLY", amount: "250" }));
                    else if (val === "standard") setForm((prev) => ({ ...prev, plan_name: "Standard Care Plan", cycle: "MONTHLY", amount: "500" }));
                    else if (val === "pro") setForm((prev) => ({ ...prev, plan_name: "Professional SLA", cycle: "QUARTERLY", amount: "1500" }));
                    else if (val === "enterprise") setForm((prev) => ({ ...prev, plan_name: "Enterprise Support & SLA", cycle: "MONTHLY", amount: "3500" }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">-- Choose Fixed Plan Package --</option>
                  <option value="starter">Starter SLA — $250.00 / month (Fixed)</option>
                  <option value="standard">Standard Care Plan — $500.00 / month (Fixed)</option>
                  <option value="pro">Professional SLA — $1,500.00 / quarter (Fixed)</option>
                  <option value="enterprise">Enterprise Support & SLA — $3,500.00 / month (Fixed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Customer
                </label>
                <select
                  value={form.customer_id || (customers[0] ? customers[0].id : "")}
                  onChange={(e) => {
                    const cId = Number(e.target.value);
                    const found = customers.find((c) => c.id === cId);
                    setForm({ ...form, customer_id: cId, customer_name: found ? found.name : "" });
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier?.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  placeholder="E.g. Enterprise Support & SLA"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={form.cycle}
                    onChange={(e) => setForm({ ...form, cycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="1500"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-xs transition-all btn-press"
                >
                  {isSubmitting ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default SubscriptionsList;
