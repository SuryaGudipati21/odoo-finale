from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.sql import func
import enum

from app.database.session import Base


class BillingCycle(str, enum.Enum):
    monthly = "MONTHLY"
    quarterly = "QUARTERLY"
    yearly = "YEARLY"


class SubscriptionStatus(str, enum.Enum):
    active = "ACTIVE"
    cancelled = "CANCELLED"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    cycle = Column(Enum(BillingCycle), nullable=False)
    price = Column(Float, nullable=False)


class BillingSchedule(Base):
    __tablename__ = "billing_schedules"

    id = Column(Integer, primary_key=True)
    quotation_line_id = Column(Integer, ForeignKey("quotation_lines.id"), nullable=False)
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.active)
    next_billing_date = Column(DateTime(timezone=True), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())