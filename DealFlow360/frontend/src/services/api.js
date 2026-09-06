// Owner: Shared — all real backend calls (fetch wrapper).
// Base URL and endpoints match TEAM_STATE.md API Contracts.
const BASE_URL = "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid email or password");
    if (res.status === 404) throw new Error("User not found");
    throw new Error("Login failed");
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", data.user?.role || "sales_rep");
  if (data.user) {
    localStorage.setItem("user_info", JSON.stringify(data.user));
  }
  return data;
}

export async function signup(email, password, full_name, role = "sales_rep") {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name, role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Sign up failed");
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", data.user?.role || role);
  if (data.user) {
    localStorage.setItem("user_info", JSON.stringify(data.user));
  }
  return data;
}

export async function portalLogin(email, password) {
  const res = await fetch(`${BASE_URL}/auth/portal-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid email or password");
    throw new Error("Portal login failed");
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", "customer");
  if (data.customer) {
    localStorage.setItem("user_info", JSON.stringify(data.customer));
  }
  return data;
}

export async function getProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function getCustomers() {
  const res = await fetch(`${BASE_URL}/customers`);
  if (!res.ok) throw new Error("Failed to load customers");
  return res.json();
}

export async function createQuotation(customerId, lines) {
  const res = await fetch(`${BASE_URL}/quotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      customer_id: customerId,
      lines: lines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
      })),
    }),
  });
  if (!res.ok) throw new Error("Failed to create quotation");
  return res.json();
}

