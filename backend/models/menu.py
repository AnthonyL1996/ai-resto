from sqlalchemy import Column, String, Float, Boolean, Integer
from .base import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    image_url = Column(String)
    prep_time = Column(Integer, nullable=False, default=15)  # in minutes