from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import redis
from config import settings

# Database engine with connection pooling
engine = create_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,  # Verify connections before using them
    echo=settings.debug  # Log SQL queries in debug mode
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Redis connection pool
redis_pool = redis.ConnectionPool.from_url(
    settings.redis_url,
    decode_responses=True  # Auto-decode responses to strings
)
redis_client = redis.Redis(connection_pool=redis_pool)