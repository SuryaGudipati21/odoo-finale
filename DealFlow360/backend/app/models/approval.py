from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.sql import func
import enum

from app.database.session import Base


class ApprovalLevel(str, enum.Enum):
    manager = "MANAGER"
    finance = "FINANCE"


class ApprovalStatus(str, enum.Enum):
    pending = "PENDING"
    approved = "APPROVED"
    rejected = "REJECTED"
    revision_requested = "REVISION_REQUESTED"


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    level = Column(Enum(ApprovalLevel), nullable=False)
    status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.pending)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)   # e.g. "approved", "rejected", "edited"
    reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())