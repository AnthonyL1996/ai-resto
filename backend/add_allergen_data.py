#!/usr/bin/env python3
"""
Script to add allergen and dietary option data to existing menu items
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.menu import MenuItem

def add_allergen_data():
    db = SessionLocal()
    
    try:
        # Sample allergen and dietary data for common Chinese dishes
        allergen_data = {
            # Rice dishes
            "Rijst Kantonees": {"allergens": ["soy"], "dietary_options": []},
            "Rijst Speciaal": {"allergens": ["soy", "egg"], "dietary_options": []},
            "Rijst Kip": {"allergens": ["soy"], "dietary_options": []},
            "Rijst Rundvlees": {"allergens": ["soy"], "dietary_options": []},
            "Rijst Garnalen": {"allergens": ["soy", "shellfish"], "dietary_options": []},
            
            # Noodle dishes
            "Bami Kantonees": {"allergens": ["gluten", "soy"], "dietary_options": []},
            "Bami Speciaal": {"allergens": ["gluten", "soy", "egg"], "dietary_options": []},
            "Bami Kip": {"allergens": ["gluten", "soy"], "dietary_options": []},
            "Bami Vegetarisch": {"allergens": ["gluten", "soy"], "dietary_options": ["vegetarian"]},
            
            # Main dishes
            "Kip Cashewnoten": {"allergens": ["nuts", "soy"], "dietary_options": []},
            "Kip Zoetzuur": {"allergens": ["soy"], "dietary_options": []},
            "Rundvlees Oestersaus": {"allergens": ["soy", "fish"], "dietary_options": []},
            "Varkensvlees Zoetzuur": {"allergens": ["soy"], "dietary_options": []},
            "Kip Kung Pao": {"allergens": ["nuts", "soy"], "dietary_options": []},
            "Garnalen Zoetzuur": {"allergens": ["soy", "shellfish"], "dietary_options": []},
            
            # Additional common allergens for other dishes
            "Kippenvleugels (6 stuks)": {"allergens": ["soy"], "dietary_options": []},
            "Garnalen Knoflook": {"allergens": ["soy", "shellfish"], "dietary_options": []},
        }
        
        # Update menu items with allergen data
        for item_name, data in allergen_data.items():
            menu_item = db.query(MenuItem).filter(MenuItem.name == item_name).first()
            if menu_item:
                menu_item.allergens = data["allergens"]
                menu_item.dietary_options = data["dietary_options"]
                print(f"Updated {item_name} with allergens: {data['allergens']}, dietary: {data['dietary_options']}")
            else:
                print(f"Menu item '{item_name}' not found")
        
        # Add some vegetarian/vegan options
        vegetarian_items = db.query(MenuItem).filter(MenuItem.name.like('%Vegetarisch%')).all()
        for item in vegetarian_items:
            if item.dietary_options is None:
                item.dietary_options = []
            if "vegetarian" not in item.dietary_options:
                item.dietary_options.append("vegetarian")
            print(f"Added vegetarian option to {item.name}")
        
        db.commit()
        print("Allergen data added successfully!")
        
    except Exception as e:
        print(f"Error adding allergen data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_allergen_data()