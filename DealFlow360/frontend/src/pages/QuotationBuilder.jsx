// Owner: Pardha — Quotation Builder screen (products + cart), B3
// Location: frontend/src/pages/QuotationBuilder.jsx

import { useMemo } from "react";
import { useQuotation } from "../hooks/useQuotation";
import { mockCustomer } from "../data/mockData";
import QuotationForm from "../components/QuotationForm";
import UpsellPanel from "../components/UpsellPanel";
import { formatCurrency } from "../utils/formatting";
import { estimateBlendedRiskScore, riskBand } from "../utils/riskScore";

const RISK_STYLES = {
  low: "bg-green-500/10 border-green-500/30 text-green-300",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  high: "bg-red-500/10 border-red-500/30 text-red-300",
};

function QuotationBuilder() {
  const { id } = useParams();
  const quotationId = id ?? 1; // matches route "/quotations/builder/:id?" default
  const { quotation, handleAddLine, handleApplyDiscount, handleDeleteLine } =
    useQuotation(quotationId);
    
  const riskPreview = useMemo(() => {
    if (!quotation) return null;
    return estimateBlendedRiskScore(quotation.lines, mockCustomer.tier);
  }, [quotation]);

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading quotation...</p>
        </div>
      </div>
    );
  }

  const orderTotal = quotation.lines.reduce(
    (sum, line) => sum + line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100),
    0
  );

  const band = riskPreview ? riskBand(riskPreview.blendedScore) : "low";

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-400/5 border border-blue-500/20 rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
          Quotation #{quotation.id}
        </h1>
        <p className="text-gray-400 text-sm">
          {mockCustomer.name} · {mockCustomer.tier.toUpperCase()} tier · Status:{" "}
          <span className="text-blue-300 font-semibold">{quotation.status}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: line items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Order Lines
            </h2>

            {quotation.lines.map((line) => (
              <div
                key={line.id}
                className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center"
              >
                <div className="sm:col-span-2">
                  <p className="text-white font-semibold">{line.product_name}</p>
                  <p className="text-xs text-gray-400">{line.category}</p>
                </div>
                <p className="text-gray-300 text-sm">
                  {line.quantity} × {formatCurrency(line.unit_price)}
                </p>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={line.discount_percent}
                    onChange={(e) => handleApplyDiscount(line.id, Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg text-sm focus:border-blue-500/50 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400 ml-1">%</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-green-300 font-bold">
                    {formatCurrency(
                      line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100)
                    )}
                  </span>
                  <button
                    onClick={() => handleDeleteLine(line.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <QuotationForm onAddLine={handleAddLine} />
        </div>

        {/* Sidebar: totals, risk preview, upsell */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/30 rounded-xl p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Order Total</p>
            <p className="text-4xl font-bold text-white mb-1">{formatCurrency(orderTotal)}</p>
            <p className="text-xs text-gray-400">Est. margin: {formatCurrency(quotation.margin)}</p>
          </div>

          {riskPreview && (
            <div className={`rounded-xl p-4 border ${RISK_STYLES[band]}`}>
              <p className="text-sm font-semibold mb-1">
                {riskPreview.blendedScore > 0 ? "⚠️ Approval likely needed" : "✓ Within discount limits"}
              </p>
              <p className="text-xs opacity-80">
                {riskPreview.blendedScore > 0
                  ? `Est. ${riskPreview.blendedScore} pts over line-level discount ceilings.`
                  : "All lines are within their tier/category ceilings."}
              </p>
              <p className="text-[10px] text-gray-400 mt-2 italic">
                Preview only — backend risk score is authoritative.
              </p>
            </div>
          )}

          <UpsellPanel
            quotationId={quotation.id}
            onAddSuggestion={(s) =>
              handleAddLine({
                id: Date.now(),
                product_id: s.product_id,
                product_name: s.product_name,
                category: s.category,
                quantity: 1,
                unit_price: s.unit_price,
                discount_percent: 0,
                line_total: s.unit_price,
              })
            }
          />

          <button className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg transition-all duration-200">
            {riskPreview?.blendedScore > 0 ? "Submit for Approval" : "Confirm Quotation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuotationBuilder;