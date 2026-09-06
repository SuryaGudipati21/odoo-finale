// Owner: Shared — sample products/customers/tiers for UI dev before backend seed data is ready
// Location: frontend/src/data/mockData.js

export const mockQuotations = {
  "Q-2024-001": {
    id: "Q-2024-001",
    customer: "Acme Corporation",
    amount: 45000,
    status: "NEGOTIATION",
    days_active: 12,
    discount_given: 15,
    rep_avg_discount: 8,
    variance: 7,
    risk_level: "high",
    created_at: "2024-08-24",
    created_by: "Priya Shah",
    lines: [
      { id: 1, product: "Enterprise License", quantity: 5, price: 2000, discount: 10 },
      { id: 2, product: "Implementation Service", quantity: 1, price: 20000, discount: 20 },
      { id: 3, product: "Support Plan (Annual)", quantity: 5, price: 1000, discount: 12 },
    ],
  },
  "Q-2024-002": {
    id: "Q-2024-002",
    customer: "Beta Industries",
    amount: 82500,
    status: "PENDING_APPROVAL",
    days_active: 5,
    discount_given: 12,
    rep_avg_discount: 8,
    variance: 4,
    risk_level: "medium",
    created_at: "2024-08-31",
    created_by: "Rahul Nair",
    lines: [
      { id: 1, product: "Warehouse Module", quantity: 1, price: 35000, discount: 15 },
      { id: 2, product: "Training Package", quantity: 2, price: 15000, discount: 10 },
    ],
  },
};

export const mockWarehouses = {
  "Q-2024-001": {
    quotation_id: "Q-2024-001",
    order_lines: [
      {
        line_id: 1,
        product: "Enterprise License",
        total_qty: 5,
        warehouse_splits: [
          {
            warehouse_id: "WH-MAIN",
            warehouse_name: "Main Warehouse (Chicago)",
            quantity: 3,
            shipment_count: 1,
            cost: 450,
            stock_level: "high",
          },
          {
            warehouse_id: "WH-EAST",
            warehouse_name: "East Depot (New York)",
            quantity: 2,
            shipment_count: 1,
            cost: 320,
            stock_level: "medium",
          },
        ],
      },
      {
        line_id: 2,
        product: "Implementation Service",
        total_qty: 1,
        warehouse_splits: [
          {
            warehouse_id: "WH-MAIN",
            warehouse_name: "Main Warehouse (Chicago)",
            quantity: 1,
            shipment_count: 1,
            cost: 200,
            stock_level: "high",
          },
        ],
      },
    ],
    total_cost: 1370,
    total_shipments: 3,
    backorder_risk: false,
  },
};

export const mockBillingSchedule = {
  "Q-2024-001": {
    quotation_id: "Q-2024-001",
    one_time_lines: [
      {
        product: "Implementation Service",
        quantity: 1,
        unit_price: 20000,
        discount: 4000,
        total: 16000,
      },
    ],
    recurring_lines: [
      {
        product: "Support Plan (Annual)",
        quantity: 5,
        unit_price: 1000,
        discount: 120,
        monthly_amount: 367,
        billing_cycle: "monthly",
        next_billing: "2024-09-24",
      },
    ],
    billing_schedule: [
      { date: "2024-09-15", description: "Invoice - Implementation", amount: 16000 },
      { date: "2024-09-24", description: "Recurring Billing Cycle 1", amount: 367 },
      { date: "2024-10-24", description: "Recurring Billing Cycle 2", amount: 367 },
      { date: "2024-11-24", description: "Recurring Billing Cycle 3", amount: 367 },
    ],
    total_one_time: 16000,
    total_recurring_monthly: 367,
    contract_value: 20404,
  },
};

