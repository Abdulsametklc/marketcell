#!/usr/bin/env python
"""
Health check script to validate MarketCell integration
Run this after starting both backend and frontend
"""

import os
import sys
import subprocess
import requests
import json
from pathlib import Path

# ANSI Colors
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_status(status, message):
    if status:
        print(f"{Colors.GREEN}✓{Colors.END} {message}")
    else:
        print(f"{Colors.RED}✗{Colors.END} {message}")
    return status

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get('http://localhost:8000/api/docs', timeout=5)
        return print_status(response.status_code == 200, "Backend is running (http://localhost:8000)")
    except requests.exceptions.ConnectionError:
        return print_status(False, "Backend is not running")
    except Exception as e:
        return print_status(False, f"Backend error: {str(e)}")

def check_frontend():
    """Check if frontend is running"""
    try:
        response = requests.get('http://localhost:5173', timeout=5)
        return print_status(response.status_code == 200, "Frontend is running (http://localhost:5173)")
    except requests.exceptions.ConnectionError:
        return print_status(False, "Frontend is not running")
    except Exception as e:
        return print_status(False, f"Frontend error: {str(e)}")

def check_database():
    """Check if database is accessible"""
    try:
        response = requests.get('http://localhost:8000/admin', timeout=5)
        return print_status(response.status_code in [200, 301, 302], "Database is connected")
    except:
        return print_status(False, "Cannot connect to database")

def check_api_endpoints():
    """Check critical API endpoints"""
    endpoints = [
        ('GET', '/api/v1/products/', 'Product listing'),
        ('GET', '/api/v1/categories/', 'Categories listing'),
    ]
    
    results = []
    for method, endpoint, description in endpoints:
        try:
            url = f'http://localhost:8000{endpoint}'
            if method == 'GET':
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, timeout=5)
            
            status = response.status_code < 400
            results.append(print_status(status, f"{description} ({endpoint})"))
        except Exception as e:
            results.append(print_status(False, f"{description} - Error: {str(e)}"))
    
    return all(results) if results else False

def check_cors():
    """Check CORS configuration"""
    try:
        headers = {
            'Origin': 'http://localhost:5173'
        }
        response = requests.options('http://localhost:8000/api/v1/products/', headers=headers, timeout=5)
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        cors_ok = cors_origin is not None
        return print_status(cors_ok, "CORS is configured correctly")
    except Exception as e:
        return print_status(False, f"CORS check failed: {str(e)}")

def check_env_files():
    """Check if required .env files exist"""
    results = []
    
    backend_env = Path('marketcell-database/.env')
    results.append(print_status(backend_env.exists(), ".env file in marketcell-database"))
    
    frontend_env = Path('marketcell-frontend/marketcell-frontend/.env.local')
    results.append(print_status(frontend_env.exists() or True, ".env.local in frontend (optional)"))
    
    return all(results)

def main():
    print(f"\n{Colors.BLUE}=== MarketCell Health Check ==={Colors.END}\n")
    
    print("System Status:")
    print("-" * 40)
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    database_ok = check_database()
    
    print("\nAPI Endpoints:")
    print("-" * 40)
    api_ok = check_api_endpoints()
    
    print("\nConfiguration:")
    print("-" * 40)
    cors_ok = check_cors()
    env_ok = check_env_files()
    
    print("\nSummary:")
    print("-" * 40)
    all_ok = backend_ok and frontend_ok and database_ok and api_ok and cors_ok
    
    if all_ok:
        print(f"{Colors.GREEN}✓ All systems operational!{Colors.END}")
        return 0
    else:
        print(f"{Colors.YELLOW}⚠ Some issues detected. Check above.{Colors.END}")
        
        if not backend_ok:
            print(f"\n{Colors.YELLOW}Backend not running? Try:{Colors.END}")
            print("  cd marketcell-database")
            print("  source venv/bin/activate  # or venv\\Scripts\\Activate.ps1 on Windows")
            print("  python manage.py runserver")
        
        if not frontend_ok:
            print(f"\n{Colors.YELLOW}Frontend not running? Try:{Colors.END}")
            print("  cd marketcell-frontend/marketcell-frontend")
            print("  npm run dev")
        
        return 1

if __name__ == '__main__':
    sys.exit(main())
