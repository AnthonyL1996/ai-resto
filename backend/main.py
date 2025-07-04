from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
from models.base import Base
from routes import orders, menu, auth, reservations, payments, kds, categories, translations, events
from services.email import EmailService
from utils.logger import setup_logger
import logging

logger = setup_logger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Starting application")
Base.metadata.create_all(bind=engine)
logger.info("Database tables created")

app.include_router(orders.router)
app.include_router(menu.router)
app.include_router(categories.router)
app.include_router(translations.router)
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(payments.router)
app.include_router(kds.router)
app.include_router(events.router)
# app.include_router(printer.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)