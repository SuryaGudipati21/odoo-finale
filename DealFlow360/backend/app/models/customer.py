from sqlalchemy import Column, Integer, String, Enum
import enum

from app.database.session import Base


class CustomerTier(str, enum.Enum):
    bronze = "bronze"
    silver = "silver"
    gold = "gold"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)  # portal login
    tier = Column(Enum(CustomerTier), nullable=False, default=CustomerTier.bronze)