export const mockDealHealth = {
  summary: {
    total_stalled: 4,
    total_anomalies: 2,
    avg_deal_age: 14,
    at_risk_percentage: 18,
  },
  stalled_deals: [
    {
      quotation_id: "Q-2024-001",
      customer: "Acme Corporation",
      amount: 45000,
      status: "NEGOTIATION",
      days_stalled: 12,
      last_activity: "2024-08-31",
      action_required: "Follow up needed",
      priority: "high",
    },
    {
      quotation_id: "Q-2024-003",
      customer: "Gamma Tech Solutions",
      amount: 28500,
      status: "PENDING_APPROVAL",
      days_stalled: 8,
      last_activity: "2024-09-02",
      action_required: "Manager approval pending",
      priority: "medium",
    },
    {
      quotation_id: "Q-2024-004",
      customer: "Delta Logistics",
      amount: 62000,
      status: "SENT_TO_CUSTOMER",
      days_stalled: 15,
      last_activity: "2024-08-28",
      action_required: "Customer response needed",
      priority: "high",
    },
    {
      quotation_id: "Q-2024-005",
      customer: "Echo Manufacturing",
      amount: 35200,
      status: "DRAFT",
      days_stalled: 5,
      last_activity: "2024-09-04",
      action_required: "Complete quote",
      priority: "low",
    },
  ],
  anomalies: [
    {
      quotation_id: "Q-2024-001",
      customer: "Acme Corporation",
      discount_given: 15,
      rep_avg: 8,
      variance: 7,
      variance_percentage: 87.5,
      risk_level: "high",
      reason: "Significantly above rep average",
    },
    {
      quotation_id: "Q-2024-006",
      customer: "Foxtrot Retail",
      discount_given: 18,
      rep_avg: 9,
      variance: 9,
      variance_percentage: 100,
      risk_level: "critical",
      reason: "Extreme discount variance",
    },
  ],
};

export const mockSubscriptions = {
  list: [
    {
      id: "SUB-001",
      customer: "Acme Corp",
      plan: "Enterprise Support & SLA",
      cycle: "Monthly",
      next_billing: "Oct 15",
      amount_monthly: 3500,
      status: "Active",
    },
    {
      id: "SUB-002",
      customer: "Beta Industries",
      plan: "Professional SLA",
      cycle: "Quarterly",
      next_billing: "Nov 01",
      amount_monthly: 1500,
      status: "Active",
    },
    {
      id: "SUB-003",
      customer: "Gamma Tech",
      plan: "Standard Care Plan",
      cycle: "Yearly",
      next_billing: "Dec 01",
      amount_monthly: 500,
      status: "Paused",
    },
    {
      id: "SUB-004",
      customer: "Nexus Dynamics",
      plan: "Starter SLA",
      cycle: "Monthly",
      next_billing: "Oct 20",
      amount_monthly: 250,
      status: "Active",
    },
  ],
};

// --- Pardha's data: QuotationBuilder mock data ---

export const mockCustomer = {
  id: 101,
  name: "Acme Corp",
  tier: "gold"
};

