// Owner: Sanjay — subscription management + billing schedule visualization
// Location: frontend/src/components/SubscriptionBilling.jsx

import React, { useState, useEffect } from "react";
import { fetchBillingSchedule, updateSubscription } from "../services/mockApi";

const SubscriptionBilling = ({ quotationId }) => {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        setLoading(true);
        const response = await fetchBillingSchedule(quotationId);
        setBillingData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [quotationId]);

  const handleUpdateSubscription = async (updates) => {
    try {
      setUpdating(true);
      await updateSubscription(quotationId, updates);
      setSuccessMessage("Subscription updated successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading billing schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-400/5 border border-purple-500/20 rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Subscription & Billing Intelligence
        </h1>
        <p className="text-gray-400 text-sm">
          Manage recurring subscriptions, billing schedules, and payment terms
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-300 animate-in fade-in duration-300">
          <p className="font-semibold">✓ {successMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700/50 gap-1 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "schedule", label: "Billing Schedule", icon: "📅" },
          { id: "history", label: "History", icon: "📝" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* One-Time Revenue */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/30 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                One-Time Revenue
              </p>
              <p className="text-3xl font-bold text-blue-300 mb-1">
                {formatCurrency(billingData?.total_one_time || 0)}
              </p>
              <p className="text-xs text-gray-400">
                {billingData?.one_time_lines?.length || 0} line
                {billingData?.one_time_lines?.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Recurring Monthly */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-400/10 border border-green-500/30 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Recurring Monthly
              </p>
              <p className="text-3xl font-bold text-green-300 mb-1">
                {formatCurrency(billingData?.total_recurring_monthly || 0)}
              </p>
              <p className="text-xs text-gray-400">Auto-billed each month</p>
            </div>

            {/* Contract Value */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border border-purple-500/30 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                12-Month Contract Value
              </p>
              <p className="text-3xl font-bold text-purple-300 mb-1">
                {formatCurrency(billingData?.contract_value || 0)}
              </p>
              <p className="text-xs text-gray-400">Including all recurring</p>
            </div>
          </div>

          {/* One-Time Lines */}
          {billingData?.one_time_lines && billingData.one_time_lines.length > 0 && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                One-Time Charges
              </h3>

              <div className="space-y-3">
                {billingData.one_time_lines.map((line, idx) => (
                  <div key={idx} className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-white font-semibold">{line.product}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {line.quantity} × {formatCurrency(line.unit_price)}
                        </p>
                      </div>
                      <span className="text-blue-300 font-bold text-lg">
                        {formatCurrency(line.total)}
                      </span>
                    </div>

                    {line.discount > 0 && (
                      <div className="flex items-center justify-between text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
                        <span>Discount Applied</span>
                        <span className="font-semibold">-{formatCurrency(line.discount)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Lines */}
          {billingData?.recurring_lines && billingData.recurring_lines.length > 0 && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                Recurring Subscriptions
              </h3>

              <div className="space-y-3">
                {billingData.recurring_lines.map((line, idx) => (
                  <div key={idx} className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-white font-semibold">{line.product}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {line.quantity} × {formatCurrency(line.unit_price)} / {line.billing_cycle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-300 font-bold text-lg">
                          {formatCurrency(line.monthly_amount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">per month</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 mb-3">
                      <span>Next Billing: {formatDate(line.next_billing)}</span>
                    </div>

                    {line.discount > 0 && (
                      <div className="flex items-center justify-between text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
                        <span>Discount</span>
                        <span className="font-semibold">-{formatCurrency(line.discount)}</span>
                      </div>
                    )}

                    {/* Subscription Actions */}
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-xs font-medium rounded transition-colors duration-200">
                        Modify
                      </button>
                      <button className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium rounded transition-colors duration-200">
                        Pause
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BILLING SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {/* Timeline Title */}
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Upcoming Billing Timeline
            </h3>
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full">
              {billingData?.billing_schedule?.length || 0} transactions
            </span>
          </div>

          {/* Timeline */}
          <div className="relative space-y-4">
            {billingData?.billing_schedule?.map((item, idx) => (
              <div key={idx} className="relative">
                {/* Timeline Connector */}
                {idx < (billingData?.billing_schedule?.length || 0) - 1 && (
                  <div className="absolute left-[15px] top-12 w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-transparent"></div>
                )}

                {/* Timeline Item */}
                <div
                  onClick={() =>
                    setExpandedSchedule(expandedSchedule === idx ? null : idx)
                  }
                  className="flex gap-4 cursor-pointer group"
                >
                  {/* Timeline Dot */}
                  <div className="mt-2">
                    <div className="w-8 h-8 bg-blue-600/40 border-2 border-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600/60 transition-colors duration-200">
                      <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-900/40 border border-gray-700/30 rounded-lg p-4 hover:bg-gray-900/60 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-semibold">{item.description}</p>
                      <span className="text-green-300 font-bold text-lg">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(item.date)}</p>

                    {/* Expanded Details */}
                    {expandedSchedule === idx && (
                      <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Invoice Status:</span>
                          <span className="text-green-300 font-semibold">Pending</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Due Date:</span>
                          <span className="text-gray-300">
                            {formatDate(new Date(item.date).getTime() + 30 * 24 * 60 * 60 * 1000)}
                          </span>
                        </div>
                        <button className="w-full mt-3 px-3 py-2 bg-blue-600/40 hover:bg-blue-600/60 text-blue-300 text-xs font-medium rounded transition-colors duration-200">
                          Download Invoice
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Proration Info */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-2">
              <span className="text-lg">ℹ️</span> Proration Notice
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              If you modify quantity or billing cycle mid-period, we'll calculate a pro-rata
              adjustment on your next invoice to keep billing accurate.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription History</h3>

            <div className="space-y-3">
              {[
                {
                  date: "2024-09-04",
                  action: "Subscription Activated",
                  details: "Support Plan added",
                },
                {
                  date: "2024-09-01",
                  action: "Contract Confirmed",
                  details: "All terms finalized",
                },
                {
                  date: "2024-08-28",
                  action: "Negotiation Submitted",
                  details: "Customer requested discount",
                },
              ].map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 pb-3 border-b border-gray-700/30 last:border-b-0"
                >
                  <div className="text-sm text-gray-400 min-w-[100px]">
                    {formatDate(entry.date)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{entry.action}</p>
                    <p className="text-xs text-gray-400 mt-1">{entry.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionBilling;