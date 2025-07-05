from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models.order import Order
from models.menu import MenuItem
from services.printer_service import PrinterService
from services.websocket_manager import manager

router = APIRouter(prefix="/orders", tags=["orders"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_next_order_number(db: Session) -> int:
    """Get the next sequential order number from database"""
    try:
        # Get the highest order number from the database
        last_order = db.query(Order).order_by(Order.order_number.desc()).first()
        if last_order and hasattr(last_order, 'order_number') and last_order.order_number:
            return last_order.order_number + 1
        else:
            # Start with order number 1 if no orders exist or no order_number field
            return 1
    except Exception as e:
        # If order_number column doesn't exist yet, fall back to timestamp-based generation
        print(f"Warning: order_number column doesn't exist yet, using fallback: {e}")
        return int(datetime.now().strftime("%H%M%S"))


class OrderItem(BaseModel):
    item_id: str
    quantity: int
    special_requests: Optional[str] = None

class OrderCreate(BaseModel):
    customer_id: Optional[str] = None  # Nullable for anonymous orders
    customer_name: Optional[str] = None  # For anonymous orders
    phone: Optional[str] = None  # Required for anonymous orders
    items: List[OrderItem]
    payment_method: str
    time_slot: Optional[datetime] = None
    source: str = "manual"
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    order_id: str
    order_number: int
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    items: List[OrderItem]
    payment_method: str
    time_slot: Optional[datetime] = None
    source: str
    notes: Optional[str] = None
    status: str
    created_at: datetime
    print_status: Optional[str] = None
    print_attempts: Optional[int] = None

@router.post("/", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Validate either customer_id or customer_name is provided
    if not order.customer_id and not order.customer_name:
        raise HTTPException(
            status_code=400,
            detail="Either customer_id or customer_name must be provided"
        )
    
    # Generate unique ID and order number
    import uuid
    order_id = str(uuid.uuid4())
    order_number = get_next_order_number(db)
        
    # Create order with order_number if column exists
    order_data = {
        "id": order_id,
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "items": [item.dict() for item in order.items],
        "payment_method": order.payment_method,
        "time_slot": order.time_slot,
        "source": order.source,
        "notes": order.notes,
        "status": "new",
        "print_status": "pending"
    }
    
    # Add order_number only if it was successfully generated
    if order_number and hasattr(Order, 'order_number'):
        order_data["order_number"] = order_number
        
    db_order = Order(**order_data)
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Queue print job
    try:
        printer = PrinterService(db)
        printer.queue_print_job(db_order.id)
    except Exception as e:
        # Log error but don't fail the order creation
        print(f"Print job failed: {e}")
    
    # Enrich items with menu item details and calculate total
    enriched_items = []
    total = 0
    
    for item in order.items:
        # Fetch menu item details
        print(f"DEBUG ORDER CREATION: Looking for menu item with ID: {item.item_id}")
        # Try to find by ID first, then by name if not found
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.item_id).first()
        if not menu_item:
            # Fallback: try to find by name (for frontend compatibility)
            menu_item = db.query(MenuItem).filter(MenuItem.name == item.item_id).first()
            if menu_item:
                print(f"DEBUG ORDER CREATION: Found menu item by name: {menu_item.name}, price: {menu_item.price}")
        else:
            print(f"DEBUG ORDER CREATION: Found menu item by ID: {menu_item.name}, price: {menu_item.price}")
        
        if menu_item:
            item_data = {
                "id": item.item_id,
                "item_id": item.item_id,
                "name": menu_item.name,
                "quantity": item.quantity,
                "price": float(menu_item.price),
                "category": menu_item.category,
                "modifications": [item.special_requests] if item.special_requests else [],
                "preparationTime": menu_item.prep_time or 15,
                "dietaryOptions": menu_item.dietary_options or [],
                "allergens": menu_item.allergens or [],
                "available": menu_item.is_available
            }
            enriched_items.append(item_data)
            total += float(menu_item.price) * item.quantity
        else:
            # Fallback for missing menu items
            item_data = {
                "id": item.item_id,
                "item_id": item.item_id,
                "name": f"Item {item.item_id}",
                "quantity": item.quantity,
                "price": 0,
                "category": "unknown",
                "modifications": [item.special_requests] if item.special_requests else [],
                "preparationTime": 15,
                "dietaryOptions": [],
                "allergens": [],
                "available": True
            }
            enriched_items.append(item_data)
    
    # Create order data for event publishing
    order_data = {
        "id": db_order.id,
        "order_id": db_order.id,  # Keep for backward compatibility
        "order_number": getattr(db_order, 'order_number', order_number),  # Use stored number or fallback
        "customer_id": db_order.customer_id,
        "customer_name": db_order.customer_name,
        "phone": db_order.phone,
        "items": enriched_items,
        "payment_method": db_order.payment_method,
        "time_slot": db_order.time_slot.isoformat() if db_order.time_slot else None,
        "source": db_order.source,
        "notes": db_order.notes,
        "status": db_order.status,
        "created_at": db_order.created_at.isoformat(),
        "print_status": db_order.print_status,
        "print_attempts": db_order.print_attempts,
        "total": total
    }
    
    # Broadcast new order to connected WebSocket clients
    await manager.broadcast({
        "type": "new_order",
        "data": order_data
    })
    
    
    return {
        "order_id": db_order.id,
        "order_number": getattr(db_order, 'order_number', order_number),
        "customer_id": db_order.customer_id,
        "customer_name": db_order.customer_name,
        "phone": db_order.phone,
        "items": order.items,
        "payment_method": db_order.payment_method,
        "time_slot": db_order.time_slot,
        "source": db_order.source,
        "notes": db_order.notes,
        "status": db_order.status,
        "created_at": db_order.created_at,
        "print_status": db_order.print_status,
        "print_attempts": db_order.print_attempts
    }

@router.get("/", response_model=List[OrderResponse])
async def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [
        {
            "order_id": order.id,
            "order_number": getattr(order, 'order_number', hash(order.id) % 10000),
            "customer_id": order.customer_id,
            "customer_name": order.customer_name,
            "phone": order.phone,
            "items": order.items or [],
            "payment_method": order.payment_method,
            "time_slot": order.time_slot,
            "source": order.source or "manual",
            "notes": order.notes,
            "status": order.status,
            "created_at": order.created_at,
            "print_status": order.print_status or "pending",
            "print_attempts": order.print_attempts or 0
        }
        for order in orders
    ]

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "order_id": order.id,
        "order_number": getattr(order, 'order_number', hash(order.id) % 10000),
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "items": order.items or [],
        "payment_method": order.payment_method,
        "time_slot": order.time_slot,
        "source": order.source or "manual",
        "notes": order.notes,
        "status": order.status,
        "created_at": order.created_at,
        "print_status": order.print_status or "pending",
        "print_attempts": order.print_attempts or 0
    }

class OrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    items: List[OrderItem]
    payment_method: str
    time_slot: Optional[datetime] = None
    source: str = "manual"
    notes: Optional[str] = None

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, order_update: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order fields
    order.customer_id = order_update.customer_id
    order.customer_name = order_update.customer_name
    order.phone = order_update.phone
    order.items = [item.dict() for item in order_update.items]
    order.payment_method = order_update.payment_method
    order.time_slot = order_update.time_slot
    order.source = order_update.source
    order.notes = order_update.notes
    
    db.commit()
    db.refresh(order)
    

    # Enrich items from stored JSON data - always fetch fresh menu data
    enriched_items = []
    total = 0
    
    if order.items:
        for item_data in order.items:
            if isinstance(item_data, dict):
                # Always enrich from menu database to ensure complete data
                item_id = item_data.get('item_id')
                print(f"DEBUG UPDATE ORDER: Looking for menu item with ID: {item_id}")
                # Try to find by ID first, then by name if not found
                menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
                if not menu_item:
                    # Fallback: try to find by name (for frontend compatibility)
                    menu_item = db.query(MenuItem).filter(MenuItem.name == item_id).first()
                    if menu_item:
                        print(f"DEBUG UPDATE ORDER: Found menu item by name: {menu_item.name}, price: {menu_item.price}")
                else:
                    print(f"DEBUG UPDATE ORDER: Found menu item by ID: {menu_item.name}, price: {menu_item.price}")
                
                if menu_item:
                    enriched_item = {
                        "id": item_id,
                        "item_id": item_id,
                        "name": menu_item.name,
                        "quantity": item_data.get('quantity', 1),
                        "price": float(menu_item.price),
                        "category": menu_item.category,
                        "modifications": [item_data.get('special_requests')] if item_data.get('special_requests') else [],
                        "preparationTime": menu_item.prep_time or 15,
                        "dietaryOptions": menu_item.dietary_options or [],
                        "allergens": menu_item.allergens or [],
                        "available": menu_item.is_available
                    }
                    enriched_items.append(enriched_item)
                    total += float(menu_item.price) * int(item_data.get('quantity', 1))
                else:
                    print(f"DEBUG: Menu item NOT found for ID: {item_id}")
                    # Fallback for missing menu items
                    enriched_item = {
                        "id": item_id,
                        "item_id": item_id,
                        "name": f"Item {item_id}",
                        "quantity": item_data.get('quantity', 1),
                        "price": 0,
                        "category": "unknown",
                        "modifications": [item_data.get('special_requests')] if item_data.get('special_requests') else [],
                        "preparationTime": 15,
                        "dietaryOptions": [],
                        "allergens": [],
                        "available": True
                    }
                    enriched_items.append(enriched_item)
    
    order_data = {
        "id": order.id,
        "order_number": getattr(order, 'order_number', hash(order.id) % 10000),
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "items": enriched_items,
        "payment_method": order.payment_method,
        "time_slot": order.time_slot.isoformat() if order.time_slot else None,
        "source": order.source or "manual",
        "notes": order.notes,
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "print_status": order.print_status or "pending",
        "print_attempts": order.print_attempts or 0,
        "total": total
    }
    
    # Broadcast order update to connected WebSocket clients
    await manager.broadcast({
        "type": "order_update",
        "data": order_data
    })
    
    return {
        "order_id": order.id,
        "order_number": getattr(order, 'order_number', hash(order.id) % 10000),
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "items": order.items or [],
        "payment_method": order.payment_method,
        "time_slot": order.time_slot,
        "source": order.source or "manual",
        "notes": order.notes,
        "status": order.status,
        "created_at": order.created_at,
        "print_status": order.print_status or "pending",
        "print_attempts": order.print_attempts or 0
    }

class StatusUpdate(BaseModel):
    status: str

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: str, status_update: StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    
    # Enrich items from stored JSON data - always fetch fresh menu data
    enriched_items = []
    total = 0
    
    if order.items:
        print(f"DEBUG STATUS UPDATE: Order has {len(order.items)} items")
        for item_data in order.items:
            if isinstance(item_data, dict):
                # Always enrich from menu database to ensure complete data
                item_id = item_data.get('item_id')
                print(f"DEBUG STATUS UPDATE: Looking for menu item with ID: {item_id}")
                # Try to find by ID first, then by name if not found
                menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
                if not menu_item:
                    # Fallback: try to find by name (for frontend compatibility)
                    menu_item = db.query(MenuItem).filter(MenuItem.name == item_id).first()
                    if menu_item:
                        print(f"DEBUG STATUS UPDATE: Found menu item by name: {menu_item.name}, price: {menu_item.price}")
                else:
                    print(f"DEBUG STATUS UPDATE: Found menu item by ID: {menu_item.name}, price: {menu_item.price}")
                
                if menu_item:
                    enriched_item = {
                        "id": item_id,
                        "item_id": item_id,
                        "name": menu_item.name,
                        "quantity": item_data.get('quantity', 1),
                        "price": float(menu_item.price),
                        "category": menu_item.category,
                        "modifications": [item_data.get('special_requests')] if item_data.get('special_requests') else [],
                        "preparationTime": menu_item.prep_time or 15,
                        "dietaryOptions": menu_item.dietary_options or [],
                        "allergens": menu_item.allergens or [],
                        "available": menu_item.is_available
                    }
                    enriched_items.append(enriched_item)
                    total += float(menu_item.price) * int(item_data.get('quantity', 1))
                else:
                    print(f"DEBUG: Menu item NOT found for ID: {item_id}")
                    # Fallback for missing menu items
                    enriched_item = {
                        "id": item_id,
                        "item_id": item_id,
                        "name": f"Item {item_id}",
                        "quantity": item_data.get('quantity', 1),
                        "price": 0,
                        "category": "unknown",
                        "modifications": [item_data.get('special_requests')] if item_data.get('special_requests') else [],
                        "preparationTime": 15,
                        "dietaryOptions": [],
                        "allergens": [],
                        "available": True
                    }
                    enriched_items.append(enriched_item)
    
    order_data = {
        "id": order.id,
        "order_number": getattr(order, 'order_number', hash(order.id) % 10000),
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "items": enriched_items,
        "payment_method": order.payment_method,
        "time_slot": order.time_slot.isoformat() if order.time_slot else None,
        "source": order.source or "manual",
        "notes": order.notes,
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "print_status": order.print_status or "pending",
        "print_attempts": order.print_attempts or 0,
        "total": total
    }
    
    # Broadcast order status update to connected WebSocket clients
    await manager.broadcast({
        "type": "order_status_update",
        "data": order_data
    })
    
    return {
        "order_id": order.id,
        "order_number": getattr(order, 'order_number', hash(order.id) % 10000),
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "items": order.items or [],
        "payment_method": order.payment_method,
        "time_slot": order.time_slot,
        "source": order.source or "manual",
        "notes": order.notes,
        "status": order.status,
        "created_at": order.created_at,
        "print_status": order.print_status or "pending",
        "print_attempts": order.print_attempts or 0
    }

@router.delete("/{order_id}")
async def delete_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Store order data before deletion for event publishing
    order_data = {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer_name,
        "phone": order.phone,
        "items": order.items or [],
        "payment_method": order.payment_method,
        "time_slot": order.time_slot.isoformat() if order.time_slot else None,
        "source": order.source or "manual",
        "notes": order.notes,
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "print_status": order.print_status or "pending",
        "print_attempts": order.print_attempts or 0
    }
    
    db.delete(order)
    db.commit()
    
    # Broadcast order deletion to connected WebSocket clients
    await manager.broadcast({
        "type": "order_deleted",
        "data": order_data
    })
    
    return {"message": "Order deleted successfully"}