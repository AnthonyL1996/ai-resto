from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from models.menu import MenuItem
from models.translations import MenuItemTranslation
from schemas.translations import MenuItemWithTranslations
from database import SessionLocal
import uuid

router = APIRouter(prefix="/menu", tags=["menu"])

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    is_available: bool = True
    image_url: str = None
    prep_time: int = 15

class MenuItemResponse(MenuItemCreate):
    id: str

@router.post("/", response_model=MenuItemResponse)
async def create_menu_item(item: MenuItemCreate):
    import uuid
    db = SessionLocal()
    try:
        db_item = MenuItem(
            id=str(uuid.uuid4()),
            name=item.name,
            description=item.description,
            price=item.price,
            category=item.category,
            is_available=item.is_available,
            image_url=item.image_url,
            prep_time=item.prep_time
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    finally:
        db.close()

@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(item_id: str, item: MenuItemCreate):
    db = SessionLocal()
    try:
        db_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        if item.name is not None:
            db_item.name = item.name
        if item.description is not None:
            db_item.description = item.description
        if item.price is not None:
            db_item.price = item.price
        if item.category is not None:
            db_item.category = item.category
        if item.is_available is not None:
            db_item.is_available = item.is_available
        if item.image_url is not None:
            db_item.image_url = item.image_url
        if item.prep_time is not None:
            db_item.prep_time = item.prep_time
            
        db.commit()
        db.refresh(db_item)
        return db_item
    finally:
        db.close()

@router.get("/", response_model=List[MenuItemWithTranslations])
async def get_menu_items(
    category: Optional[str] = None,
    language: Optional[str] = Query(None, description="Language code (en, fr, zh-HK)")
):
    db = SessionLocal()
    try:
        query = db.query(MenuItem).options(joinedload(MenuItem.translations))
        if category:
            query = query.filter(MenuItem.category == category)
        
        items = query.all()
        result = []
        
        for item in items:
            # Build translations dictionary
            translations = {}
            for trans in item.translations:
                translations[trans.language_code] = {
                    "name": trans.name,
                    "description": trans.description or ""
                }
            
            # If specific language requested, use translated name/description as primary
            display_name = item.name
            display_description = item.description
            
            if language and language in translations:
                display_name = translations[language]["name"]
                display_description = translations[language]["description"]
            
            result.append(MenuItemWithTranslations(
                id=item.id,
                name=display_name,
                description=display_description,
                price=item.price,
                category=item.category,
                is_available=item.is_available,
                image_url=item.image_url,
                prep_time=item.prep_time,
                allergens=item.allergens or [],
                dietary_options=item.dietary_options or [],
                translations=translations
            ))
        
        return result
    finally:
        db.close()

@router.get("/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(item_id: str):
    db = SessionLocal()
    try:
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return item
    finally:
        db.close()

@router.delete("/{item_id}")
async def delete_menu_item(item_id: str):
    db = SessionLocal()
    try:
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        db.delete(item)
        db.commit()
        return {"message": "Menu item deleted successfully"}
    finally:
        db.close()