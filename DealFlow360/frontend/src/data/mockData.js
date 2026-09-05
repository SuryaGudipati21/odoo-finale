// src/data/mockData.js
// Owner: Shared — sample products/customers/tiers for UI dev before backend seed data is ready

export const mockQuotation = {
  id: 1,
  customer_id: 101,
  status: "DRAFT",
  lines: [
    {
      id: 1,
      product_id: 5,
      product_name: "Office Chair",
      quantity: 2,
      unit_price: 3000,
      discount_percent: 5,
      line_total: 5700
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

export const mockUpsellSuggestions = [
  { id: 1, product_name: "Ergonomic Footrest", margin_delta: 450, promoted: true },
  { id: 2, product_name: "Extended Warranty", margin_delta: 900, promoted: false },
  { id: 3, product_name: "Desk Organizer Set", margin_delta: 200, promoted: false }
];