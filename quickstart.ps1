# MarketCell Quick Start Script for Windows
# Usage: powershell -ExecutionPolicy Bypass -File quickstart.ps1

Write-Host "=== MarketCell Quick Start Script ===" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up Backend..." -ForegroundColor Yellow
Push-Location marketcell-database

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

# Install requirements
Write-Host "Installing Python packages..."
pip install -r requirements-clean.txt

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env file"
}

# Run migrations
Write-Host "Running migrations..."
python manage.py migrate

# Ask about superuser
$createSuper = Read-Host "Create superuser? (y/n)"
if ($createSuper -eq "y") {
    python manage.py createsuperuser
}

Write-Host "✓ Backend setup complete" -ForegroundColor Green

Write-Host ""
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
Pop-Location
Push-Location marketcell-frontend\marketcell-frontend

# Install npm packages
Write-Host "Installing npm packages..."
npm install

# Create .env.local if not exists
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Created .env.local file"
}

Write-Host "✓ Frontend setup complete" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor White
Write-Host "  cd marketcell-database"
Write-Host "  .\venv\Scripts\Activate.ps1"
Write-Host "  python manage.py runserver"
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor White
Write-Host "  cd marketcell-frontend/marketcell-frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "URLs:" -ForegroundColor White
Write-Host "  Backend: http://localhost:8000"
Write-Host "  API Docs: http://localhost:8000/api/docs"
Write-Host "  Admin: http://localhost:8000/admin"
Write-Host "  Frontend: http://localhost:5173"
Write-Host ""
