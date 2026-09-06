// Owner: Shared — Mock API service matching backend API contracts
// Location: frontend/src/services/mockApi.js
// Replace these with real API calls when backend is ready

import * as mockData from "../data/mockData.js";
import { estimateBlendedRiskScore } from "../utils/riskScore.js";

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

export const createSubscriptionPlan = async (data) => {
  await delay(API_DELAY);
  const list = mockData.mockSubscriptions?.list || [];
  const idNum = list.length + 1;
  const newSub = {
    id: `SUB-${String(idNum).padStart(3, "0")}`,
    customer: data.customer_name || data.customer || "Acme Corp",
    plan: data.plan_name || data.plan || "Standard Plan",
    cycle: data.cycle || "Monthly",
    next_billing: data.next_bill_date || "Oct 15",
    amount_monthly: Number(data.amount) || Number(data.amount_monthly) || 500,
    status: data.status || "Active",
  };
  list.unshift(newSub);
  return { success: true, message: "Subscription plan created", data: newSub };
};

// ========================================
// CUSTOMER NEGOTIATION API (Sanjay)
// ========================================

export const submitNegotiation = async (quotationId, negotiation) => {
  await delay(API_DELAY);
  const quotation = mockData.mockQuotationsStore[quotationId];
  if (quotation) {
    quotation.status = "NEGOTIATION";
    if (negotiation.counter_discount !== undefined && negotiation.counter_discount !== "") {
      const discountVal = Number(negotiation.counter_discount);
      quotation.discount_given = discountVal;
      if (Array.isArray(quotation.lines)) {
        quotation.lines.forEach((l) => {
          l.discount_percent = discountVal;
          l.discount = discountVal;
          const unitPrice = l.unit_price ?? l.price ?? 0;
          l.line_total = Math.round(unitPrice * l.quantity * (1 - discountVal / 100));
        });
      }
    }
    logActivity(quotation, {
      action: "Customer negotiation requested",
      user: "Customer",
      reason: negotiation.counter_discount_reason || negotiation.special_requests || "Requested counter terms",
    });
  }
  return {
    success: true,
    message: "Negotiation request submitted",
    data: quotation || {
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
    const risk = estimateBlendedRiskScore(quotation.lines || [], "gold");
    quotation.risk_score = risk.blendedScore;

    if (risk.requiresManager) {
      quotation.status = "REAPPROVAL_REQUIRED";
      logActivity(quotation, {
        action: "Re-approval required",
        user: actorName || "Customer",
        reason: `Counter terms exceed threshold (Risk Score: ${risk.blendedScore}). Automatically routed for manager/finance re-approval.`,
      });
      // Add or update approval record
      const existingApproval = mockData.mockApprovals.find((a) => a.quotation_id === quotation.id);
      if (existingApproval) {
        existingApproval.status = "pending";
        existingApproval.blended_risk_score = risk.blendedScore;
        existingApproval.level = risk.requiresFinance ? "finance" : "manager";
      } else {
        mockData.mockApprovals.push({
          id: Date.now(),
          quotation_id: quotation.id,
          level: risk.requiresFinance ? "finance" : "manager",
          status: "pending",
          blended_risk_score: risk.blendedScore,
          customer_name: quotation.customer || "Acme Corp",
          steps: [
            { level: "manager", status: "pending", reviewed_by: null, reason: null },
            ...(risk.requiresFinance ? [{ level: "finance", status: "pending", reviewed_by: null, reason: null }] : []),
          ],
        });
      }
    } else {
      quotation.status = "CONFIRMED";
      logActivity(quotation, { action: "Confirmed quotation", user: actorName || "Customer" });
    }
  }
  return {
    success: true,
    message: quotation?.status === "REAPPROVAL_REQUIRED" ? "Re-approval required" : "Quotation confirmed",
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

export const submitApprovalAction = async (approvalId, action, reason) => {
  await delay(API_DELAY);

  const statusMap = {
    approve: "approved",
    request_revision: "revision_requested",
    reject: "rejected",
  };
  const targetStatus = statusMap[action] || action;
  const targetStr = String(approvalId);
  const cleanId = targetStr.replace(/^Q-/, "");

  // Locate the approval record in mockApprovals or mockApproval
  let approval = mockData.mockApprovals?.find(
    (a) =>
      String(a.id) === targetStr ||
      String(a.quotation_id) === targetStr ||
      String(a.id) === cleanId ||
      String(a.quotation_id) === cleanId ||
      String(a.quotation_id).replace(/^Q-/, "") === cleanId
  );
  if (!approval && mockData.mockApproval) {
    approval = mockData.mockApproval;
  }

  if (approval) {
    approval.status = targetStatus;
    if (!Array.isArray(approval.steps)) {
      approval.steps = [];
    }

    // Find pending step or update/create
    const pendingStep = approval.steps.find((s) => s.status === "pending") || approval.steps[approval.steps.length - 1];
    if (pendingStep) {
      pendingStep.status = targetStatus;
      pendingStep.reviewed_by = pendingStep.level === "finance" ? "Finance Director" : "Sales Manager";
      pendingStep.reason = reason || (action === "approve" ? "Approved per review policy" : "Action submitted");
    } else {
      approval.steps.push({
        level: approval.level || "manager",
        status: targetStatus,
        reviewed_by: "Sales Manager",
        reason: reason || "Processed",
      });
    }

    if (mockData.mockApproval && (String(mockData.mockApproval.id) === String(approval.id) || String(mockData.mockApproval.quotation_id) === String(approval.quotation_id))) {
      mockData.mockApproval.status = targetStatus;
      mockData.mockApproval.steps = [...approval.steps];
    }

    // Sync quotation in store
    const qId = approval.quotation_id;
    const q =
      mockData.mockQuotationsStore?.[qId] ||
      mockData.mockQuotationsStore?.[cleanId] ||
      mockData.mockQuotationsStore?.[`Q-${cleanId}`];
    if (q) {
      if (targetStatus === "approved") {
        q.status = "APPROVED";
      } else if (targetStatus === "revision_requested") {
        q.status = "DRAFT";
      } else if (targetStatus === "rejected") {
        q.status = "REJECTED";
      }
      logActivity(q, {
        action: `Approval decision: ${targetStatus.toUpperCase()}`,
        user: pendingStep?.reviewed_by || "Reviewer",
        details: reason || `Quotation marked as ${targetStatus}`,
      });
    }
  }

  return {
    success: true,
    message: `Approval successfully updated to ${targetStatus}`,
    data: approval || { approval_id: approvalId, status: targetStatus, reason },
  };
};

export const fetchApprovalDetail = async (approvalId) => {
  await delay(API_DELAY);
  const targetStr = String(approvalId);
  const cleanId = targetStr.replace(/^Q-/, "");

  let found = mockData.mockApprovals?.find(
    (a) =>
      String(a.id) === targetStr ||
      String(a.quotation_id) === targetStr ||
      String(a.id) === cleanId ||
      String(a.quotation_id) === cleanId ||
      String(a.quotation_id).replace(/^Q-/, "") === cleanId
  );

  if (!found) {
    const q =
      mockData.mockQuotationsStore?.[approvalId] ||
      mockData.mockQuotationsStore?.[cleanId] ||
      mockData.mockQuotationsStore?.[`Q-${cleanId}`] ||
      Object.values(mockData.mockQuotationsStore || {}).find(
        (item) => String(item.id) === targetStr || String(item.id) === cleanId || String(item.id).replace(/^Q-/, "") === cleanId
      );

    if (q) {
      found = {
        id: approvalId,
        quotation_id: q.id,
        customer_name: q.customer || q.customer_name || "Customer",
        customer_tier: "gold",
        level: "sales_manager",
        status: q.status === "CONFIRMED" || q.status === "APPROVED" ? "approved" : "pending",
        blended_risk_score: q.risk_score || 12,
        steps: [
          { id: 1, level: "sales_manager", status: q.status === "CONFIRMED" || q.status === "APPROVED" ? "approved" : "pending", reviewed_by: q.status === "CONFIRMED" ? "Sales Manager" : null, reason: null },
          { id: 2, level: "finance", status: q.status === "CONFIRMED" || q.status === "APPROVED" ? "approved" : "pending", reviewed_by: q.status === "CONFIRMED" ? "Finance Director" : null, reason: null }
        ],
        lines: q.lines || []
      };
      if (Array.isArray(mockData.mockApprovals)) {
        mockData.mockApprovals.push(found);
      }
    }
  }

  return {
    success: true,
    data: found || mockData.mockApprovals?.[0] || mockData.mockApproval || { error: "Not found" }
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
  const targetStr = String(id);
  const cleanId = targetStr.replace(/^Q-/, "");

  let quotation =
    mockData.mockQuotationsStore[id] ||
    mockData.mockQuotationsStore[cleanId] ||
    mockData.mockQuotationsStore[`Q-${cleanId}`] ||
    Object.values(mockData.mockQuotationsStore || {}).find(
      (q) => String(q.id) === targetStr || String(q.id) === cleanId || String(q.id).replace(/^Q-/, "") === cleanId
    );

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
    mockData.mockQuotationsStore[quotation.id] = quotation;
    mockData.mockQuotationsStore[id] = quotation;
  }

  // Graceful fallback to avoid infinite loading screen
  if (!quotation) {
    quotation = Object.values(mockData.mockQuotationsStore || {})[0] || null;
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

    let existing = mockData.mockApprovals?.find(
      (a) => String(a.quotation_id) === String(quotationId) || String(a.id) === String(quotationId)
    );
    if (!existing) {
      const newAppr = {
        id: (mockData.mockApprovals?.length || 0) + 1,
        quotation_id: Number(quotationId),
        customer_name: quotation.customer || quotation.customer_name || "Acme Corp",
        level: "sales_manager",
        status: "pending",
        blended_risk_score: quotation.risk_score || 15,
        steps: [
          { level: "sales_manager", status: "pending", reviewed_by: null, reason: null },
          { level: "finance", status: "pending", reviewed_by: null, reason: null },
        ],
      };
      mockData.mockApprovals.unshift(newAppr);
    } else {
      existing.status = "pending";
    }
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