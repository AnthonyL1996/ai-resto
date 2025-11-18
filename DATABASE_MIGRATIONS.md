# Database Migrations Guide

## Overview

This project uses **Alembic** for database schema migrations. This guide explains how to use Alembic for all database schema changes.

---

## 🚨 Important

**NEVER use `Base.metadata.create_all()` in production!** Always use Alembic migrations to manage database schema changes.

---

## Setup

Alembic is already configured and ready to use. The initial migration has been created.

### Configuration Files

- `backend/alembic.ini` - Alembic configuration
- `backend/alembic/env.py` - Environment configuration (loads from `config.py`)
- `backend/alembic/versions/` - Migration scripts directory

---

## Quick Start

### 1. Apply Existing Migrations

When setting up a new database or deploying:

```bash
cd backend
alembic upgrade head
```

This will create all tables defined in the migrations.

### 2. Check Current Migration Status

```bash
cd backend
alembic current
```

### 3. View Migration History

```bash
cd backend
alembic history --verbose
```

---

## Common Operations

### Creating a New Migration

**After making changes to SQLAlchemy models:**

```bash
cd backend
alembic revision --autogenerate -m "Add column to users table"
```

This will:
1. Compare your models with the current database schema
2. Generate a migration file with the differences
3. Save it to `alembic/versions/`

**Important:** Always review the auto-generated migration before applying it!

### Applying Migrations

**Upgrade to latest:**
```bash
alembic upgrade head
```

**Upgrade by one version:**
```bash
alembic upgrade +1
```

**Upgrade to specific version:**
```bash
alembic upgrade <revision_id>
```

### Rolling Back Migrations

**Downgrade by one version:**
```bash
alembic downgrade -1
```

**Downgrade to specific version:**
```bash
alembic downgrade <revision_id>
```

**Downgrade to base (remove all):**
```bash
alembic downgrade base
```

### Creating Empty Migration (Manual)

For complex migrations that can't be auto-generated:

```bash
alembic revision -m "Add custom index"
```

Then edit the generated file to add custom SQL or operations.

---

## Migration File Structure

Each migration file looks like this:

```python
"""Add user email verification

Revision ID: abc123def456
Revises: previous_revision_id
Create Date: 2025-11-18 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'abc123def456'
down_revision = 'previous_revision_id'  # Previous migration
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Apply the migration."""
    op.add_column('customers', sa.Column('email_verified', sa.Boolean(), default=False))

def downgrade() -> None:
    """Rollback the migration."""
    op.drop_column('customers', 'email_verified')
```

---

## Best Practices

### 1. Always Review Auto-Generated Migrations

Auto-generate is smart but not perfect. Review each migration:

```bash
# After creating migration
cat alembic/versions/<new_migration_file>.py
```

Check for:
- Correct column types
- Proper nullable/default values
- Index creation
- Foreign key constraints
- Data migrations needed

### 2. Test Migrations Both Ways

```bash
# Apply migration
alembic upgrade head

# Test it works
python -c "from database import engine; print(engine.execute('SELECT * FROM table LIMIT 1').fetchone())"

# Rollback
alembic downgrade -1

# Reapply
alembic upgrade head
```

### 3. Never Edit Applied Migrations

Once a migration is applied (especially in production), never edit it. Create a new migration instead:

```bash
# DON'T: Edit abc123_add_column.py
# DO: Create new migration
alembic revision -m "Fix column type"
```

### 4. Use Descriptive Migration Names

```bash
# ✅ Good
alembic revision --autogenerate -m "Add email_verified column to customers"
alembic revision -m "Create index on orders.customer_id"

# ❌ Bad
alembic revision -m "Update database"
alembic revision -m "Fix stuff"
```

### 5. Data Migrations

When you need to migrate data, use a two-step approach:

**Step 1: Add new column (nullable)**
```bash
alembic revision --autogenerate -m "Add new_column to table (nullable)"
```

**Step 2: Populate data**
```python
def upgrade():
    # Add column
    op.add_column('table', sa.Column('new_column', sa.String(), nullable=True))

    # Migrate data
    connection = op.get_bind()
    connection.execute("UPDATE table SET new_column = old_column WHERE new_column IS NULL")

    # Make not nullable
    op.alter_column('table', 'new_column', nullable=False)
```

### 6. Handle Large Tables Carefully

For large tables, some operations can lock the table:

