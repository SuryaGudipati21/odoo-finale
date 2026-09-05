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

export const confirmQuotation = async (quotationId) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Quotation confirmed",
    data: {
      quotation_id: quotationId,
      status: "CONFIRMED",
    },
  };
};

// ========================================
// APPROVAL API (Pardha)
// ========================================

export const fetchApprovals = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockApprovals };
};

export const submitApprovalAction = async (approvalId, action, reason) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: `Approval ${action}`,
    data: { approval_id: approvalId, status: action, reason },
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

export const getQuotation = async (id) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[id];
  return { success: true, data: quotation || null };
};

export const addLineToQuotation = async (quotationId, line) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  if (quotation) quotation.lines.push(line);
  return { success: true, data: quotation };
};

export const applyDiscount = async (quotationId, lineId, percent) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  const line = quotation?.lines.find((l) => l.id === lineId);
  if (line) line.discount_percent = percent;
  return { success: true, data: quotation };
};

export const deleteLineFromQuotation = async (quotationId, lineId) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  const index = quotation?.lines.findIndex((l) => l.id === lineId) ?? -1;
  if (quotation && index > -1) quotation.lines.splice(index, 1);
  return { success: true, data: quotation };
};

export const submitQuotationForApproval = async (quotationId) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  if (quotation) quotation.status = "PENDING_APPROVAL";
  return {
    success: true,
    message: "Quotation submitted for approval",
    data: quotation,
  };
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