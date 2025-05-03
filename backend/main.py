from fastapi import FastAPI
from database import engine, SessionLocal
from models.base import Base
from routes import orders, menu, auth, reservations, payments, kds
from services.printer import PrinterService
from services.email import EmailService
from utils.logger import setup_logger
import threading
import logging

logger = setup_logger(__name__)

app = FastAPI()

logger.info("Starting application")
Base.metadata.create_all(bind=engine)
logger.info("Database tables created")

# Start printer service in background
def start_printer_service():
    db = SessionLocal()
    try:
        printer = PrinterService(db)
        printer.process_queue()
    finally:
        db.close()

printer_thread = threading.Thread(target=start_printer_service, daemon=True)
printer_thread.start()

app.include_router(orders.router)
app.include_router(menu.router)
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(payments.router)
app.include_router(kds.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)