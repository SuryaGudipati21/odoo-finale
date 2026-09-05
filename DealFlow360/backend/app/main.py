from fastapi import FastAPI

from app.api.routes import auth

app = FastAPI(title="DealFlow360")

app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/health")
def health():
    return {"status": "ok"}