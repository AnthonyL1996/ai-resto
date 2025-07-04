from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid

from database import SessionLocal
from models.translations import MenuItemTranslation, CategoryTranslation

router = APIRouter(prefix="/translations", tags=["translations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TranslationUpdate(BaseModel):
    translations: Dict[str, Dict[str, str]]  # {lang_code: {name: str, description: str}}

@router.put("/menu-item/{item_id}")
async def update_menu_item_translations(
    item_id: str, 
    translation_data: TranslationUpdate,
    db: Session = Depends(get_db)
):
    """Update translations for a menu item"""
    try:
        # Delete existing translations for this item
        db.query(MenuItemTranslation).filter(MenuItemTranslation.menu_item_id == item_id).delete()
        
        # Add new translations
        for lang_code, content in translation_data.translations.items():
            if content.get('name'):  # Only create translation if name is provided
                translation = MenuItemTranslation(
                    id=str(uuid.uuid4()),
                    menu_item_id=item_id,
                    language_code=lang_code,
                    name=content['name'],
                    description=content.get('description', '')
                )
                db.add(translation)
        
        db.commit()
        return {"message": "Translations updated successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update translations: {str(e)}")

@router.put("/category/{category_id}")
async def update_category_translations(
    category_id: str, 
    translation_data: TranslationUpdate,
    db: Session = Depends(get_db)
):
    """Update translations for a category"""
    try:
        # Delete existing translations for this category
        db.query(CategoryTranslation).filter(CategoryTranslation.category_id == category_id).delete()
        
        # Add new translations
        for lang_code, content in translation_data.translations.items():
            if content.get('name'):  # Only create translation if name is provided
                translation = CategoryTranslation(
                    id=str(uuid.uuid4()),
                    category_id=category_id,
                    language_code=lang_code,
                    name=content['name'],
                    description=content.get('description', '')
                )
                db.add(translation)
        
        db.commit()
        return {"message": "Translations updated successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update translations: {str(e)}")