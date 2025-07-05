"""
Database migration utilities
"""

from sqlalchemy import text, Column, Integer
from sqlalchemy.exc import OperationalError, ProgrammingError
from database import engine
import logging

logger = logging.getLogger(__name__)

def migrate_add_order_number():
    """Add order_number column to orders table if it doesn't exist"""
    try:
        with engine.connect() as connection:
            # Check if the column exists
            try:
                # Try to query for the column
                result = connection.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='orders' AND column_name='order_number'
                """))
                
                if result.fetchone():
                    logger.info("order_number column already exists")
                    return True
                    
            except Exception as e:
                logger.warning(f"Could not check column existence: {e}")
            
            # Add the column
            logger.info("Adding order_number column to orders table...")
            
            try:
                # Add the column as nullable first
                connection.execute(text("""
                    ALTER TABLE orders 
                    ADD COLUMN order_number INTEGER
                """))
                connection.commit()
                logger.info("Added order_number column")
                
                # Update existing orders with sequential numbers
                logger.info("Updating existing orders with order numbers...")
                connection.execute(text("""
                    WITH numbered_orders AS (
                        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                        FROM orders 
                        WHERE order_number IS NULL
                    )
                    UPDATE orders 
                    SET order_number = numbered_orders.row_num
                    FROM numbered_orders 
                    WHERE orders.id = numbered_orders.id
                """))
                connection.commit()
                logger.info("Updated existing orders with order numbers")
                
                # Make the column NOT NULL and add unique constraint
                logger.info("Adding constraints to order_number column...")
                connection.execute(text("""
                    ALTER TABLE orders 
                    ALTER COLUMN order_number SET NOT NULL
                """))
                
                # Add unique constraint if it doesn't exist
                try:
                    connection.execute(text("""
                        ALTER TABLE orders 
                        ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number)
                    """))
                except Exception:
                    # Constraint might already exist
                    pass
                    
                connection.commit()
                logger.info("Migration completed successfully!")
                return True
                
            except Exception as e:
                logger.error(f"Failed to add order_number column: {e}")
                connection.rollback()
                return False
                
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False

def run_migrations():
    """Run all database migrations"""
    logger.info("Running database migrations...")
    
    migrations = [
        migrate_add_order_number,
    ]
    
    for migration in migrations:
        try:
            success = migration()
            if not success:
                logger.error(f"Migration {migration.__name__} failed")
        except Exception as e:
            logger.error(f"Migration {migration.__name__} failed with exception: {e}")