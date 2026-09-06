from pydantic import BaseModel
from datetime import datetime


class AuditLogOut(BaseModel):
    id: int
    user_id: int
    user_name: str | None = None
    action: str
    reason: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True