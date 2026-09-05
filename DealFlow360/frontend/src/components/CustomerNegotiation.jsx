// Owner: Sanjay — comment/counter-discount/confirm, used in CustomerPortal
import React, { useState, useEffect } from "react";
import { fetchQuotationDetail, submitNegotiation } from "../services/mockApi";

const CustomerNegotiation = ({ quotationId }) => {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expandedLine, setExpandedLine] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    line_comments: {},
    counter_discount: "",
    counter_discount_reason: "",
    special_requests: "",
  });

  const [validation, setValidation] = useState({});

  useEffect(() => {
    const loadQuotation = async () => {
      try {
        setLoading(true);
        const response = await fetchQuotationDetail(quotationId);
        setQuotation(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuotation();
  }, [quotationId]);

  const validateForm = () => {
    const newValidation = {};

    if (formData.counter_discount && isNaN(parseFloat(formData.counter_discount))) {
      newValidation.counter_discount = "Must be a valid number";
    }

    if (formData.counter_discount && parseFloat(formData.counter_discount) > 50) {
      newValidation.counter_discount = "Discount cannot exceed 50%";
    }

    if (
      formData.counter_discount &&
      !formData.counter_discount_reason.trim()
    ) {
      newValidation.counter_discount_reason =
        "Please provide a reason for discount request";
    }

    setValidation(newValidation);
    return Object.keys(newValidation).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await submitNegotiation(quotationId, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 6000);

      // Reset form
      setFormData({
        line_comments: {},
        counter_discount: "",
        counter_discount_reason: "",
        special_requests: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLineComment = (lineId, comment) => {
    setFormData((prev) => ({
      ...prev,
      line_comments: {
        ...prev.line_comments,
        [lineId]: comment,
      },
    }));
  };

  const calculateOrderTotal = () => {
    if (!quotation) return 0;
    return quotation.lines.reduce((total, line) => {
      const lineTotal = line.quantity * line.price;
      const discountAmount = (lineTotal * line.discount) / 100;
      return total + (lineTotal - discountAmount);
    }, 0);
  };

  const calculateProposedTotal = () => {
    const currentTotal = calculateOrderTotal();
    if (!formData.counter_discount) return currentTotal;

    const counterDiscount = (currentTotal * parseFloat(formData.counter_discount)) / 100;
    return currentTotal - counterDiscount;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading quotation...</p>
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
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600/10 to-blue-400/5 border border-green-500/20 rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Quotation Review & Negotiation
        </h1>
        <p className="text-gray-400 text-sm">
          Review the quotation details and submit any change requests or discount
          proposals
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-300 animate-in fade-in duration-300">
          <p className="font-semibold">✓ Negotiation request submitted successfully</p>
          <p className="text-sm mt-1">Our team will review your request within 24 hours</p>
        </div>
      )}

      {/* Current Quotation Summary */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
          Current Quotation Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Quotation ID
            </p>
            <p className="text-white font-semibold">{quotation?.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Quotation Date
            </p>
            <p className="text-white font-semibold">
              {new Date(quotation?.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total Amount
            </p>
            <p className="text-green-300 font-bold text-lg">
              {formatCurrency(calculateOrderTotal())}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Line Items Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Line Items
          </h2>

          <div className="space-y-2">
            {quotation?.lines?.map((line) => (
              <div key={line.id} className="space-y-2">
                {/* Line Item Card */}
                <div
                  onClick={() =>
                    setExpandedLine(expandedLine === line.id ? null : line.id)
                  }
                  className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-4 hover:bg-gray-900/60 hover:border-gray-600/60 transition-all duration-200 cursor-pointer group"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Product */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Product
                      </p>
                      <p className="text-white font-semibold group-hover:text-blue-300 transition-colors duration-200">
                        {line.product}
                      </p>
                    </div>

                    {/* Quantity × Price */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Quantity
                      </p>
                      <p className="text-gray-300">
                        {line.quantity} × {formatCurrency(line.price)}
                      </p>
                    </div>

                    {/* Discount */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Discount
                      </p>
                      <p className="text-orange-400 font-semibold">{line.discount}%</p>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Line Total
                      </p>
                      <p className="text-green-300 font-bold text-lg">
                        {formatCurrency(
                          line.quantity * line.price * (1 - line.discount / 100)
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Expanded: Add Comment */}
                  {expandedLine === line.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700/30 space-y-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-300 block mb-2">
                          Add a comment or question about this item
                        </label>
                        <textarea
                          placeholder="e.g., Can we get a bulk discount? What's the warranty period?"
                          value={
                            formData.line_comments[line.id] || ""
                          }
                          onChange={(e) =>
                            handleLineComment(line.id, e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 rounded-lg focus:border-blue-500/50 focus:outline-none transition-colors duration-200 resize-none"
                          rows="3"
                        />
                      </div>
                    </div>
                  )}

                  {/* Show indicator when comment exists */}
                  {formData.line_comments[line.id] && (
                    <div className="mt-3 text-xs text-blue-300 flex items-center gap-1">
                      ✓ Comment added ({formData.line_comments[line.id].length} chars)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Counter Discount Section */}
        <div className="bg-gradient-to-br from-amber-600/10 to-amber-400/5 border border-amber-500/30 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
            Propose a Counter Discount (Optional)
          </h3>

          <p className="text-sm text-gray-300">
            If you'd like to negotiate the total price, please provide a discount
            percentage and your reasoning.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Counter Discount % */}
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">
                Requested Discount (%)
              </label>
              <input
                type="number"
                placeholder="e.g., 5"
                value={formData.counter_discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    counter_discount: e.target.value,
                  })
                }
                min="0"
                max="50"
                step="0.5"
                className={`w-full px-4 py-2.5 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors duration-200 ${
                  validation.counter_discount
                    ? "border-red-500/50 focus:border-red-500/50"
                    : "border-gray-700/50 focus:border-blue-500/50"
                }`}
              />
              {validation.counter_discount && (
                <p className="text-xs text-red-400 mt-1">
                  {validation.counter_discount}
                </p>
              )}
            </div>

            {/* Proposed Total Preview */}
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">
                Proposed Total
              </label>
              <div className="px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg flex items-center justify-between">
                <span className="text-green-300 font-bold text-lg">
                  {formatCurrency(calculateProposedTotal())}
                </span>
                {formData.counter_discount && (
                  <span className="text-xs text-green-400">
                    You save {formatCurrency(calculateOrderTotal() - calculateProposedTotal())}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Discount Reason */}
          <div>
            <label className="text-sm font-semibold text-gray-300 block mb-2">
              Reason for Discount Request
            </label>
            <textarea
              placeholder="Help us understand your negotiation (e.g., budget constraints, multi-year commitment, etc.)"
              value={formData.counter_discount_reason}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  counter_discount_reason: e.target.value,
                })
              }
              className={`w-full px-4 py-2.5 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors duration-200 resize-none ${
                validation.counter_discount_reason
                  ? "border-red-500/50 focus:border-red-500/50"
                  : "border-gray-700/50 focus:border-blue-500/50"
              }`}
              rows="3"
            />
            {validation.counter_discount_reason && (
              <p className="text-xs text-red-400 mt-1">
                {validation.counter_discount_reason}
              </p>
            )}
          </div>
        </div>

        {/* Special Requests Section */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Special Requests or Questions (Optional)
          </h3>

          <textarea
            placeholder="e.g., Can you customize the delivery schedule? Do you offer implementation support? Any volume discounts available?"
            value={formData.special_requests}
            onChange={(e) =>
              setFormData({
                ...formData,
                special_requests: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 rounded-lg focus:border-blue-500/50 focus:outline-none transition-colors duration-200 resize-none"
            rows="4"
          />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-xs text-blue-300 leading-relaxed">
            💡 <span className="font-semibold">Tip:</span> The more details you provide about your
            needs and constraints, the faster our team can respond with a revised proposal.
            All negotiations are handled confidentially.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : (
              "✓ Submit Negotiation Request"
            )}
          </button>

          <button
            type="button"
            className="flex-1 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-semibold rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Terms Info */}
      <div className="text-center space-y-2 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500">
          By submitting, you agree to our negotiation terms & conditions
        </p>
        <p className="text-xs text-gray-600">
          Questions? <span className="text-blue-400 cursor-pointer hover:underline">Contact our sales team</span>
        </p>
      </div>
    </div>
  );
};

export default CustomerNegotiation;