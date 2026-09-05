// Owner: Pardha
// Location: frontend/src/services/discountCalculator.js
// NOTE (BUSINESS RULE): This is a client-side PREVIEW ONLY, for instant UI feedback while typing a discount.
// The backend's discount risk score service is the sole authority on whether approval is required.
// Never treat this file's output as final — always re-check against the backend response before showing "approved".

import { estimateBlendedRiskScore, riskBand } from "../utils/riskScore";

/**
 * Given a quotation's current lines plus a proposed edit to one line's
 * discount, returns an instant preview of what the blended risk score
 * WOULD become — without waiting on a backend round-trip. Used to show
 * a live "this will likely need approval" hint as the rep types.
 *
 * @param {Array} lines - current quotation lines
 * @param {string|number} lineId - id of the line being edited
 * @param {number} proposedDiscountPercent - the discount the rep just typed
 * @param {string} tier - customer tier
 */
export function previewDiscountChange(lines, lineId, proposedDiscountPercent, tier) {
  const updatedLines = lines.map((line) =>
    line.id === lineId
      ? { ...line, discount_percent: proposedDiscountPercent }
      : line
  );

  const result = estimateBlendedRiskScore(updatedLines, tier);

  return {
    ...result,
    band: riskBand(result.blendedScore),
    // Human-readable one-liner for a tooltip/banner in QuotationBuilder
    message: buildPreviewMessage(result),
  };
}

/**
 * Preview for adding a brand-new line (e.g. an upsell suggestion) to see its
 * effect on the blended score before it's actually added.
 */
export function previewNewLine(lines, newLine, tier) {
  const result = estimateBlendedRiskScore([...lines, newLine], tier);
  return {
    ...result,
    band: riskBand(result.blendedScore),
    message: buildPreviewMessage(result),
  };
}

function buildPreviewMessage({ blendedScore, requiresManager, requiresFinance }) {
  if (blendedScore <= 0) {
    return "Within approved discount limits — no review needed.";
  }
  if (requiresFinance) {
    return `Likely to require Sales Manager + Finance approval (est. ${blendedScore} pts over limit).`;
  }
  if (requiresManager) {
    return `Likely to require Sales Manager approval (est. ${blendedScore} pts over limit).`;
  }
  return "Within approved discount limits — no review needed.";
}

/**
 * Convenience: is this single discount value, on its own, already above what
 * ANY tier/category combination would allow? Used for a hard client-side
 * sanity cap (e.g. blocking absurd typos like "500%") independent of the
 * blended-score preview above.
 */
export function isDiscountValueSane(percent) {
  const num = Number(percent);
  return Number.isFinite(num) && num >= 0 && num <= 100;
}