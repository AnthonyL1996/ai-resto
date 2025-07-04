from pydantic import BaseModel
from typing import Optional, Dict, List

class TranslationBase(BaseModel):
    language_code: str
    name: str
    description: Optional[str] = None

class MenuItemTranslationCreate(TranslationBase):
    pass

class MenuItemTranslationResponse(TranslationBase):
    id: str
    menu_item_id: str

class CategoryTranslationCreate(TranslationBase):
    pass

class CategoryTranslationResponse(TranslationBase):
    id: str
    category_id: str

class MenuItemWithTranslations(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    category: str
    is_available: bool
    image_url: Optional[str] = None
    prep_time: int
    allergens: Optional[List[str]] = []
    dietary_options: Optional[List[str]] = []
    translations: Dict[str, Dict[str, str]] = {}  # {lang_code: {name: str, description: str}}

class CategoryWithTranslations(BaseModel):
    id: str
    name: str
    display_order: int
    is_active: bool
    color: str
    description: Optional[str] = None
    translations: Dict[str, Dict[str, str]] = {}  # {lang_code: {name: str, description: str}}