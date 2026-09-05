# DealFlow360 — Team State
> Update this file every time you finish or decide something. Everyone's AI reads this before writing code.

## Current Architecture
Backend: FastAPI + SQLAlchemy + PostgreSQL
Frontend: TBD (fill in once decided)
Authentication: JWT (internal users + separate customer-portal role)

## Current Database Models
(add as they're created — keep names exactly as listed here)
- User (done — email, hashed_password, full_name, role, is_active)
- Customer (done — name, email, hashed_password, tier)
- Product (done)
- ProductVariant (done)
- PriceList → PriceListItem (done — per-tier pricing per product)
- DiscountTier → DiscountTierLimit (done — order-level ceiling per tier)
- CategoryDiscountLimit (done — line-level ceiling per product category)
- ProductPairing (done — upsell/cross-sell rule)
- Quotation
- QuotationLine
- Approval
- Warehouse
- Stock
- SubscriptionPlan
- BillingSchedule
- AuditLog

## API Contracts
(one line per endpoint as it's built — method, path, one-line purpose)
- POST /auth/login
    - Request:  { "email": str, "password": str }
    - Response: { "access_token": str, "token_type": "bearer" }
    - Errors:   401 { "detail": "Invalid credentials" }
    
- POST /auth/portal-login
    - Request:  { "email": str, "password": str }
    - Response: { "access_token": str, "token_type": "bearer" }
    - Errors:   401 Invalid credentials

- POST /quotations
    - Auth: Bearer token (sales_rep, sales_manager, or admin)
    - Request:  { "customer_id": int, "lines": [{ "product_id": int, "quantity": int, "unit_price": float, "discount_percent": float }] }
    - Response: { "id": int, "customer_id": int, "status": str, "risk_score": float, "lines": [...] }
    - Errors:   404 Customer not found, 401/403 auth
    - GET /quotations/{id}
    - Auth: Bearer token (any authenticated internal user)
    - Response: same shape as above
    - Errors: 404 Quotation not found

- POST /approvals/{id}/action
    - Auth: Bearer token (sales_manager for manager-level, finance for finance-level)
    - Request:  { "action": "approve" | "reject" | "request_revision", "reason": str (optional) }
    - Response: { "id", "quotation_id", "level", "status", "reviewed_by_id" }
    - Errors: 404 not found, 400 already actioned / invalid action, 403 wrong role for this level

- GET /quotations/{id}/audit-log
    - Auth: Bearer token (any authenticated internal user)
    - Response: [{ "id", "user_id", "action", "reason", "created_at" }, ...] — newest first
    - Errors: 404 Quotation not found

- PATCH /quotations/{id}/lines
    - Auth: Bearer token (sales_rep, sales_manager, or admin)
    - Request:  { "lines": [{ "product_id", "quantity", "unit_price", "discount_percent" }] }
    - Response: same QuotationOut shape as POST /quotations
    - Errors: 404 not found, 400 if quotation isn't in DRAFT (can't edit an already-approved/pending quote)

- GET /quotations/{id}/upsell-suggestions
    - Auth: Bearer token (any authenticated internal user)
    - Response: [{ "product_id", "product_name", "margin_delta", "is_promoted" }, ...]
    - Errors: 404 Quotation not found

- POST /quotations/{id}/negotiate
    - Auth: Bearer token (customer, must own this quotation)
    - Request:  { "comment": str?, "proposed_discount_percent": float?, "quotation_line_id": int? }
    - Response: { "status": "NEGOTIATION" }
    - Errors: 404 (not found or not this customer's quotation)

- POST /quotations/{id}/confirm
    - Auth: Bearer token (customer, must own this quotation)
    - Request: (empty body)
    - Response: QuotationOut — status is "CONFIRMED" or "REAPPROVAL_REQUIRED"
    - Errors: 404

## State Machines
Quotation:
DRAFT → PENDING_APPROVAL → APPROVED → SENT_TO_CUSTOMER → NEGOTIATION → REAPPROVAL_REQUIRED → CONFIRMED → FULFILLMENT → COMPLETED

## Currently Working On
- Surya: core auth (password hashing + JWT) — next
- Tharachand:
- Pardha:
- Sanjay:

## Completed
-

## Decisions
- User roles: sales_rep, sales_manager, finance, admin (enum in models/user.py)
- Customer tiers: bronze, silver, gold (enum in models/customer.py)
- Product category is a free-text string field, not a fixed enum. Frontend must fetch category list from backend (endpoint TBD), not hardcode it.
- Discount approval thresholds: score > 0 → Manager approval, score > 10 → also Finance approval

## Do Not Change Without Team Agreement
- Model names (see Current Database Models above)
- Quotation state names (see State Machines above)
- Field names: use `customer_id` (not `client_id`), `status` (not `state`)

## Known Issues
-

## Next Checkpoint
-

## Open Questions
- Customer portal login: email+password (assumed) or magic link? Affects Customer model + /auth/portal-login contract.