from fastapi import FastAPI
from database import engine, SessionLocal
from models.base import Base
from routes import orders, menu, auth, reservations, payments, kds
from services.email import EmailService
from utils.logger import setup_logger
import logging

logger = setup_logger(__name__)

app = FastAPI()

logger.info("Starting application")
Base.metadata.create_all(bind=engine)
logger.info("Database tables created")

app.include_router(orders.router)
app.include_router(menu.router)
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(payments.router)
app.include_router(kds.router)
# app.include_router(printer.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)