import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStock, getFulfillmentOrders } from "../services/api";
import Layout from "../components/Layout";

function FulfillmentList() {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getStock(), getFulfillmentOrders()])
      .then(([s, o]) => {
        setStock(s);
        setOrders(o);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Layout style="width=auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Fulfillment and Stock (List)</h1>
      <p className="text-gray-500 text-sm mb-6">Live stock per warehouse, plus every order that still needs fulfilling</p>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Warehouse</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">In Stock</th>
              <th className="text-left px-4 py-3">Reserved</th>
              <th className="text-left px-4 py-3">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stock.map((s, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-gray-900 font-medium">{s.warehouse_name}</td>
                <td className="px-4 py-3 text-gray-600">{s.product_name}</td>
                <td className="px-4 py-3 text-gray-600">{s.qty_in_stock}</td>
                <td className="px-4 py-3 text-gray-600">{s.qty_reserved}</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">{s.qty_available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-blue-600 mb-3">Orders Awaiting Fulfillment</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Warehouses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => navigate(`/fulfillment/${o.id}`)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-gray-900 font-medium">Q-{o.quotation_id}</td>
                <td className="px-4 py-3 text-gray-600">{o.customer_name}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{o.status.replace(/_/g, " ").toLowerCase()}</td>
                <td className="px-4 py-3 text-gray-600">
                  {o.allocations.map((a) => a.warehouse_name).join(" + ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        Click an order row to open its warehouse split detail.
      </div>
    </Layout>
  );
}

export default FulfillmentList;