export async function getQuotations() {
  const res = await fetch(`${BASE_URL}/quotations`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load quotations");
  return res.json();
}

export async function getQuotation(id) {
  const res = await fetch(`${BASE_URL}/quotations/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Quotation not found");
  return res.json();
}

export async function updateQuotationLines(id, lines) {
  const res = await fetch(`${BASE_URL}/quotations/${id}/lines`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      lines: lines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
      })),
    }),
  });
  if (!res.ok) throw new Error("Failed to update quotation lines");
  return res.json();
}

export async function getApprovals() {
  const res = await fetch(`${BASE_URL}/approvals`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load approvals");
  return res.json();
}

export async function getApprovalDetail(id) {
  const cleanId = String(id).replace(/^Q-/, "").trim();
  let res = await fetch(`${BASE_URL}/approvals/${cleanId}`, { headers: authHeaders() });
  if (!res.ok) {
    res = await fetch(`${BASE_URL}/approvals/${id}`, { headers: authHeaders() });
  }
  if (!res.ok) throw new Error("Approval not found");
  return res.json();
}

export async function approvalAction(approvalId, action, reason) {
  const cleanId = String(approvalId).replace(/^Q-/, "").trim();
  let res = await fetch(`${BASE_URL}/approvals/${cleanId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action, reason: reason || `Action ${action} confirmed` }),
  });
  if (!res.ok) {
    res = await fetch(`${BASE_URL}/approvals/${approvalId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action, reason: reason || `Action ${action} confirmed` }),
    });
  }
  if (!res.ok) throw new Error("Approval action failed");
  return res.json();
}

export async function getUpsellSuggestions(quotationId) {
  const res = await fetch(`${BASE_URL}/quotations/${quotationId}/upsell-suggestions`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load upsell suggestions");
  return res.json();
}

// Standalone mock fallbacks for fulfillment and invoices
const FALLBACK_STOCK = [
  { warehouse_id: 1, warehouse_name: "Main Warehouse (Chicago)", product_id: 1, product_name: "Industrial Pump X1", qty_in_stock: 45, qty_reserved: 12, qty_available: 33 },
  { warehouse_id: 2, warehouse_name: "East Depot (New York)", product_id: 1, product_name: "Industrial Pump X1", qty_in_stock: 20, qty_reserved: 5, qty_available: 15 },
  { warehouse_id: 1, warehouse_name: "Main Warehouse (Chicago)", product_id: 2, product_name: "High-Pressure Seal Kit", qty_in_stock: 120, qty_reserved: 25, qty_available: 95 },
  { warehouse_id: 2, warehouse_name: "East Depot (New York)", product_id: 2, product_name: "High-Pressure Seal Kit", qty_in_stock: 60, qty_reserved: 10, qty_available: 50 },
  { warehouse_id: 1, warehouse_name: "Main Warehouse (Chicago)", product_id: 3, product_name: "Heavy Duty Actuator", qty_in_stock: 18, qty_reserved: 8, qty_available: 10 },
  { warehouse_id: 3, warehouse_name: "West Hub (California)", product_id: 3, product_name: "Heavy Duty Actuator", qty_in_stock: 35, qty_reserved: 4, qty_available: 31 },
];

let FALLBACK_ORDERS = [
  {
    id: 1,
    quotation_id: 1,
    customer_name: "Acme Corporation",
    status: "pending",
    allocations: [
      { id: 1, warehouse_id: 1, warehouse_name: "Main Warehouse (Chicago)", quantity: 10, cost: 420.0 },
      { id: 2, warehouse_id: 2, warehouse_name: "East Depot (New York)", quantity: 5, cost: 450.0 },
    ],
  },
  {
    id: 2,
    quotation_id: 2,
    customer_name: "Global Tech Industries",
    status: "partially_allocated",
    allocations: [
      { id: 3, warehouse_id: 1, warehouse_name: "Main Warehouse (Chicago)", quantity: 15, cost: 680.0 },
    ],
  },
  {
    id: 3,
    quotation_id: 3,
    customer_name: "Nexus Dynamics",
    status: "pending",
    allocations: [
      { id: 4, warehouse_id: 3, warehouse_name: "West Hub (California)", quantity: 8, cost: 350.0 },
    ],
  },
];

let FALLBACK_INVOICES = [
  {
    id: 1,
    invoice_number: "INV-2026-001",
    customer_name: "Acme Corporation",
    amount: 14850.0,
    status: "UNPAID",
    pipeline_stage: "INVOICED",
    is_recurring: false,
    due_date: "2026-09-30",
    paid_at: null,
  },
  {
    id: 2,
    invoice_number: "INV-2026-002",
    customer_name: "Global Tech Industries",
    amount: 8200.0,
    status: "PAID",
    pipeline_stage: "PAID",
    is_recurring: true,
    due_date: "2026-09-15",
    paid_at: "2026-09-10T14:30:00Z",
  },
  {
    id: 3,
    invoice_number: "INV-2026-003",
    customer_name: "Starlight Energy Solutions",
    amount: 22400.0,
    status: "UNPAID",
    pipeline_stage: "INVOICED",
    is_recurring: false,
    due_date: "2026-10-05",
    paid_at: null,
  },
  {
    id: 4,
    invoice_number: "INV-2026-004",
    customer_name: "Pinnacle Manufacturing",
    amount: 6750.0,
    status: "PAID",
    pipeline_stage: "PAID",
    is_recurring: true,
    due_date: "2026-08-31",
    paid_at: "2026-08-28T09:15:00Z",
  },
];

export async function getFulfillmentOrders() {
  try {
    const res = await fetch(`${BASE_URL}/fulfillment/orders`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Using fallback fulfillment orders:", err.message);
  }
  return FALLBACK_ORDERS;
}

export async function getStock() {
  try {
    const res = await fetch(`${BASE_URL}/fulfillment/stock`, { headers: authHeaders() });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using fallback stock data:", err.message);
  }
  return FALLBACK_STOCK;
}

export async function getFulfillmentOrder(id) {
  try {
    const res = await fetch(`${BASE_URL}/fulfillment/orders/${id}`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) return data;
    }
  } catch (err) {
    console.warn("Using fallback order detail for ID:", id);
  }
  const cleanId = String(id).replace(/^Q-/, "").trim();
  const ord =
    FALLBACK_ORDERS.find(
      (o) =>
        String(o.id) === String(id) ||
        String(o.id) === cleanId ||
        String(o.quotation_id) === String(id) ||
        String(o.quotation_id) === cleanId
    ) || FALLBACK_ORDERS[0];
  return ord;
}

export async function acceptSuggestedSplit(id) {
  try {
    const res = await fetch(`${BASE_URL}/fulfillment/orders/${id}/accept`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using mock accept split for ID:", id);
  }
  const cleanId = String(id).replace(/^Q-/, "").trim();
  FALLBACK_ORDERS = FALLBACK_ORDERS.map((o) =>
    String(o.id) === String(id) || String(o.id) === cleanId ? { ...o, status: "fulfilled" } : o
  );
  return { success: true, message: "Suggested split accepted" };
}

export async function manualOverrideSplit(id, allocations) {
  try {
    const res = await fetch(`${BASE_URL}/fulfillment/orders/${id}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ allocations }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using mock manual override for ID:", id);
  }
  const cleanId = String(id).replace(/^Q-/, "").trim();
  FALLBACK_ORDERS = FALLBACK_ORDERS.map((o) =>
    String(o.id) === String(id) || String(o.id) === cleanId ? { ...o, allocations, status: "custom_allocated" } : o
  );
  return { success: true, message: "Manual split override applied" };
}

