from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from models.reservation import Reservation, ReservationStatus
from models.customer import Customer
from database import SessionLocal
from routes.auth import oauth2_scheme, get_current_user

router = APIRouter(prefix="/reservations", tags=["reservations"])

class ReservationCreate(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    phone: str
    pickup_time: datetime
    source: str  # website, phone, kiosk

class ReservationMenuItem(BaseModel):
    id: str
    name: str
    quantity: int
    prep_time: int  # in minutes

class ReservationResponse(ReservationCreate):
    id: str
    status: str
    created_at: datetime
    order_details: dict  # Includes menu items and prep times
    menu_items: List[ReservationMenuItem] = []
    estimated_ready_time: Optional[datetime] = None

@router.post("/", response_model=ReservationResponse)
async def create_reservation(
    reservation: ReservationCreate
):
    db = SessionLocal()
    try:
        # Validate reservation time is in the future
        if reservation.reservation_time < datetime.now():
            raise HTTPException(
                status_code=400,
                detail="Reservation time must be in the future"
            )

        # Set employee_id if reservation is made by staff
        employee_id = None
        if reservation.source == "employee":
            if not current_user:
                raise HTTPException(
                    status_code=403,
                    detail="Only employees can create employee reservations"
                )
            employee_id = current_user.id

        db_reservation = Reservation(
            **reservation.dict(),
            status=ReservationStatus.PENDING,
            employee_id=employee_id
        )
        db.add(db_reservation)
        db.commit()
        db.refresh(db_reservation)
        return db_reservation
    finally:
        db.close()

@router.get("/", response_model=List[ReservationResponse])
async def get_reservations(
    date: Optional[str] = None,
    status: Optional[str] = None,
    current_user: Customer = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        query = db.query(Reservation)
        
        if date:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(
                Reservation.reservation_time >= target_date,
                Reservation.reservation_time < target_date + timedelta(days=1)
            )
            
        if status:
            query = query.filter(Reservation.status == status)
            
        return query.all()
    finally:
        db.close()

@router.get("/today/kds", response_model=List[ReservationResponse])
async def get_today_reservations_for_kds():
    """Get today's reservations formatted for Kitchen Display System"""
    db = SessionLocal()
    try:
        today = datetime.now().date()
        reservations = db.query(Reservation).filter(
            Reservation.reservation_time >= today,
            Reservation.reservation_time < today + timedelta(days=1),
            Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.CONFIRMED])
        ).order_by(Reservation.reservation_time).all()

        # Add menu items and calculate ready times
        for reservation in reservations:
            # Get associated order and its items
            order = db.query(Order).filter(
                Order.reservation_id == reservation.id
            ).first()
            
            if order:
                reservation.menu_items = [
                    ReservationMenuItem(
                        id=item.menu_item_id,
                        name=db.query(MenuItem).get(item.menu_item_id).name,
                        quantity=item.quantity,
                        prep_time=db.query(MenuItem).get(item.menu_item_id).prep_time
                    ) for item in order.items
                ]
                
                # Calculate ready time (reservation time - longest prep time)
                if reservation.menu_items:
                    max_prep = max(item.prep_time for item in reservation.menu_items)
                    reservation.estimated_ready_time = reservation.reservation_time - timedelta(minutes=max_prep)

        return reservations
    finally:
        db.close()

@router.get("/today/print", response_model=List[ReservationResponse])
async def get_today_reservations_for_printing():
    """Get today's reservations formatted for printing"""
    db = SessionLocal()
    try:
        today = datetime.now().date()
        return db.query(Reservation).filter(
            Reservation.reservation_time >= today,
            Reservation.reservation_time < today + timedelta(days=1),
            Reservation.status == ReservationStatus.CONFIRMED
        ).order_by(Reservation.reservation_time).all()
    finally:
        db.close()