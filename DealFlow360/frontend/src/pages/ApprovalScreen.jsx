// Owner: Pardha — discount approval screen + audit trail view
// src/pages/ApprovalScreen.jsx
// FIXED: was importing `approvalAction` from services/api.js (real backend call) —
// same mock/real mismatch as UpsellPanel and LoginPage had. Switched to mockApi's
// `submitApprovalAction`, and now reads the approval by :id from the route instead
// of always showing the one hardcoded mockApproval.

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useApprovalStatus } from "../hooks/useApprovalStatus";
import AuditTrail from "../components/AuditTrail";
import DiscountApprovalFlow from "../components/DiscountApprovalFlow";

function ApprovalScreen() {
  const { id } = useParams();
  const { approval, loading, error, submitting, submitDecision } = useApprovalStatus(id ?? 1);
  const [actionError, setActionError] = useState(null);

  const handleDecision = async (action, reason) => {
    setActionError(null);
    try {
      await submitDecision(action, reason);
    } catch (err) {
      setActionError(err.message);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading approval...</p>
        </div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
          Approval not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-400/5 border border-blue-500/20 rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Discount Approval
        </h1>
        <p className="text-gray-400 text-sm">
          Quotation #{approval.quotation_id} is awaiting review at the {approval.level} level
        </p>
      </div>

      {(error || actionError) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
          {actionError || error}
        </div>
      )}

      <DiscountApprovalFlow
        approval={approval}
        onSubmit={handleDecision}
        disabled={submitting}
      />

      <AuditTrail steps={approval.steps} title="Approval History" />
    </div>
  );
}

export default ApprovalScreen;