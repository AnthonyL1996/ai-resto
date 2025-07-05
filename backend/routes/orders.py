from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models.order import Order
from services.printer_service import PrinterService
from services.redis_event_service import redis_event_service

router = APIRouter(prefix="/orders", tags=["orders"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    
    # Generate unique ID
    import uuid
    order_id = str(uuid.uuid4())
        
    db_order = Order(
        id=order_id,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        phone=order.phone,
        items=[item.dict() for item in order.items],
        payment_method=order.payment_method,
        time_slot=order.time_slot,
        source=order.source,
        notes=order.notes,
        status="new",
        print_status="pending"
    )
    
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
    
    # Publish new order event to queue
    order_data = {
        "order_id": db_order.id,
        "customer_id": db_order.customer_id,
        "customer_name": db_order.customer_name,
        "phone": db_order.phone,
        "items": [item.dict() for item in order.items],
        "payment_method": db_order.payment_method,
        "time_slot": db_order.time_slot.isoformat() if db_order.time_slot else None,
        "source": db_order.source,
        "notes": db_order.notes,
        "status": db_order.status,
        "created_at": db_order.created_at.isoformat(),
        "print_status": db_order.print_status,
        "print_attempts": db_order.print_attempts
    }
    
    # Publish to Redis for SSE real-time updates
    try:
        await redis_event_service.publish_order_created(order_data)
    except Exception as e:
        # Log error but don't fail the order creation
        print(f"Redis event publishing failed: {e}")
    
    return {
        "order_id": db_order.id,
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
    
    # Publish to Redis for SSE real-time updates
    try:
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
        await redis_event_service.publish_order_status_changed(order.id, order_data)
    except Exception as e:
        # Log error but don't fail the order update
        print(f"Redis event publishing failed: {e}")
    
    return {
        "order_id": order.id,
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
    
    # Publish to Redis for SSE real-time updates
    try:
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
        await redis_event_service.publish_order_status_changed(order.id, order_data)
    except Exception as e:
        # Log error but don't fail the status update
        print(f"Redis event publishing failed: {e}")
    
    return {
        "order_id": order.id,
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
    
    # Publish to Redis for SSE real-time updates
    try:
        await redis_event_service.publish_order_deleted(order_id, order_data)
    except Exception as e:
        # Log error but don't fail the delete operation
        print(f"Redis event publishing failed: {e}")
    
    return {"message": "Order deleted successfully"}