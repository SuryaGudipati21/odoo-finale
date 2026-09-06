// Owner: Sanjay — main deal health dashboard with metrics, stalled deals, and anomalies
// Location: frontend/src/pages/DealHealthDashboard.jsx

import React, { useState, useEffect } from "react";
import DealHealthCard from "../components/DealHealthCard";
import Layout from "../components/Layout";
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
  const [notification, setNotification] = useState(null);

  // Intervention modal states
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [escalateDealId, setEscalateDealId] = useState("all");
  const [escalateTarget, setEscalateTarget] = useState("VP of Enterprise Sales");
  const [escalateUrgency, setEscalateUrgency] = useState("Critical (2-Hour SLA)");
  const [escalateNotes, setEscalateNotes] = useState("Stalled beyond pipeline SLA. Margin concession review required.");
  
  const [nudgeDealId, setNudgeDealId] = useState("");
  const [nudgeTemplate, setNudgeTemplate] = useState("time_sensitive");
  const [nudgeNotes, setNudgeNotes] = useState("");

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
      high: "bg-rose-50 text-rose-700 border-rose-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      low: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return colors[priority] || colors.medium;
  };

  const getRiskColor = (risk) => {
    const colors = {
      high: "text-rose-600 font-bold",
      medium: "text-amber-600 font-bold",
      low: "text-emerald-600 font-semibold",
      critical: "text-red-700 font-extrabold",
    };
    return colors[risk] || "text-gray-500";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filterDeals = () => {
    let filtered = [...stalledDeals];

    if (filterPriority !== "all") {
      filtered = filtered.filter((deal) => deal.priority === filterPriority);
    }

    if (sortBy === "days") {
      filtered.sort((a, b) => b.days_stalled - a.days_stalled);
    } else if (sortBy === "amount") {
      filtered.sort((a, b) => b.amount - a.amount);
    }

    return filtered;
  };

  const handleConfirmEscalation = () => {
    setStalledDeals((prev) =>
      prev.map((deal) => {
        if (escalateDealId === "all" || deal.quotation_id === Number(escalateDealId)) {
          return {
            ...deal,
            status: "Escalated",
            priority: "high",
            last_activity: `Escalated to ${escalateTarget} just now`,
          };
        }
        return deal;
      })
    );
    setIsEscalateModalOpen(false);
    setNotification(`Successfully escalated deals to ${escalateTarget} with urgency: ${escalateUrgency}`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleConfirmNudge = () => {
    const targetDeal = stalledDeals.find((d) => d.quotation_id === Number(nudgeDealId)) || stalledDeals[0];
    const customerName = targetDeal ? targetDeal.customer : "Client";
    setStalledDeals((prev) =>
      prev.map((deal) => {
        if (!targetDeal || deal.quotation_id === targetDeal.quotation_id) {
          return {
            ...deal,
            last_activity: "Follow-up email dispatched just now",
            status: "Follow-up Sent",
          };
        }
        return deal;
      })
    );
    setIsNudgeModalOpen(false);
    setNotification(`Customer follow-up successfully sent to ${customerName}! Activity log updated.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCompileVarianceAudit = () => {
    try {
      const headers = [
        "Quotation ID",
        "Customer Name",
        "Risk Level",
        "Variance %",
        "Discount Given %",
        "Rep Average %",
        "Reason",
      ];
      const rows = anomalies.map((a) => {
        const qId = `Q-${String(a.quotation_id || a.id).padStart(3, "0")}`;
        const cust = `"${(a.customer || "").replace(/"/g, '""')}"`;
        const rLevel = a.risk_level || "MEDIUM";
        const variance = a.variance_percentage || 0;
        const given = a.discount_given || 0;
        const repAvg = a.rep_avg || 0;
        const reason = `"${(a.reason || "").replace(/"/g, '""')}"`;
        return `${qId},${cust},${rLevel},${variance}%,${given}%,${repAvg}%,${reason}`;
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `deal-health-variance-audit-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotification(
        `Variance Audit Report compiled with ${anomalies.length} risk records and downloaded!`
      );
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification(`Failed to generate audit report: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading deal health insights...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold">Failed to load Deal Health data</p>
          <p className="text-sm">{error}</p>
        </div>
      </Layout>
    );
  }

  const filteredDeals = filterDeals();

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Deal Health & Anomaly Intelligence
          </h1>
          <p className="text-gray-500 text-sm">
            Continuous real-time pipeline monitoring, stalled deal interventions, and discount risk diagnostics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Telemetry Live
          </span>
        </div>
      </div>

      {notification && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-4 rounded-xl mb-6 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DealHealthCard
          variant="red"
          icon="🛑"
          title="Stalled Deals"
          value={dealHealth?.summary?.total_stalled || 0}
          label="Deals inactive >7 days"
          trend="up"
          trendValue={18}
        />
        <DealHealthCard
          variant="amber"
          icon="⚠️"
          title="Anomalies Detected"
          value={dealHealth?.summary?.total_anomalies || 0}
          label="Ceiling variance flags"
          trend="up"
          trendValue={25}
        />
        <DealHealthCard
          variant="blue"
          icon="📊"
          title="Avg Deal Age"
          value={`${dealHealth?.summary?.avg_deal_age || 0}d`}
          label="Days active in pipeline"
          trend="up"
          trendValue={8}
        />
        <DealHealthCard
          variant="purple"
          icon="📈"
          title="Pipeline At Risk"
          value={`${dealHealth?.summary?.at_risk_percentage || 0}%`}
          label="Potential revenue exposure"
          trend="down"
          trendValue={5}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Stalled Deals List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h2 className="text-base font-bold text-gray-900">
                  Stalled Deals Pipeline
                </h2>
                <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full ml-1">
                  {filteredDeals.length} deals
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {["all", "high", "medium", "low"].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setFilterPriority(priority)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        filterPriority === priority
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {priority === "all" ? "All" : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:border-blue-400"
                >
                  <option value="days">Sort: Days Stalled</option>
                  <option value="amount">Sort: Amount</option>
                </select>
              </div>
            </div>

            {/* Deals List */}
            <div className="space-y-2.5">
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => (
                  <div
                    key={deal.quotation_id}
                    onClick={() => setSelectedDeal(deal)}
                    className="bg-gray-50/50 border border-gray-200/80 rounded-xl p-4 hover:bg-white hover:border-blue-400 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                      {/* Customer */}
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                          Customer
                        </p>
                        <p className="text-gray-900 font-bold group-hover:text-blue-600 transition-colors">
                          {deal.customer}
                        </p>
                      </div>

                      {/* Amount */}
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                          Amount
                        </p>
                        <p className="text-emerald-700 font-bold">
                          {formatCurrency(deal.amount)}
                        </p>
                      </div>

                      {/* Days Stalled */}
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                          Stalled Duration
                        </p>
                        <p className="text-rose-600 font-semibold flex items-center gap-1">
                          <span>⏱</span> {deal.days_stalled} days
                        </p>
                      </div>

                      {/* Priority Badge */}
                      <div className="flex sm:justify-end">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold border rounded-full ${getPriorityColor(
                            deal.priority
                          )}`}
                        >
                          {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>

                    {/* Action Required */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <p className="text-amber-800 font-medium flex items-center gap-1.5">
                        <span className="font-bold">Next Action:</span> {deal.action_required}
                      </p>
                      <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                        Investigate →
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No stalled deals matching active filters
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Anomalies & Actions */}
        <div className="space-y-4">
          {/* Anomalies Card */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="text-base font-bold text-gray-900">
                Discount Variance Flags
              </h3>
            </div>

            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anomaly) => (
                <div
                  key={anomaly.quotation_id}
                  className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-3.5 hover:bg-white hover:border-amber-300 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-sm font-bold text-gray-900">
                      {anomaly.customer}
                    </p>
                    <span className={`text-xs ${getRiskColor(anomaly.risk_level)}`}>
                      +{anomaly.variance_percentage}% variance
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{anomaly.reason}</p>
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 flex justify-between">
                    <span>Rep Avg: {anomaly.rep_avg}%</span>
                    <span className="font-semibold text-gray-700">Given: {anomaly.discount_given}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Intervention Actions */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
              Automated Interventions
            </h3>

            <button
              onClick={() => setIsEscalateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all duration-150 btn-press"
              title="Escalate stalled accounts to sales executives"
            >
              <span>📞</span> Escalate Stalled Deals
            </button>

            <button
              onClick={() => {
                setNudgeDealId(stalledDeals[0]?.quotation_id || "");
                setIsNudgeModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all duration-150 btn-press"
              title="Dispatch re-engagement email to customer"
            >
              <span>✉️</span> Dispatch Customer Follow-up
            </button>

            <button
              onClick={handleCompileVarianceAudit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all duration-150 btn-press"
              title="Download full CSV of all discount variance anomalies"
            >
              <span>📊</span> Compile Variance Audit
            </button>

            <p className="text-2xs text-gray-400 text-center pt-2">
              Last synced: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Escalate Stalled Deals Modal */}
      {isEscalateModalOpen && (
        <div
          onClick={() => setIsEscalateModalOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-lg">
                  📞
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Escalate Stalled Deals</h3>
                  <p className="text-xs text-gray-400">Trigger executive leadership SLA notification & priority intervention</p>
                </div>
              </div>
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Target Quotation / Account
                </label>
                <select
                  value={escalateDealId}
                  onChange={(e) => setEscalateDealId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="all">All Stalled Deals ({stalledDeals.length} accounts)</option>
                  {stalledDeals.map((d) => (
                    <option key={d.quotation_id} value={d.quotation_id}>
                      Q-{d.quotation_id}: {d.customer} ({formatCurrency(d.amount)} — {d.days_stalled}d inactive)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Executive Recipient
                  </label>
                  <select
                    value={escalateTarget}
                    onChange={(e) => setEscalateTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="VP of Enterprise Sales">VP of Enterprise Sales</option>
                    <option value="Regional Sales Director">Regional Sales Director</option>
                    <option value="Chief Commercial Officer">Chief Commercial Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Urgency SLA
                  </label>
                  <select
                    value={escalateUrgency}
                    onChange={(e) => setEscalateUrgency(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Critical (2-Hour SLA)">Critical (2-Hour SLA)</option>
                    <option value="High (24-Hour SLA)">High (24-Hour SLA)</option>
                    <option value="Executive Review (48-Hour)">Executive Review (48-Hour)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Escalation Dossier Context & Instructions
                </label>
                <textarea
                  rows={3}
                  value={escalateNotes}
                  onChange={(e) => setEscalateNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                  placeholder="Provide context for executive intervention..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 btn-press"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow btn-press"
              >
                Confirm & Dispatch Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Nudge Modal */}
      {isNudgeModalOpen && (
        <div
          onClick={() => setIsNudgeModalOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-lg">
                  ✉️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Dispatch Customer Follow-up</h3>
                  <p className="text-xs text-gray-400">Automated multi-channel re-engagement and incentive dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setIsNudgeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Select Target Account
                </label>
                <select
                  value={nudgeDealId}
                  onChange={(e) => setNudgeDealId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  {stalledDeals.map((d) => (
                    <option key={d.quotation_id} value={d.quotation_id}>
                      {d.customer} — Q-{d.quotation_id} ({formatCurrency(d.amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Nudge Template
                </label>
                <select
                  value={nudgeTemplate}
                  onChange={(e) => setNudgeTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="time_sensitive">Time-Sensitive Special Pricing Expiry Notice</option>
                  <option value="executive_checkin">Executive Courtesy Check-in & Feedback Request</option>
                  <option value="implementation_slot">Quarterly Implementation Slot Reservation Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Email Subject Preview
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    nudgeTemplate === "time_sensitive"
                      ? "Regarding your Quotation: Special pricing terms expiring shortly"
                      : nudgeTemplate === "executive_checkin"
                      ? "DealFlow360 Executive Team: Checking in on your proposal"
                      : "Action Required: Reserving your project onboarding window"
                  }
                  className="w-full px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 select-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Follow-up Notes / Custom Message
                </label>
                <textarea
                  rows={3}
                  value={nudgeNotes}
                  onChange={(e) => setNudgeNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                  placeholder="Optional custom addendum attached to automated outreach..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsNudgeModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 btn-press"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNudge}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow btn-press"
              >
                Send Customer Nudge ✉️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDeal && (
        <div
          onClick={() => setSelectedDeal(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedDeal.customer}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Quotation Ref: Q-{selectedDeal.quotation_id}</p>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-semibold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Pipeline Amount:</span>
                <span className="text-emerald-700 font-bold">{formatCurrency(selectedDeal.amount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Current Status:</span>
                <span className="text-blue-600 font-semibold">{selectedDeal.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Days Inactive:</span>
                <span className="text-rose-600 font-semibold">{selectedDeal.days_stalled} days</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Last Activity:</span>
                <span className="text-gray-700">{selectedDeal.last_activity}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Priority Level:</span>
                <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs border ${getPriorityColor(selectedDeal.priority)}`}>
                  {selectedDeal.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-6">
              <span className="font-bold">Recommended Action:</span> {selectedDeal.action_required}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDeal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setNudgeDealId(selectedDeal.quotation_id);
                  setSelectedDeal(null);
                  setIsNudgeModalOpen(true);
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs btn-press"
              >
                Trigger Nudge
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DealHealthDashboard;