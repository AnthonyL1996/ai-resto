from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.orm import relationship
from .base import Base

class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)  # Default language (Dutch)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    color = Column(String, default="#228be6")  # For UI theming
    description = Column(String, nullable=True)  # Default language (Dutch)

    # Relationship to translations
    translations = relationship("CategoryTranslation", back_populates="category", cascade="all, delete-orphan")