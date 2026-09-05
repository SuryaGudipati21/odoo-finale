// src/data/mockData.js
// Owner: Shared — sample products/customers/tiers for UI dev before backend seed data is ready
// NOTE: category is free-text per TEAM_STATE decisions — not an enum.
// Real category list will come from a backend endpoint (TBD) — hardcoded here only for demo/mock purposes.

export const mockCustomer = {
  id: 101,
  name: "Acme Corp",
  tier: "gold" // bronze | silver | gold — per TEAM_STATE decisions
};

export const mockQuotation = {
  id: 1,
  customer_id: 101,
  status: "DRAFT", // matches agreed state machine exactly
  lines: [
    {
      id: 1,
      product_id: 5,
      product_name: "Office Chair",
      category: "Hardware", // free-text, assumption for mock only
      quantity: 2,
      unit_price: 3000,
      discount_percent: 5,
      line_total: 5700
    },
    {
      id: 2,
      product_id: 8,
      product_name: "Onboarding Setup",
      category: "Services",
      quantity: 1,
      unit_price: 8000,
      discount_percent: 12,
      line_total: 7040
    }
  ],
  margin: 1200,
  risk_score: 0 // real value comes from backend's blended risk score calc — never computed client-side
};

export const mockApproval = {
  id: 1,
  quotation_id: 1,
  level: "finance", // "manager" | "finance" — from blended_risk_score > 10
  status: "pending", // "pending" | "approved" | "rejected"
  blended_risk_score: 14,
  steps: [
    { level: "manager", status: "approved", reviewed_by: "Sales Manager", reason: null },
    { level: "finance", status: "pending", reviewed_by: null, reason: null }
  ]
};