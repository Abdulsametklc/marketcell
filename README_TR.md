# MarketCell - E-Commerce Platform

🛒 MarketCell, modern bir e-ticaret platformudur. Alıcılar ve satıcılar için eksiksiz bir çözüm sunar.

## 🚀 Başlıyor

### Hızlı Başlangıç (Docker)

```bash
# Tüm hizmetleri başlat
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:5173
# Database: PostgreSQL on localhost:5432
```

### Manuel Kurulum

Detaylı kurulum talimatları için [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) dosyasını incele.

## 📋 Proje Yapısı

```
marketcell-demo/
├── marketcell-backend/      # Eski backend (kullanılmıyor)
├── marketcell-database/     # 🎯 Ana Django Backend API
├── marketcell-frontend/     # 🎯 React/Vite Frontend
├── docker-compose.yml       # Full-stack Docker setup
└── INTEGRATION_GUIDE.md     # Detaylı entegrasyon rehberi
```

## 🎯 Temel Özellikler

### Kullanıcı Yönetimi
- ✅ GSM numarasıyla kayıt
- ✅ OTP doğrulaması
- ✅ JWT kimlik doğrulama
- ✅ Adres yönetimi

### Ürün Yönetimi
- ✅ Ürün listeleme ve detay
- ✅ Kategori filtreleme
- ✅ Ürün arama
- ✅ Varyant yönetimi (Beden, Renk vb.)

### Sepet & Sipariş
- ✅ Dinamik sepet
- ✅ Sepet ürünü güncelleme
- ✅ Çoklu mağazadan sipariş
- ✅ Kupon/İndirim desteği

### Satıcı Paneli
- ✅ Mağaza yönetimi
- ✅ Sipariş takibi
- ✅ Durum güncellemeleri

## 🏗️ Mimari

### Backend
- **Framework**: Django + Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT (SimpleJWT)
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Django built-in logging

### Frontend
- **Framework**: React 19.x
- **Build Tool**: Vite 8.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Routing**: React Router v7

### Deployment
- **Container**: Docker & Docker Compose
- **Web Server**: Nginx (Frontend)
- **App Server**: Gunicorn (Backend)
- **Database**: PostgreSQL 15

## 📚 API Endpoints

### Kimlik Doğrulama
```
POST   /api/v1/auth/register/         - Kayıt
POST   /api/v1/auth/verify-otp/       - OTP Doğrulama
POST   /api/v1/auth/token/refresh/    - Token Yenileme
```

### Adresler
```
GET    /api/v1/addresses/             - Adresleri Listele
POST   /api/v1/addresses/             - Adres Ekle
GET    /api/v1/addresses/{id}/        - Adres Detayı
PATCH  /api/v1/addresses/{id}/        - Adres Güncelle
DELETE /api/v1/addresses/{id}/        - Adres Sil
```

### Ürünler
```
GET    /api/v1/products/              - Ürünleri Listele
GET    /api/v1/products/{id}/         - Ürün Detayı
GET    /api/v1/categories/            - Kategorileri Listele
GET    /api/v1/stores/                - Mağazaları Listele
POST   /api/v1/stores/                - Yeni Mağaza (Satıcılar)
```

### Sepet
```
GET    /api/v1/cart/                  - Sepeti Getir
POST   /api/v1/cart/items/            - Sepete Ekle
PATCH  /api/v1/cart/items/{id}/       - Güncelle
DELETE /api/v1/cart/items/{id}/       - Sil
```

### Siparişler
```
GET    /api/v1/orders/                - Siparişleri Listele
POST   /api/v1/orders/                - Yeni Sipariş
GET    /api/v1/orders/{id}/           - Sipariş Detayı
GET    /api/v1/seller/orders/         - Satıcı Siparişleri
PATCH  /api/v1/seller/orders/{id}/status/ - Durumu Güncelle
```

## 🔐 Kimlik Doğrulama Akışı

```
1. Kullanıcı GSM + Ad ile kaydolur
   ↓
2. OTP koduyla doğrulama yapar
   ↓
3. JWT token (access + refresh) alır
   ↓
4. API isteklerinde Authorization header'da token kullanır
   ↓
5. Token süresi dolarsa refresh token ile yenisini alır
```

## 🗄️ Veri Modelleri

### User
```
- id (UUID)
- gsm_number (Unique)
- name
- email
- is_buyer / is_seller / is_admin
- otp_code
- created_at
```

### Product
```
- id (UUID)
- store (FK)
- category (FK)
- name, description
- base_price
- status (ACTIVE/INACTIVE/OUT_OF_STOCK)
- images (JSON)
- variants (ProductVariant)
- search_vector (Full-text search)
```

### Order
```
- id (UUID)
- buyer (FK)
- address (FK)
- total_amount
- payment_status
- sub_orders (SubOrder - her mağaza için bir)
```

## 🚀 Dağıtım

### Production Setup

1. **Environment Variables** - `.env.prod` oluştur
2. **Database Migration** - `python manage.py migrate`
3. **Static Files** - `python manage.py collectstatic`
4. **Gunicorn** - WSGI sunucusu olarak çalıştır
5. **Nginx** - Reverse proxy olarak yapılandır
6. **SSL/TLS** - HTTPS sertifikası ekle

### Docker Dağıtımı

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Database backup
docker-compose exec db pg_dump -U postgres marketcell > backup.sql
```

## 📦 Gerekli Paketler

### Backend
```
Django==5.2.14
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.2
django-cors-headers==4.3.1
drf-spectacular==0.27.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

### Frontend
```
react==19.x
react-router-dom==7.x
zustand==5.x
axios==1.x
tailwindcss==3.x
```

## 🧪 Test

### Backend
```bash
cd marketcell-database
python manage.py test
```

### Frontend
```bash
cd marketcell-frontend/marketcell-frontend
npm test
```

## 📖 Dokümantasyon

- **API Docs**: http://localhost:8000/api/docs (Swagger)
- **Admin Panel**: http://localhost:8000/admin
- **Integration Guide**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

## 🤝 Katkıda Bulunma

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit et (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push et (`git push origin feature/AmazingFeature`)
5. Pull Request aç

## 📄 Lisans

Bu proje MIT lisansı altında dağıtılmaktadır.

## 👥 İletişim

- Issue'lar için: GitHub Issues
- Sorular için: GitHub Discussions
- Email: support@marketcell.com

---

**Son Güncelleme**: Mayıs 2026

**Status**: ✅ Tüm bileşenler entegre edildi ve çalışan durumda
