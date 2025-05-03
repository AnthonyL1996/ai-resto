from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import redis

# Database URL - adjust according to your PostgreSQL configuration
DATABASE_URL = "postgresql://restaurant:restaurant123@localhost:5432/restaurant_db"

# Redis configuration
REDIS_URL = "redis://localhost:6379/0"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Redis connection pool
redis_pool = redis.ConnectionPool.from_url(REDIS_URL)
redis_client = redis.Redis(connection_pool=redis_pool)