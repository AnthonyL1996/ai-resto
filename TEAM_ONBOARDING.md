# Team Onboarding Guide - AI Resto

Welcome to the AI Resto project! This guide will get you set up and running quickly.

---

## 🎯 Quick Start (5 Minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/AnthonyL1996/ai-resto.git
cd ai-resto
```

### 2. Set Up Backend
```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `backend/.env` and update these REQUIRED settings:

```bash
# Generate a secret key
python -c 'import secrets; print(secrets.token_urlsafe(32))'

# Copy the output and paste it in .env
SECRET_KEY=<paste-your-generated-key-here>

# Update database credentials if different
DATABASE_URL=postgresql://restaurant:restaurant123@localhost:5432/restaurant_db
REDIS_URL=redis://localhost:6379/0

# Add your frontend URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Start Database Services
```bash
# From project root
docker-compose up -d db redis
```

### 5. Run Database Migrations
```bash
cd backend
alembic upgrade head
```

### 6. Start Backend Server
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Set Up Frontend (Optional)
```bash
cd frontend
npm install
npm run dev
```

**Done!** Visit:
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

---

## ✅ Onboarding Checklist

Print this out or copy to a GitHub issue:

### Prerequisites
- [ ] Git installed
- [ ] Python 3.10+ installed
- [ ] PostgreSQL client installed (optional, for debugging)
- [ ] Docker & Docker Compose installed
- [ ] Node.js 18+ installed (for frontend)
- [ ] Code editor (VS Code recommended)

### Backend Setup
- [ ] Repository cloned
- [ ] Virtual environment created
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created from `.env.example`
- [ ] Secret key generated and added to `.env`
- [ ] Database credentials configured
- [ ] Docker services started (`docker-compose up -d`)
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Backend server starts without errors
- [ ] Can access http://localhost:8000/health
- [ ] Can access http://localhost:8000/docs

### Frontend Setup
- [ ] Node modules installed (`npm install`)
- [ ] Frontend dev server starts (`npm run dev`)
- [ ] Can access http://localhost:5173

### Security & Best Practices
- [ ] Read `SECURITY.md`
- [ ] Understand environment variable usage
- [ ] `.env` file added to `.gitignore` (already done)
- [ ] Never commit secrets to git

### Database Migrations
- [ ] Read `DATABASE_MIGRATIONS.md`
- [ ] Understand migration workflow
- [ ] Know how to create migrations
- [ ] Know how to apply migrations
- [ ] Know how to rollback migrations

### Code Quality
- [ ] Read `CODE_ANALYSIS_AND_IMPROVEMENTS.md`
- [ ] Understand security requirements
- [ ] Familiar with project structure

### Team Communication
- [ ] Added to team Slack/Discord
- [ ] Access to project management board
- [ ] GitHub repository access granted
- [ ] Code review process understood

---

## 🔧 Common Setup Issues & Solutions

### Issue: "Module not found" errors
**Solution:**
```bash
# Make sure you're in the virtual environment
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Database connection refused"
**Solution:**
```bash
# Check if Docker services are running
docker-compose ps

# If not running, start them
docker-compose up -d db redis

# Check connection
docker-compose logs db

# Test connection
psql postgresql://restaurant:restaurant123@localhost:5432/restaurant_db
```

### Issue: "SECRET_KEY must be set to a secure random value"
**Solution:**
```bash
# Generate a new secret key
python -c 'import secrets; print(secrets.token_urlsafe(32))'

# Add to .env
echo "SECRET_KEY=<your-generated-key>" >> .env
```

### Issue: Alembic can't find migrations
**Solution:**
```bash
# Make sure you're in the backend directory
cd backend

# Check current migration status
alembic current

# Apply migrations
alembic upgrade head
```

### Issue: Port already in use
**Solution:**
```bash
# Find process using the port
lsof -i :8000  # On Linux/Mac
netstat -ano | findstr :8000  # On Windows

# Kill the process or use a different port
uvicorn main:app --reload --port 8001
```

### Issue: Redis connection errors
**Solution:**
```bash
# Check if Redis is running
docker-compose ps redis

# Start Redis
docker-compose up -d redis

# Test connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

---

## 📖 Essential Reading (Priority Order)

1. **`SECURITY.md`** (15 min) - Security setup and configuration
2. **`DATABASE_MIGRATIONS.md`** (20 min) - Database migration workflow
3. **`CODE_ANALYSIS_AND_IMPROVEMENTS.md`** (30 min) - Code quality standards
4. **`README.md`** (backend & frontend) - Project-specific details

---

## 🛠️ Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Check for new migrations
cd backend
alembic current
alembic upgrade head  # If behind

# 3. Install any new dependencies
pip install -r requirements.txt

# 4. Start development
uvicorn main:app --reload
```

### Making Changes

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make your changes

