from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models.order import Order
from services.email import EmailService
import json
from typing import List
from datetime import datetime

router = APIRouter(prefix="/kds", tags=["kds"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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

    # Broadcast update to all connected clients
    await manager.broadcast({
        "type": "order_update",
        "order_id": order.id,
        "status": order.status
    })

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