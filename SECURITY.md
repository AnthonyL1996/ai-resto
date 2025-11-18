# Security Implementation Guide

## Overview

This document describes the security improvements implemented in the Restaurant Management System and provides setup instructions.

---

## 🔐 Security Features Implemented

### 1. **Environment-Based Configuration**
- ✅ All secrets moved to environment variables
- ✅ No hardcoded credentials in source code
- ✅ Configuration validation on startup
- ✅ Separate configuration for dev/staging/production

**Files:**
- `backend/config.py` - Centralized configuration management
- `backend/.env.example` - Template for environment variables

### 2. **CORS (Cross-Origin Resource Sharing)**
- ✅ Configured to allow only specified origins
- ✅ Credentials support enabled
- ✅ Production-ready settings

**Configuration:** See `backend/main.py:37-45`

### 3. **Rate Limiting**
- ✅ Global rate limiting (60 requests/minute by default)
- ✅ Endpoint-specific limits:
  - Login: 5 attempts/minute
  - Order creation: 10/minute
  - Order retrieval: 30/minute
- ✅ IP-based tracking

**Configuration:** See `backend/main.py:18-22`

### 4. **Input Validation**
- ✅ Comprehensive Pydantic models with validators
- ✅ Field length restrictions
- ✅ Type checking
- ✅ Custom validation logic
- ✅ SQL injection protection via ORM

**Examples:** `backend/routes/auth.py:35-40`, `backend/routes/orders.py:28-63`

### 5. **Authentication & Authorization**
- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Token expiration (30 minutes default)
- ✅ Protected endpoints require authentication
- ✅ Resource ownership verification

**Implementation:** `backend/routes/auth.py`

### 6. **Payment Security**
- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ Idempotency checks (prevent duplicate processing)
- ✅ Double verification with payment provider
- ✅ Async HTTP requests (non-blocking)
- ✅ Proper error handling

**Implementation:** `backend/routes/payments.py:36-77`, `159-228`

### 7. **Additional Security Measures**
- ✅ Health check endpoint for monitoring
- ✅ API versioning (`/api/v1`)
- ✅ Structured logging
- ✅ Database connection pooling
- ✅ Proper session management
- ✅ Documentation disabled in production

---

## 🚀 Setup Instructions

### Step 1: Generate Secret Key

Generate a secure secret key for JWT tokens:

```bash
python -c 'import secrets; print(secrets.token_urlsafe(32))'
```

Copy the output - you'll need this for the `SECRET_KEY` environment variable.

### Step 2: Create Environment File

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

### Step 3: Configure Environment Variables

Edit `.env` and update the following **required** settings:

```bash
# CRITICAL: Replace with the secret key you generated
SECRET_KEY=your-generated-secret-key-here

# Database (update with your credentials)
DATABASE_URL=postgresql://restaurant:restaurant123@localhost:5432/restaurant_db

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS - Add your frontend URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**For production, also configure:**

```bash
# Environment
ENVIRONMENT=production
DEBUG=False

# Email (required in production)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@restaurant.com

# Payment (required for payment processing)
PAYCONIQ_API_KEY=your-payconiq-api-key
PAYCONIQ_WEBHOOK_SECRET=your-webhook-secret
BASE_URL=https://your-domain.com
```

### Step 4: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note:** Dependencies have been updated to latest secure versions.

### Step 5: Verify Configuration

The application will validate configuration on startup. If there are issues, you'll see clear error messages:

```bash
cd backend
python -c "from config import settings; settings.validate_required_settings()"
```

### Step 6: Run the Application

**Development:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Production:**
```bash
cd backend
gunicorn -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8000 main:app
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] `SECRET_KEY` is set to a strong random value (not the example)
- [ ] `DATABASE_URL` uses strong password
- [ ] `ALLOWED_ORIGINS` contains only your domains
- [ ] `ENVIRONMENT` is set to `production`
- [ ] `DEBUG` is set to `False`
- [ ] Email settings are configured
- [ ] Payment API keys are configured
- [ ] `PAYCONIQ_WEBHOOK_SECRET` is set
- [ ] `.env` file is NOT committed to git (check `.gitignore`)
- [ ] Database migrations are set up (Alembic)
- [ ] HTTPS is enabled (use reverse proxy like nginx)
- [ ] Rate limiting is enabled
- [ ] Logs are being collected and monitored

---

## 🛡️ Security Best Practices

### For Developers

1. **Never commit secrets**
   - Always use `.env` files
   - Never hardcode credentials
   - Use `.gitignore` to exclude `.env`

