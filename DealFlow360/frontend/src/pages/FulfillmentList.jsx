import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getStock, getFulfillmentOrders } from "../services/api";
import Layout from "../components/Layout";

function FulfillmentList() {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([getStock(), getFulfillmentOrders()])
      .then(([s, o]) => {
        setStock(s || []);
        setOrders(o || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const qRef = String(o.quotation_id || "").toLowerCase();
      const cust = (o.customer_name || "").toLowerCase();
      const matchesSearch = !searchTerm || qRef.includes(searchTerm.toLowerCase()) || cust.includes(searchTerm.toLowerCase());
      const normStatus = (o.status || "").toLowerCase();
      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "pending" && (normStatus.includes("pending") || normStatus.includes("split"))) ||
        (statusFilter === "fulfilled" && normStatus.includes("fulfilled"));
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, statusFilter]);

  const pendingCount = orders.filter((o) => !(o.status || "").toLowerCase().includes("fulfilled")).length;
  const fulfilledCount = orders.filter((o) => (o.status || "").toLowerCase().includes("fulfilled")).length;

  const getStatusBadge = (status) => {
    const s = (status || "split_pending").toLowerCase();
    if (s.includes("fulfilled")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("partial")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Fulfillment & Multi-Warehouse Dispatch
          </h1>
          <p className="text-gray-500 text-sm">
            Live inventory tracking, automated order splits, and multi-depot allocation management
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs">
            {orders.length} Total Orders
          </span>
          <span className="px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold shadow-2xs">
            {pendingCount} Awaiting Split
          </span>
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs">
            {fulfilledCount} Fulfilled
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-6 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="text-xs font-bold underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* Orders Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <h2 className="text-lg font-bold text-gray-900">Orders Requiring Warehouse Split</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search order or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "38px" }}
                className="w-full pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "all" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "pending" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter("fulfilled")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "fulfilled" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Fulfilled ({fulfilledCount})
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Quotation Ref</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Warehouse Allocations</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((o) => {
                const targetId = o.id ?? o.quotation_id ?? 1;
                const orderRef = String(o.quotation_id).startsWith("Q-") ? o.quotation_id : `Q-${o.quotation_id}`;
                const allocations = Array.isArray(o.allocations) ? o.allocations : [];

                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/fulfillment/${targetId}`)}
                    className="hover:bg-blue-50/40 even:bg-gray-50/30 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/fulfillment/${targetId}`);
                        }}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50/90 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200/80 inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Click to open warehouse split detail"
                      >
                        <span>{orderRef}</span>
                        <span className="text-xs font-normal">↗</span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {o.customer_name || "Enterprise Customer"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded-full capitalize ${getStatusBadge(o.status)}`}>
                        {(o.status || "split_pending").replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {allocations.length > 0 ? (
                          allocations.map((a, idx) => (
                            <span
                              key={a.id || idx}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-xs font-medium"
                            >
                              <span>🏢 {a.warehouse_name}</span>
                              <span className="text-blue-600 font-bold font-mono">({a.quantity}u)</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/fulfillment/${targetId}`);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all btn-press flex items-center gap-1.5"
                          title="Open Warehouse Split Detail"
                        >
                          <span>Open Split Detail</span>
                          <span>→</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No fulfillment orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 text-xs text-amber-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">💡</span>
            <span>
              Click any order row or the <strong>Open Split Detail →</strong> button to inspect stock breakdown, review automated inventory allocations, and approve or manually override dispatches.
            </span>
          </div>
        </div>
      </div>

      {/* Warehouse Live Stock Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <h2 className="text-lg font-bold text-gray-900">Live Inventory per Warehouse</h2>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Warehouse</th>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Total In Stock</th>
                <th className="px-5 py-3.5">Reserved</th>
                <th className="px-5 py-3.5 text-right">Available for Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stock.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-900 font-semibold flex items-center gap-2">
                    <span>🏢</span>
                    <span>{s.warehouse_name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{s.product_name}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono">{s.qty_in_stock}</td>
                  <td className="px-5 py-3.5 text-amber-600 font-mono font-medium">{s.qty_reserved}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      {s.qty_available} units
                    </span>
                  </td>
                </tr>
              ))}

              {stock.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                    No warehouse stock records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default FulfillmentList;
