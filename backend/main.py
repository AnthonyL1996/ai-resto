from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import engine, SessionLocal, redis_client
from models.base import Base
from routes import orders, menu, auth, reservations, payments, kds
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"] if settings.rate_limit_enabled else []
)

# Create FastAPI app with metadata
app = FastAPI(
    title="Restaurant Management API",
    description="API for managing restaurant orders, reservations, and kitchen operations",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,  # Disable docs in production
    redoc_url="/redoc" if settings.debug else None,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    logger.info("Starting Restaurant Management API")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Rate limiting: {'enabled' if settings.rate_limit_enabled else 'disabled'}")

    # Warning: This should be replaced with Alembic migrations in production
    if settings.environment == "development":
        logger.warning("Running in development mode - creating tables with create_all()")
        Base.metadata.create_all(bind=engine)
    else:
        logger.info("Production mode - assuming migrations have been run")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    logger.info("Shutting down Restaurant Management API")
    # Close database connections
    engine.dispose()


# Health check endpoint
@app.get("/health", tags=["system"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    Checks database and Redis connectivity.
    """
    health_status = {
        "status": "healthy",
        "environment": settings.environment,
        "version": "1.0.0"
    }

    try:
        # Check database connection
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            health_status["database"] = "connected"
        finally:
            db.close()

        # Check Redis connection
        redis_client.ping()
        health_status["redis"] = "connected"

        return health_status

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "environment": settings.environment,
                "version": "1.0.0"
            }
        )


# Include routers with API prefix
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(menu.router, prefix=API_PREFIX)
app.include_router(reservations.router, prefix=API_PREFIX)
app.include_router(payments.router, prefix=API_PREFIX)
app.include_router(kds.router, prefix=API_PREFIX)
# app.include_router(printer.router, prefix=API_PREFIX)

# Root endpoint
@app.get("/", tags=["system"])
async def root():
    """API root endpoint."""
    return {
        "message": "Restaurant Management API",
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else "disabled",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level=settings.log_level.lower()
    )