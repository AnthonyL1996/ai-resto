from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Boolean
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    reservation_id = Column(String, ForeignKey("reservations.id"), nullable=True)
    phone = Column(String, nullable=True)  # For anonymous orders
    customer_name = Column(String, nullable=True)  # For anonymous orders
    status = Column(String, default="received")
    created_at = Column(DateTime, server_default='now()')
    items = Column(JSON)  # Stores list of menu items with quantities
    payment_method = Column(String, nullable=False)
    payment_status = Column(String, default="pending")
    payment_provider = Column(String, default="payconiq")
    payment_reference = Column(String)
    time_slot = Column(DateTime, nullable=True)
    source = Column(String, default="manual")  # manual, kiosk, website
    notes = Column(String, nullable=True)
    print_status = Column(String, default="pending")
    print_attempts = Column(Integer, default=0)
    last_print_attempt = Column(DateTime, nullable=True)
    email_sent = Column(Boolean, default=False)
    customer_email = Column(String, nullable=True)