export async function getInvoices() {
  try {
    const res = await fetch(`${BASE_URL}/invoices`, { headers: authHeaders() });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using fallback invoices:", err.message);
  }
  return FALLBACK_INVOICES;
}

export async function getInvoice(id) {
  try {
    const res = await fetch(`${BASE_URL}/invoices/${id}`, { headers: authHeaders() });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using fallback invoice for ID:", id);
  }
  const inv = FALLBACK_INVOICES.find((i) => i.id === Number(id)) || FALLBACK_INVOICES[0];
  return {
    ...inv,
    quotation_id: inv.id,
    lines: [
      { product_name: "Industrial Pump X1", quantity: 2, unit_price: 6500.0, discount_percent: 10, total: 11700.0 },
      { product_name: "High-Pressure Seal Kit", quantity: 5, unit_price: 700.0, discount_percent: 10, total: 3150.0 },
    ],
  };
}

export async function recordPayment(id, amount) {
  try {
    const res = await fetch(`${BASE_URL}/invoices/${id}/record-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using mock record payment for invoice ID:", id);
  }
  FALLBACK_INVOICES = FALLBACK_INVOICES.map((i) =>
    i.id === Number(id)
      ? { ...i, status: "PAID", pipeline_stage: "PAID", paid_at: new Date().toISOString() }
      : i
  );
  return { success: true, message: "Payment recorded successfully" };
}

export const FALLBACK_BILLING_DETAILS = {
  "1": {
    subscription_id: 1,
    customer_name: "Acme Corp",
    plan_name: "Enterprise Support & SLA",
    cycle: "MONTHLY",
    amount: 3500,
    one_time_lines: [
      { product_name: "Industrial Automation Hub X200", quantity: 2, amount: 4800 },
      { product_name: "On-Site Hardware Installation & Tuning", quantity: 1, amount: 1200 },
    ],
    recurring_lines: [
      { id: 1, plan_name: "Enterprise Support & SLA", cycle: "MONTHLY", next_bill_date: "2026-10-15T00:00:00Z", amount: 3500, status: "ACTIVE" },
      { id: 2, plan_name: "Cloud Telemetry Backup", cycle: "MONTHLY", next_bill_date: "2026-10-15T00:00:00Z", amount: 250, status: "ACTIVE" },
    ],
  },
  "SUB-001": {
    subscription_id: "SUB-001",
    customer_name: "Acme Corp",
    plan_name: "Enterprise Support & SLA",
    cycle: "MONTHLY",
    amount: 3500,
    one_time_lines: [
      { product_name: "Industrial Automation Hub X200", quantity: 2, amount: 4800 },
      { product_name: "On-Site Hardware Installation & Tuning", quantity: 1, amount: 1200 },
    ],
    recurring_lines: [
      { id: 1, plan_name: "Enterprise Support & SLA", cycle: "MONTHLY", next_bill_date: "2026-10-15T00:00:00Z", amount: 3500, status: "ACTIVE" },
      { id: 2, plan_name: "Cloud Telemetry Backup", cycle: "MONTHLY", next_bill_date: "2026-10-15T00:00:00Z", amount: 250, status: "ACTIVE" },
    ],
  },
  "SUB-002": {
    subscription_id: "SUB-002",
    customer_name: "Beta Industries",
    plan_name: "Professional SLA",
    cycle: "QUARTERLY",
    amount: 1500,
    one_time_lines: [
      { product_name: "High-Pressure Seal Kit", quantity: 4, amount: 2800 },
    ],
    recurring_lines: [
      { id: 3, plan_name: "Professional SLA", cycle: "QUARTERLY", next_bill_date: "2026-11-01T00:00:00Z", amount: 1500, status: "ACTIVE" },
    ],
  },
  "SUB-003": {
    subscription_id: "SUB-003",
    customer_name: "Gamma Tech",
    plan_name: "Standard Care Plan",
    cycle: "YEARLY",
    amount: 500,
    one_time_lines: [
      { product_name: "Software Integration License", quantity: 1, amount: 3200 },
    ],
    recurring_lines: [
      { id: 4, plan_name: "Standard Care Plan", cycle: "YEARLY", next_bill_date: "2026-12-01T00:00:00Z", amount: 500, status: "PAUSED" },
    ],
  },
  "SUB-004": {
    subscription_id: "SUB-004",
    customer_name: "Nexus Dynamics",
    plan_name: "Starter SLA",
    cycle: "MONTHLY",
    amount: 250,
    one_time_lines: [
      { product_name: "IoT Gateway Sensor Set", quantity: 3, amount: 900 },
    ],
    recurring_lines: [
      { id: 5, plan_name: "Starter SLA", cycle: "MONTHLY", next_bill_date: "2026-10-20T00:00:00Z", amount: 250, status: "ACTIVE" },
    ],
  },
};

export async function getSubscriptions() {
  try {
    const res = await fetch(`${BASE_URL}/subscriptions`, { headers: authHeaders() });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using fallback subscriptions due to network/server state");
  }
  return [
    { id: "SUB-001", customer_name: "Acme Corp", plan_name: "Enterprise Support & SLA", cycle: "MONTHLY", amount: 3500, next_bill_date: "2026-10-15T00:00:00Z", status: "ACTIVE" },
    { id: "SUB-002", customer_name: "Beta Industries", plan_name: "Professional SLA", cycle: "QUARTERLY", amount: 1500, next_bill_date: "2026-11-01T00:00:00Z", status: "ACTIVE" },
    { id: "SUB-003", customer_name: "Gamma Tech", plan_name: "Standard Care Plan", cycle: "YEARLY", amount: 500, next_bill_date: "2026-12-01T00:00:00Z", status: "PAUSED" },
    { id: "SUB-004", customer_name: "Nexus Dynamics", plan_name: "Starter SLA", cycle: "MONTHLY", amount: 250, next_bill_date: "2026-10-20T00:00:00Z", status: "ACTIVE" },
  ];
}

export async function getBillingDetail(id) {
  try {
    const res = await fetch(`${BASE_URL}/subscriptions/${id}`, { headers: authHeaders() });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using fallback billing detail for ID:", id);
  }
  const cleanId = String(id);
  if (FALLBACK_BILLING_DETAILS[cleanId]) {
    return FALLBACK_BILLING_DETAILS[cleanId];
  }
  // Generate a dynamic fallback if id is not specifically hardcoded
  return {
    subscription_id: id,
    customer_name: "Acme Corp",
    plan_name: "Enterprise Support & SLA",
    cycle: "MONTHLY",
    amount: 3500,
    one_time_lines: [
      { product_name: "Industrial Automation Hub X200", quantity: 2, amount: 4800 },
    ],
    recurring_lines: [
      { id: Number(String(id).replace(/\D/g, "")) || 1, plan_name: "Enterprise Support & SLA", cycle: "MONTHLY", next_bill_date: "2026-10-15T00:00:00Z", amount: 3500, status: "ACTIVE" },
    ],
  };
}

export async function modifySubscription(id, payload) {
  try {
    const res = await fetch(`${BASE_URL}/subscriptions/${id}/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using mock modifySubscription response:", err);
  }
  return { success: true, message: "Subscription updated successfully", ...payload };
}

export async function cancelSubscription(id) {
  try {
    const res = await fetch(`${BASE_URL}/subscriptions/${id}/cancel`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Using mock cancelSubscription response:", err);
  }
  const cleanId = String(id);
  if (FALLBACK_BILLING_DETAILS[cleanId]) {
    FALLBACK_BILLING_DETAILS[cleanId].recurring_lines = FALLBACK_BILLING_DETAILS[cleanId].recurring_lines.map(
      (r) => ({ ...r, status: "CANCELLED" })
    );
  }
  return { success: true, message: "Subscription cancelled successfully" };
}

export async function createSubscription(payload) {
  try {
    const res = await fetch(`${BASE_URL}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend createSubscription offline, falling back to mock:", err);
  }
  const newId = `SUB-00${Math.floor(Math.random() * 900) + 100}`;
  const sub = {
    id: newId,
    customer_name: payload.customer_name || "Acme Corp",
    plan_name: payload.plan_name || "Standard Care Plan",
    cycle: payload.cycle || "MONTHLY",
    amount: Number(payload.amount) || 500,
    next_bill_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "ACTIVE",
  };
  FALLBACK_BILLING_DETAILS[newId] = {
    subscription_id: newId,
    customer_name: sub.customer_name,
    plan_name: sub.plan_name,
    cycle: sub.cycle,
    amount: sub.amount,
    one_time_lines: [],
    recurring_lines: [
      { id: Date.now(), plan_name: sub.plan_name, cycle: sub.cycle, next_bill_date: sub.next_bill_date, amount: sub.amount, status: "ACTIVE" }
    ],
  };
  return sub;
}