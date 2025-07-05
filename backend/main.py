from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
from models.base import Base
from routes import orders, menu, auth, reservations, payments, kds, categories, translations
from services.email import EmailService
from services.websocket_manager import manager
from utils.logger import setup_logger
from database_migration import run_migrations
import logging
import asyncio

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

# Run database migrations
logger.info("Running database migrations")
run_migrations()
logger.info("Database migrations completed")


app.include_router(orders.router)
app.include_router(menu.router)
app.include_router(categories.router)
app.include_router(translations.router)
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(payments.router)
app.include_router(kds.router)
# app.include_router(printer.router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)