// Owner: Pardha — discount approval screen + audit trail view
// src/pages/ApprovalScreen.jsx
import { useState } from "react";
import { mockApproval } from "../data/mockData";
import { approvalAction } from "../services/api";

function ApprovalScreen() {
  const [approval, setApproval] = useState(mockApproval);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAction = async (action) => {
    setSubmitting(true);
    setError(null);
    try {
      // Real API call — endpoint is confirmed/stable per TEAM_STATE
      const result = await approvalAction(approval.id, action, reason || undefined);
      setApproval(prev => ({ ...prev, status: result.status }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Approval — Quotation #{approval.quotation_id}</h2>

      <p>Blended Risk Score: <strong>{approval.blended_risk_score}</strong></p>
      <p>Current Level: <strong>{approval.level}</strong></p>
      <p>Status: <strong>{approval.status}</strong></p>

      <h3>Approval Steps</h3>
      <ul>
        {approval.steps.map((step, i) => (
          <li key={i}>
            {step.level} — {step.status}
            {step.reviewed_by && ` (by ${step.reviewed_by})`}
          </li>
        ))}
      </ul>

      {approval.status === "pending" && (
        <div>
          <textarea
            placeholder="Reason (optional for approve, recommended for reject/revision)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div>
            <button disabled={submitting} onClick={() => handleAction("approve")}>
              Approve
            </button>
            <button disabled={submitting} onClick={() => handleAction("reject")}>
              Reject
            </button>
            <button disabled={submitting} onClick={() => handleAction("request_revision")}>
              Request Revision
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default ApprovalScreen;