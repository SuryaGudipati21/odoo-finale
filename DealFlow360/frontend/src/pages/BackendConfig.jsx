// src/pages/BackendConfig.jsx
// Owner: Admin config UI — products/price lists, discount tiers & approval chains,
// warehouses, subscription plans. Connected to live backend database.

import { useState, useEffect } from "react";
import { formatCurrency } from "../utils/formatting";
import Layout from "../components/Layout";
import {
  getProducts,
  createProduct,
  getDiscountLimits,
  updateDiscountLimits,
  getWarehouses,
  createWarehouse,
  getSubscriptions,
} from "../services/api";

const TABS = [
  { id: "products", label: "Products & Price Lists" },
  { id: "discounts", label: "Discount Tiers" },
  { id: "warehouses", label: "Warehouses" },
  { id: "subscriptions", label: "Subscription Plans" },
];

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Hardware", price: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getProducts()
      .then((data) => setProducts(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createProduct({
        name: form.name,
        category: form.category,
        base_price: Number(form.price),
        unit: "unit",
        tax_percent: 18.0,
      });
      setProducts((prev) => [created, ...prev]);
      setForm({ name: "", category: "Hardware", price: "" });
    } catch (err) {
      setError(err.message || "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={addProduct} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <input
          required
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-3 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
        >
          <option>Hardware</option>
          <option>Software</option>
          <option>Service</option>
          <option>Maintenance</option>
        </select>
        <input
          required
          type="number"
          min="1"
          placeholder="Price ($)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="px-3 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
        />
        <button
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-all btn-press text-sm disabled:opacity-50"
        >
          {saving ? "Adding..." : "+ Add Product"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm py-4">Loading database catalog...</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
              <div>
                <p className="text-gray-900 font-semibold">{p.name}</p>
                <p className="text-xs text-gray-500">{p.category} • {p.unit || "unit"}</p>
              </div>
              <p className="text-emerald-700 font-bold">{formatCurrency(p.price || p.base_price)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiscountTiersTab() {
  const [tiers, setTiers] = useState([
    { tier: "bronze", max_discount_percent: 5 },
    { tier: "silver", max_discount_percent: 10 },
    { tier: "gold", max_discount_percent: 15 },
  ]);
  const [categories, setCategories] = useState([
    { category: "Hardware", max_discount_percent: 15 },
    { category: "Software", max_discount_percent: 20 },
    { category: "Service", max_discount_percent: 10 },
    { category: "Maintenance", max_discount_percent: 12 },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getDiscountLimits()
      .then((data) => {
        if (data.tiers && data.tiers.length > 0) setTiers(data.tiers);
        if (data.categories && data.categories.length > 0) setCategories(data.categories);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateDiscountLimits({ tiers, categories });
      setMessage("Concession ceilings successfully updated and saved in database!");
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage("Error saving ceilings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
          {message}
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Customer Tier Concession Ceilings (Database)
        </h3>
        <div className="space-y-2">
          {tiers.map((t, idx) => (
            <div key={t.tier} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
              <div>
                <p className="text-gray-900 font-semibold capitalize">{t.tier} Tier</p>
                <p className="text-xs text-gray-500">
                  {t.tier === "gold" ? "Manager + Finance approval if >10%" : "Manager approval threshold"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={t.max_discount_percent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTiers((prev) => prev.map((item, i) => (i === idx ? { ...item, max_discount_percent: val } : item)));
                  }}
                  className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg text-right focus:bg-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-gray-500 text-sm font-medium">% max</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Product Category Ceilings
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          A line's actual ceiling is the tier ceiling, further capped by its category ceiling if stricter.
        </p>
        <div className="space-y-2">
          {categories.map((c, idx) => (
            <div key={c.category} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
              <p className="text-gray-900 font-semibold">{c.category}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={c.max_discount_percent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCategories((prev) => prev.map((item, i) => (i === idx ? { ...item, max_discount_percent: val } : item)));
                  }}
                  className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg text-right focus:bg-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-gray-500 text-sm font-medium">% max</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all btn-press shadow-xs disabled:opacity-50"
      >
        {saving ? "Saving to Database..." : "Save Discount Ceilings"}
      </button>
    </div>
  );
}

function WarehousesTab() {
  const [warehouses, setWarehouses] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWarehouses()
      .then((data) => setWarehouses(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addWarehouse = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await createWarehouse(name.trim());
      setWarehouses((prev) => [...prev, created]);
      setName("");
    } catch (err) {
      alert(err.message || "Failed to add warehouse");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addWarehouse} className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <input
          required
          placeholder="New warehouse facility name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
        />
        <button
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-all btn-press text-sm disabled:opacity-50"
        >
          {saving ? "Adding..." : "+ Add Warehouse"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm py-4">Loading warehouses...</p>
      ) : (
        <div className="space-y-2">
          {warehouses.map((w) => (
            <div key={w.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
              <div>
                <p className="text-gray-900 font-semibold">{w.name}</p>
                <p className="text-xs text-gray-500">Warehouse ID #{w.id}</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Active Node
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionPlansTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptions()
      .then((data) => setPlans(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-gray-400 text-sm py-4">Loading subscription contracts...</p>
      ) : plans.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">No subscription plans recorded in database yet.</p>
      ) : (
        plans.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <div>
              <p className="text-gray-900 font-semibold">{p.plan_name}</p>
              <p className="text-xs text-gray-500">Customer: {p.customer_name} • {p.cycle} billing</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</p>
              <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                {p.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function BackendConfig() {
  const [activeTab, setActiveTab] = useState("products");

  const renderTab = () => {
    switch (activeTab) {
      case "products":
        return <ProductsTab />;
      case "discounts":
        return <DiscountTiersTab />;
      case "warehouses":
        return <WarehousesTab />;
      case "subscriptions":
        return <SubscriptionPlansTab />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          Catalog & Rules Configuration
        </h1>
        <p className="text-gray-500 text-sm">
          Configure product price books, category discount ceilings, warehouse nodes, and recurring plans with database persistence
        </p>
      </div>

      <div className="flex border-b border-gray-200 gap-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-all duration-150 whitespace-nowrap rounded-t-lg ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">{renderTab()}</div>
    </Layout>
  );
}

export default BackendConfig;