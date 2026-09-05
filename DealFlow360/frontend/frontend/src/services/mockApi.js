// Owner: Shared — fallback fake responses matching the same shape as api.js, for UI dev before backend endpoints exist.
// Mock API service - matches backend API contracts
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

export const applyDiscount = async (quotationId, lineId, discountPercent) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      line_id: lineId,
      discount_percent: discountPercent,
      updated_at: new Date().toISOString()
    }
  };
};

export const updateLineQuantity = async (quotationId, lineId, quantity) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      line_id: lineId,
      quantity: quantity,
      updated_at: new Date().toISOString()
    }
  };
};

export const calculateMargin = async (quotationId) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      quotation_id: quotationId,
      margin_percent: 35,
      margin_amount: 5000
    }
  };
};

export const calculateRiskScore = async (quotationId) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      quotation_id: quotationId,
      blended_risk_score: 45,
      needs_approval: true,
      approval_level: "manager_finance"
    }
  };
};

export const applyLineDiscount = async (quotationId, lineId, discountPercent) => {
  await delay(API_DELAY);
  return {
    success: true,
    data: {
      line_id: lineId,
      discount_percent: discountPercent,
      line_total: 1800
    }
  };
};

export const submitQuotationForApproval = async (quotationId) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Quotation submitted for approval",
    data: {
      quotation_id: quotationId,
      status: "PENDING_APPROVAL"
    }
  };
};

// ========================================
// WAREHOUSE SPLIT API
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
// BILLING SCHEDULE API
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
// DEAL HEALTH API
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
// SUBSCRIPTIONS API
// ========================================

export const fetchSubscriptions = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockSubscriptions?.list || [] };
};

// ========================================
// CUSTOMER NEGOTIATION API
// ========================================

export const submitNegotiation = async (quotationId, negotiation) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: "Negotiation request submitted",
    data: {
      quotation_id: quotationId,
      status: "NEGOTIATION",
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
// APPROVAL API
// ========================================

export const fetchApprovals = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockApprovals || [] };
};

export const submitApprovalAction = async (approvalId, action, reason) => {
  await delay(API_DELAY);
  return {
    success: true,
    message: `Approval ${action}`,
    data: { approval_id: approvalId, status: action, reason },
  };
};

// ========================================
// PRODUCTS API
// ========================================

export const fetchProducts = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockProducts || [] };
};

export const fetchProductDetails = async (productId) => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockProducts?.[productId] };
};