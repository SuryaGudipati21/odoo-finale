// src/pages/BackendConfig.jsx
// Owner: Admin config UI — products/price lists, discount tiers & approval chains,
// warehouses, subscription plans (problem statement sections A2–A5).
// Location: frontend/src/pages/BackendConfig.jsx
//
// NOTE: No backend config endpoints exist yet, so this manages local state only
// and does not persist. It exists so the Admin role has a real screen to configure
// the data that drives discount ceilings (riskScore.js), warehouses (WarehouseSplit),
// and subscription plans (SubscriptionBilling) — currently those are all hardcoded
// in mockData.js. Wiring this up to actually control that mock data is the natural
// next step once a real backend exists.

import { useState } from "react";
import { formatCurrency } from "../utils/formatting";

const TABS = [
  { id: "products", label: "Products & Price Lists" },
  { id: "discounts", label: "Discount Tiers" },
  { id: "warehouses", label: "Warehouses" },
  { id: "subscriptions", label: "Subscription Plans" },
];

function ProductsTab() {
  const [products, setProducts] = useState([
    { id: 1, name: "Enterprise License", category: "Software", price: 2000 },
    { id: 2, name: "Implementation Service", category: "Services", price: 20000 },
  ]);
  const [form, setForm] = useState({ name: "", category: "Hardware", price: "" });

  const addProduct = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setProducts((prev) => [
      ...prev,
      { id: Date.now(), name: form.name, category: form.category, price: Number(form.price) },
    ]);
    setForm({ name: "", category: "Hardware", price: "" });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addProduct} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
        <input
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
        >
          <option>Hardware</option>
          <option>Software</option>
          <option>Services</option>
        </select>
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
        />
        <button className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 font-semibold rounded-lg border border-blue-500/40">
          + Add Product
        </button>
      </form>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
            <div>
              <p className="text-white font-semibold">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category}</p>
            </div>
            <p className="text-green-300 font-bold">{formatCurrency(p.price)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscountTiersTab() {
  const [tiers, setTiers] = useState([
    { tier: "Bronze", ceiling: 5, approvalLevel: "Manager only" },
    { tier: "Silver", ceiling: 10, approvalLevel: "Manager only" },
    { tier: "Gold", ceiling: 15, approvalLevel: "Manager, then Finance if >10%" },
  ]);
  const [categoryCeilings, setCategoryCeilings] = useState([
    { category: "Hardware", ceiling: 15 },
    { category: "Software", ceiling: 15 },
    { category: "Services", ceiling: 10 },
  ]);

  const updateTierCeiling = (idx, value) => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, ceiling: Number(value) } : t)));
  };

  const updateCategoryCeiling = (idx, value) => {
    setCategoryCeilings((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ceiling: Number(value) } : c))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
          Tier Discount Ceilings
        </h3>
        <div className="space-y-2">
          {tiers.map((t, idx) => (
            <div key={t.tier} className="flex items-center justify-between bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
              <div>
                <p className="text-white font-semibold">{t.tier}</p>
                <p className="text-xs text-gray-400">{t.approvalLevel}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={t.ceiling}
                  onChange={(e) => updateTierCeiling(idx, e.target.value)}
                  className="w-20 px-2 py-1.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg text-right focus:border-blue-500/50 focus:outline-none"
                />
                <span className="text-gray-400 text-sm">% max</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
          Category Discount Ceilings
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          A line's actual ceiling is the tier ceiling, further capped by its category ceiling if stricter.
        </p>
        <div className="space-y-2">
          {categoryCeilings.map((c, idx) => (
            <div key={c.category} className="flex items-center justify-between bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
              <p className="text-white font-semibold">{c.category}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={c.ceiling}
                  onChange={(e) => updateCategoryCeiling(idx, e.target.value)}
                  className="w-20 px-2 py-1.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg text-right focus:border-blue-500/50 focus:outline-none"
                />
                <span className="text-gray-400 text-sm">% max</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WarehousesTab() {
  const [warehouses, setWarehouses] = useState([
    { id: "WH-MAIN", name: "Main Warehouse (Chicago)", shippingWeight: 1.0 },
    { id: "WH-EAST", name: "East Depot (New York)", shippingWeight: 1.2 },
  ]);
  const [name, setName] = useState("");

  const addWarehouse = (e) => {
    e.preventDefault();
    if (!name) return;
    setWarehouses((prev) => [
      ...prev,
      { id: `WH-${Date.now()}`, name, shippingWeight: 1.0 },
    ]);
    setName("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addWarehouse} className="flex gap-3 bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
        <input
          placeholder="New warehouse name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
        />
        <button className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 font-semibold rounded-lg border border-blue-500/40">
          + Add Warehouse
        </button>
      </form>

      <div className="space-y-2">
        {warehouses.map((w) => (
          <div key={w.id} className="flex items-center justify-between bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
            <div>
              <p className="text-white font-semibold">{w.name}</p>
              <p className="text-xs text-gray-400">{w.id}</p>
            </div>
            <p className="text-xs text-gray-400">Shipping weight: {w.shippingWeight}x</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionPlansTab() {
  const [plans, setPlans] = useState([
    { id: 1, name: "Monthly Support", cycle: "Monthly", prorationEnabled: true },
    { id: 2, name: "Annual Enterprise", cycle: "Yearly", prorationEnabled: true },
  ]);

  return (
    <div className="space-y-2">
      {plans.map((p) => (
        <div key={p.id} className="flex items-center justify-between bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
          <div>
            <p className="text-white font-semibold">{p.name}</p>
            <p className="text-xs text-gray-400">{p.cycle} billing</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              p.prorationEnabled
                ? "bg-green-500/20 text-green-300 border-green-500/30"
                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
            }`}
          >
            {p.prorationEnabled ? "Proration on" : "Proration off"}
          </span>
        </div>
      ))}
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
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="bg-gradient-to-r from-gray-600/10 to-blue-400/5 border border-gray-600/20 rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Backend Configuration</h1>
        <p className="text-gray-400 text-sm">
          Manage products, price lists, discount tiers, warehouses, and subscription plans
        </p>
      </div>

      <div className="flex border-b border-gray-700/50 gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">{renderTab()}</div>
    </div>
  );
}

export default BackendConfig;