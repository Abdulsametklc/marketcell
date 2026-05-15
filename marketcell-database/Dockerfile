# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Sistem paketleri
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python paketleri
COPY requirements-clean.txt .
RUN pip install --no-cache-dir -r requirements-clean.txt

# Django uygulaması
COPY . .

# Port
EXPOSE 8000

# Migration ve sunucu başlatma
CMD ["sh", "-c", "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]
