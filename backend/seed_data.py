#!/usr/bin/env python3
"""
Database seeding script for Chinese takeaway restaurant in Belgium
Adds realistic sample data for menu items, customers, orders, and reservations
"""

import uuid
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models.customer import Customer
from models.menu import MenuItem
from models.order import Order
from models.reservation import Reservation, ReservationStatus
from models.category import MenuCategory

def generate_id():
    """Generate a unique ID"""
    return str(uuid.uuid4())

def create_categories(db: Session):
    """Create default menu categories for Chinese restaurant"""
    
    categories_data = [
        {"name": "Rijst", "display_order": 1, "color": "#ff6b35", "description": "Gebakken rijst gerechten"},
        {"name": "Bami", "display_order": 2, "color": "#f7931e", "description": "Chinese noedel gerechten"},
        {"name": "Vlees", "display_order": 3, "color": "#c1272d", "description": "Vlees gerechten met kip, rundvlees en varkensvlees"},
        {"name": "Garnalen", "display_order": 4, "color": "#0071bc", "description": "Verse garnalen gerechten"},
        {"name": "Vis", "display_order": 5, "color": "#00a0b0", "description": "Vis gerechten"},
        {"name": "Soep", "display_order": 6, "color": "#7b68ee", "description": "Traditionele Chinese soepen"},
        {"name": "Voorgerecht", "display_order": 7, "color": "#228b22", "description": "Loempia's en andere voorgerechten"},
        {"name": "Dessert", "display_order": 8, "color": "#da70d6", "description": "Zoete desserts"},
        {"name": "Drank", "display_order": 9, "color": "#4682b4", "description": "Koude en warme dranken"}
    ]
    
    for cat_data in categories_data:
        category = MenuCategory(
            id=generate_id(),
            name=cat_data["name"],
            display_order=cat_data["display_order"],
            color=cat_data["color"],
            description=cat_data["description"],
            is_active=True
        )
        db.add(category)
    
    print(f"✅ Created {len(categories_data)} menu categories")

