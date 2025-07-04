from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
from models.category import MenuCategory
from models.translations import CategoryTranslation
from schemas.translations import CategoryWithTranslations

router = APIRouter(prefix="/categories", tags=["categories"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CategoryCreate(BaseModel):
    name: str
    display_order: int = 0
    is_active: bool = True
    color: str = "#228be6"
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    display_order: int
    is_active: bool
    color: str
    description: Optional[str] = None

@router.get("/", response_model=List[CategoryWithTranslations])
async def get_categories(
    language: Optional[str] = Query(None, description="Language code (en, fr, zh-HK)"),
    db: Session = Depends(get_db)
):
    categories = db.query(MenuCategory).options(joinedload(MenuCategory.translations)).order_by(MenuCategory.display_order, MenuCategory.name).all()
    result = []
    
    for category in categories:
        # Build translations dictionary
        translations = {}
        for trans in category.translations:
            translations[trans.language_code] = {
                "name": trans.name,
                "description": trans.description or ""
            }
        
        # If specific language requested, use translated name/description as primary
        display_name = category.name
        display_description = category.description
        
        if language and language in translations:
            display_name = translations[language]["name"]
            display_description = translations[language]["description"]
        
        result.append(CategoryWithTranslations(
            id=category.id,
            name=display_name,
            display_order=category.display_order,
            is_active=category.is_active,
            color=category.color,
            description=display_description,
            translations=translations
        ))
    
    return result

@router.post("/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    # Check if category name already exists
    existing = db.query(MenuCategory).filter(MenuCategory.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Generate unique ID
    import uuid
    category_id = str(uuid.uuid4())
    
    db_category = MenuCategory(
        id=category_id,
        name=category.name,
        display_order=category.display_order,
        is_active=category.is_active,
        color=category.color,
        description=category.description
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return {
        "id": db_category.id,
        "name": db_category.name,
        "display_order": db_category.display_order,
        "is_active": db_category.is_active,
        "color": db_category.color,
        "description": db_category.description
    }

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str, db: Session = Depends(get_db)):
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {
        "id": category.id,
        "name": category.name,
        "display_order": category.display_order,
        "is_active": category.is_active,
        "color": category.color,
        "description": category.description
    }

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category_update: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing categories
    if category_update.name and category_update.name != category.name:
        existing = db.query(MenuCategory).filter(MenuCategory.name == category_update.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Update fields
    if category_update.name is not None:
        category.name = category_update.name
    if category_update.display_order is not None:
        category.display_order = category_update.display_order
    if category_update.is_active is not None:
        category.is_active = category_update.is_active
    if category_update.color is not None:
        category.color = category_update.color
    if category_update.description is not None:
        category.description = category_update.description
    
    db.commit()
    db.refresh(category)
    
    return {
        "id": category.id,
        "name": category.name,
        "display_order": category.display_order,
        "is_active": category.is_active,
        "color": category.color,
        "description": category.description
    }

@router.delete("/{category_id}")
async def delete_category(category_id: str, db: Session = Depends(get_db)):
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is being used by menu items
    from models.menu import MenuItem
    items_using_category = db.query(MenuItem).filter(MenuItem.category == category.name).count()
    if items_using_category > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category. {items_using_category} menu items are using this category."
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}

@router.patch("/{category_id}/reorder", response_model=CategoryResponse)
async def reorder_category(category_id: str, new_order: int, db: Session = Depends(get_db)):
    category = db.query(MenuCategory).filter(MenuCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.display_order = new_order
    db.commit()
    db.refresh(category)
    
    return {
        "id": category.id,
        "name": category.name,
        "display_order": category.display_order,
        "is_active": category.is_active,
        "color": category.color,
        "description": category.description
    }