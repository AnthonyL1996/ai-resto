from sqlalchemy import Column, String, Float, Boolean, Integer, JSON
from sqlalchemy.orm import relationship
from .base import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)  # Default language (Dutch)
    description = Column(String)  # Default language (Dutch)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    image_url = Column(String)
    prep_time = Column(Integer, nullable=False, default=15)  # in minutes
    allergens = Column(JSON, default=list)  # List of allergens: ['gluten', 'lactose', 'nuts', etc.]
    dietary_options = Column(JSON, default=list)  # List of dietary options: ['vegetarian', 'vegan', 'glutenFree']

    # Relationship to translations
    translations = relationship("MenuItemTranslation", back_populates="menu_item", cascade="all, delete-orphan")