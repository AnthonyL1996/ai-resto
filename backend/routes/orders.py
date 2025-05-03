from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models.order import Order
from services.printer import PrinterService

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
    special_requests: str = None

class OrderCreate(BaseModel):
    customer_id: Optional[str] = None  # Nullable for anonymous orders
    phone: Optional[str] = None  # Required for anonymous orders
    items: List[OrderItem]
    payment_method: str
    time_slot: datetime = None

class OrderResponse(OrderCreate):
    order_id: str
    status: str
    created_at: datetime
    print_status: str
    print_attempts: int

@router.post("/", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Validate either customer_id or phone is provided
    if not order.customer_id and not order.phone:
        raise HTTPException(
            status_code=400,
            detail="Either customer_id or phone must be provided"
        )
        
    db_order = Order(
        customer_id=order.customer_id,
        items=order.items,
        payment_method=order.payment_method,
        time_slot=order.time_slot,
        status="received",
        print_status="pending"
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Queue print job
    printer = PrinterService(db)
    printer.queue_print_job(db_order.id)
    
    return {
        "order_id": db_order.id,
        "status": db_order.status,
        "created_at": db_order.created_at,
        "print_status": db_order.print_status,
        "print_attempts": db_order.print_attempts,
        **order.dict()
    }

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "order_id": order.id,
        "status": order.status,
        "created_at": order.created_at,
        "print_status": order.print_status,
        "print_attempts": order.print_attempts,
        "customer_id": order.customer_id,
        "items": order.items,
        "payment_method": order.payment_method,
        "time_slot": order.time_slot
    }