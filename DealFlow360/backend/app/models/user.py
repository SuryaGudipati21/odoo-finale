from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum

from app.database.session import Base


class UserRole(str, enum.Enum):
    sales_rep = "sales_rep"
    sales_manager = "sales_manager"
    finance = "finance"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)