export const mockQuotation = {
  id: 1,
  customer_id: 101,
  status: "DRAFT",
  created_by: "Sales Rep",
  created_at: "2024-09-01T09:00:00Z",
  lines: [
    {
      id: 1,
      product_id: 5,
      product_name: "Office Chair",
      category: "Hardware",
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
  risk_score: 0
};

export const mockApproval = {
  id: 1,
  quotation_id: 1,
  customer_name: "Acme Corp",
  customer_tier: "gold",
  level: "finance",
  status: "pending",
  blended_risk_score: 14,
  steps: [
    { id: 1, level: "sales_manager", status: "approved", reviewed_by: "Sales Manager", reason: "Standard enterprise concession verified" },
    { id: 2, level: "finance", status: "pending", reviewed_by: null, reason: null }
  ],
  lines: [
    { id: 1, product_name: "Office Chair", category: "Hardware", quantity: 2, unit_price: 3000, discount_percent: 5 },
    { id: 2, product_name: "Onboarding Setup", category: "Services", quantity: 1, unit_price: 8000, discount_percent: 12 }
  ]
};

export const mockApprovals = [
  mockApproval,
  {
    id: 2,
    quotation_id: "Q-2024-002",
    customer_name: "Beta Industries",
    customer_tier: "silver",
    level: "sales_manager",
    status: "pending",
    blended_risk_score: 12,
    steps: [
      { id: 3, level: "sales_manager", status: "pending", reviewed_by: null, reason: null },
      { id: 4, level: "finance", status: "pending", reviewed_by: null, reason: null }
    ],
    lines: [
      { id: 1, product_name: "Warehouse Module", category: "Hardware", quantity: 1, unit_price: 35000, discount_percent: 15 },
      { id: 2, product_name: "Training Package", category: "Services", quantity: 2, unit_price: 15000, discount_percent: 10 }
    ]
  },
  {
    id: 3,
    quotation_id: "Q-2024-001",
    customer_name: "Acme Corporation",
    customer_tier: "gold",
    level: "finance",
    status: "approved",
    blended_risk_score: 18,
    steps: [
      { id: 5, level: "sales_manager", status: "approved", reviewed_by: "Sales Manager", reason: "Strategic partner discount authorized" },
      { id: 6, level: "finance", status: "approved", reviewed_by: "Finance Director", reason: "Quarterly margin quota met" }
    ],
    lines: [
      { id: 1, product_name: "Enterprise License", category: "Software", quantity: 5, unit_price: 2000, discount_percent: 10 },
      { id: 2, product_name: "Implementation Service", category: "Services", quantity: 1, unit_price: 20000, discount_percent: 20 },
      { id: 3, product_name: "Support Plan (Annual)", category: "Services", quantity: 5, unit_price: 1000, discount_percent: 12 }
    ]
  }
];

export const mockUpsellSuggestions = [
  { id: 1, product_id: 6, product_name: "Ergonomic Footrest", category: "Hardware", unit_price: 1500, margin_delta: 450, promoted: true },
  { id: 2, product_id: 7, product_name: "Extended Warranty", category: "Services", unit_price: 3000, margin_delta: 900, promoted: false },
  { id: 3, product_id: 8, product_name: "Desk Organizer Set", category: "Hardware", unit_price: 800, margin_delta: 200, promoted: false },
];

export const mockProducts = [
  { id: 1, name: "Enterprise License", price: 2000, category: "Software", margin: 1200 },
  { id: 2, name: "Implementation Service", price: 20000, category: "Services", margin: 8000 },
  { id: 3, name: "Support Plan", price: 1000, category: "Services", margin: 600 },
  { id: 4, name: "Warehouse Module", price: 35000, category: "Software", margin: 17500 },
  { id: 5, name: "Training Package", price: 15000, category: "Services", margin: 7500 },
];


const normalizeLine = (line, idx) => {
  const unitPrice = line.unit_price ?? line.price ?? 0;
  const discountPercent = line.discount_percent ?? line.discount ?? 0;
  const quantity = line.quantity ?? 1;
  return {
    id: line.id ?? idx + 1,
    product_id: line.product_id ?? null,
    product_name: line.product_name ?? line.product,
    category: line.category ?? "General",
    quantity,
    unit_price: unitPrice,
    discount_percent: discountPercent,
    line_total: Math.round(unitPrice * quantity * (1 - discountPercent / 100)),
  };
};

const buildUnifiedQuotation = (raw) => ({
  id: raw.id,
  customer_id: raw.customer_id ?? mockCustomer.id,
  customer: raw.customer ?? mockCustomer.name,
  status: raw.status,
  lines: raw.lines.map(normalizeLine),
  margin: raw.margin ?? 0,
  risk_score: raw.risk_score ?? 0,
  created_by: raw.created_by ?? null,
  created_at: raw.created_at ?? null,
  // Activity trail — who did what to this quotation, in order.
  // Seeds with a "created" entry when we know who/when; new drafts created
  // via the "+ New Quotation" button start this list empty and grow it live.
  activity: raw.created_by
    ? [
        {
          action: "Created quotation",
          user: raw.created_by,
          timestamp: raw.created_at ?? null,
          status: "done",
        },
      ]
    : [],
});

export const mockQuotationsStore = {
  [mockQuotation.id]: buildUnifiedQuotation(mockQuotation),
  ...Object.fromEntries(
    Object.values(mockQuotations).map((q) => [q.id, buildUnifiedQuotation(q)])
  ),
};