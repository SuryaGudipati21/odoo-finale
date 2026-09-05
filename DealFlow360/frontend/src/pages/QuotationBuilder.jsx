// Owner: Pardha — Quotation Detail / Builder (B3)
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuotation } from "../hooks/useQuotation";
import { useAuth } from "../context/AuthContext";
import { mockCustomer } from "../data/mockData";
import QuotationForm from "../components/QuotationForm";
import UpsellPanel from "../components/UpsellPanel";
import AuditTrail from "../components/AuditTrail";
import Layout from "../components/Layout";
import { formatCurrency, formatDateTime } from "../utils/formatting";
import { estimateBlendedRiskScore } from "../utils/riskScore";

function QuotationBuilder() {
  const { id } = useParams();
  const quotationId = id ?? 1;
  const { user } = useAuth();
  const actorName = user?.full_name || user?.email || "You";
  const { quotation, handleAddLine, handleApplyDiscount, handleDeleteLine, handleSubmit, handleSaveDraft } = useQuotation(quotationId, actorName);

  const riskPreview = useMemo(() => {
    if (!quotation) return null;
    return estimateBlendedRiskScore(quotation.lines, mockCustomer.tier);
  }, [quotation]);

  if (!quotation) {
    return (
      <Layout>
        <p className="text-gray-400 text-sm">Loading quotation...</p>
      </Layout>
    );
  }

  const lineStatus = (line) => {
    const over = riskPreview?.lineBreakdown.find((l) => l.lineId === line.id)?.overage ?? 0;
    return over > 0 ? `OVER (+${over}pt)` : "OK";
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Quotation Detail: Q-{quotation.id} ({mockCustomer.name})
      </h1>
      <p className="text-gray-500 text-sm mb-1">
        Opened by clicking a row on the Quotations list. Add products, apply discounts, review upsells.
      </p>
      <p className="text-gray-400 text-xs mb-6">
        Created by <span className="font-medium text-gray-600">{quotation.created_by || "Unknown user"}</span>
        {quotation.created_at && <> on {formatDateTime(quotation.created_at)}</>}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Customer</label>
          <input readOnly value={mockCustomer.name} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Price List</label>
          <input readOnly value={`${mockCustomer.tier.toUpperCase()} tier`} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Limit</th>
              <th className="text-left px-4 py-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotation.lines.map((line) => {
              const status = lineStatus(line);
              return (
                <tr key={line.id}>
                  <td className="px-4 py-3 text-gray-900 font-medium">{line.product_name}</td>
                  <td className="px-4 py-3 text-gray-600">{line.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(line.unit_price)}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0" max="100"
                      value={line.discount_percent}
                      onChange={(e) => handleApplyDiscount(line.id, Number(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                    />%
                  </td>
                  <td className="px-4 py-3 text-gray-500">—</td>
                  <td className="px-4 py-3">
                    <span className={status === "OK" ? "text-green-600 font-medium" : "text-red-600 font-semibold"}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeleteLine(line.id)} className="text-red-500 text-xs hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6">
        Discount is checked against each line's own limit live, as soon as it is entered, not only at submit time.
      </div>

      <h2 className="text-lg font-semibold text-blue-600 mb-3">Upsell and Cross-Sell Suggestions</h2>
      <UpsellPanel
        quotationId={quotation.id}
        onAddSuggestion={(s) =>
          handleAddLine({
            id: Date.now(), product_id: s.product_id, product_name: s.product_name,
            category: s.category, quantity: 1, unit_price: s.unit_price,
            discount_percent: 0, line_total: s.unit_price,
          })
        }
      />

      <div className="mt-6">
        <QuotationForm onAddLine={handleAddLine} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-blue-600 mb-3">Who Did What</h2>
        <AuditTrail entries={quotation.activity || []} title="Quotation Activity" />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSaveDraft}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSubmit(riskPreview?.blendedScore > 0)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-150"
        >
          {riskPreview?.blendedScore > 0 ? "Submit for Approval" : "Confirm Quotation"}
        </button>
      </div>
      {quotation.status !== "DRAFT" && (
        <p className="text-sm text-gray-500 mt-3">
          Current status: <span className="font-semibold text-gray-700">{quotation.status.replace(/_/g, " ")}</span>
        </p>
      )}
    </Layout>
  );
}

export default QuotationBuilder;