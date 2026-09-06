from app.models import user, customer, product, pricing, discount, quotation, approval, upsell, negotiation, warehouse, invoice, subscription  # noqa: F401
from app.api.routes import auth, quotations, approvals, fulfillment, invoices, subscriptions, products
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DealFlow360")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(quotations.router, prefix="/quotations", tags=["quotations"])
app.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
app.include_router(fulfillment.router, prefix="/fulfillment", tags=["fulfillment"])
app.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
app.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
app.include_router(products.router, tags=["catalog"])


@app.get("/health")
def health():
    return {"status": "ok"}