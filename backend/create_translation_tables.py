#!/usr/bin/env python3
"""
Migration script to create translation tables and populate with initial translations
"""

import uuid
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models.base import Base
from models.menu import MenuItem
from models.category import MenuCategory
from models.translations import MenuItemTranslation, CategoryTranslation

def generate_id():
    """Generate a unique ID"""
    return str(uuid.uuid4())

def create_tables():
    """Create the translation tables"""
    print("📋 Creating translation tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Translation tables created")

def populate_menu_item_translations(db: Session):
    """Populate menu item translations based on existing items"""
    
    # Translation mappings for Chinese restaurant items
    translations = {
        # RIJST (Rice dishes)
        "Rijst Kantonees": {
            "en": {"name": "Cantonese Rice", "description": "Fried rice with egg, ham, shrimp and vegetables"},
            "fr": {"name": "Riz Cantonais", "description": "Riz frit avec œuf, jambon, crevettes et légumes"},
            "zh-HK": {"name": "廣東炒飯", "description": "雞蛋火腿蝦仁炒飯配蔬菜"}
        },
        "Rijst Speciaal": {
            "en": {"name": "Special Rice", "description": "Fried rice with chicken, beef, shrimp and vegetables"},
            "fr": {"name": "Riz Spécial", "description": "Riz frit avec poulet, bœuf, crevettes et légumes"},
            "zh-HK": {"name": "特色炒飯", "description": "雞肉牛肉蝦仁炒飯配蔬菜"}
        },
        "Rijst Kip": {
            "en": {"name": "Chicken Rice", "description": "Fried rice with chicken and Chinese vegetables"},
            "fr": {"name": "Riz au Poulet", "description": "Riz frit avec poulet et légumes chinois"},
            "zh-HK": {"name": "雞肉炒飯", "description": "雞肉炒飯配中式蔬菜"}
        },
        "Rijst Rundvlees": {
            "en": {"name": "Beef Rice", "description": "Fried rice with beef and vegetables"},
            "fr": {"name": "Riz au Bœuf", "description": "Riz frit avec bœuf et légumes"},
            "zh-HK": {"name": "牛肉炒飯", "description": "牛肉炒飯配蔬菜"}
        },
        "Rijst Garnalen": {
            "en": {"name": "Shrimp Rice", "description": "Fried rice with shrimp and spring onions"},
            "fr": {"name": "Riz aux Crevettes", "description": "Riz frit avec crevettes et oignons verts"},
            "zh-HK": {"name": "蝦仁炒飯", "description": "蝦仁炒飯配韭黃"}
        },
        
        # BAMI (Noodle dishes)
        "Bami Kantonees": {
            "en": {"name": "Cantonese Noodles", "description": "Fried noodles with egg, ham, shrimp and vegetables"},
            "fr": {"name": "Nouilles Cantonaises", "description": "Nouilles frites avec œuf, jambon, crevettes et légumes"},
            "zh-HK": {"name": "廣東炒麵", "description": "雞蛋火腿蝦仁炒麵配蔬菜"}
        },
        "Bami Speciaal": {
            "en": {"name": "Special Noodles", "description": "Fried noodles with chicken, beef, shrimp and vegetables"},
            "fr": {"name": "Nouilles Spéciales", "description": "Nouilles frites avec poulet, bœuf, crevettes et légumes"},
            "zh-HK": {"name": "特色炒麵", "description": "雞肉牛肉蝦仁炒麵配蔬菜"}
        },
        "Bami Kip": {
            "en": {"name": "Chicken Noodles", "description": "Fried noodles with chicken and Chinese vegetables"},
            "fr": {"name": "Nouilles au Poulet", "description": "Nouilles frites avec poulet et légumes chinois"},
            "zh-HK": {"name": "雞肉炒麵", "description": "雞肉炒麵配中式蔬菜"}
        },
        "Bami Vegetarisch": {
            "en": {"name": "Vegetarian Noodles", "description": "Fried noodles with fresh vegetables and bean sprouts"},
            "fr": {"name": "Nouilles Végétariennes", "description": "Nouilles frites avec légumes frais et pousses de soja"},
            "zh-HK": {"name": "素食炒麵", "description": "素炒麵配新鮮蔬菜豆芽"}
        },
        
        # VLEES (Meat dishes)
        "Kip Cashewnoten": {
            "en": {"name": "Chicken Cashew Nuts", "description": "Stir-fried chicken with cashew nuts and vegetables"},
            "fr": {"name": "Poulet aux Noix de Cajou", "description": "Poulet sauté avec noix de cajou et légumes"},
            "zh-HK": {"name": "腰果雞丁", "description": "腰果炒雞丁配蔬菜"}
        },
        "Kip Zoetzuur": {
            "en": {"name": "Sweet & Sour Chicken", "description": "Deep-fried chicken with sweet and sour sauce"},
            "fr": {"name": "Poulet Aigre-Doux", "description": "Poulet frit avec sauce aigre-douce"},
            "zh-HK": {"name": "咕嚕雞", "description": "炸雞配糖醋汁"}
        },
        "Rundvlees Oestersaus": {
            "en": {"name": "Beef in Oyster Sauce", "description": "Stir-fried beef with oyster sauce and vegetables"},
            "fr": {"name": "Bœuf à la Sauce d'Huître", "description": "Bœuf sauté avec sauce d'huître et légumes"},
            "zh-HK": {"name": "蠔油牛肉", "description": "蠔油炒牛肉配蔬菜"}
        },
        
        # Add more translations as needed...
        # For items without specific translations, we'll use generic ones
    }
    
    menu_items = db.query(MenuItem).all()
    translation_count = 0
    
    for item in menu_items:
        if item.name in translations:
            item_translations = translations[item.name]
            
            for lang_code, translation in item_translations.items():
                # Check if translation already exists
                existing = db.query(MenuItemTranslation).filter(
                    MenuItemTranslation.menu_item_id == item.id,
                    MenuItemTranslation.language_code == lang_code
                ).first()
                
                if not existing:
                    translation_record = MenuItemTranslation(
                        id=generate_id(),
                        menu_item_id=item.id,
                        language_code=lang_code,
                        name=translation["name"],
                        description=translation["description"]
                    )
                    db.add(translation_record)
                    translation_count += 1
        else:
            # Create generic English translation for items without specific translations
            existing = db.query(MenuItemTranslation).filter(
                MenuItemTranslation.menu_item_id == item.id,
                MenuItemTranslation.language_code == "en"
            ).first()
            
            if not existing:
                translation_record = MenuItemTranslation(
                    id=generate_id(),
                    menu_item_id=item.id,
                    language_code="en",
                    name=item.name,  # Use Dutch name as fallback
                    description=item.description or ""
                )
                db.add(translation_record)
                translation_count += 1
    
    print(f"✅ Created {translation_count} menu item translations")

