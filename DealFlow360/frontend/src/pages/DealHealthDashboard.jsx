// Owner: Sanjay — stalled deals, anomaly alerts
import React, { useState, useEffect } from "react";
import DealHealthCard from "./DealHealthCard";
// import DealHealthDashboard from "../components/DealHealthDashboard";
import { fetchDealHealth, fetchStalledDeals, fetchAnomalies } from "../services/mockApi";

const DealHealthDashboard = () => {
  const [dealHealth, setDealHealth] = useState(null);
  const [stalledDeals, setStalledDeals] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("days");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [healthRes, stalledRes, anomaliesRes] = await Promise.all([
          fetchDealHealth(),
          fetchStalledDeals(),
          fetchAnomalies(),
        ]);

        setDealHealth(healthRes.data);
        setStalledDeals(stalledRes.data);
        setAnomalies(anomaliesRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-500/20 text-red-300 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
    return colors[priority] || colors.medium;
  };

  const getRiskColor = (risk) => {
    const colors = {
      high: "text-red-400",
      medium: "text-amber-400",
      low: "text-green-400",
      critical: "text-red-500",
    };
    return colors[risk] || "text-gray-400";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filterDeals = () => {
    let filtered = stalledDeals;

    if (filterPriority !== "all") {
      filtered = filtered.filter((deal) => deal.priority === filterPriority);
    }

    // Sort
    if (sortBy === "days") {
      filtered.sort((a, b) => b.days_stalled - a.days_stalled);
    } else if (sortBy === "amount") {
      filtered.sort((a, b) => b.amount - a.amount);
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading deal health data...</p>
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

  const filteredDeals = filterDeals();

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600/10 to-blue-400/5 border border-indigo-500/20 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Deal Health & Anomaly Dashboard</h1>
        <p className="text-gray-400 text-sm">
          Real-time monitoring of stalled deals, discount anomalies, and sales performance
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DealHealthCard
          variant="red"
          icon="🛑"
          title="Stalled Deals"
          value={dealHealth?.summary?.total_stalled || 0}
          label="Deals inactive"
          trend="up"
          trendValue={18}
        />
        <DealHealthCard
          variant="amber"
          icon="⚠️"
          title="Anomalies Detected"
          value={dealHealth?.summary?.total_anomalies || 0}
          label="Discount variances"
          trend="up"
          trendValue={25}
        />
        <DealHealthCard
          variant="blue"
          icon="📊"
          title="Avg Deal Age"
          value={`${dealHealth?.summary?.avg_deal_age || 0}d`}
          label="Days in pipeline"
          trend="up"
          trendValue={8}
        />
        <DealHealthCard
          variant="purple"
          icon="📈"
          title="At Risk %"
          value={`${dealHealth?.summary?.at_risk_percentage || 0}%`}
          label="Of total pipeline"
          trend="down"
          trendValue={5}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stalled Deals Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full"></span>
              Stalled Deals
            </h2>
            <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full">
              {filteredDeals.length} deals
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-2">
              {["all", "high", "medium", "low"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    filterPriority === priority
                      ? "bg-red-600/40 text-red-300 border border-red-500/40"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600/50"
                  }`}
                >
                  {priority === "all" ? "All Priority" : `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg focus:border-gray-600/50 focus:outline-none transition-colors duration-200"
            >
              <option value="days">Sort by: Days Stalled</option>
              <option value="amount">Sort by: Amount</option>
            </select>
          </div>

          {/* Deals Table */}
          <div className="space-y-2">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <div
                  key={deal.quotation_id}
                  onClick={() => setSelectedDeal(deal)}
                  className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-4 hover:bg-gray-900/60 hover:border-gray-600/60 transition-all duration-200 cursor-pointer group"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Customer */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Customer
                      </p>
                      <p className="text-white font-semibold group-hover:text-blue-300 transition-colors duration-200">
                        {deal.customer}
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Amount
                      </p>
                      <p className="text-green-300 font-bold">
                        {formatCurrency(deal.amount)}
                      </p>
                    </div>

                    {/* Days Stalled */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Days Stalled
                      </p>
                      <p className="text-red-400 font-semibold">{deal.days_stalled}d</p>
                    </div>

                    {/* Priority Badge */}
                    <div className="flex items-end">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium border rounded-full ${getPriorityColor(
                          deal.priority
                        )}`}
                      >
                        {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)} Priority
                      </span>
                    </div>
                  </div>

                  {/* Action Required */}
                  <div className="mt-3 pt-3 border-t border-gray-700/30">
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                      <span className="text-lg">→</span> {deal.action_required}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No stalled deals matching filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Anomalies & Quick Actions */}
        <div className="space-y-4">
          {/* Anomalies Card */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
              Discount Anomalies
            </h3>

            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anomaly) => (
                <div
                  key={anomaly.quotation_id}
                  className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3 hover:bg-gray-900/60 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-white">
                      {anomaly.customer}
                    </p>
                    <span
                      className={`text-xs font-bold ${getRiskColor(anomaly.risk_level)}`}
                    >
                      {anomaly.variance_percentage}% above
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{anomaly.reason}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Rep avg: {anomaly.rep_avg}% | Given: {anomaly.discount_given}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {anomalies.length > 3 && (
              <button className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium rounded-lg border border-blue-500/30 transition-colors duration-200">
                View All Anomalies ({anomalies.length})
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>

            <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">
              📞 Escalate Deal
            </button>

            <button className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">
              ✉️ Send Nudge
            </button>

            <button className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">
              📊 Run Report
            </button>
          </div>

          {/* Last Updated */}
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Detail Modal (Conditional) */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700/50 rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{selectedDeal.customer}</h3>
              <button
                onClick={() => setSelectedDeal(null)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Quotation ID:</span>
                <span className="text-white font-semibold">{selectedDeal.quotation_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-green-300 font-semibold">
                  {formatCurrency(selectedDeal.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-blue-300 font-semibold">{selectedDeal.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Days Stalled:</span>
                <span className="text-red-400 font-semibold">{selectedDeal.days_stalled}d</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Activity:</span>
                <span className="text-gray-300">{selectedDeal.last_activity}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700/50 space-y-2">
              <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200">
                View Full Deal
              </button>
              <button className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition-colors duration-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealHealthDashboard;