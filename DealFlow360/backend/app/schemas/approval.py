from pydantic import BaseModel


class ApprovalActionRequest(BaseModel):
    action: str  # "approve" | "reject" | "request_revision"
    reason: str | None = None


class ApprovalOut(BaseModel):
    id: int
    quotation_id: int
    level: str
    status: str
    reviewed_by_id: int | None

    class Config:
        from_attributes = True