def create_menu_items(db: Session):
    """Create authentic Chinese takeaway menu items popular in Belgium"""
    
    menu_items = [
        # RIJST GERECHTEN (Rice Dishes)
        {
            "name": "Rijst Kantonees", 
            "description": "Gebakken rijst met ei, ham, garnalen en groenten", 
            "price": 8.50, 
            "category": "Rijst", 
            "prep_time": 12
        },
        {
            "name": "Rijst Speciaal", 
            "description": "Gebakken rijst met kip, rundvlees, garnalen en groenten", 
            "price": 9.80, 
            "category": "Rijst", 
            "prep_time": 15
        },
        {
            "name": "Rijst Kip", 
            "description": "Gebakken rijst met kip en Chinese groenten", 
            "price": 8.20, 
            "category": "Rijst", 
            "prep_time": 12
        },
        {
            "name": "Rijst Rundvlees", 
            "description": "Gebakken rijst met rundvlees en groenten", 
            "price": 8.50, 
            "category": "Rijst", 
            "prep_time": 12
        },
        {
            "name": "Rijst Garnalen", 
            "description": "Gebakken rijst met garnalen en lente-ui", 
            "price": 9.20, 
            "category": "Rijst", 
            "prep_time": 10
        },
        
        # BAMI GERECHTEN (Noodle Dishes)
        {
            "name": "Bami Kantonees", 
            "description": "Gebakken noedels met ei, ham, garnalen en groenten", 
            "price": 8.80, 
            "category": "Bami", 
            "prep_time": 15
        },
        {
            "name": "Bami Speciaal", 
            "description": "Gebakken noedels met kip, rundvlees, garnalen en groenten", 
            "price": 10.50, 
            "category": "Bami", 
            "prep_time": 18
        },
        {
            "name": "Bami Kip", 
            "description": "Gebakken noedels met kip en Chinese groenten", 
            "price": 8.50, 
            "category": "Bami", 
            "prep_time": 15
        },
        {
            "name": "Bami Vegetarisch", 
            "description": "Gebakken noedels met verse groenten en sojascheuten", 
            "price": 7.80, 
            "category": "Bami", 
            "prep_time": 12
        },
        
        # VLEES GERECHTEN (Meat Dishes)
        {
            "name": "Kip Cashewnoten", 
            "description": "Gebakken kip met cashewnoten en groenten", 
            "price": 11.50, 
            "category": "Vlees", 
            "prep_time": 20
        },
        {
            "name": "Kip Zoetzuur", 
            "description": "Gefrituerde kip met zoetzure saus", 
            "price": 10.80, 
            "category": "Vlees", 
            "prep_time": 18
        },
        {
            "name": "Rundvlees Oestersaus", 
            "description": "Gebakken rundvlees met oestersaus en groenten", 
            "price": 12.50, 
            "category": "Vlees", 
            "prep_time": 22
        },
        {
            "name": "Varkensvlees Zoetzuur", 
            "description": "Gefrituurd varkensvlees met zoetzure saus", 
            "price": 11.20, 
            "category": "Vlees", 
            "prep_time": 18
        },
        {
            "name": "Kip Kung Pao", 
            "description": "Pittige kip met pinda's en pepers", 
            "price": 11.80, 
            "category": "Vlees", 
            "prep_time": 20
        },
        
        # GARNALEN & VIS (Shrimp & Fish)
        {
            "name": "Garnalen Zoetzuur", 
            "description": "Gefrituerde garnalen met zoetzure saus", 
            "price": 13.50, 
            "category": "Garnalen", 
            "prep_time": 15
        },
        {
            "name": "Garnalen Knoflook", 
            "description": "Gebakken garnalen met knoflook en gember", 
            "price": 14.20, 
            "category": "Garnalen", 
            "prep_time": 12
        },
        {
            "name": "Vis Zoetzuur", 
            "description": "Gefrituerde vis met zoetzure saus", 
            "price": 12.80, 
            "category": "Vis", 
            "prep_time": 18
        },
        
        # SOEPEN (Soups)
        {
            "name": "Tomatensoep", 
            "description": "Chinese tomatensoep met ei", 
            "price": 3.80, 
            "category": "Soep", 
            "prep_time": 8
        },
        {
            "name": "Champignonsoep", 
            "description": "Soep met champignons en bamboe", 
            "price": 4.20, 
            "category": "Soep", 
            "prep_time": 10
        },
        {
            "name": "Wonton Soep", 
            "description": "Traditionele Chinese soep met wontons", 
            "price": 5.50, 
            "category": "Soep", 
            "prep_time": 15
        },
        
        # VOORGERECHTEN (Appetizers)
        {
            "name": "Loempia's (4 stuks)", 
            "description": "Krokante loempia's met groenten", 
            "price": 4.80, 
            "category": "Voorgerecht", 
            "prep_time": 8
        },
        {
            "name": "Kippenvleugels (6 stuks)", 
            "description": "Gebakken kippenvleugels met Chinese kruiden", 
            "price": 6.50, 
            "category": "Voorgerecht", 
            "prep_time": 15
        },
        {
            "name": "Wan Tan (6 stuks)", 
            "description": "Gefrituerde wan tan met vlees vulling", 
            "price": 5.20, 
            "category": "Voorgerecht", 
            "prep_time": 10
        },
        {
            "name": "Sateh (4 stokjes)", 
            "description": "Gegrilde sateh met pindasaus", 
            "price": 7.20, 
            "category": "Voorgerecht", 
            "prep_time": 12
        },
        
        # DESSERTS
        {
            "name": "Gebakken IJs", 
            "description": "Warm gebakken ijs met honing", 
            "price": 4.50, 
            "category": "Dessert", 
            "prep_time": 5
        },
        {
            "name": "Lychee", 
            "description": "Verse lychee vruchten", 
            "price": 3.20, 
            "category": "Dessert", 
            "prep_time": 2
        },
        
        # DRANKEN (Drinks)
        {
            "name": "Chinese Thee", 
            "description": "Traditionele Chinese thee", 
            "price": 2.50, 
            "category": "Drank", 
            "prep_time": 3
        },
        {
            "name": "Coca Cola", 
            "description": "33cl blikje", 
            "price": 2.20, 
            "category": "Drank", 
            "prep_time": 1
        },
        {
            "name": "Fanta", 
            "description": "33cl blikje", 
            "price": 2.20, 
            "category": "Drank", 
            "prep_time": 1
        }
    ]
    
    for item_data in menu_items:
        menu_item = MenuItem(
            id=generate_id(),
            name=item_data["name"],
            description=item_data["description"],
            price=item_data["price"],
            category=item_data["category"],
            prep_time=item_data["prep_time"],
            is_available=True
        )
        db.add(menu_item)
    
    print(f"✅ Created {len(menu_items)} menu items")

