from app.models import user, customer, product, pricing, discount, quotation, approval, upsell, negotiation, warehouse, invoice, subscription  # noqa: F401
from app.api.routes import auth, quotations, approvals, fulfillment, invoices, subscriptions, products
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DealFlow360")

cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_origin_regex=r"https?://.*" if "*" not in allowed_origins else None,
    allow_credentials=True if "*" not in allowed_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import auth, quotations, approvals, fulfillment, invoices, subscriptions, products, deal_health

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(quotations.router, prefix="/quotations", tags=["quotations"])
app.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
app.include_router(fulfillment.router, prefix="/fulfillment", tags=["fulfillment"])
app.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
app.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
app.include_router(deal_health.router, prefix="/deal-health", tags=["deal-health"])
app.include_router(products.router, tags=["catalog"])


@app.get("/health")
def health():
    return {"status": "ok"}