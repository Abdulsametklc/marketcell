#!/bin/bash

echo "=== MarketCell Quick Start Script ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo "Checking Python..."
if ! command -v python &> /dev/null; then
    echo -e "${RED}Python not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $(python --version)${NC}"

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check PostgreSQL (optional)
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL found: $(psql --version)${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL not found (using SQLite for development)${NC}"
fi

echo ""
echo "Setting up Backend..."
cd marketcell-database

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
# venv\Scripts\activate  # Windows

# Install requirements
echo "Installing Python packages..."
pip install -r requirements-clean.txt

# Create .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env file"
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create superuser (optional)
echo "Create superuser? (y/n)"
read -r CREATE_SUPER
if [ "$CREATE_SUPER" = "y" ]; then
    python manage.py createsuperuser
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"

echo ""
echo "Setting up Frontend..."
cd ../marketcell-frontend/marketcell-frontend

# Install npm packages
echo "Installing npm packages..."
npm install

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "Created .env.local file"
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd marketcell-database"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd marketcell-frontend/marketcell-frontend"
echo "  npm run dev"
echo ""
echo "URLs:"
echo "  Backend: http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
echo "  Admin: http://localhost:8000/admin"
echo "  Frontend: http://localhost:5173"
echo ""
