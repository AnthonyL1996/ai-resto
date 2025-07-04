from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class MenuItemTranslation(Base):
    __tablename__ = "menu_item_translations"

    id = Column(String, primary_key=True)
    menu_item_id = Column(String, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(5), nullable=False)  # 'nl', 'en', 'fr', 'zh-HK'
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to MenuItem
    menu_item = relationship("MenuItem", back_populates="translations")

    # Unique constraint to ensure one translation per language per menu item
    __table_args__ = (
        UniqueConstraint('menu_item_id', 'language_code', name='uq_menu_item_language'),
    )

class CategoryTranslation(Base):
    __tablename__ = "category_translations"

    id = Column(String, primary_key=True)
    category_id = Column(String, ForeignKey("menu_categories.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(5), nullable=False)  # 'nl', 'en', 'fr', 'zh-HK'
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to MenuCategory
    category = relationship("MenuCategory", back_populates="translations")

    # Unique constraint to ensure one translation per language per category
    __table_args__ = (
        UniqueConstraint('category_id', 'language_code', name='uq_category_language'),
    )