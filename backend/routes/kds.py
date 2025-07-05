from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models.order import Order
from models.menu import MenuItem
from services.email import EmailService
from services.websocket_manager import manager
import json
from typing import List
from datetime import datetime

router = APIRouter(prefix="/kds", tags=["kds"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_order_number_for_existing_order(order_id: str) -> int:
    """Get order number for existing orders (for updates/status changes)"""
    return hash(order_id) % 10000


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = ["preparing", "ready", "served", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    order.status = status
    db.commit()

    # Process order data
    try:
        # Enrich items from stored JSON data
        enriched_items = []
        total = 0
        
        if order.items:
            for item_data in order.items:
                if isinstance(item_data, dict):
                    if 'name' in item_data and 'price' in item_data:
                        enriched_items.append(item_data)
                        total += float(item_data.get('price', 0)) * int(item_data.get('quantity', 1))
                    else:
                        menu_item = db.query(MenuItem).filter(MenuItem.id == item_data.get('item_id')).first()
                        if menu_item:
                            enriched_item = {
                                "id": item_data.get('item_id'),
                                "name": menu_item.name,
                                "quantity": item_data.get('quantity', 1),
                                "price": float(menu_item.price),
                                "category": menu_item.category,
                                "modifications": [item_data.get('special_requests')] if item_data.get('special_requests') else [],
                            }
                            enriched_items.append(enriched_item)
                            total += float(menu_item.price) * int(item_data.get('quantity', 1))
        
        order_number = get_order_number_for_existing_order(order.id)
        order_data = {
            "id": order.id,
            "order_number": order_number,
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
        
        # Broadcast KDS status update to connected WebSocket clients
        await manager.broadcast({
            "type": "kds_status_update",
            "data": order_data
        })
        
    except Exception as e:
        # Log error but don't fail the status update
        print(f"Order data processing failed: {e}")

    # Send status update email if customer has email
    if order.customer_email and status in ["ready", "completed"]:
        email_service = EmailService()
        email_service.send_order_confirmation(order.id)

    return {"status": "updated"}

@router.get("/orders")
async def get_orders_by_date_range(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """
    Get all orders within a date range.
    
    - **start_date**: Start of date range (inclusive)
    - **end_date**: End of date range (inclusive)
    
    Returns list of Order objects with all order details.
    """
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    if start_dt > end_dt:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )

    # Include full end date by adding 1 day and using less than
    end_dt_plus_1 = end_dt.replace(hour=23, minute=59, second=59)

    orders = db.query(Order).filter(
        Order.created_at >= start_dt,
        Order.created_at <= end_dt_plus_1
    ).all()

    return orders