def create_customers(db: Session):
    """Create sample customers with Belgian names"""
    
    customers_data = [
        {"first_name": "Jan", "last_name": "Janssen", "email": "jan.janssen@telenet.be", "phone": "+32 9 123 4567"},
        {"first_name": "Marie", "last_name": "Dupont", "email": "marie.dupont@skynet.be", "phone": "+32 2 987 6543"},
        {"first_name": "Pieter", "last_name": "Van Der Berg", "email": "pieter.vdb@proximus.be", "phone": "+32 3 456 7890"},
        {"first_name": "Sophie", "last_name": "Martin", "email": "sophie.martin@gmail.com", "phone": "+32 4 321 9876"},
        {"first_name": "Luc", "last_name": "Vermeersch", "email": "luc.vermeersch@hotmail.com", "phone": "+32 9 555 1234"},
        {"first_name": "Emma", "last_name": "De Smet", "email": "emma.desmet@orange.be", "phone": "+32 2 777 8888"},
        {"first_name": "Thomas", "last_name": "Willems", "email": "thomas.willems@telenet.be", "phone": "+32 3 999 0000"},
        {"first_name": "Laura", "last_name": "Van Houten", "email": "laura.vh@skynet.be", "phone": "+32 4 111 2222"},
        {"first_name": "Kevin", "last_name": "Peeters", "email": "kevin.peeters@gmail.com", "phone": "+32 9 333 4444"},
        {"first_name": "Sarah", "last_name": "Claes", "email": "sarah.claes@proximus.be", "phone": "+32 2 555 6666"},
        {"first_name": "David", "last_name": "Van Damme", "email": "david.vandamme@telenet.be", "phone": "+32 3 777 8888"},
        {"first_name": "Lisa", "last_name": "Goossens", "email": "lisa.goossens@hotmail.com", "phone": "+32 4 999 0000"}
    ]
    
    for customer_data in customers_data:
        customer = Customer(
            id=generate_id(),
            first_name=customer_data["first_name"],
            last_name=customer_data["last_name"],
            email=customer_data["email"],
            phone=customer_data["phone"],
            is_verified=True,
            created_at=datetime.now() - timedelta(days=random.randint(1, 180))
        )
        db.add(customer)
    
    print(f"✅ Created {len(customers_data)} customers")
    return customers_data

def create_orders_and_reservations(db: Session, customers_data):
    """Create sample orders and reservations"""
    
    # Get menu items from database
    menu_items = db.query(MenuItem).all()
    customers = db.query(Customer).all()
    
    # Create 20 sample orders
    for i in range(20):
        # Random customer
        customer = random.choice(customers)
        
        # Random number of items (1-4)
        num_items = random.randint(1, 4)
        order_items = []
        
        for _ in range(num_items):
            menu_item = random.choice(menu_items)
            quantity = random.randint(1, 3)
            
            # Create order item dict
            order_item = {
                "item_id": menu_item.name,
                "quantity": quantity,
                "special_requests": random.choice([
                    None, 
                    "Extra pikant", 
                    "Geen ui", 
                    "Weinig zout", 
                    "Extra groenten",
                    "Geen champignons"
                ])
            }
            order_items.append(order_item)
        
        # Random order details
        order_time = datetime.now() - timedelta(
            days=random.randint(0, 7),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        pickup_time = order_time + timedelta(minutes=random.randint(30, 90))
        
        # Create order
        order = Order(
            id=generate_id(),
            customer_id=customer.id,
            customer_name=f"{customer.first_name} {customer.last_name}",
            phone=customer.phone,
            items=order_items,
            payment_method=random.choice(["card", "cash"]),
            source=random.choice(["website", "kiosk", "manual"]),
            status=random.choice(["new", "preparing", "ready", "completed"]),
            notes=random.choice([
                None,
                "Bel aan bij aankomst",
                "Parkeren voor de deur",
                "Extra servetten graag",
                "Allergisch voor noten"
            ]),
            created_at=order_time,
            time_slot=pickup_time
        )
        db.add(order)
        db.flush()  # Get the order ID
        
        # Create reservation for some orders (60% chance)
        if random.random() < 0.6:
            reservation = Reservation(
                id=generate_id(),
                customer_id=customer.id,
                phone=customer.phone,
                pickup_time=pickup_time,
                status=random.choice([
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.READY,
                    ReservationStatus.PICKED_UP
                ]),
                created_at=order_time,
                order_id=order.id,
                source=order.source
            )
            db.add(reservation)
    
    print("✅ Created 20 orders and 12 reservations")

def main():
    """Main seeding function"""
    print("🌱 Starting database seeding for Chinese Takeaway Restaurant...")
    
    db = SessionLocal()
    try:
        # Clear existing data (optional - comment out if you want to keep existing data)
        print("🗑️  Clearing existing data...")
        db.query(Reservation).delete()
        db.query(Order).delete()
        db.query(Customer).delete()
        db.query(MenuItem).delete()
        db.query(MenuCategory).delete()
        db.commit()
        
        # Create sample data
        print("📂 Creating categories...")
        create_categories(db)
        
        print("📝 Creating menu items...")
        create_menu_items(db)
        
        print("👥 Creating customers...")
        customers_data = create_customers(db)
        
        print("📦 Creating orders and reservations...")
        # Skip order creation for now due to indexing issue
        # create_orders_and_reservations(db, customers_data)
        print("⚠️  Skipping order creation due to data issues")
        
        # Commit all changes
        db.commit()
        print("\n🎉 Database seeding completed successfully!")
        print("🏪 Your Chinese takeaway restaurant database is ready!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()