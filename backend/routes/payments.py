from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from models.order import Order
from database import SessionLocal
import requests
import os

router = APIRouter(prefix="/payments", tags=["payments"])

PAYCONIQ_API_URL = "https://api.payconiq.com/v3/payments"
PAYCONIQ_API_KEY = os.getenv("PAYCONIQ_API_KEY")

async def verify_payment(payment_id: str):
    headers = {
        "Authorization": f"Bearer {PAYCONIQ_API_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{PAYCONIQ_API_URL}/{payment_id}", headers=headers)
    return response.json().get("status") == "SUCCEEDED"

@router.post("/initiate/{order_id}")
async def initiate_payment(order_id: str):
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.payment_status == "completed":
            raise HTTPException(status_code=400, detail="Order already paid")

        headers = {
            "Authorization": f"Bearer {PAYCONIQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "amount": order.total_amount,
            "currency": "EUR",
            "reference": order_id,
            "callbackUrl": f"{os.getenv('BASE_URL')}/payments/callback"
        }

        response = requests.post(PAYCONIQ_API_URL, json=payload, headers=headers)
        payment_data = response.json()

        order.payment_reference = payment_data.get("paymentId")
        order.payment_status = "pending"
        db.commit()

        return {"payment_url": payment_data.get("_links", {}).get("payment", {}).get("href")}
    finally:
        db.close()

@router.get("/callback")
async def payment_callback(paymentId: str):
    db = SessionLocal()
    try:
        if not await verify_payment(paymentId):
            raise HTTPException(status_code=400, detail="Payment verification failed")

        order = db.query(Order).filter(Order.payment_reference == paymentId).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order.payment_status = "completed"
        db.commit()

        return {"status": "success"}
    finally:
        db.close()