```python
# Instead of:
op.add_column('large_table', sa.Column('new_col', sa.String()))

# Consider:
op.execute("ALTER TABLE large_table ADD COLUMN new_col VARCHAR")  # PostgreSQL specific, no lock
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested locally
- [ ] Migrations reviewed by team
- [ ] Backup database before applying
- [ ] Test rollback procedure
- [ ] Verify downgrade works
- [ ] Check for long-running operations

### Deployment Process

**1. Backup database:**
```bash
pg_dump -U restaurant -d restaurant_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**2. Apply migrations:**
```bash
cd backend
alembic upgrade head
```

**3. Verify:**
```bash
alembic current
# Should show latest migration
```

**4. If something goes wrong:**
```bash
# Restore backup
psql -U restaurant -d restaurant_db < backup_20251118_100000.sql

# Or rollback migration
alembic downgrade -1
```

### Zero-Downtime Migrations

For production systems with zero-downtime requirements:

**Phase 1: Make column nullable**
```python
def upgrade():
    op.add_column('table', sa.Column('new_col', sa.String(), nullable=True))
    # Deploy application code that writes to both old and new column
```

**Phase 2: Backfill data**
```python
def upgrade():
    connection = op.get_bind()
    connection.execute("UPDATE table SET new_col = old_col WHERE new_col IS NULL")
```

**Phase 3: Make required**
```python
def upgrade():
    op.alter_column('table', 'new_col', nullable=False)
    op.drop_column('table', 'old_col')
    # Deploy application code that only uses new column
```

---

## Troubleshooting

### "Can't locate revision identified by '<id>'"

The database has migrations that don't exist locally.

**Solution:**
```bash
# Pull latest migrations from git
git pull origin main

# Then upgrade
alembic upgrade head
```

### "Target database is not up to date"

The database schema doesn't match migrations.

**Solution:**
```bash
# Check current version
alembic current

# Check history
alembic history

# Stamp database with correct version
alembic stamp head  # Use with caution!
```

### "FAILED: Can't proceed with --autogenerate option"

Database connection issue.

**Solution:**
```bash
# Check .env file has correct DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL

# Ensure PostgreSQL is running
docker-compose up -d db
```

### Migration fails partway through

**Solution:**
```bash
# Check what version database is at
alembic current

# Manually fix the issue, then stamp
alembic stamp <revision_id>

# Or rollback and try again
alembic downgrade -1
alembic upgrade head
```

---

## Advanced Topics

### Branching and Merging

When multiple developers create migrations:

```bash
# Create merge migration
alembic merge -m "Merge migrations" <rev1> <rev2>
```

### Custom Migration Templates

Edit `alembic/script.py.mako` to customize migration file template.

### Offline SQL Generation

Generate SQL without applying:

```bash
alembic upgrade head --sql > migration.sql
```

Review and apply manually:
```bash
psql $DATABASE_URL < migration.sql
```

---

## Initial Migration

The initial migration (`923906363993_initial_migration_create_all_tables.py`) creates:

- `customers` table - User accounts
- `menu_items` table - Restaurant menu
- `orders` table - Customer orders
- `reservations` table - Order reservations

**To apply:**
```bash
cd backend
alembic upgrade head
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Run Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd backend
          alembic upgrade head
```

---

## Useful Commands Reference

```bash
# Status
alembic current                          # Show current version
alembic history                          # Show all migrations
alembic heads                            # Show head revision(s)

# Create Migrations
alembic revision --autogenerate -m "msg" # Auto-generate from models
alembic revision -m "msg"                # Create empty migration

# Apply Migrations
alembic upgrade head                     # Upgrade to latest
alembic upgrade +1                       # Upgrade one version
alembic upgrade <revision>               # Upgrade to specific version

# Rollback Migrations
alembic downgrade -1                     # Downgrade one version
alembic downgrade <revision>             # Downgrade to specific version
alembic downgrade base                   # Remove all migrations

# Other
alembic stamp head                       # Mark database as current
alembic show <revision>                  # Show specific migration
alembic edit <revision>                  # Open migration in editor
```

---

## Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Support

For migration issues:
1. Check this guide
2. Review migration file
3. Check database logs
4. Create GitHub issue with migration file and error message

---

**Last Updated:** 2025-11-18
**Alembic Version:** 1.14.0
**SQLAlchemy Version:** 2.0.36