# 3. If you changed models, create migration
cd backend
alembic revision --autogenerate -m "Description of change"

# 4. Review the migration file
cat alembic/versions/<new_file>.py

# 5. Test the migration
alembic upgrade head
alembic downgrade -1  # Test rollback
alembic upgrade head  # Re-apply

# 6. Commit your changes
git add .
git commit -m "Description of changes"

# 7. Push and create PR
git push origin feature/your-feature-name
```

### Before Committing

**Checklist:**
- [ ] Code follows project style
- [ ] No hardcoded secrets
- [ ] Migrations tested (upgrade & downgrade)
- [ ] API endpoints have authentication
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Logging added for important operations
- [ ] Documentation updated if needed

---

## 🧪 Testing Your Setup

### Backend Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","database":"connected","redis":"connected"}
```

### Register a Test User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+32123456789",
    "password": "SecurePassword123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=SecurePassword123!"
```

### Test Database Connection
```bash
cd backend
python -c "from database import engine; from sqlalchemy import text; print(engine.connect().execute(text('SELECT 1')).scalar())"
# Should return: 1
```

### Test Redis Connection
```bash
cd backend
python -c "from database import redis_client; print(redis_client.ping())"
# Should return: True
```

---

## 👥 Team Communication

### Code Review Process
1. Create feature branch
2. Make changes
3. Create Pull Request
4. Request review from at least 1 team member
5. Address feedback
6. Merge after approval

### Asking for Help
1. Check this onboarding guide first
2. Search existing GitHub issues
3. Ask in team chat
4. Create GitHub issue if bug/feature request
5. Tag relevant team members

### Reporting Issues
When reporting an issue, include:
- What you were trying to do
- What you expected to happen
- What actually happened
- Error messages (full stack trace)
- Your environment (OS, Python version, etc.)
- Steps to reproduce

---

## 🔐 Security Reminders

**NEVER:**
- ❌ Commit `.env` files
- ❌ Commit secrets or API keys
- ❌ Use weak passwords in `.env`
- ❌ Skip authentication on endpoints
- ❌ Disable rate limiting
- ❌ Use `SECRET_KEY=your-secret-key-here`

**ALWAYS:**
- ✅ Generate strong secret keys
- ✅ Use environment variables for config
- ✅ Add authentication to protected endpoints
- ✅ Validate all user input
- ✅ Review migration files before applying
- ✅ Test changes locally before pushing

---

## 📚 Additional Resources

### Documentation
- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- Alembic Docs: https://alembic.sqlalchemy.org/
- Pydantic Docs: https://docs.pydantic.dev/

### Tools
- Postman: Test API endpoints
- DBeaver: Database client
- Redis Desktop Manager: Redis client
- Docker Desktop: Container management

### VS Code Extensions (Recommended)
- Python
- Pylance
- Python Test Explorer
- GitLens
- Docker
- Thunder Client (API testing)
- SQLTools

---

## 🎓 Learning Path (Optional)

### Week 1: Basics
- [ ] Get development environment working
- [ ] Understand project structure
- [ ] Make a small documentation fix
- [ ] Review code in main files

### Week 2: Understanding
- [ ] Read all models (`backend/models/`)
- [ ] Read all routes (`backend/routes/`)
- [ ] Understand authentication flow
- [ ] Test API endpoints with Postman

### Week 3: Contributing
- [ ] Fix a small bug
- [ ] Add a small feature
- [ ] Create your first migration
- [ ] Submit your first PR

### Week 4: Advanced
- [ ] Understand security features
- [ ] Write tests
- [ ] Optimize a database query
- [ ] Review others' PRs

---

## 💡 Pro Tips

1. **Use a Python IDE** - PyCharm or VS Code with Python extensions make development much easier

2. **Set up auto-formatting** - Use Black and Ruff:
   ```bash
   pip install black ruff
   black backend/
   ruff check backend/
   ```

3. **Use database migrations properly** - Never modify existing migrations, always create new ones

4. **Keep dependencies updated** - Regularly check for security updates:
   ```bash
   pip list --outdated
   ```

5. **Use feature branches** - Never commit directly to main

6. **Write descriptive commit messages**:
   ```
   ✅ "Add email verification to user registration"
   ❌ "Fix stuff"
   ```

7. **Test thoroughly** - Test migrations both up and down before committing

8. **Ask questions** - Better to ask than to guess!

---

## 🚀 You're Ready!

Once you've completed the checklist above, you're ready to start contributing!

**Next Steps:**
1. Pick an issue from the backlog
2. Ask questions in team chat
3. Start coding!

**Welcome to the team! 🎉**

---

**Need Help?**
- GitHub Issues: https://github.com/AnthonyL1996/ai-resto/issues
- Team Lead: [Add contact info]
- Documentation: See files in project root

---

**Last Updated:** 2025-11-18
**Version:** 1.0.0