2. **Keep dependencies updated**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

3. **Run security scans**
   ```bash
   # Install safety
   pip install safety

   # Check for known vulnerabilities
   safety check
   ```

4. **Use HTTPS in production**
   - Configure nginx or another reverse proxy
   - Use Let's Encrypt for free SSL certificates

5. **Monitor logs**
   - Check for failed authentication attempts
   - Monitor rate limit violations
   - Track payment webhook errors

### For Production Deployment

1. **Database Security**
   - Use strong passwords
   - Restrict network access
   - Enable SSL connections
   - Regular backups

2. **API Security**
   - Use API gateway if possible
   - Implement IP whitelisting for admin endpoints
   - Set up monitoring/alerting

3. **Rate Limiting**
   - Adjust limits based on your traffic
   - Consider using Redis for distributed rate limiting
   - Monitor for abuse

4. **Authentication**
   - Consider shorter token expiration for sensitive operations
   - Implement refresh tokens
   - Add 2FA for admin accounts

---

## 🐛 Testing Security

### Test Authentication

```bash
# Register a user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+32123456789",
    "password": "SecurePassword123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=SecurePassword123!"
```

### Test Rate Limiting

```bash
# Try more than 5 login attempts in a minute
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/auth/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test@example.com&password=wrong"
  echo ""
done
```

### Test Health Check

```bash
curl http://localhost:8000/health
```

---

## 📋 API Changes

### Breaking Changes

All API endpoints now have the `/api/v1` prefix:

**Old:** `http://localhost:8000/orders`
**New:** `http://localhost:8000/api/v1/orders`

### Authentication Required

The following endpoints now require authentication:

- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{order_id}` - Get order
- `POST /api/v1/payments/initiate/{order_id}` - Initiate payment

**Include JWT token in requests:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/v1/orders/123
```

---

## 🔍 Troubleshooting

### "SECRET_KEY must be set to a secure random value"

**Solution:** Generate a new secret key and add to `.env`:
```bash
python -c 'import secrets; print(secrets.token_urlsafe(32))'
```

### "Could not validate credentials"

**Solution:** Your JWT token has expired or is invalid. Login again to get a new token.

### "Rate limit exceeded"

**Solution:** You've made too many requests. Wait a minute and try again, or adjust rate limits in `.env`:
```bash
RATE_LIMIT_PER_MINUTE=120
```

### CORS errors in browser

**Solution:** Add your frontend URL to `ALLOWED_ORIGINS` in `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### Database connection errors

**Solution:** Verify your `DATABASE_URL` is correct and PostgreSQL is running:
```bash
# Test PostgreSQL connection
psql "postgresql://restaurant:restaurant123@localhost:5432/restaurant_db"
```

---

## 📞 Support

For security vulnerabilities, please report to: [security email here]

For general issues, create a GitHub issue.

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Python Security](https://python.readthedocs.io/en/stable/library/security_warnings.html)

---

**Last Updated:** 2025-11-18
**Version:** 1.0.0

---

## 🗄️ Database Migrations

### Overview

Database schema changes are managed using **Alembic** migrations. Never use `Base.metadata.create_all()` - always use migrations.

### Quick Start

**Apply migrations:**
```bash
cd backend
alembic upgrade head
```

**Check current version:**
```bash
alembic current
```

**Create new migration (after model changes):**
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Important Notes

- ✅ Always review auto-generated migrations before applying
- ✅ Test migrations locally (upgrade AND downgrade)
- ✅ Never edit applied migrations - create new ones
- ✅ Backup database before production migrations
- ⚠️ Run `alembic upgrade head` after pulling latest code

### Production Deployment

**Pre-deployment:**
1. Backup database: `pg_dump ... > backup.sql`
2. Review migration files
3. Test on staging environment

**Apply migrations:**
```bash
cd backend
alembic upgrade head
```

**Rollback if needed:**
```bash
alembic downgrade -1
```

### Detailed Documentation

See [`DATABASE_MIGRATIONS.md`](DATABASE_MIGRATIONS.md) for complete guide including:
- Creating migrations
- Rolling back changes
- Handling data migrations
- Zero-downtime deployments
- Troubleshooting

### CI/CD Integration

Migrations are automatically validated and applied via GitHub Actions:
- PRs: Migrations are validated and tested
- Staging: Auto-applied on push to `staging` branch
- Production: Auto-applied on push to `main` branch

See [`.github/workflows/database-migrations.yml`](.github/workflows/database-migrations.yml)

---
