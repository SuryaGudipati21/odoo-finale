from fastapi import FastAPI

from app.api.routes import auth, quotations

app = FastAPI(title="DealFlow360")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(quotations.router, prefix="/quotations", tags=["quotations"])


@app.get("/health")
def health():
    return {"status": "ok"}