# GitHub Actions Workflows

This directory contains CI/CD workflows for the AI Resto project.

---

## Workflows

### 1. `ci.yml` - Continuous Integration
**Triggers:** Push and Pull Requests to main, staging, develop

**Jobs:**
- **Lint Backend** - Runs Ruff, Black, MyPy
- **Security Scan** - Checks for vulnerabilities and secrets
- **Test Backend** - Runs test suite with PostgreSQL and Redis
- **Build Frontend** - Type checks and builds frontend
- **Docker Build** - Builds Docker images
- **Auto-merge Dependabot** - Automatically merges dependency updates

**Status:** [![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

---

### 2. `database-migrations.yml` - Database Migrations
**Triggers:** Push and Pull Requests affecting migrations or models

**Jobs:**
- **Validate Migrations** - Tests migration syntax, upgrade, and rollback
- **Apply Migrations to Staging** - Auto-deploys to staging (on push to staging branch)
- **Apply Migrations to Production** - Auto-deploys to production (on push to main branch)
- **Check Migration Conflicts** - Detects branching issues in PRs

**Status:** [![Migrations](../../actions/workflows/database-migrations.yml/badge.svg)](../../actions/workflows/database-migrations.yml)

---

## Setup Required

### Repository Secrets

Add these secrets in **Settings → Secrets and variables → Actions**:

#### Staging Environment
```
STAGING_DATABASE_URL=postgresql://user:pass@host:5432/db
STAGING_SECRET_KEY=<generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'>
STAGING_REDIS_URL=redis://host:6379/0
STAGING_ALLOWED_ORIGINS=https://staging.yourdomain.com
```

#### Production Environment
```
PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/db
PRODUCTION_SECRET_KEY=<generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'>
PRODUCTION_REDIS_URL=redis://host:6379/0
PRODUCTION_ALLOWED_ORIGINS=https://yourdomain.com
```

#### Docker (Optional)
```
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-token
```

---

## Workflow Features

### Database Migrations Workflow

#### On Pull Requests:
1. ✅ Validates migration syntax
2. ✅ Tests upgrade to head
3. ✅ Tests downgrade and re-apply
4. ✅ Checks for migration conflicts
5. ✅ Verifies database schema

#### On Push to Staging:
1. 📦 Backs up database (configure your backup solution)
2. 🚀 Applies migrations
3. ✅ Verifies migration success
4. 📢 Sends notifications

#### On Push to Production:
1. 💾 **CRITICAL: Backs up database**
2. 🚀 Applies migrations with verification
3. ✅ Runs health checks
4. 📢 Sends success notifications
5. 🔄 Auto-rollback on failure

---

## CI/CD Pipeline

### Pull Request Flow
```
PR Created
  ↓
Lint Code → Security Scan → Run Tests → Build Frontend
  ↓
All Pass ✅
  ↓
Ready for Review
```

### Deployment Flow (Main Branch)
```
Push to Main
  ↓
Run CI Pipeline
  ↓
Build Docker Image
  ↓
Apply Migrations (Production)
  ↓
Deploy Application
  ↓
Notify Team
```

---

## Customization

### Adding Environment-Specific Jobs

Edit `.github/workflows/database-migrations.yml`:

```yaml
apply-migrations-dev:
  name: Apply Migrations to Development
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/develop'
  environment:
    name: development

  steps:
    # ... similar to staging/production
```

### Adding Notifications

#### Slack Notification Example:
```yaml
- name: Send Slack notification
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ Migrations applied to production",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Deployment Status:* Success\n*Environment:* Production"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

#### Discord Notification Example:
```yaml
- name: Send Discord notification
  run: |
    curl -H "Content-Type: application/json" \
      -d '{"content": "✅ Production migrations completed successfully"}' \
      ${{ secrets.DISCORD_WEBHOOK_URL }}
```

---

## Monitoring

### View Workflow Runs
- Go to **Actions** tab in GitHub
- Click on workflow name
- View run details and logs

### Set Up Status Badges

Add to your README.md:
```markdown
[![CI](https://github.com/YourUsername/ai-resto/actions/workflows/ci.yml/badge.svg)](https://github.com/YourUsername/ai-resto/actions/workflows/ci.yml)
[![Migrations](https://github.com/YourUsername/ai-resto/actions/workflows/database-migrations.yml/badge.svg)](https://github.com/YourUsername/ai-resto/actions/workflows/database-migrations.yml)
```

---

## Troubleshooting

### Workflow Fails on Migration
1. Check workflow logs
2. Verify secrets are set correctly
3. Ensure database is accessible
4. Check migration file syntax

### Database Connection Timeout
- Increase timeout in workflow
- Check firewall rules
- Verify database URL format

### Migration Conflicts
```bash
# Locally, merge migrations
alembic merge heads -m "Merge migrations"

# Push the merge
git add backend/alembic/versions/
git commit -m "Merge migration heads"
git push
```

---

## Best Practices

1. **Always test locally first**
   ```bash
   alembic upgrade head
   alembic downgrade -1
   alembic upgrade head
   ```

2. **Review migration files in PRs**
   - Check SQL generated
   - Verify rollback logic
   - Consider data migration impact

3. **Use staging environment**
   - Test migrations on staging before production
   - Verify application works after migration

4. **Monitor production deployments**
   - Watch workflow execution
   - Check application health after deployment
   - Be ready to rollback if needed

5. **Backup before production migrations**
   - Configure automated backups
   - Test restore procedures
   - Keep recent backups accessible

---

## Security Notes

- ⚠️ Never commit secrets to workflow files
- ✅ Use GitHub Secrets for sensitive data
- ✅ Restrict who can trigger production deployments
- ✅ Enable branch protection rules
- ✅ Require status checks before merging

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Setup Python Action](https://github.com/actions/setup-python)

---

**Last Updated:** 2025-11-18
**Maintainer:** DevOps Team
