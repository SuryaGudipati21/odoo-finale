import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuotation } from "../hooks/useQuotation";
import { useAuth } from "../context/AuthContext";
import { getCustomers, createCustomer } from "../services/api";
import QuotationForm from "../components/QuotationForm";
import UpsellPanel from "../components/UpsellPanel";
import AuditTrail from "../components/AuditTrail";
import Layout from "../components/Layout";
import { formatCurrency, formatDateTime } from "../utils/formatting";
import { estimateBlendedRiskScore } from "../utils/riskScore";

function QuotationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quotationId = id ?? "new";
  const { user } = useAuth();
  const actorName = user?.full_name || user?.email || "You";

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", email: "", tier: "bronze" });
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState(null);

  // Load real customers from database
  useEffect(() => {
    getCustomers()
      .then((data) => {
        setCustomers(data || []);
        if (data && data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  const {
    quotation,
    loading,
    error,
    handleAddLine,
    handleApplyDiscount,
    handleDeleteLine,
    handleUpdateStatus,
    handleUpdateCustomer,
    handleSubmit,
    handleSaveDraft,
  } = useQuotation(quotationId, actorName, selectedCustomerId);

  const [approvalNotice, setApprovalNotice] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const onAddLine = async (line) => {
    setActionError(null);
    try {
      await handleAddLine(line, selectedCustomerId);
      setApprovalNotice(`Added "${line.product_name || "Product"}" to quotation!`);
      setTimeout(() => setApprovalNotice(null), 3500);
    } catch (err) {
      setActionError(err.message || "Failed to add product line");
    }
  };

  const onSaveDraft = async () => {
    setActionError(null);
    try {
      const res = await handleSaveDraft(selectedCustomerId);
      const newId = res?.data?.id || res?.id;
      if (isNew && newId) {
        setApprovalNotice("Quotation draft created successfully!");
        navigate(`/quotations/builder/${newId}`, { replace: true });
      } else {
        setApprovalNotice("Quotation draft saved successfully!");
      }
    } catch (err) {
      setActionError(err.message || "Failed to save draft");
    }
  };

  const onSubmit = async () => {
    setActionError(null);
    try {
      const requiresAppr = (riskPreview?.blendedScore ?? 0) > 0 || (quotation?.risk_score ?? 0) > 0;
      const res = await handleSubmit(requiresAppr, selectedCustomerId);
      const newId = res?.data?.id || res?.id;
      if (isNew && newId) {
        navigate(`/quotations/builder/${newId}`, { replace: true });
      }
      if (requiresAppr) {
        setApprovalNotice("Quotation submitted for approval! Click 'Review Approval →' to open the workflow.");
      } else {
        setApprovalNotice("Quotation successfully confirmed! Order is sent to fulfillment.");
      }
    } catch (err) {
      setActionError(err.message || "Failed to submit quotation");
    }
  };

  const onStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    setActionError(null);
    try {
      await handleUpdateStatus(newStatus);
      setApprovalNotice(`Quotation status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (err) {
      setActionError(err.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const onCustomerChange = async (newCustomerId) => {
    setSelectedCustomerId(newCustomerId);
    if (!isNew && quotation?.id && quotation.id !== "new") {
      try {
        await handleUpdateCustomer(newCustomerId);
        setApprovalNotice("Customer updated for this quotation!");
      } catch (err) {
        setActionError(err.message || "Failed to update customer");
      }
    }
  };

  // Keep selectedCustomerId in sync with quotation's customer_id once loaded
  useEffect(() => {
    if (quotation?.customer_id) {
      setSelectedCustomerId(quotation.customer_id);
    }
  }, [quotation?.customer_id]);

  const currentCustomer = useMemo(() => {
    if (quotation?.customer_id) {
      return customers.find((c) => c.id === quotation.customer_id) || {
        id: quotation.customer_id,
        name: quotation.customer_name || `Customer #${quotation.customer_id}`,
        tier: "silver",
      };
    }
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || {
      name: "Select Customer",
      tier: "bronze",
    };
  }, [quotation, selectedCustomerId, customers]);

  const customerTier = currentCustomer?.tier || "bronze";

  const riskPreview = useMemo(() => {
    if (!quotation || !quotation.lines) return null;
    return estimateBlendedRiskScore(quotation.lines, customerTier);
  }, [quotation, customerTier]);

  const quoteLines = useMemo(() => {
    return Array.isArray(quotation?.lines) ? quotation.lines : [];
  }, [quotation?.lines]);

  const grossSubtotal = useMemo(() => {
    return quoteLines.reduce(
      (sum, l) => sum + Number(l.unit_price || 0) * Number(l.quantity || 1),
      0
    );
  }, [quoteLines]);

  const netTotal = useMemo(() => {
    return quotation?.total_amount ?? quoteLines.reduce(
      (sum, l) =>
        sum +
        Number(
          l.line_total ??
            Math.round(
              Number(l.unit_price || 0) *
                Number(l.quantity || 1) *
                (1 - Number(l.discount_percent || 0) / 100)
            )
        ),
      0
    );
  }, [quotation?.total_amount, quoteLines]);

  const totalDiscountAmount = Math.max(0, grossSubtotal - netTotal);
  const effectiveDiscountPercent =
    grossSubtotal > 0 ? ((totalDiscountAmount / grossSubtotal) * 100).toFixed(1) : "0.0";

  const handleCreateNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.email.trim()) return;
    setCustomerSaving(true);
    setCustomerError(null);
    try {
      const created = await createCustomer(newCustomerForm);
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(created.id);
      setShowNewCustomerModal(false);
      setNewCustomerForm({ name: "", email: "", tier: "bronze" });
    } catch (err) {
      setCustomerError(err.message || "Failed to create customer");
    } finally {
      setCustomerSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading quotation builder...</p>
        </div>
      </Layout>
    );
  }

  if (error && !quotation) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-lg mx-auto text-center mt-10">
          <p className="font-bold text-lg mb-2">Quotation Not Found</p>
          <p className="text-sm mb-4">{error}</p>
          <Link to="/quotations" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs">
            Back to Quotations Pipeline
          </Link>
        </div>
      </Layout>
    );
  }

  const isNew = !quotation || quotation.id === "new";
  const displayRef = isNew ? "New Draft" : (String(quotation.id).startsWith("Q-") ? quotation.id : `Q-${quotation.id}`);
  const customerName = currentCustomer.name || quotation.customer_name || "Customer";

  const lineStatus = (line) => {
    const over = riskPreview?.lineBreakdown.find((l) => l.lineId === line.id)?.overage ?? 0;
    return over > 0 ? `OVER (+${over}pt)` : "OK";
  };

  return (
    <Layout>
      {/* Back breadcrumb */}
      <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-gray-500">
        <Link to="/quotations" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <span>←</span>
          <span>Back to Quotations Pipeline</span>
        </Link>
        <span className="text-gray-300">|</span>
        <Link to="/approvals" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <span>⚖️</span>
          <span>Approvals Queue</span>
        </Link>
      </div>

      {/* Pending Approval Banner */}
      {!isNew && (quotation.status === "PENDING_APPROVAL" || quotation.status === "REAPPROVAL_REQUIRED") && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 mb-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">⚖️</span>
            <div>
              <p className="font-bold text-sm">Approval Review Pending</p>
              <p className="text-xs text-amber-700">
                This quotation includes concessions exceeding limit thresholds. It is pending decision by Sales Manager and Finance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/approvals/${quotation.id}`)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all duration-150 flex items-center gap-1.5 shrink-0 self-start sm:self-auto btn-press"
          >
            <span>Review Approval</span>
            <span>→</span>
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Quotation Detail: {displayRef} ({customerName})
      </h1>
      <p className="text-gray-500 text-sm mb-1">
        Configure products, live discount calculations, real-time blended risk scores, and upsell suggestions.
      </p>
      <p className="text-gray-400 text-xs mb-6">
        Created by <span className="font-medium text-gray-600">{quotation.created_by || actorName}</span>
        {quotation.created_at && <> on {formatDateTime(quotation.created_at)}</>}
      </p>

      {/* Quotation Status Lifecycle Bar */}
      {!isNew && (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 mb-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-3xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Current Quotation Stage</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">Stage:</span>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  {(quotation.status || "DRAFT").replace(/_/g, " ")}
                </span>
                {quotation.risk_score > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Risk Score: {quotation.risk_score}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600">Change Stage:</label>
              <select
                disabled={statusUpdating}
                value={quotation.status || "DRAFT"}
                onChange={(e) => onStatusChange(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="SENT_TO_CUSTOMER">Sent to Customer</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FULFILLMENT">Fulfillment</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Visual Progression Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-3 border-t border-gray-100 text-center">
            {[
              { key: "DRAFT", label: "Draft" },
              { key: "PENDING_APPROVAL", label: "Approval" },
              { key: "APPROVED", label: "Approved" },
              { key: "SENT_TO_CUSTOMER", label: "Sent" },
              { key: "NEGOTIATION", label: "Negotiating" },
              { key: "CONFIRMED", label: "Confirmed" },
              { key: "FULFILLMENT", label: "Fulfillment" },
            ].map((step) => {
              const isCurrent = (quotation.status || "DRAFT").toUpperCase() === step.key;
              return (
                <button
                  key={step.key}
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => onStatusChange(step.key)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs font-bold ring-2 ring-blue-300"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                  title={`Set status to ${step.label}`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer & Price List Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700">Customer Account</label>
            {isNew ? (
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                + New Customer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {isEditingCustomer ? "Done" : "Change Customer"}
              </button>
            )}
          </div>
          {isNew || isEditingCustomer ? (
            <select
              value={selectedCustomerId || ""}
              onChange={(e) => onCustomerChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tier?.toUpperCase() || "BRONZE"}) — {c.email}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-sm font-semibold text-gray-900">{customerName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {customerTier} Tier
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Assigned Price Tier & Limit Ceiling</label>
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-sm font-medium text-gray-800">
              {customerTier.toUpperCase()} Tier (Ceiling: {customerTier === "gold" ? "15%" : customerTier === "silver" ? "10%" : "5%"})
            </span>
            <span className="text-xs text-gray-500">Live Database Catalog</span>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Customer</h3>
            <p className="text-xs text-gray-500 mb-4">Register an enterprise account directly into the database.</p>

            {customerError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {customerError}
              </div>
            )}

            <form onSubmit={handleCreateNewCustomer} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Company / Customer Name</label>
                <input
                  required
                  placeholder="e.g. Zenith Tech Corp"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Contact Email</label>
                <input
                  required
                  type="email"
                  placeholder="contact@zenith.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Customer Tier</label>
                <select
                  value={newCustomerForm.tier}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                >
                  <option value="bronze">Bronze (5% max discount)</option>
                  <option value="silver">Silver (10% max discount)</option>
                  <option value="gold">Gold (15% max discount)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customerSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {customerSaving ? "Saving..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden mb-4 shadow-2xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <span>📋</span>
            <span>Line Items ({quoteLines.length})</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            Customer tier: <strong className="text-gray-800 uppercase">{customerTier}</strong> ({customerTier === "gold" ? "15%" : customerTier === "silver" ? "10%" : "5%"} ceiling)
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200/80">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Unit Price</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Line Total</th>
              <th className="text-left px-4 py-3">Compliance</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quoteLines.map((line) => {
              const status = lineStatus(line);
              const calculatedLineTotal =
                line.line_total ??
                Math.round(
                  Number(line.unit_price || 0) *
                    Number(line.quantity || 1) *
                    (1 - Number(line.discount_percent || 0) / 100)
                );

              return (
                <tr key={line.id || Math.random()} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3.5 text-gray-900 font-semibold">
                    {line.product_name || "Product"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                      {line.category || "Hardware"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 font-medium">{line.quantity}</td>
                  <td className="px-4 py-3.5 text-gray-700">{formatCurrency(line.unit_price)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.discount_percent ?? 0}
                        onChange={(e) => handleApplyDiscount(line.id, Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold"
                      />
                      <span className="text-gray-500 text-xs font-bold">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-gray-900">
                    {formatCurrency(calculatedLineTotal)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        status === "OK"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {status === "OK" ? "✓ Within Limit" : status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteLine(line.id)}
                      className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {quoteLines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">📦</span>
                    <p className="font-semibold text-gray-700 text-sm">No products added yet</p>
                    <p className="text-gray-400">Select a product and quantity below, then click &ldquo;+ Add Line&rdquo;.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Actions Card */}
      {quoteLines.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100 rounded-2xl p-5 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-1">
                <span>Gross Subtotal: <strong className="text-gray-900 font-semibold">{formatCurrency(grossSubtotal)}</strong></span>
                <span>•</span>
                <span>
                  Discount Savings: <strong className="text-emerald-700 font-semibold">−{formatCurrency(totalDiscountAmount)} ({effectiveDiscountPercent}%)</strong>
                </span>
                {riskPreview && (
                  <>
                    <span>•</span>
                    <span>
                      Blended Risk Score:{" "}
                      <strong className={riskPreview.blendedScore > 0 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                        {riskPreview.blendedScore} pt
                      </strong>
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Final Quotation Total:</span>
                <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
                  {formatCurrency(netTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={onSaveDraft}
                className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-semibold text-xs rounded-xl shadow-2xs transition-all btn-press cursor-pointer"
              >
                {isNew ? "💾 Save Draft" : "💾 Save Changes"}
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow transition-all btn-press cursor-pointer"
              >
                {(riskPreview?.blendedScore ?? 0) > 0 ? "⚖️ Submit for Approval" : "✓ Confirm Quotation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upsell / Cross-Sell Suggestions */}
      {!isNew && (
        <>
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Live Upsell & Cross-Sell Recommendations</h2>
          <UpsellPanel
            quotationId={quotation.id}
            onAddSuggestion={(s) =>
              handleAddLine({
                product_id: s.suggested_product_id || s.product_id || s.id,
                product_name: s.product_name,
                category: s.category || "Hardware",
                quantity: 1,
                unit_price: s.unit_price || s.price || 0,
                discount_percent: 0,
              })
            }
          />
        </>
      )}

      {/* Add Product Form */}
      <div className="mt-6">
        <QuotationForm
          onAddLine={(line) => onAddLine(line)}
        />
      </div>

      {/* Audit Trail */}
      {!isNew && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Audit Trail & Activity Log</h2>
          <AuditTrail entries={quotation.activity || []} title="Quotation Activity" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-8 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onSaveDraft}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors btn-press"
        >
          {isNew ? "Create Draft Quotation" : "Save Draft"}
        </button>

        <button
          type="button"
          onClick={onSubmit}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-all duration-150 btn-press"
        >
          {(riskPreview?.blendedScore ?? 0) > 0 ? "Submit for Approval" : "Confirm Quotation"}
        </button>

        {!isNew && (quotation.status === "PENDING_APPROVAL" || quotation.status === "REAPPROVAL_REQUIRED") && (
          <button
            type="button"
            onClick={() => navigate(`/approvals/${quotation.id}`)}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center gap-2 btn-press"
          >
            <span>⚖️</span>
            <span>Review Approval →</span>
          </button>
        )}

        {!isNew && (quotation.status === "DRAFT" || quotation.status === "APPROVED") && (
          <button
            type="button"
            disabled={statusUpdating}
            onClick={() => onStatusChange("SENT_TO_CUSTOMER")}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all duration-150 btn-press"
          >
            ✉️ Send to Customer
          </button>
        )}

        {!isNew && quotation.status === "SENT_TO_CUSTOMER" && (
          <>
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => onStatusChange("NEGOTIATION")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all duration-150 btn-press"
            >
              💬 In Negotiation
            </button>
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => onStatusChange("CONFIRMED")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all duration-150 btn-press"
            >
              ✓ Customer Confirmed
            </button>
          </>
        )}

        {!isNew && quotation.status === "NEGOTIATION" && (
          <>
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => onStatusChange("PENDING_APPROVAL")}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all duration-150 btn-press"
            >
              ⚖️ Request Re-Approval
            </button>
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => onStatusChange("CONFIRMED")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all duration-150 btn-press"
            >
              ✓ Agreement Confirmed
            </button>
          </>
        )}

        {!isNew && quotation.status === "CONFIRMED" && (
          <button
            type="button"
            disabled={statusUpdating}
            onClick={() => onStatusChange("FULFILLMENT")}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all duration-150 btn-press"
          >
            📦 Move to Fulfillment
          </button>
        )}
      </div>

      {actionError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {actionError}
        </div>
      )}

      {approvalNotice && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span className="font-semibold">{approvalNotice}</span>
          </div>
          {!isNew && (
            <button
              onClick={() => navigate(`/approvals/${quotation.id}`)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors ml-3 shrink-0"
            >
              Review Approval →
            </button>
          )}
        </div>
      )}

      {!isNew && quotation.status !== "DRAFT" && (
        <p className="text-sm text-gray-500 mt-3">
          Current status: <span className="font-semibold text-gray-700">{quotation.status.replace(/_/g, " ")}</span>
        </p>
      )}
    </Layout>
  );
}

export default QuotationBuilder;