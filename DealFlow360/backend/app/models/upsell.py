from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database.session import Base


class ProductPairing(Base):
    """If base_product is in the cart, suggest suggested_product."""
    __tablename__ = "product_pairings"

    id = Column(Integer, primary_key=True)
    base_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    suggested_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    margin_delta = Column(Float, nullable=False, default=0)
    is_promoted = Column(Boolean, default=False)

    suggested_product = relationship("Product", foreign_keys=[suggested_product_id])