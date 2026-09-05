# DealFlow360 — Team State
> Update this file every time you finish or decide something. Everyone's AI reads this before writing code.

## Current Architecture
Backend: FastAPI + SQLAlchemy + PostgreSQL
Frontend:  React + Vite (JavaScript)
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
- POST /auth/portal-login — customer portal login

## State Machines
Quotation:
DRAFT → PENDING_APPROVAL → APPROVED → SENT_TO_CUSTOMER → NEGOTIATION → REAPPROVAL_REQUIRED → CONFIRMED → FULFILLMENT → COMPLETED

## Currently Working On
- Surya: core auth (password hashing + JWT) — next
- Tharachand:
- Pardha: Quotation Builder UI working with mock data (add line, edit discount) — waiting on real GET/POST /quotations API from backend

- Sanjay:

## Completed
-Frontend scaffolded (Vite + React), Quotation Builder page renders mock quotation with editable discount and add-line form

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
- Frontend login attempts get "Failed to fetch" — backend server not reachable at localhost:8000.
  Needs: confirm Surya's backend is running + correct host/port + CORS enabled for localhost:5173.

## Next Checkpoint
- Pardha needs: GET /quotations/{id} and POST /quotations/{id}/lines contract from Surya/Tharachand to replace mockApi.js

## Open Questions
- Customer portal login: email+password (assumed) or magic link? Affects Customer model + /auth/portal-login contract.