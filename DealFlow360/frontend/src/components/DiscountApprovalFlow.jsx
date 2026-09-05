// Owner: Pardha — approve/reject/revise UI, used in ApprovalScreen
// Owner: Pardha — approve/reject/revise UI, used in ApprovalScreen
// Location: frontend/src/components/DiscountApprovalFlow.jsx

import React, { useState } from "react";

const LEVEL_LABELS = {
  manager: "Sales Manager",
  finance: "Finance",
};

const RISK_BAND = (score) => {
  if (score >= 15) return { label: "High Risk", style: "bg-red-500/20 text-red-300 border-red-500/30" };
  if (score >= 8) return { label: "Medium Risk", style: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  return { label: "Low Risk", style: "bg-green-500/20 text-green-300 border-green-500/30" };
};

/**
 * Approve / Reject / Request Revision panel for a pending approval step.
 * Purely a UI + local-state component — the actual decision authority (whether
 * a revision re-triggers the blended risk check, whether this is the final step,
 * etc.) lives entirely on the backend. This component just collects the action
 * and reason and hands off via onSubmit.
 *
 * Props:
 *   approval   — the approval object (id, quotation_id, level, status, blended_risk_score, steps)
 *   onSubmit   — async (action, reason) => void   (action: "approve" | "reject" | "request_revision")
 *   disabled   — optional, disables all actions (e.g. while another submit is in flight)
 */
const DiscountApprovalFlow = ({ approval, onSubmit, disabled = false }) => {
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [validationError, setValidationError] = useState("");

  if (!approval) return null;

  const risk = RISK_BAND(approval.blended_risk_score ?? 0);
  const currentLevelLabel = LEVEL_LABELS[approval.level] || approval.level;
  const requiresReason = pendingAction === "reject" || pendingAction === "request_revision";

  const handleSubmit = async (action) => {
    setPendingAction(action);

    if ((action === "reject" || action === "request_revision") && !reason.trim()) {
      setValidationError("Please provide a reason before rejecting or requesting revision.");
      return;
    }

    setValidationError("");
    try {
      await onSubmit(action, reason.trim() || undefined);
      setReason("");
      setPendingAction(null);
    } catch (err) {
      // Let parent surface the error (it already tracks its own error state);
      // just release the local "submitting" lock here.
      setPendingAction(null);
    }
  };

  const isBusy = disabled || pendingAction !== null;

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Review — {currentLevelLabel}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Quotation #{approval.quotation_id}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${risk.style}`}>
          {risk.label} · Score {approval.blended_risk_score ?? 0}
        </span>
      </div>

      {/* Current step status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Level</p>
          <p className="text-white font-semibold">{currentLevelLabel}</p>
        </div>
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
          <p className="text-amber-300 font-semibold capitalize">{approval.status}</p>
        </div>
      </div>

      {approval.status === "pending" ? (
        <>
          {/* Reason field */}
          <div>
            <label className="text-sm font-semibold text-gray-300 block mb-2">
              Reason {requiresReason ? (
                <span className="text-red-400">(required)</span>
              ) : (
                <span className="text-gray-500 font-normal">(optional for approve)</span>
              )}
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="Explain your decision, especially for rejection or revision requests..."
              rows="3"
              disabled={isBusy}
              className={`w-full px-4 py-2.5 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors duration-200 resize-none disabled:opacity-50 ${
                validationError
                  ? "border-red-500/50 focus:border-red-500/50"
                  : "border-gray-700/50 focus:border-blue-500/50"
              }`}
            />
            {validationError && (
              <p className="text-xs text-red-400 mt-1">{validationError}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleSubmit("approve")}
              disabled={isBusy}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {pendingAction === "approve" ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Approving...
                </span>
              ) : (
                "✓ Approve"
              )}
            </button>

            <button
              onClick={() => handleSubmit("request_revision")}
              disabled={isBusy}
              className="flex-1 px-6 py-3 bg-orange-600/20 hover:bg-orange-600/30 disabled:opacity-50 text-orange-300 font-semibold rounded-lg border border-orange-500/40 transition-all duration-200"
            >
              {pendingAction === "request_revision" ? "Submitting..." : "↺ Request Revision"}
            </button>

            <button
              onClick={() => handleSubmit("reject")}
              disabled={isBusy}
              className="flex-1 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-300 font-semibold rounded-lg border border-red-500/40 transition-all duration-200"
            >
              {pendingAction === "reject" ? "Submitting..." : "✕ Reject"}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">
            This approval step is <span className="text-white font-semibold capitalize">{approval.status}</span> and no further action is needed here.
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscountApprovalFlow;