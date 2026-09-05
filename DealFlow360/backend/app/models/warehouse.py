from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database.session import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    shipping_cost_weight = Column(Float, nullable=False, default=1.0)  # higher = costlier to ship from


class Stock(Base):
    __tablename__ = "stock"

    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)

    warehouse = relationship("Warehouse")
    product = relationship("Product")


class Fulfillment(Base):
    __tablename__ = "fulfillments"

    id = Column(Integer, primary_key=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    is_manual_override = Column(Boolean, default=False)

    lines = relationship("FulfillmentLine", back_populates="fulfillment", cascade="all, delete-orphan")


class FulfillmentLine(Base):
    __tablename__ = "fulfillment_lines"

    id = Column(Integer, primary_key=True)
    fulfillment_id = Column(Integer, ForeignKey("fulfillments.id"), nullable=False)
    quotation_line_id = Column(Integer, ForeignKey("quotation_lines.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)  # null if backordered
    quantity_allocated = Column(Integer, nullable=False)
    is_backorder = Column(Boolean, default=False)

    fulfillment = relationship("Fulfillment", back_populates="lines")
    warehouse = relationship("Warehouse")