def populate_category_translations(db: Session):
    """Populate category translations"""
    
    category_translations = {
        "Rijst": {
            "en": {"name": "Rice Dishes", "description": "Fried rice dishes"},
            "fr": {"name": "Plats de Riz", "description": "Plats de riz frit"},
            "zh-HK": {"name": "飯類", "description": "炒飯類"}
        },
        "Bami": {
            "en": {"name": "Noodle Dishes", "description": "Chinese noodle dishes"},
            "fr": {"name": "Plats de Nouilles", "description": "Plats de nouilles chinoises"},
            "zh-HK": {"name": "麵類", "description": "中式炒麵類"}
        },
        "Vlees": {
            "en": {"name": "Meat Dishes", "description": "Meat dishes with chicken, beef and pork"},
            "fr": {"name": "Plats de Viande", "description": "Plats de viande avec poulet, bœuf et porc"},
            "zh-HK": {"name": "肉類", "description": "雞肉牛肉豬肉類"}
        },
        "Garnalen": {
            "en": {"name": "Shrimp Dishes", "description": "Fresh shrimp dishes"},
            "fr": {"name": "Plats de Crevettes", "description": "Plats de crevettes fraîches"},
            "zh-HK": {"name": "蝦類", "description": "新鮮蝦類"}
        },
        "Vis": {
            "en": {"name": "Fish Dishes", "description": "Fish dishes"},
            "fr": {"name": "Plats de Poisson", "description": "Plats de poisson"},
            "zh-HK": {"name": "魚類", "description": "魚類菜式"}
        },
        "Soep": {
            "en": {"name": "Soups", "description": "Traditional Chinese soups"},
            "fr": {"name": "Soupes", "description": "Soupes chinoises traditionnelles"},
            "zh-HK": {"name": "湯類", "description": "傳統中式湯"}
        },
        "Voorgerecht": {
            "en": {"name": "Appetizers", "description": "Spring rolls and other appetizers"},
            "fr": {"name": "Entrées", "description": "Rouleaux de printemps et autres entrées"},
            "zh-HK": {"name": "前菜", "description": "春卷等前菜"}
        },
        "Dessert": {
            "en": {"name": "Desserts", "description": "Sweet desserts"},
            "fr": {"name": "Desserts", "description": "Desserts sucrés"},
            "zh-HK": {"name": "甜品", "description": "甜品類"}
        },
        "Drank": {
            "en": {"name": "Drinks", "description": "Cold and hot drinks"},
            "fr": {"name": "Boissons", "description": "Boissons froides et chaudes"},
            "zh-HK": {"name": "飲品", "description": "冷熱飲品"}
        }
    }
    
    categories = db.query(MenuCategory).all()
    translation_count = 0
    
    for category in categories:
        if category.name in category_translations:
            cat_translations = category_translations[category.name]
            
            for lang_code, translation in cat_translations.items():
                # Check if translation already exists
                existing = db.query(CategoryTranslation).filter(
                    CategoryTranslation.category_id == category.id,
                    CategoryTranslation.language_code == lang_code
                ).first()
                
                if not existing:
                    translation_record = CategoryTranslation(
                        id=generate_id(),
                        category_id=category.id,
                        language_code=lang_code,
                        name=translation["name"],
                        description=translation["description"]
                    )
                    db.add(translation_record)
                    translation_count += 1
    
    print(f"✅ Created {translation_count} category translations")

def main():
    """Main migration function"""
    print("🌍 Starting translation tables migration...")
    
    # Create tables
    create_tables()
    
    db = SessionLocal()
    try:
        # Populate translations
        print("📝 Populating menu item translations...")
        populate_menu_item_translations(db)
        
        print("📂 Populating category translations...")
        populate_category_translations(db)
        
        # Commit all changes
        db.commit()
        print("\n🎉 Translation migration completed successfully!")
        print("🌍 Your menu now supports multiple languages!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()