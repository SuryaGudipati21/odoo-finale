from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database.session import Base


class InvoiceStatus(str, enum.Enum):
    unpaid = "UNPAID"
    paid = "PAID"


class PipelineStage(str, enum.Enum):
    order_confirmed = "ORDER_CONFIRMED"
    shipped = "SHIPPED"
    invoiced = "INVOICED"
    paid = "PAID"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True)
    invoice_number = Column(String, unique=True, nullable=False)  # e.g. "INV-1042"
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    subscription_plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(Enum(InvoiceStatus), nullable=False, default=InvoiceStatus.unpaid)
    pipeline_stage = Column(Enum(PipelineStage), nullable=False, default=PipelineStage.order_confirmed)
    is_recurring = Column(Boolean, nullable=False, default=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quotation = relationship("Quotation")
    subscription_plan = relationship("SubscriptionPlan")
