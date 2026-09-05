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
  risk_score: 0 
};