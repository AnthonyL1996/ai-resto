from sqlalchemy import Column, String, Boolean, DateTime, LargeBinary
from .base import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    password_hash = Column(LargeBinary, nullable=True)  # Nullable for anonymous orders
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default='now()')
    last_login = Column(DateTime)