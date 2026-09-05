// Owner: Shared — Mock API service matching backend API contracts
// Location: frontend/src/services/mockApi.js
// Replace these with real API calls when backend is ready

import * as mockData from "../data/mockData.js";

const API_DELAY = 300; // Simulate network latency (ms)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ========================================
// QUOTATION API
// ========================================

export const createQuotation = async (customerId, lines) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      id: `Q-${Date.now()}`,
      customer_id: customerId,
      status: "DRAFT",
      lines: lines,
      total: lines.reduce((sum, line) => sum + (line.unit_price * line.quantity), 0),
      discount: 0,
      margin: 0
    }
  };
};

export const addLine = async (quotationId, product) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      line_id: `L-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      discount_percent: 0,
      total: product.price
    }
  };
};

export const updateLine = async (quotationId, lineId, updates) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: { line_id: lineId, ...updates }
  };
};

export const deleteLine = async (quotationId, lineId) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Line deleted"
  };
};

export const fetchQuotation = async (quotationId) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: mockData.mockQuotations[quotationId] || { error: "Not found" }
  };
};

export const fetchQuotationDetail = async (quotationId) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotations[quotationId];
  return {
    success: true,
    data: quotation || { error: "Not found" }
  };
};

// ========================================
// WAREHOUSE SPLIT API (Sanjay)
// ========================================

export const fetchWarehouseSplit = async (quotationId) => {
  await delay(API_DELAY);
  const data = mockData.mockWarehouses[quotationId];
  if (!data) throw new Error("Quotation not found");
  return { success: true, data };
};

export const confirmWarehouseSplit = async (quotationId, splits) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Warehouse split confirmed",
    data: { quotation_id: quotationId, status: "FULFILLMENT" },
  };
};

// ========================================
// BILLING SCHEDULE API (Sanjay)
// ========================================

export const fetchBillingSchedule = async (quotationId) => {
  await delay(API_DELAY);
  const data = mockData.mockBillingSchedule[quotationId];
  if (!data) throw new Error("Billing schedule not found");
  return { success: true, data };
};

export const updateSubscription = async (quotationId, updates) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Subscription updated",
    data: { quotation_id: quotationId, ...updates },
  };
};

// ========================================
// DEAL HEALTH API (Sanjay)
// ========================================

export const fetchDealHealth = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockDealHealth };
};

export const fetchAnomalies = async () => {
  await delay(API_DELAY);
  return {
    success: true,
    data: mockData.mockDealHealth?.anomalies || [],
  };
};

export const fetchStalledDeals = async () => {
  await delay(API_DELAY);
  return {
    success: true,
    data: mockData.mockDealHealth?.stalled_deals || [],
  };
};

// ========================================
// SUBSCRIPTIONS API (Sanjay)
// ========================================

export const fetchSubscriptions = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockSubscriptions?.list || [] };
};

// ========================================
// CUSTOMER NEGOTIATION API (Sanjay)
// ========================================

export const submitNegotiation = async (quotationId, negotiation) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Negotiation request submitted",
    data: {
      quotation_id: quotationId,
      status: "NEGOTIATION",
      submitted_at: new Date().toISOString(),
      ...negotiation,
    },
  };
};

export const confirmQuotation = async (quotationId, actorName) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  if (quotation) {
    quotation.status = "CONFIRMED";
    logActivity(quotation, { action: "Confirmed quotation", user: actorName || "Unknown user" });
  }
  return {
    success: true,
    message: "Quotation confirmed",
    data: quotation,
  };
};

// ========================================
// APPROVAL API (Pardha)
// ========================================

export const fetchApprovals = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockApprovals };
};

const APPROVAL_ACTION_MAP = {
  approve: "approved",
  reject: "rejected",
  request_revision: "revision_requested",
};

export const submitApprovalAction = async (approvalId, action, reason) => {
  await delay(API_DELAY);

  const status = APPROVAL_ACTION_MAP[action];
  if (!status) throw new Error(`Unknown approval action: ${action}`);

  const approval = mockData.mockApproval;
  if (!approval) throw new Error("Approval not found");

  const stepIndex = (approval.steps || []).findIndex((s) => s.level === approval.level);
  if (stepIndex !== -1) {
    approval.steps[stepIndex] = {
      ...approval.steps[stepIndex],
      status,
      reviewed_by: approval.steps[stepIndex].reviewed_by || "You",
      reason: reason || null,
    };
  }

  if (status === "approved" && approval.level === "manager") {
    approval.level = "finance";   // advance to next level
    approval.status = "pending";
  } else {
    approval.status = status;     // finance approval, reject, or revision = final
  }

  const quotation = mockData.mockQuotationsStore[approval.quotation_id];
  if (quotation) {
    if (status === "rejected" || status === "revision_requested") {
      quotation.status = "DRAFT";
    } else if (status === "approved" && approval.status === "approved") {
      quotation.status = "APPROVED";
    }
  }

  return {
    success: true,
    message: `Approval ${status}`,
    data: { approval_id: approvalId, status: approval.status, reason },
  };
};

export const fetchApprovalDetail = async (approvalId) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: mockData.mockApproval || { error: "Not found" }
  };
};

// ========================================
// PRODUCTS API (Pardha)
// ========================================

export const fetchProducts = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockProducts || [] };
};

export const fetchProductDetails = async (productId) => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockProducts?.[productId] };
};

// ========================================
// UPSELL SUGGESTIONS API (Pardha)
// ========================================

export const fetchUpsellSuggestions = async (quotationId) => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockUpsellSuggestions };
};

export const addUpsellToQuotation = async (quotationId, productId) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Upsell added to quotation",
    data: { quotation_id: quotationId, product_id: productId }
  };
};

// ========================================
// QUOTATION BUILDER API (Pardha)
// ========================================

export const getQuotation = async (id, actorName) => {
  await delay(API_DELAY);
  let quotation = mockData.mockQuotationsStore[id];

  // "new" (from the "+ New Quotation" button) never exists in the store yet —
  // create a fresh draft on first request instead of returning null forever.
  if (!quotation && id === "new") {
    const now = new Date().toISOString();
    const createdBy = actorName || "Unknown user";
    quotation = {
      id: `Q-${Date.now()}`,
      customer_id: mockData.mockCustomer.id,
      customer: mockData.mockCustomer.name,
      status: "DRAFT",
      lines: [],
      margin: 0,
      risk_score: 0,
      created_by: createdBy,
      created_at: now,
      activity: [{ action: "Created quotation", user: createdBy, timestamp: now, status: "done" }],
    };
    mockData.mockQuotationsStore[id] = quotation;
  }

  return { success: true, data: quotation || null };
};

const logActivity = (quotation, entry) => {
  if (!quotation) return;
  if (!Array.isArray(quotation.activity)) quotation.activity = [];
  quotation.activity.push({ timestamp: new Date().toISOString(), status: "done", ...entry });
};

export const addLineToQuotation = async (quotationId, line, actorName) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  if (quotation) {
    quotation.lines.push(line);
    logActivity(quotation, {
      action: "Added line",
      user: actorName || "Unknown user",
      reason: `${line.product_name} × ${line.quantity}`,
    });
  }
  return { success: true, data: quotation };
};

export const applyDiscount = async (quotationId, lineId, percent, actorName) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  const line = quotation?.lines.find((l) => l.id === lineId);
  if (line) {
    line.discount_percent = percent;
    logActivity(quotation, {
      action: "Applied discount",
      user: actorName || "Unknown user",
      reason: `${percent}% on ${line.product_name}`,
    });
  }
  return { success: true, data: quotation };
};

export const deleteLineFromQuotation = async (quotationId, lineId, actorName) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  const index = quotation?.lines.findIndex((l) => l.id === lineId) ?? -1;
  if (quotation && index > -1) {
    const [removed] = quotation.lines.splice(index, 1);
    logActivity(quotation, {
      action: "Removed line",
      user: actorName || "Unknown user",
      reason: removed?.product_name,
    });
  }
  return { success: true, data: quotation };
};

export const submitQuotationForApproval = async (quotationId, actorName) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  if (quotation) {
    quotation.status = "PENDING_APPROVAL";
    logActivity(quotation, { action: "Submitted for approval", user: actorName || "Unknown user" });
  }
  return {
    success: true,
    message: "Quotation submitted for approval",
    data: quotation,
  };
};

export const saveQuotationDraft = async (quotationId, actorName) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  if (quotation) {
    logActivity(quotation, { action: "Saved draft", user: actorName || "Unknown user" });
  }
  return { success: true, message: "Draft saved", data: quotation };
};

// Lists every quotation for SalesWorkspace's pipeline view
export const listQuotations = async () => {
  await delay(API_DELAY);
  return { success: true, data: Object.values(mockData.mockQuotationsStore) };
};

// ========================================
// AUTHENTICATION API (Shared)
// ========================================

export const login = async (email, password, role = "sales_rep") => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      access_token: `token-${Date.now()}`,
      user: { id: 1, email, role, full_name: email.split("@")[0] },
    },
  };
};

export const signup = async (email, password, fullName, role = "sales_rep") => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      access_token: `token-${Date.now()}`,
      user: { id: Date.now(), email, role, full_name: fullName || email.split("@")[0] },
    },
  };
};

export const logout = async () => {
  await delay(API_DELAY);
  return { success: true, message: "Logged out" };
};

export const portalLogin = async (email) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      token: `portal-token-${Date.now()}`,
      user: { id: 1, email, role: "customer" }
    }
  };
};

// ========================================
// UTILITY FUNCTION
// ========================================

export const handleApiError = (error) => {
  console.error("API Error:", error);
  return {
    success: false,
    error: error.message || "An error occurred"
  };
};
export const fetchBillingDetail = async (id) => {
  await delay(API_DELAY);
  const detail = mockData.mockBillingDetails?.[id];
  if (!detail) throw new Error("Subscription not found");
  return { success: true, data: detail };
};

export const modifySubscription = async (id, updates) => {
  await delay(API_DELAY);
  const recurring = mockData.mockBillingDetails?.[id]?.recurring_lines || [];
  const line = recurring.find((r) => r.id === Number(id));
  if (line) Object.assign(line, updates);
  return { success: true, message: "Subscription modified", data: line };
};

export const cancelSubscription = async (id) => {
  await delay(API_DELAY);
  const listEntry = (mockData.mockSubscriptions?.list || []).find((s) => s.id === Number(id));
  if (listEntry) listEntry.status = "CANCELLED";
  const recurring = mockData.mockBillingDetails?.[id]?.recurring_lines || [];
  const line = recurring.find((r) => r.id === Number(id));
  if (line) line.status = "CANCELLED";
  return { success: true, message: "Subscription cancelled", data: { id, status: "CANCELLED" } };
};