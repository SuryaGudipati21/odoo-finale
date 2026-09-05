from sqlalchemy import Column, Integer, Float, String, Enum

from app.database.session import Base
from app.models.customer import CustomerTier


class DiscountTierLimit(Base):
    """Order-level ceiling: max discount % allowed for a customer tier."""
    __tablename__ = "discount_tier_limits"

    id = Column(Integer, primary_key=True)
    tier = Column(Enum(CustomerTier), nullable=False, unique=True)
    max_discount_percent = Column(Float, nullable=False)


class CategoryDiscountLimit(Base):
    """Line-level ceiling: max discount % allowed for a product category."""
    __tablename__ = "category_discount_limits"

    id = Column(Integer, primary_key=True)
    category = Column(String, nullable=False, unique=True)
    max_discount_percent = Column(Float, nullable=False)