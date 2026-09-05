from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database.session import Base


class BillingCycle(str, enum.Enum):
    monthly = "MONTHLY"
    quarterly = "QUARTERLY"
    yearly = "YEARLY"


class SubscriptionStatus(str, enum.Enum):
    active = "ACTIVE"
    paused = "PAUSED"
    cancelled = "CANCELLED"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)  # originating order
    plan_name = Column(String, nullable=False)          # e.g. "Care Plan 2yr"
    cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    amount = Column(Float, nullable=False)
    next_bill_date = Column(DateTime(timezone=True), nullable=True)  # null when paused
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer")
    quotation = relationship("Quotation")
