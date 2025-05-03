from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from models.menu import MenuItem
from database import SessionLocal

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
    db = SessionLocal()
    try:
        db_item = MenuItem(**item.dict())
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
        
        for key, value in item.dict().items():
            setattr(db_item, key, value)
            
        db.commit()
        db.refresh(db_item)
        return db_item
    finally:
        db.close()

@router.get("/", response_model=List[MenuItemResponse])
async def get_menu_items(category: str = None):
    db = SessionLocal()
    try:
        query = db.query(MenuItem)
        if category:
            query = query.filter(MenuItem.category == category)
        return query.all()
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