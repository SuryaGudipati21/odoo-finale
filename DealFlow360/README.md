# DealFlow360

B2B sales deal management platform — Odoo Hackathon 2026 Final Round.

- `backend/` — FastAPI + SQLAlchemy + PostgreSQL. All business logic (pricing, discounts, approvals, stock, billing) lives here.
- `frontend/` — Consumes backend APIs only. No business logic here.
- `TEAM_STATE.md` — **Source of truth.** Read this before writing any code. Update it whenever you finish something.

## Team
| Member | Role |
|---|---|
| Surya Gudipati | Backend Lead — auth, core models, discount risk score, approval workflow |
| Tharachand K | Backend — CRUD, migrations, warehouse split, billing, tests |
| Pardha Saradhi | Frontend — quotation builder, approval screen, upsell panel |
| Sanjay Prakash | Frontend — fulfillment/billing screens, customer portal, dashboard |

## Rule
Backend is authoritative for all business rules. Frontend only displays state and calls APIs.
