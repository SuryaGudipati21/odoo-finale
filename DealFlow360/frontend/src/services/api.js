// Owner: Shared — all real backend calls (fetch/axios wrapper). Both Pardha and Sanjay import from here.
// Base URL and endpoints must match TEAM_STATE.md API Contracts exactly.
// src/services/api.js
// src/services/api.js
const BASE_URL = "http://localhost:8000"; // confirm actual port with Surya

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid email or password");
    if (res.status === 404) throw new Error("User not found");
    throw new Error("Login failed");
  }
  
  const data = await res.json();
  // data should have: { access_token, token_type, user: { id, email, role, full_name } }
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", data.user?.role || 'sales_rep');
  
  return data;
}

export async function portalLogin(email, password) {
  const res = await fetch(`${BASE_URL}/auth/portal-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid email or password");
    throw new Error("Portal login failed");
  }
  
  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", "customer"); // Portal users are always 'customer'
  
  return data;
}

export async function createQuotation(customerId, lines) {
  const res = await fetch(`${BASE_URL}/quotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      customer_id: customerId,
      lines: lines.map(l => ({
        product_id: l.product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent
      }))
    })
  });
  if (!res.ok) throw new Error("Failed to create quotation");
  return res.json();
}

export async function getQuotation(id) {
  const res = await fetch(`${BASE_URL}/quotations/${id}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error("Quotation not found");
  return res.json();
}

export async function approvalAction(approvalId, action, reason) {
  const res = await fetch(`${BASE_URL}/approvals/${approvalId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action, reason })
  });
  if (!res.ok) throw new Error("Approval action failed");
  return res.json();
}
export async function getUpsellSuggestions(quotationId) {
  const res = await fetch(`${BASE_URL}/quotations/${quotationId}/upsell-suggestions`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error("Failed to load upsell suggestions");
  return res.json();
}