from pydantic import BaseModel
from datetime import datetime


class AuditLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    reason: str | None
    created_at: datetime

    class Config:
        from_attributes = True