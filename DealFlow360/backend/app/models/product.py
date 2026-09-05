from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    base_price = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="unit")
    tax_percent = Column(Float, nullable=False, default=0)
    description = Column(String, nullable=True)

    variants = relationship("ProductVariant", back_populates="product")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    attribute_name = Column(String, nullable=False)   # e.g. "Size"
    value = Column(String, nullable=False)            # e.g. "Large"
    extra_price = Column(Float, nullable=False, default=0)

    product = relationship("Product", back_populates="variants")