// Owner: Pardha
// Location: frontend/src/utils/riskScore.js
// NOTE (BUSINESS RULE): Display-only estimate for live margin/risk feedback in QuotationBuilder.
// The backend blended discount risk score is authoritative — this must never gate approval decisions itself.
//
// This mirrors the "Understanding the Blended Discount Risk Score" example in the
// problem statement (section 10): each line is checked against its OWN discount
// ceiling (tier ceiling capped further by category ceiling), overages are summed
// across the whole order, and that blended total — not any single worst line —
// is what determines whether the quote needs review, and at what level.

// Default ceilings — these should ultimately come from A3 backend config
// (Discount Tier & Approval Chain Setup), not be hardcoded here. Kept as a
// fallback so the UI has something sensible to preview against before that
// config is wired up.
const DEFAULT_TIER_CEILINGS = {
  bronze: 5,
  silver: 10,
  gold: 15,
};

const DEFAULT_CATEGORY_CEILINGS = {
  hardware: 15,
  software: 15,
  services: 10,
};

// Thresholds for preview-only approval-level guidance. The backend's own
// thresholds are the ones that actually matter.
const MANAGER_THRESHOLD = 0; // any overage at all triggers manager review
const FINANCE_THRESHOLD = 10; // blended score above this also needs finance

/**
 * Returns the effective discount ceiling for a single line: the tier's
 * ceiling, further capped by that line's category ceiling if one exists
 * and is stricter.
 */
export function getLineCeiling(
  category,
  tier,
  { tierCeilings = DEFAULT_TIER_CEILINGS, categoryCeilings = DEFAULT_CATEGORY_CEILINGS } = {}
) {
  const tierCeiling = tierCeilings[String(tier).toLowerCase()] ?? 0;
  const categoryCeiling = categoryCeilings[String(category).toLowerCase()];

  if (categoryCeiling === undefined) return tierCeiling;
  return Math.min(tierCeiling, categoryCeiling);
}

/**
 * Returns how many points over its own ceiling a single line is (0 if within limit).
 */
export function getLineOverage(line, tier, config) {
  const ceiling = getLineCeiling(line.category, tier, config);
  const given = line.discount_percent ?? line.discount ?? 0;
  return Math.max(0, given - ceiling);
}

/**
 * Computes a blended risk score preview for an entire quotation: the sum of
 * every line's overage (points above its own ceiling), so several small
 * violations spread across lines add up instead of hiding behind one
 * "acceptable-looking" overall discount.
 *
 * @param {Array} lines - quotation lines, each with category + discount_percent
 * @param {string} tier - customer tier (bronze/silver/gold)
 * @returns {{ blendedScore: number, lineBreakdown: Array, requiresManager: boolean, requiresFinance: boolean }}
 */
export function estimateBlendedRiskScore(lines = [], tier, config) {
  const lineBreakdown = lines.map((line) => ({
    lineId: line.id,
    product: line.product_name,
    category: line.category,
    discountGiven: line.discount_percent ?? line.discount ?? 0,
    ceiling: getLineCeiling(line.category, tier, config),
    overage: getLineOverage(line, tier, config),
  }));

  const blendedScore = lineBreakdown.reduce((sum, l) => sum + l.overage, 0);

  return {
    blendedScore,
    lineBreakdown,
    requiresManager: blendedScore > MANAGER_THRESHOLD,
    requiresFinance: blendedScore > FINANCE_THRESHOLD,
  };
}

/**
 * Convenience classifier for coloring a risk score badge in the UI.
 */
export function riskBand(blendedScore) {
  if (blendedScore > FINANCE_THRESHOLD) return "high";
  if (blendedScore > MANAGER_THRESHOLD) return "medium";
  return "low";
}