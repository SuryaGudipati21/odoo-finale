from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database.session import Base


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(Integer, primary_key=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    quotation_line_id = Column(Integer, ForeignKey("quotation_lines.id"), nullable=True)
    comment = Column(String, nullable=True)
    proposed_discount_percent = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())