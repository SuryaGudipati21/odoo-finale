# Entry point. Creates the FastAPI app and plugs in the route modules from api/routes/.
from fastapi import FastAPI

app = FastAPI(title="DealFlow360")

# Routers get registered here as they're built, e.g.:
# from app.api.routes import auth
# app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/health")
def health():
    return {"status": "ok"}
