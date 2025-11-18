from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import SessionLocal
from models.order import Order
from models.customer import Customer
from services.printer_service import PrinterService
from routes.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])
limiter = Limiter(key_func=get_remote_address)


def get_db():
    """Database dependency for proper session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class OrderItem(BaseModel):
    """Order item with validation."""
    item_id: str = Field(..., min_length=1, max_length=50, description="Menu item ID")
    quantity: int = Field(..., gt=0, le=100, description="Quantity (1-100)")
    special_requests: Optional[str] = Field(None, max_length=500, description="Special requests")

    @validator('item_id')
    def validate_item_id(cls, v):
        """Validate item_id format."""
        if not v or v.isspace():
            raise ValueError('item_id cannot be empty or whitespace')
        return v.strip()


class OrderCreate(BaseModel):
    """Order creation request with validation."""
    customer_id: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    items: List[OrderItem] = Field(..., min_items=1, max_items=50)
    payment_method: str = Field(..., description="Payment method: card, cash, payconiq")
    time_slot: Optional[datetime] = None

    @validator('items')
    def validate_items(cls, v):
        """Ensure at least one item is provided."""
        if not v:
            raise ValueError('At least one item is required')
        return v

    @validator('payment_method')
    def validate_payment_method(cls, v):
        """Validate payment method."""
        allowed_methods = ['card', 'cash', 'payconiq']
        if v.lower() not in allowed_methods:
            raise ValueError(f'Payment method must be one of: {", ".join(allowed_methods)}')
        return v.lower()

class OrderResponse(OrderCreate):
    order_id: str
    status: str
    created_at: datetime
    print_status: str
    print_attempts: int

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")  # Rate limit: 10 orders per minute per IP
async def create_order(
    request: Request,
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: Optional[Customer] = Depends(get_current_user)
):
    """
    Create a new order.
    Requires authentication. Rate limited to 10 orders per minute.
    """
    # Validate either customer_id or phone is provided
    if not order.customer_id and not order.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either customer_id or phone must be provided"
        )

    # Convert Pydantic models to dict for JSON storage
    items_dict = [item.dict() for item in order.items]

    db_order = Order(
        customer_id=order.customer_id or (current_user.id if current_user else None),
        items=items_dict,
        payment_method=order.payment_method,
        time_slot=order.time_slot,
        status="received",
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
        # Log error but don't fail the order
        import logging
        logging.error(f"Failed to queue print job for order {db_order.id}: {str(e)}")

    return {
        "order_id": db_order.id,
        "status": db_order.status,
        "created_at": db_order.created_at,
        "print_status": db_order.print_status,
        "print_attempts": db_order.print_attempts,
        **order.dict()
    }


@router.get("/{order_id}", response_model=OrderResponse)
@limiter.limit("30/minute")  # Rate limit: 30 reads per minute per IP
async def get_order(
    request: Request,
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    """
    Get an order by ID.
    Requires authentication. Users can only access their own orders.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Verify the user owns this order (security check)
    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this order"
        )

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