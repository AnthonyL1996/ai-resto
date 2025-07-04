#!/usr/bin/env python3
"""
Database migration to add allergen and dietary option columns
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import SessionLocal, engine

def migrate_allergens():
    db = SessionLocal()
    
    try:
        # Add allergens column
        try:
            db.execute(text("ALTER TABLE menu_items ADD COLUMN allergens JSON DEFAULT '[]'"))
            print("Added allergens column")
        except Exception as e:
            if "already exists" in str(e) or "duplicate column" in str(e):
                print("Allergens column already exists")
            else:
                raise e
        
        # Add dietary_options column
        try:
            db.execute(text("ALTER TABLE menu_items ADD COLUMN dietary_options JSON DEFAULT '[]'"))
            print("Added dietary_options column")
        except Exception as e:
            if "already exists" in str(e) or "duplicate column" in str(e):
                print("Dietary_options column already exists")
            else:
                raise e
        
        db.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_allergens()