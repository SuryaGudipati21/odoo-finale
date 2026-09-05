from sqlalchemy import Column, Integer, String, Float
from app.database.base import Base  # confirm this import path matches Surya's database/ setup

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    shipping_cost_weight = Column(Float, nullable=False, default=1.0)
    # PDF A4: "shipping cost weighting used by auto split logic to minimize shipments"