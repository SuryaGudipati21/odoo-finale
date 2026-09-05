from app.models import user, customer, product, pricing, discount, quotation, approval, upsell, negotiation  # noqa: F401

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, quotations, approvals

app = FastAPI(title="DealFlow360")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(quotations.router, prefix="/quotations", tags=["quotations"])
app.include_router(approvals.router, prefix="/approvals", tags=["approvals"])


@app.get("/health")
def health():
    return {"status": "ok"}