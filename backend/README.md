# Backend Application Setup Guide

## Prerequisites
- Python 3.9+
- PostgreSQL (or your preferred database)
- Redis (for background tasks)

## Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/MacOS
# OR
.\venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

1. Create `.env` file:
```bash
cp .env.example .env
```

2. Edit `.env` with your database credentials:
```
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key
```

## Running the Application

### Development Mode (with auto-reload)
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode (using gunicorn + uvicorn)
```bash
gunicorn -k uvicorn.workers.UvicornWorker -w 4 main:app
```

### Alternative (using main.py directly)
```bash
python main.py
```

## Accessing the API

- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- API Base URL: http://localhost:8000/api

## First-Time Setup

1. Initialize database tables:
```bash
python -c "from database import engine, Base; Base.metadata.create_all(engine)"
```

2. Create admin user (optional):
```bash
python -c "from scripts.create_admin import create_admin; create_admin()"
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection URL |
| SECRET_KEY | JWT encryption key |
| REDIS_URL | Redis connection URL |
| DEBUG | Set to "True" for development |