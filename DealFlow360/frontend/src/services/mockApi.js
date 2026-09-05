// Owner: Shared — fallback fake responses matching the same shape as api.js, for UI dev before backend endpoints exist.
import { mockQuotation } from "../data/mockData";

// Later: replace body with real fetch("/api/quotations/" + id)
export async function getQuotation(id) {
  return Promise.resolve(mockQuotation);
}

// Later: real backend recalculates margin/risk on the server
export async function addLine(quotationId, newLine) {
  mockQuotation.lines.push(newLine);
  return Promise.resolve(mockQuotation);
}

export async function applyDiscount(quotationId, lineId, discountPercent) {
  const line = mockQuotation.lines.find(l => l.id === lineId);
  if (line) line.discount_percent = discountPercent;
  return Promise.resolve(mockQuotation);
}