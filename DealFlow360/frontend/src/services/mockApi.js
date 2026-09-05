// Owner: Shared — fallback fake responses matching the same shape as api.js, for UI dev before backend endpoints exist.
// Mock API service - matches backend API contracts
// Replace these with real API calls when backend is ready

import * as mockData from "../data/mockData.js";

const API_DELAY = 300; // Simulate network latency (ms)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Warehouse Split API
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

// Billing Schedule API
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

// Deal Health API
export const fetchDealHealth = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockDealHealth };
};

export const fetchAnomalies = async () => {
  await delay(API_DELAY);
  return {
    success: true,
    data: mockData.mockDealHealth.anomalies,
  };
};

export const fetchStalledDeals = async () => {
  await delay(API_DELAY);
  return {
    success: true,
    data: mockData.mockDealHealth.stalled_deals,
  };
};

// Subscriptions API
export const fetchSubscriptions = async () => {
  await delay(API_DELAY);
  return { success: true, data: mockData.mockSubscriptions.list };
};

// Customer Negotiation API
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

export const fetchQuotationDetail = async (quotationId) => {
  await delay(API_DELAY);
  const data = mockData.mockQuotations[quotationId];
  if (!data) throw new Error("Quotation not found");
  return { success: true, data };
};