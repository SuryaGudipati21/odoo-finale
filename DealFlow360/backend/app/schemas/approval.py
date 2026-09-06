from pydantic import BaseModel
from datetime import datetime


class ApprovalActionRequest(BaseModel):
    action: str  # "approve" | "reject" | "request_revision"
    reason: str | None = None


class ApprovalStepOut(BaseModel):
    id: int
    level: str
    status: str
    reviewed_by: str | None = None
    reason: str | None = None
    reviewed_at: datetime | None = None


class ApprovalOut(BaseModel):
    id: int
    quotation_id: int
    level: str
    status: str
    reviewed_by_id: int | None = None
    reason: str | None = None
    created_at: datetime | None = None
    reviewed_at: datetime | None = None

    class Config:
        from_attributes = True


class ApprovalListItem(BaseModel):
    id: int
    quotation_id: int
    customer_name: str
    blended_risk_score: float
    level: str
    status: str
    created_at: datetime | None = None


class ApprovalDetailOut(BaseModel):
    id: int
    quotation_id: int
    customer_name: str
    customer_tier: str
    level: str
    status: str
    blended_risk_score: float
    steps: list[ApprovalStepOut] = []
    lines: list[dict] = []