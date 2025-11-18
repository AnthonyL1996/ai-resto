# Ansible Deployment Guide - AI Resto

Complete Ansible infrastructure automation for deploying AI Resto on bare metal servers.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Configuration](#configuration)
- [Deployment Workflows](#deployment-workflows)
- [Operations](#operations)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## 🎯 Overview

This Ansible infrastructure automates the complete deployment of AI Resto on bare metal servers, including:

- ✅ System hardening and security (UFW firewall, fail2ban)
- ✅ PostgreSQL 17 database setup with automated backups
- ✅ Redis caching layer
- ✅ Python application deployment with virtualenv
- ✅ Gunicorn + Uvicorn workers
- ✅ Nginx reverse proxy with SSL/TLS
- ✅ Let's Encrypt SSL certificates (automatic renewal)
- ✅ Database migrations with Alembic
- ✅ Systemd service management
- ✅ Rolling deployment strategy
- ✅ Health checks and monitoring
- ✅ Rollback capabilities

---

## ⚙️ Prerequisites

### Control Machine (Your Laptop/CI Server)

```bash
# Install Ansible
pip install ansible

# Install required Ansible collections
ansible-galaxy collection install community.postgresql
ansible-galaxy collection install community.general

# Verify installation
ansible --version  # Should be 2.14+
```

### Target Servers

**Minimum Requirements:**
- Ubuntu 22.04 LTS (recommended) or Ubuntu 20.04 LTS
- 2+ CPU cores
- 4GB+ RAM (8GB recommended for production)
- 20GB+ disk space
- SSH access with sudo privileges
- Python 3 installed

**Recommended Server Layout:**

**Staging/Development:**
```
1 server: Combined (DB + Redis + Application)
```

**Production:**
```
- 2+ Web servers (application + nginx)
- 1+ Database server (PostgreSQL)
- 1+ Cache server (Redis)
```

### SSH Setup

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy SSH key to all servers
ssh-copy-id user@your-server-ip

# Test SSH connection
ssh user@your-server-ip "echo 'Connection successful'"
```

---

## 🚀 Quick Start

### 1. Configure Inventory

Edit the inventory file for your environment:

```bash
# For production
nano inventories/production/hosts

# For staging
nano inventories/staging/hosts
```

Example inventory:
```ini
[webservers]
web1.example.com ansible_host=192.168.1.10
web2.example.com ansible_host=192.168.1.11

[dbservers]
db1.example.com ansible_host=192.168.1.20

[redis]
cache1.example.com ansible_host=192.168.1.30

[production:children]
webservers
dbservers
redis
```

### 2. Configure Variables

Edit environment-specific variables:

```bash
# For production
nano group_vars/production.yml

# For staging
nano group_vars/staging.yml
```

**CRITICAL: Update these variables:**

```yaml
# Domain
domain_name: api.yourcompany.com
frontend_domain: yourcompany.com

# Email for SSL certificates
ssl_email: admin@yourcompany.com

# Database credentials (use Ansible Vault for production!)
db_password: "CHANGE_THIS_STRONG_PASSWORD"

# Application secrets (use Ansible Vault!)
secret_key: "GENERATE_A_SECURE_SECRET_KEY_HERE"

# Git repository
git_repo: https://github.com/YourOrg/ai-resto.git
git_branch: main
```

### 3. Secure Secrets with Ansible Vault

**IMPORTANT:** Never commit plain-text secrets!

```bash
# Create encrypted vault file
ansible-vault create group_vars/production/vault.yml

# Add sensitive variables:
vault_db_password: your_secure_db_password
vault_secret_key: your_secure_secret_key
vault_redis_password: your_secure_redis_password

# Save and exit (:wq in vim)
```

Then reference vault variables in `group_vars/production.yml`:
```yaml
db_password: "{{ vault_db_password }}"
secret_key: "{{ vault_secret_key }}"
```

### 4. Test Connection

```bash
# Test connection to all servers
ansible -i inventories/production all -m ping

# Should return:
# web1 | SUCCESS => { "changed": false, "ping": "pong" }
```

### 5. Initial Deployment

```bash
# Run complete deployment (first time)
ansible-playbook -i inventories/production site.yml --ask-vault-pass

# For staging
ansible-playbook -i inventories/staging site.yml --ask-vault-pass
```

**This will take 15-30 minutes** depending on server specs and network speed.

### 6. Verify Deployment

```bash
# Run health checks
ansible-playbook -i inventories/production healthcheck.yml

# Check application
curl https://api.yourcompany.com/health
# Expected: {"status":"healthy","database":"connected","redis":"connected"}
```

---

## 📁 Directory Structure

```
ansible/
├── ansible.cfg                 # Ansible configuration
├── site.yml                    # Main deployment playbook
├── deploy.yml                  # Application update playbook
├── rollback.yml                # Rollback playbook
├── healthcheck.yml             # Health check playbook
│
├── inventories/                # Server inventories
│   ├── production/
│   │   └── hosts              # Production servers
│   └── staging/
│       └── hosts              # Staging servers
│
├── group_vars/                 # Environment variables
│   ├── production.yml         # Production config
│   ├── staging.yml            # Staging config
│   └── production/
│       └── vault.yml          # Encrypted secrets (create this)
│
└── roles/                      # Ansible roles
    ├── common/                 # System setup
    │   ├── tasks/
    │   │   └── main.yml
    │   └── templates/
    │       └── sysctl.conf.j2
    │
    ├── postgresql/             # Database setup
    │   ├── tasks/
    │   │   └── main.yml
    │   ├── templates/
    │   │   ├── postgresql.conf.j2
    │   │   ├── pg_hba.conf.j2
    │   │   └── backup-db.sh.j2
    │   └── handlers/
    │       └── main.yml
    │
    ├── redis/                  # Cache setup
    │   ├── tasks/
    │   │   └── main.yml
    │   ├── templates/
    │   │   └── redis.conf.j2
    │   └── handlers/
    │       └── main.yml
    │
    ├── backend/                # Application deployment
    │   ├── tasks/
    │   │   └── main.yml
    │   ├── templates/
    │   │   ├── env.j2
    │   │   └── airest.service.j2
    │   └── handlers/
    │       └── main.yml
    │
    ├── nginx/                  # Reverse proxy
    │   ├── tasks/
    │   │   └── main.yml
    │   ├── templates/
    │   │   └── nginx-site.conf.j2
    │   └── handlers/
    │       └── main.yml
    │
    └── ssl/                    # SSL certificates
        ├── tasks/
        │   └── main.yml
        └── handlers/
            └── main.yml
```

---

## ⚙️ Configuration

### Environment Variables

Key variables in `group_vars/[environment].yml`:

| Variable | Description | Example |
|----------|-------------|---------|
| `app_name` | Application name | `ai-resto` |
| `app_port` | Internal port | `8000` |
| `app_workers` | Gunicorn workers | `4` (2 x CPU cores) |
| `domain_name` | API domain | `api.example.com` |
| `git_repo` | Git repository | `https://github.com/user/repo.git` |
| `git_branch` | Git branch | `main` or `staging` |
| `db_name` | Database name | `restaurant_db` |
| `db_user` | Database user | `restaurant` |
| `db_password` | Database password | `{{ vault_db_password }}` |
| `secret_key` | JWT secret key | `{{ vault_secret_key }}` |
| `use_ssl` | Enable SSL | `true` |
| `ssl_email` | SSL contact email | `admin@example.com` |

### Production vs Staging Differences

**Production:**
- Higher worker counts (4+ workers)
- SSL required
- Debug disabled
- Monitoring enabled
- Automated backups
- Strict firewall rules

**Staging:**
- Lower resources (2 workers)
- Debug enabled
- Relaxed CORS
- Monitoring optional
- Shorter backup retention

---

## 🔄 Deployment Workflows

### Initial Deployment (First Time)

Complete infrastructure setup from scratch:

```bash
ansible-playbook -i inventories/production site.yml --ask-vault-pass
```

**What this does:**
1. ✅ Configure firewalls, fail2ban, security updates
2. ✅ Install and configure PostgreSQL
3. ✅ Install and configure Redis
4. ✅ Deploy application code
5. ✅ Install Python dependencies
6. ✅ Run database migrations
7. ✅ Configure systemd services
8. ✅ Install and configure Nginx
9. ✅ Obtain SSL certificates
10. ✅ Run health checks

**Time:** 15-30 minutes

### Application Updates (Normal Deployments)

Update application code without rebuilding infrastructure:

```bash
ansible-playbook -i inventories/production deploy.yml --ask-vault-pass
```

**What this does:**
1. ✅ Pull latest code from Git
2. ✅ Update Python dependencies
3. ✅ Run database migrations
4. ✅ Restart application (rolling deployment)
5. ✅ Health checks after each server
6. ✅ Reload Nginx

**Time:** 2-5 minutes

**Rolling Deployment:**
- Deploys to one server at a time
- Verifies health before moving to next server
- Zero downtime

### Rollback

Revert to a previous version if deployment fails:

```bash
# Get the git commit hash you want to rollback to
git log --oneline

# Rollback
ansible-playbook -i inventories/production rollback.yml \
  -e "rollback_version=abc1234" \
  --ask-vault-pass
```

**What this does:**
1. ⚠️ Stops application
2. ⚠️ Checks out previous git version
3. ⚠️ Reinstalls dependencies
4. ⚠️ Prompts for database rollback (manual)
5. ✅ Starts application
6. ✅ Health checks

**Time:** 2-5 minutes

**Database Rollback:**
If schema changed, you may need to manually rollback migrations:

```bash
# SSH to web server
ssh user@web1.example.com

# Become app user
sudo su - airest

# Rollback one migration
cd /opt/ai-resto/backend
source ../venv/bin/activate
alembic downgrade -1

# Or rollback to specific version
alembic downgrade abc123
```

---

## 🛠️ Operations

### Health Checks

```bash
# Run comprehensive health checks
ansible-playbook -i inventories/production healthcheck.yml

# Quick check via curl
curl https://api.yourcompany.com/health
```

### Viewing Logs

```bash
# Via Ansible
ansible webservers -i inventories/production -a "journalctl -u ai-resto -n 50"

# Or SSH to server
ssh user@web1.example.com
sudo journalctl -u ai-resto -f  # Follow logs
sudo journalctl -u nginx -f     # Nginx logs
```

### Restarting Services

```bash
# Restart application on all web servers
ansible webservers -i inventories/production -b -m systemd \
  -a "name=ai-resto state=restarted"

# Restart nginx
ansible webservers -i inventories/production -b -m systemd \
  -a "name=nginx state=restarted"

# Restart PostgreSQL
ansible dbservers -i inventories/production -b -m systemd \
  -a "name=postgresql state=restarted"
```

### Database Operations

```bash
# Connect to database
ssh user@db1.example.com
sudo -u postgres psql restaurant_db

# Create database backup
ssh user@db1.example.com
sudo -u postgres /usr/local/bin/backup-db.sh

# List backups
ssh user@db1.example.com
ls -lh /var/backups/postgresql/
```

### Manual Migration Management

```bash
# SSH to web server
ssh user@web1.example.com
sudo su - airest
cd /opt/ai-resto/backend
source ../venv/bin/activate

# Check current version
alembic current

# Show migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### Certificate Renewal

Certificates auto-renew, but to manually renew:

```bash
ansible webservers -i inventories/production -b -a "certbot renew"
```

---

## 🔍 Troubleshooting

### Problem: Connection Refused

```bash
# Check if service is running
ansible webservers -i inventories/production -b -a "systemctl status ai-resto"

# Check if port is listening
ansible webservers -i inventories/production -a "netstat -tulpn | grep 8000"

# Check firewall
ansible webservers -i inventories/production -b -a "ufw status"
```

### Problem: 502 Bad Gateway

Usually means the application isn't running:

```bash
# Check application logs
ssh user@web1.example.com
sudo journalctl -u ai-resto -n 100

# Common causes:
# - Application crashed (check logs)
# - Wrong port in nginx config
# - Application not started
```

### Problem: Database Connection Error

```bash
# Test database connectivity from web server
ansible webservers -i inventories/production -a \
  "psql postgresql://restaurant:PASSWORD@db1.example.com/restaurant_db -c 'SELECT 1'"

# Check PostgreSQL is running
ansible dbservers -i inventories/production -b -a "systemctl status postgresql"

# Check pg_hba.conf allows connections
ssh user@db1.example.com
sudo cat /etc/postgresql/17/main/pg_hba.conf
```

### Problem: SSL Certificate Issues

```bash
# Check certificate status
ansible webservers -i inventories/production -b -a \
  "certbot certificates"

# Test SSL
curl -vI https://api.yourcompany.com

# Force certificate renewal
ansible webservers -i inventories/production -b -a \
  "certbot renew --force-renewal"
```

### Problem: Out of Memory

```bash
# Check memory usage
ansible all -i inventories/production -a "free -h"

# Check which process is using memory
ansible webservers -i inventories/production -a "ps aux --sort=-%mem | head -20"

# Reduce workers in group_vars if needed
app_workers: 2  # Instead of 4
```

### Problem: Disk Space Full

```bash
# Check disk usage
ansible all -i inventories/production -a "df -h"

# Find large files
ansible all -i inventories/production -a \
  "du -sh /var/log/* /opt/* /var/backups/* | sort -rh | head -20"

# Clean old logs
ansible all -i inventories/production -b -a \
  "journalctl --vacuum-time=7d"

# Clean old backups
ssh user@db1.example.com
sudo find /var/backups/postgresql -mtime +30 -delete
```

---

## 🔐 Security Best Practices

### 1. Use Ansible Vault for Secrets

**NEVER commit plain-text secrets to Git!**

```bash
# Create vault for production
ansible-vault create group_vars/production/vault.yml

# Edit vault
ansible-vault edit group_vars/production/vault.yml

# Store vault password securely
# Option 1: Use password file (secure this file!)
echo "your_vault_password" > ~/.ansible_vault_pass
chmod 600 ~/.ansible_vault_pass

# Use with playbooks
ansible-playbook site.yml --vault-password-file ~/.ansible_vault_pass

# Option 2: Use environment variable
export ANSIBLE_VAULT_PASSWORD=your_vault_password
ansible-playbook site.yml
```

### 2. SSH Key Authentication Only

```bash
# On target servers, disable password auth
sudo nano /etc/ssh/sshd_config

# Set these values:
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### 3. Regular Security Updates

The `common` role enables automatic security updates. Monitor them:

```bash
# Check update status
ansible all -i inventories/production -b -a "apt list --upgradable"

# Force security updates
ansible all -i inventories/production -b -a "unattended-upgrade"
```

### 4. Firewall Configuration

UFW is configured to only allow necessary ports:
- 22 (SSH)
- 80 (HTTP - redirects to HTTPS)
- 443 (HTTPS)

```bash
# Check firewall status
ansible all -i inventories/production -b -a "ufw status verbose"

# Add custom rule if needed
ansible webservers -i inventories/production -b -a \
  "ufw allow from 10.0.0.0/8 to any port 5432"
```

### 5. Regular Backups

Database backups run daily via cron. Store backups off-server:

```bash
# Set up off-site backup sync (add to crontab on db server)
0 2 * * * rsync -az /var/backups/postgresql/ backup-server:/backups/ai-resto/
```

### 6. Monitoring and Alerts

Consider adding:
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (ELK Stack, Graylog)
- APM (New Relic, Datadog)
- Security scanning (OSSEC, Wazuh)

### 7. Least Privilege

- Application runs as dedicated `airest` user (not root)
- Database user has only necessary permissions
- Nginx runs as www-data

---

## 📊 Performance Tuning

### Gunicorn Workers

Rule of thumb: `(2 x CPU cores) + 1`

```yaml
# For 2 CPU cores
app_workers: 5

# For 4 CPU cores
app_workers: 9
```

### PostgreSQL Tuning

Edit `roles/postgresql/templates/postgresql.conf.j2`:

```ini
# For 8GB RAM server
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 512MB
```

### Redis Tuning

Edit `roles/redis/templates/redis.conf.j2`:

```ini
# Maximum memory
maxmemory 1gb

# Eviction policy
maxmemory-policy allkeys-lru
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Ansible
        run: |
          pip install ansible
          ansible-galaxy collection install community.postgresql

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519

      - name: Deploy
        env:
          ANSIBLE_VAULT_PASSWORD: ${{ secrets.ANSIBLE_VAULT_PASSWORD }}
        run: |
          cd ansible
          ansible-playbook -i inventories/production deploy.yml \
            --vault-password-file <(echo "$ANSIBLE_VAULT_PASSWORD")
```

---

## 📚 Additional Resources

### Ansible Documentation
- Ansible User Guide: https://docs.ansible.com/ansible/latest/user_guide/
- Ansible Vault: https://docs.ansible.com/ansible/latest/user_guide/vault.html
- Best Practices: https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html

### Application-Specific
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- PostgreSQL Tuning: https://pgtune.leopard.in.ua/
- Nginx Optimization: https://www.nginx.com/blog/tuning-nginx/
- Let's Encrypt: https://certbot.eff.org/

---

## 🆘 Getting Help

1. Check this README and troubleshooting section
2. Review Ansible logs: `ansible-playbook ... -vvv` (verbose mode)
3. Check application logs on servers
4. Create GitHub issue with:
   - What you were trying to do
   - Command you ran
   - Error messages
   - Relevant log excerpts

---

## 📝 Maintenance Checklist

### Daily
- [ ] Check application health endpoints
- [ ] Monitor error logs

### Weekly
- [ ] Review disk space usage
- [ ] Check backup status
- [ ] Review security logs (fail2ban)

### Monthly
- [ ] Test backup restoration
- [ ] Review SSL certificate expiry
- [ ] Update dependencies (`pip list --outdated`)
- [ ] Review and rotate logs

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Disaster recovery test
- [ ] Documentation updates

---

**Last Updated:** 2025-11-18
**Version:** 1.0.0
**Maintainer:** AI Resto Team

---

## ⚡ Quick Reference

```bash
# Initial deployment
ansible-playbook -i inventories/production site.yml --ask-vault-pass

# Update application
ansible-playbook -i inventories/production deploy.yml --ask-vault-pass

# Rollback
ansible-playbook -i inventories/production rollback.yml -e "rollback_version=abc123" --ask-vault-pass

# Health check
ansible-playbook -i inventories/production healthcheck.yml

# View logs
ansible webservers -i inventories/production -a "journalctl -u ai-resto -n 50"

# Restart app
ansible webservers -i inventories/production -b -m systemd -a "name=ai-resto state=restarted"
```

**Happy Deploying! 🚀**
