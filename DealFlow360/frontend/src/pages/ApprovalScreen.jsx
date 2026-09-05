// Owner: Pardha — Approval Detail
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useApprovalStatus } from "../hooks/useApprovalStatus";
import Layout from "../components/Layout";

const STEPS = ["Submitted", "Sales Manager", "Finance", "Confirmed"];

function ApprovalScreen() {
  const { id } = useParams();
  const { approval, loading, submitting, submitDecision } = useApprovalStatus(id ?? 1);
  const [reason, setReason] = useState("");

  if (loading || !approval) {
    return <Layout><p className="text-gray-400 text-sm">Loading approval...</p></Layout>;
  }

  const riskLabel = approval.blended_risk_score >= 15 ? "HIGH" : approval.blended_risk_score >= 8 ? "MEDIUM" : "LOW";
  const currentStepIndex = approval.level === "finance" ? 2 : 1;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Approval Detail: Q-{approval.quotation_id} (Acme Corp)</h1>
      <p className="text-gray-500 text-sm mb-6">Opened by clicking a row on the Approvals list</p>

      <div className="flex gap-3 mb-6">
        <span className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg text-sm">
          Blended Risk: {riskLabel}
        </span>
        <span className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg text-sm">
          Customer Tier: Gold
        </span>
      </div>

      <h2 className="text-lg font-semibold text-blue-600 mb-3">Why This Quote Was Flagged</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Line</th>
              <th className="text-left px-4 py-3">Discount Given</th>
              <th className="text-left px-4 py-3">Limit Allowed</th>
              <th className="text-left px-4 py-3">Over By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-3">Laptop (Hardware)</td>
              <td className="px-4 py-3">12%</td>
              <td className="px-4 py-3">15%</td>
              <td className="px-4 py-3 text-green-600">0 pt - OK</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Setup Service (Services)</td>
              <td className="px-4 py-3">18%</td>
              <td className="px-4 py-3">10%</td>
              <td className="px-4 py-3 text-red-600 font-semibold">8 pt OVER</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6">
        Worst single line (8pt over) plus overall pattern across the order sets the blended score. One bad line is enough to require approval.
      </div>

      <div className="flex items-center justify-between mb-8 max-w-xl">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full ${i <= currentStepIndex ? "bg-blue-600" : "bg-gray-300"}`} />
              <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{step}</p>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(approval.steps || []).map((s, i) => (
              <tr key={i}>
                <td className="px-4 py-3">{s.reviewed_by || "—"}</td>
                <td className="px-4 py-3 capitalize">{s.status}</td>
                <td className="px-4 py-3 text-gray-500">—</td>
                <td className="px-4 py-3 text-gray-500">{s.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {approval.status === "pending" && (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for decision..."
            rows="2"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4"
          />
          <div className="flex gap-3">
            <button
              disabled={submitting}
              onClick={() => submitDecision("approve", reason)}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-150"
            >
              Approve
            </button>
            <button
              disabled={submitting}
              onClick={() => submitDecision("request_revision", reason)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors duration-150"
            >
              Return for Revision
            </button>
            <button
              disabled={submitting}
              onClick={() => submitDecision("reject", reason)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-150"
            >
              Reject
            </button>
          </div>
        </>
      )}
    </Layout>
  );
}

export default ApprovalScreen;