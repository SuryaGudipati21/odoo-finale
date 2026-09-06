from sqlalchemy import Column, Integer, Float, String, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.customer import CustomerTier


class PriceList(Base):
    """A named price list, scoped to a customer tier and currency.

    Spec ref: A2 Product & Price List Management -- "Price Lists: Customer
    tier based pricing, currency specific rules."
    """
    __tablename__ = "price_lists"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    tier = Column(Enum(CustomerTier), nullable=False)
    currency = Column(String, nullable=False, default="USD")

    items = relationship(
        "PriceListItem", back_populates="price_list", cascade="all, delete-orphan"
    )


class PriceListItem(Base):
    """Override price for a specific product within a price list.

    If no PriceListItem exists for a (price_list, product) pair, callers
    should fall back to Product.base_price.
    """
    __tablename__ = "price_list_items"

    id = Column(Integer, primary_key=True)
    price_list_id = Column(Integer, ForeignKey("price_lists.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    price = Column(Float, nullable=False)

    price_list = relationship("PriceList", back_populates="items")
    product = relationship("Product")