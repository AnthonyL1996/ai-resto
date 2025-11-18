from fastapi import APIRouter, HTTPException, Depends, Request, Header, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
import httpx
import hmac
import hashlib
import logging

from config import settings
from database import SessionLocal
from models.order import Order
from models.customer import Customer
from routes.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)


def get_db():
    """Database dependency for proper session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PaymentInitiateResponse(BaseModel):
    """Response for payment initiation."""
    payment_url: str
    payment_id: str
    status: str


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify webhook signature from Payconiq.
    Uses HMAC-SHA256 to verify the webhook is authentic.
    """
    if not settings.payconiq_webhook_secret:
        logger.warning("Webhook secret not configured - skipping signature verification")
        return True  # Allow in development, but log warning

    try:
        expected_signature = hmac.new(
            settings.payconiq_webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {str(e)}")
        return False


async def verify_payment_status(payment_id: str) -> bool:
    """
    Verify payment status with Payconiq API.
    Uses async HTTP client to avoid blocking.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.payconiq_api_url}/{payment_id}",
                headers={
                    "Authorization": f"Bearer {settings.payconiq_api_key}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("status") == "SUCCEEDED"
    except httpx.HTTPError as e:
        logger.error(f"Failed to verify payment {payment_id}: {str(e)}")
        return False

@router.post("/initiate/{order_id}", response_model=PaymentInitiateResponse)
async def initiate_payment(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    """
    Initiate a payment for an order.
    Requires authentication. User must own the order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Verify user owns this order
    if order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this order"
        )

    if order.payment_status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )

    # Check if API key is configured
    if not settings.payconiq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured"
        )

    try:
        # Initiate payment with Payconiq
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "amount": getattr(order, 'total_amount', 0) * 100,  # Convert to cents
                "currency": "EUR",
                "reference": order_id,
                "callbackUrl": f"{settings.base_url}/api/v1/payments/webhook",
                "description": f"Order {order_id}"
            }

            response = await client.post(
                settings.payconiq_api_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.payconiq_api_key}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            payment_data = response.json()

        # Store payment reference
        order.payment_reference = payment_data.get("paymentId")
        order.payment_status = "pending"
        db.commit()

        logger.info(f"Payment initiated for order {order_id}, payment_id: {order.payment_reference}")

        return PaymentInitiateResponse(
            payment_url=payment_data.get("_links", {}).get("payment", {}).get("href", ""),
            payment_id=order.payment_reference,
            status="pending"
        )

    except httpx.HTTPError as e:
        logger.error(f"Failed to initiate payment for order {order_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to initiate payment with payment provider"
        )


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for payment status updates.
    Verifies signature to ensure authenticity.
    """
    # Get raw body for signature verification
    body = await request.body()

    # Verify webhook signature
    if not verify_webhook_signature(body, x_signature or ""):
        logger.warning("Invalid webhook signature received")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )

    # Parse webhook data
    try:
        data = await request.json()
        payment_id = data.get("paymentId")
        payment_status = data.get("status")

        if not payment_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing payment_id in webhook"
            )

        # Verify payment status with API (double-check)
        if payment_status == "SUCCEEDED":
            verified = await verify_payment_status(payment_id)
            if not verified:
                logger.error(f"Payment verification failed for {payment_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment verification failed"
                )

        # Update order payment status
        order = db.query(Order).filter(Order.payment_reference == payment_id).first()
        if not order:
            logger.warning(f"Order not found for payment {payment_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        # Prevent duplicate processing (idempotency check)
        if order.payment_status == "completed" and payment_status == "SUCCEEDED":
            logger.info(f"Payment {payment_id} already processed")
            return {"status": "already_processed"}

        order.payment_status = "completed" if payment_status == "SUCCEEDED" else "failed"
        db.commit()

        logger.info(f"Payment webhook processed for order {order.id}, status: {payment_status}")

        return {"status": "success", "order_id": order.id}

    except Exception as e:
        logger.error(f"Error processing payment webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook"
        )