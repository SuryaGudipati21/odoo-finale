// src/pages/SalesWorkspace.jsx
// Role-aware Dashboard: renders tailored metrics, quick actions, and activity feeds
// for Sales Rep, Sales Management, Finance, and Admin roles.

import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

function SalesWorkspace() {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const role = userRole || "sales_rep";

  // Dashboard configuration per role
  const dashboardConfigs = {
    sales_rep: {
      title: "Sales Workspace & Rep Dashboard",
      subtitle: "Active quotation pipeline, customer deal stages, and discount margin management",
      badge: "Sales Rep",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      kpis: [
        { label: "Open Quotations", value: "12 active deals", sub: "3 awaiting customer action", color: "text-blue-600" },
        { label: "Pending Approvals", value: "4 quotations waiting", sub: "Average turnaround 2.4 hrs", color: "text-amber-600" },
        { label: "At-Risk Deals", value: "3 flagged deals", sub: "Identified by Deal Health telemetry", color: "text-rose-600" },
      ],
      actions: [
        { label: "+ New Quotation", path: "/quotations/builder/new", primary: true },
        { label: "View All Quotations", path: "/quotations", primary: false },
      ],
      activities: [
        { text: "Acme Corp quotation approved by Finance", time: "10 mins ago", type: "success" },
        { text: "Beta Industries requested a discount change", time: "1 hour ago", type: "warning" },
        { text: "East Depot stock allocated for Order #2291", time: "3 hours ago", type: "info" },
        { text: "New draft quotation created for OmniCorp", time: "Yesterday", type: "default" },
      ],
    },
    sales_manager: {
      title: "Sales Management Dashboard",
      subtitle: "Pipeline health diagnostics, margin concession oversight, and team quotation approvals",
      badge: "Sales Management",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      kpis: [
        { label: "Pending Approvals", value: "4 quotations waiting", sub: "2 require immediate review", color: "text-amber-600" },
        { label: "Stalled Deals", value: "3 deals inactive > 7 days", sub: "Nudge follow-ups recommended", color: "text-rose-600" },
        { label: "Margin Concessions", value: "2 high variance quotes", sub: "Exceeding rep average by >8%", color: "text-purple-600" },
        { label: "Active Pipeline Value", value: "$1,420,000", sub: "Across 28 open negotiations", color: "text-emerald-600" },
      ],
      actions: [
        { label: "⚡ Deal Health & Telemetry", path: "/deal-health", primary: true },
        { label: "Review Approvals", path: "/approvals", primary: false },
        { label: "Performance Reports", path: "/reports", primary: false },
        { label: "All Quotations", path: "/quotations", primary: false },
      ],
      activities: [
        { text: "Quotation Q-2024-001 escalated for margin concession review", time: "15 mins ago", type: "warning" },
        { text: "Automated nudge follow-up dispatched to Stalled Enterprise deal", time: "45 mins ago", type: "info" },
        { text: "Discount limit override authorized for Platinum account", time: "2 hours ago", type: "success" },
        { text: "Variance audit CSV compiled for executive weekly review", time: "4 hours ago", type: "default" },
      ],
    },
    finance: {
      title: "Finance & Receivables Dashboard",
      subtitle: "Invoice collection monitoring, high-concession margin sign-offs, and recurring billing",
      badge: "Finance",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      kpis: [
        { label: "Outstanding Invoices", value: "$48,500 pending", sub: "3 invoices nearing 30 days", color: "text-rose-600" },
        { label: "Finance Concession Queue", value: "2 quotations waiting", sub: "Discounts exceeding 15% threshold", color: "text-amber-600" },
        { label: "Collected This Month", value: "$212,800 received", sub: "+18% compared to last cycle", color: "text-emerald-600" },
        { label: "Active Subscriptions", value: "14 recurring contracts", sub: "Next billing run in 4 days", color: "text-blue-600" },
      ],
      actions: [
        { label: "💰 Invoices & Receivables", path: "/invoices", primary: true },
        { label: "Financial Reports", path: "/reports", primary: false },
        { label: "Finance Approvals Queue", path: "/approvals", primary: false },
        { label: "Fulfillment Status", path: "/fulfillment", primary: false },
      ],
      activities: [
        { text: "Invoice #INV-2024-089 marked as Paid ($12,400)", time: "25 mins ago", type: "success" },
        { text: "High-concession review requested for 18% hardware discount", time: "1 hour ago", type: "warning" },
        { text: "Monthly recurring billing schedule batch processed successfully", time: "3 hours ago", type: "info" },
        { text: "Payment reconciliation completed for North America region", time: "Yesterday", type: "default" },
      ],
    },
    admin: {
      title: "Admin & Operations Command Dashboard",
      subtitle: "System configuration, catalog pricing master, discount tier governance, and warehouse logistics",
      badge: "Admin / Ops",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      kpis: [
        { label: "Product Catalog", value: "45 active SKUs", sub: "Configured across 4 price tiers", color: "text-purple-600" },
        { label: "Discount Tier Governance", value: "4 tiers configured", sub: "Bronze, Silver, Gold, Platinum rules", color: "text-blue-600" },
        { label: "Connected Warehouses", value: "3 distribution hubs", sub: "Stock sync live & healthy", color: "text-emerald-600" },
        { label: "Deal Health Telemetry", value: "Live & Operational", sub: "Continuous background monitoring", color: "text-cyan-600" },
      ],
      actions: [
        { label: "⚡ Backend Configuration", path: "/config", primary: true },
        { label: "Deal Health Telemetry", path: "/deal-health", primary: false },
        { label: "Approvals Oversight", path: "/approvals", primary: false },
        { label: "Warehouse Logistics", path: "/fulfillment", primary: false },
      ],
      activities: [
        { text: "Hardware category discount ceiling updated to 15%", time: "30 mins ago", type: "info" },
        { text: "New warehouse 'Central Hub Dallas' provisioned and verified", time: "2 hours ago", type: "success" },
        { text: "Product pricing tiers synchronized with PostgreSQL backend", time: "4 hours ago", type: "default" },
        { text: "User roles and permissions audit completed", time: "Yesterday", type: "default" },
      ],
    },
  };

  const currentConfig = dashboardConfigs[role] || dashboardConfigs.sales_rep;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{currentConfig.title}</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
              {currentConfig.badge}
            </span>
          </div>
          <p className="text-gray-500 text-sm">{currentConfig.subtitle}</p>
        </div>
        {user && (
          <div className="text-xs text-gray-500 text-right">
            Logged in as <span className="font-semibold text-gray-700">{user.email || user.full_name}</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {currentConfig.kpis.map((kpi, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color} mb-1`}>{kpi.value}</p>
            <p className="text-gray-400 text-xs">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {currentConfig.actions.map((act, index) => (
          <button
            key={index}
            onClick={() => navigate(act.path)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 btn-press ${
              act.primary
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-2xs"
            }`}
          >
            {act.label}
          </button>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚡</span>
          <span>Recent Activity & Updates</span>
        </h2>
        <div className="divide-y divide-gray-100">
          {currentConfig.activities.map((act, index) => (
            <div key={index} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${
                  act.type === "success" ? "bg-emerald-500" :
                  act.type === "warning" ? "bg-amber-500" :
                  act.type === "info" ? "bg-blue-500" : "bg-gray-400"
                }`}></span>
                <span className="text-gray-700">{act.text}</span>
              </div>
              <span className="text-xs text-gray-400">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default SalesWorkspace;