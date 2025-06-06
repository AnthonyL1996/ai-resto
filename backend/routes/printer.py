from fastapi import APIRouter, HTTPException
from typing import Optional
from services.printer_service import PrinterService
import os
import logging

router = APIRouter(
    prefix="/printer",
    tags=["printer"],
    responses={404: {"description": "Not found"}},
)

# Printer configuration from environment
PRINTER_TYPE = os.getenv("PRINTER_TYPE", "usb")
PRINTER_CONFIG = {
    "usb": {
        "vendor_id": int(os.getenv("PRINTER_VENDOR_ID", "0x6868")),
        "product_id": int(os.getenv("PRINTER_PRODUCT_ID", "0x0500")),
    },
    "network": {
        "host": os.getenv("PRINTER_HOST", "192.168.1.100"),
        "port": int(os.getenv("PRINTER_PORT", "9100")),
    },
    "bluetooth": {
        "device_address": os.getenv("PRINTER_BT_ADDRESS"),
    }
}

printer_service = None

@router.on_event("startup")
async def startup_event():
    global printer_service
    try:
        printer_service = PrinterService(
            connection_type=PRINTER_TYPE,
            **PRINTER_CONFIG.get(PRINTER_TYPE, {})
        )
    except Exception as e:
        logging.error(f"Failed to initialize printer: {str(e)}")
        printer_service = None

@router.post("/text")
async def print_text(text: str, align: Optional[str] = "left"):
    if not printer_service:
        raise HTTPException(status_code=503, detail="Printer not available")
    
    try:
        printer_service.print_text(text, align)
        return {"status": "success", "message": "Text printed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/kitchen-order")
async def print_kitchen_order(
    order_time: str,
    ready_time: str,
    customer_name: str,
    customer_contact: str,
    items: list[str]
):
    if not printer_service:
        raise HTTPException(status_code=503, detail="Printer not available")
    
    try:
        printer_service.print_kitchen_order({
            "order_time": order_time,
            "ready_time": ready_time,
            "customer_name": customer_name,
            "customer_contact": customer_contact,
            "items": items
        })
        return {"status": "success", "message": "Kitchen order printed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/image")
async def print_image(image_path: str):
    if not printer_service:
        raise HTTPException(status_code=503, detail="Printer not available")
    
    try:
        printer_service.print_image(image_path)
        return {"status": "success", "message": "Image printed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cut")
async def cut_paper(partial: bool = False):
    if not printer_service:
        raise HTTPException(status_code=503, detail="Printer not available")
    
    try:
        printer_service.cut(partial)
        return {"status": "success", "message": "Paper cut successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))