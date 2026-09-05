from sqlalchemy import Column, Integer, Float, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database.session import Base


class QuotationStatus(str, enum.Enum):
    draft = "DRAFT"
    pending_approval = "PENDING_APPROVAL"
    approved = "APPROVED"
    sent_to_customer = "SENT_TO_CUSTOMER"
    negotiation = "NEGOTIATION"
    reapproval_required = "REAPPROVAL_REQUIRED"
    confirmed = "CONFIRMED"
    fulfillment = "FULFILLMENT"
    completed = "COMPLETED"


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(QuotationStatus), nullable=False, default=QuotationStatus.draft)
    risk_score = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lines = relationship("QuotationLine", back_populates="quotation", cascade="all, delete-orphan")
    customer = relationship("Customer")


class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id = Column(Integer, primary_key=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount_percent = Column(Float, nullable=False, default=0)
    subscription_plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=True)

    quotation = relationship("Quotation", back_populates="lines")
    product = relationship("Product")