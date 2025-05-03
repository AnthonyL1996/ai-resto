from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from datetime import datetime
from .base import Base
from enum import Enum as PyEnum
from .order import Order

class ReservationStatus(PyEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    READY = "ready"
    PICKED_UP = "picked_up"

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    phone = Column(String, nullable=False)
    pickup_time = Column(DateTime, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.PENDING)
    created_at = Column(DateTime, server_default='now()')
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    source = Column(String)  # website, phone, kiosk