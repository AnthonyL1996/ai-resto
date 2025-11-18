#!/bin/bash
#
# AI Resto - Development Environment Setup Script
# This script sets up your development environment automatically
#
# Usage: ./setup-dev.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Main setup
print_header "AI Resto Development Setup"

# Check prerequisites
print_info "Checking prerequisites..."

MISSING_DEPS=0

if ! check_command python3; then
    print_error "Python 3 is required. Please install Python 3.10 or higher."
    MISSING_DEPS=1
fi

if ! check_command pip; then
    print_error "pip is required. Please install pip."
    MISSING_DEPS=1
fi

if ! check_command docker; then
    print_warning "Docker is required for database services."
    print_info "Install from: https://docs.docker.com/get-docker/"
    MISSING_DEPS=1
fi

if ! check_command docker-compose; then
    print_warning "Docker Compose is required for database services."
    print_info "Install from: https://docs.docker.com/compose/install/"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies and run this script again."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
REQUIRED_VERSION="3.10"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Python $REQUIRED_VERSION or higher is required. Found: $PYTHON_VERSION"
    exit 1
fi

print_success "All prerequisites are installed"

# Setup backend
print_header "Setting Up Backend"

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
print_info "Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
print_success "Dependencies installed"

# Create .env file
if [ ! -f ".env" ]; then
    print_info "Creating .env file..."
    cp .env.example .env

    # Generate secret key
    SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')

    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-here-CHANGE-THIS/$SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/your-secret-key-here-CHANGE-THIS/$SECRET_KEY/" .env
    fi

    print_success ".env file created with generated SECRET_KEY"
else
    print_warning ".env file already exists - skipping"
fi

cd ..

# Setup Docker services
print_header "Starting Docker Services"

print_info "Starting PostgreSQL and Redis..."
docker-compose up -d db redis

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "Docker services are running"
else
    print_error "Failed to start Docker services"
    exit 1
fi

# Run migrations
print_header "Running Database Migrations"

cd backend
source venv/bin/activate

print_info "Applying database migrations..."
alembic upgrade head
print_success "Database migrations completed"

cd ..

# Setup frontend (optional)
print_header "Setting Up Frontend (Optional)"

read -p "Do you want to set up the frontend? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if check_command node && check_command npm; then
        cd frontend
        print_info "Installing Node dependencies..."
        npm install
        print_success "Frontend dependencies installed"
        cd ..
    else
        print_warning "Node.js/npm not found. Skipping frontend setup."
        print_info "Install from: https://nodejs.org/"
    fi
fi

# Create helpful scripts
print_header "Creating Helper Scripts"

# Start backend script
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
EOF
chmod +x start-backend.sh
print_success "Created start-backend.sh"

# Start frontend script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm run dev
EOF
chmod +x start-frontend.sh
print_success "Created start-frontend.sh"

# Run migrations script
cat > run-migrations.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
alembic upgrade head
EOF
chmod +x run-migrations.sh
print_success "Created run-migrations.sh"

# Print summary
print_header "Setup Complete! 🎉"

echo -e "${GREEN}Your development environment is ready!${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Start the backend:   ${YELLOW}./start-backend.sh${NC}"
echo -e "  2. Start the frontend:  ${YELLOW}./start-frontend.sh${NC}"
echo -e "  3. Run migrations:      ${YELLOW}./run-migrations.sh${NC}"
echo ""

echo -e "${BLUE}Useful URLs:${NC}"
echo -e "  • Backend API:    ${YELLOW}http://localhost:8000${NC}"
echo -e "  • API Docs:       ${YELLOW}http://localhost:8000/docs${NC}"
echo -e "  • Health Check:   ${YELLOW}http://localhost:8000/health${NC}"
echo -e "  • Frontend:       ${YELLOW}http://localhost:5173${NC}"
echo ""

echo -e "${BLUE}Database Services:${NC}"
echo -e "  • PostgreSQL:     ${YELLOW}localhost:5432${NC}"
echo -e "  • Redis:          ${YELLOW}localhost:6379${NC}"
echo ""

echo -e "${BLUE}Documentation:${NC}"
echo -e "  • Onboarding:     ${YELLOW}cat TEAM_ONBOARDING.md${NC}"
echo -e "  • Migrations:     ${YELLOW}cat DATABASE_MIGRATIONS.md${NC}"
echo -e "  • Security:       ${YELLOW}cat SECURITY.md${NC}"
echo ""

print_info "To test your setup, run: curl http://localhost:8000/health"
echo ""

# Optional: Start services
read -p "Do you want to start the backend now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting backend server..."
    ./start-backend.sh
fi
