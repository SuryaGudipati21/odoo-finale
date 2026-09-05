// Owner: Pardha — live margin display helper (estimate only, backend confirms final margin)
// Location: frontend/src/utils/margin.js
//
// NOTE (BUSINESS RULE): This gives the rep instant feedback while building a
// quote (e.g. after accepting an upsell suggestion, per B5). It is a client-side
// ESTIMATE only. The backend recalculates and confirms the authoritative margin
// on save/submit — never treat this file's output as the number that gets stored
// or reported on.

/**
 * Estimates a product's per-unit cost from its list price and list margin.
 * Assumes `product.margin` is the absolute margin per unit at full list price
 * (matches the shape of mockData.mockProducts, e.g. price 2000 / margin 1200
 * implies an estimated unit cost of 800).
 */
export function estimateUnitCost(product) {
  if (!product) return 0;
  const cost = (product.price ?? 0) - (product.margin ?? 0);
  return cost < 0 ? 0 : cost;
}

/**
 * Estimates the margin contributed by a single quotation line, accounting for
 * the discount actually applied on that line (discount eats into margin
 * dollar-for-dollar since cost is assumed fixed).
 *
 * @param {object} line - { quantity, unit_price, discount_percent }
 * @param {object} product - matching product record with a `margin` field
 */
export function estimateLineMargin(line, product) {
  if (!line) return 0;
  const unitPrice = line.unit_price ?? product?.price ?? 0;
  const discountPercent = line.discount_percent ?? 0;
  const quantity = line.quantity ?? 0;

  const cost = product ? estimateUnitCost(product) : 0;
  const effectiveUnitPrice = unitPrice * (1 - discountPercent / 100);

  return Math.round((effectiveUnitPrice - cost) * quantity);
}

/**
 * Estimates total margin across all lines in a quotation.
 *
 * @param {Array} lines - quotation lines
 * @param {Array} products - product catalog to look up cost basis by product_id
 */
export function estimateOrderMargin(lines = [], products = []) {
  return lines.reduce((total, line) => {
    const product = products.find((p) => p.id === line.product_id);
    return total + estimateLineMargin(line, product);
  }, 0);
}

/**
 * Estimates margin as a percentage of revenue for a single line.
 * Returns 0 if revenue is 0 to avoid NaN/Infinity in the UI.
 */
export function estimateMarginPercent(line, product) {
  const unitPrice = line?.unit_price ?? product?.price ?? 0;
  const discountPercent = line?.discount_percent ?? 0;
  const quantity = line?.quantity ?? 0;
  const revenue = unitPrice * (1 - discountPercent / 100) * quantity;

  if (revenue <= 0) return 0;

  const margin = estimateLineMargin(line, product);
  return Math.round((margin / revenue) * 1000) / 10; // one decimal place
}

/**
 * Classifies a margin percentage into a UI-friendly health band, for
 * color-coding margin indicators in the Quotation Builder (green/amber/red).
 */
export function marginHealthBand(marginPercent) {
  if (marginPercent >= 30) return "healthy";
  if (marginPercent >= 15) return "watch";
  return "thin";
}