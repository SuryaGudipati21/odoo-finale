from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
import enum

from app.database.session import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    stock = relationship("Stock", back_populates="warehouse")


class Stock(Base):
    __tablename__ = "stock"

    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty_in_stock = Column(Integer, nullable=False, default=0)
    qty_reserved = Column(Integer, nullable=False, default=0)

    warehouse = relationship("Warehouse", back_populates="stock")
    product = relationship("Product")


class FulfillmentStatus(str, enum.Enum):
    split_pending = "SPLIT_PENDING"
    backorder = "BACKORDER"
    fulfilled = "FULFILLED"


class FulfillmentOrder(Base):
    __tablename__ = "fulfillment_orders"

    id = Column(Integer, primary_key=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    status = Column(Enum(FulfillmentStatus), nullable=False, default=FulfillmentStatus.split_pending)

    quotation = relationship("Quotation")
    allocations = relationship("WarehouseAllocation", back_populates="order", cascade="all, delete-orphan")


class WarehouseAllocation(Base):
    __tablename__ = "warehouse_allocations"

    id = Column(Integer, primary_key=True)
    fulfillment_order_id = Column(Integer, ForeignKey("fulfillment_orders.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False, default=0)

    order = relationship("FulfillmentOrder", back_populates="allocations")
    warehouse = relationship("Warehouse")
    product = relationship("Product")
