// Owner: Pardha — Approval Detail
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApprovalStatus } from "../hooks/useApprovalStatus";
import Layout from "../components/Layout";
import AuditTrail from "../components/AuditTrail";

const STEPS = ["Submitted", "Sales Manager", "Finance", "Confirmed"];

function ApprovalScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { approval, loading, submitting, submitDecision } = useApprovalStatus(id ?? 1);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  const displayRef = approval ? (String(approval.quotation_id).startsWith("Q-") ? approval.quotation_id : `Q-${approval.quotation_id}`) : "";

  const handleDecision = async (action) => {
    setActiveAction(action);
    setFeedback(null);
    try {
      const res = await submitDecision(action, reason);
      const actionName = action === "approve" ? "Approved" : action === "request_revision" ? "Returned for Revision" : "Rejected";
      setFeedback({
        type: "success",
        message: `Quotation ${displayRef} successfully ${actionName}! Pipeline and audit trails have been updated.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to submit approval decision.",
      });
    } finally {
      setActiveAction(null);
    }
  };

  if (loading || !approval) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading approval details...</p>
        </div>
      </Layout>
    );
  }

  const riskLabel = approval.blended_risk_score >= 15 ? "HIGH" : approval.blended_risk_score >= 8 ? "MEDIUM" : "LOW";
  const normStatus = (approval.status || "pending").toLowerCase();
  const currentStepIndex = normStatus !== "pending" ? 3 : (approval.level || "").toLowerCase() === "finance" ? 2 : 1;
  const isPending = normStatus === "pending";

  return (
    <Layout>
      {/* Back button breadcrumb */}
      <div className="mb-4">
        <Link
          to="/approvals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <span>←</span>
          <span>Back to Approvals Queue</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2 flex-wrap">
              <span>Approval Detail:</span>
              <Link
                to={`/quotations/builder/${approval.quotation_id}`}
                className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 inline-flex items-center gap-1.5 transition-colors font-mono"
                title="Click to view and edit this Quotation"
              >
                <span>{displayRef}</span>
                <span className="text-xs no-underline bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-semibold font-sans">
                  Open ↗
                </span>
              </Link>
              <span className="text-gray-500 font-medium text-lg sm:text-xl">
                ({approval.customer_name || approval.customer || "Acme Corp"})
              </span>
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                normStatus === "approved"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : normStatus === "rejected"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : normStatus === "revision_requested"
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
              }`}
            >
              {normStatus.toUpperCase().replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Review discount thresholds, blended margin risk metrics, and authorization chain
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/quotations/builder/${approval.quotation_id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all btn-press"
            title="Open Quotation in Builder"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View Full Quotation</span>
          </button>
          <span className={`px-3 py-1.5 font-semibold rounded-xl text-xs border ${
            approval.blended_risk_score >= 15
              ? "bg-red-50 text-red-700 border-red-200"
              : approval.blended_risk_score >= 8
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}>
            Blended Risk: {riskLabel} ({approval.blended_risk_score} pts)
          </span>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-xl text-xs">
            Customer Tier: {(approval.customer_tier || "gold").toUpperCase()}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between shadow-xs animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{feedback.type === "success" ? "✓" : "⚠"}</span>
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Flagged breakdown */}
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        Why This Quote Was Flagged
      </h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4 shadow-2xs">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="text-left px-5 py-3">Line Item</th>
              <th className="text-left px-5 py-3">Discount Given</th>
              <th className="text-left px-5 py-3">Limit Allowed</th>
              <th className="text-left px-5 py-3">Variance Over Limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {approval.lines && approval.lines.length > 0 ? (
              approval.lines.map((l, idx) => {
                const name = l.product_name || l.product || "Product";
                const cat = l.category || "Hardware";
                const disc = l.discount_percent ?? l.discount ?? 0;
                const limit = cat === "Services" || cat === "Service" ? 10 : 15;
                const variance = Math.max(0, disc - limit);
                return (
                  <tr key={l.id || idx}>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{name} ({cat})</td>
                    <td className="px-5 py-3.5 text-gray-600">{disc}%</td>
                    <td className="px-5 py-3.5 text-gray-600">{limit}%</td>
                    <td className="px-5 py-3.5">
                      {variance > 0 ? (
                        <span className="text-red-600 font-bold">{variance} pt OVER</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">0 pt - OK</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <>
                <tr>
                  <td className="px-5 py-3.5 font-medium text-gray-900">Laptop (Hardware)</td>
                  <td className="px-5 py-3.5 text-gray-600">12%</td>
                  <td className="px-5 py-3.5 text-gray-600">15%</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-semibold">0 pt - OK</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-medium text-gray-900">Setup Service (Services)</td>
                  <td className="px-5 py-3.5 text-gray-600">18%</td>
                  <td className="px-5 py-3.5 text-gray-600">10%</td>
                  <td className="px-5 py-3.5 text-red-600 font-bold">8 pt OVER</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900 mb-8 flex items-start gap-2.5">
        <span className="text-base mt-0.5">ℹ️</span>
        <span>
          Worst single line (8pt over) plus overall pattern across the order sets the blended score. One bad line is enough to require multi-tier manager and finance authorization.
        </span>
      </div>

      {/* Progress stepper */}
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        Workflow Authorization Pipeline
      </h2>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-2xs">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                    i <= currentStepIndex ? "bg-blue-600 shadow-xs shadow-blue-300" : "bg-gray-300"
                  }`}
                >
                  {i < currentStepIndex ? "✓" : i + 1}
                </div>
                <p className={`text-xs mt-2 font-medium whitespace-nowrap ${
                  i <= currentStepIndex ? "text-blue-700 font-semibold" : "text-gray-400"
                }`}>
                  {step}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-colors duration-300 ${
                    i < currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Decision Section */}
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        Review History & Audit Trail
      </h2>
      <div className="mb-6">
        <AuditTrail steps={approval.steps || []} title="Approval History" />
      </div>

      {isPending ? (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
            Submit Executive Decision
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Provide comments or rationale for the sales representative and customer audit trail:
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g. Approved due to strategic enterprise partnership; or please lower discount to 14% on Setup Service..."
            rows="3"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors mb-4"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={submitting}
              onClick={() => handleDecision("approve")}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs hover:shadow transition-all duration-150 btn-press"
            >
              {activeAction === "approve" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>✓</span>
              )}
              Approve Quotation
            </button>
            <button
              disabled={submitting}
              onClick={() => handleDecision("request_revision")}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs hover:shadow transition-all duration-150 btn-press"
            >
              {activeAction === "request_revision" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>↺</span>
              )}
              Return for Revision
            </button>
            <button
              disabled={submitting}
              onClick={() => handleDecision("reject")}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs hover:shadow transition-all duration-150 btn-press"
            >
              {activeAction === "reject" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>✕</span>
              )}
              Reject Quotation
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                normStatus === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : normStatus === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {normStatus === "approved" ? "✓" : normStatus === "rejected" ? "✕" : "↺"}
            </div>
            <div>
              <p className="font-bold text-gray-900">
                Decision Recorded: {normStatus.replace(/_/g, " ").toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                This quotation has concluded the approval review stage.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
          >
            ← Return to Approvals List
          </button>
        </div>
      )}
    </Layout>
  );
}

export default ApprovalScreen;