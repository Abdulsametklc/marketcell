# MarketCell - Sistem Mimarisi

Bu dokümanda MarketCell e-ticaret platformunun tam sistem mimarisi tanımlanmıştır.

## 🏗️ Genel Mimari Görünüm

```
┌─────────────────────────────────────────────────────────────────────┐
│                          İstemci Tarafı                             │
│                      React 19 / Vite 8                              │
│                     (port: 5173)                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Tailwind CSS + React Router + Zustand State Management     │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  Pages Layer                                         │   │   │
│  │  │  - Login/Register - Products - Cart - Orders        │   │   │
│  │  │  - Checkout - Seller Dashboard                      │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  Components Layer                                    │   │   │
│  │  │  - Navbar - ProductCard - CartItem - OrderItem      │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  State Management (Zustand)                         │   │   │
│  │  │  - authStore - cartStore - orderStore              │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  API Client (Axios)                                 │   │   │
│  │  │  - auth.js - products.js - cart.js - orders.js     │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                    ↓ (HTTP REST API)                              │
│                  CORS Enabled                                      │
│                    ↓                                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       Sunucu Tarafı                                 │
│                   Django 5.2 REST API                              │
│                     (port: 8000)                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  API Gateway & Authentication                              │  │
│  │  - JWT Authentication (SimpleJWT)                          │  │
│  │  - CORS Middleware                                         │  │
│  │  - Rate Limiting (optional)                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  API Routes (v1)                                            │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ /auth/         - Authentication & OTP                 │ │  │
│  │  │ /products/     - Product Management                   │ │  │
│  │  │ /categories/   - Category Management                  │ │  │
│  │  │ /stores/       - Store Management                     │ │  │
│  │  │ /cart/         - Shopping Cart                        │ │  │
│  │  │ /orders/       - Order Management                     │ │  │
│  │  │ /seller/       - Seller Operations                    │ │  │
│  │  │ /addresses/    - Address Management                   │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  View Layer (Business Logic)                               │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ UserViews:  Register, VerifyOTP, Address Management  │ │  │
│  │  │ ProductViews: List, Detail, Search, Filter           │ │  │
│  │  │ CartViews: Get, Add, Update, Remove                  │ │  │
│  │  │ OrderViews: Create, List, Detail, SellerOperations  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Serializer Layer (Data Validation & Transformation)       │  │
│  │  - UserSerializer, ProductSerializer, OrderSerializer      │  │
│  │  - CartSerializer, AddressSerializer, etc.                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Model Layer (ORM)                                          │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Users App:                                             │ │  │
│  │  │ - User (Custom auth with GSM number)                  │ │  │
│  │  │ - Address                                              │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │ Products App:                                          │ │  │
│  │  │ - Product - Category - Store - ProductVariant          │ │  │
│  │  │ - Review - Wishlist                                    │ │  │
│  │  ├────────────────────────────────────────────────────────┤ │  │
│  │  │ Orders App:                                            │ │  │
│  │  │ - Order - SubOrder - OrderItem                         │ │  │
│  │  │ - Cart - CartItem - Coupon                             │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Signal Handlers                                            │  │
│  │  - Auto-create Cart for new User                           │  │
│  │  - Full-text search vector update on Product save          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Veri Tabanı Tarafı                            │
│                   PostgreSQL 15 / SQLite (dev)                     │
│                       (port: 5432)                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Core Tables                                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ users (auth_user): User, GSM, OTP, Roles           │  │  │
│  │  │ addresses: User addresses with delivery info        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ categories: Product categories (hierarchical)       │  │  │
│  │  │ products: Product details, pricing, images          │  │  │
│  │  │ product_variants: Size, color, price variants       │  │  │
│  │  │ stores: Seller stores                               │  │  │
│  │  │ reviews: Product reviews & ratings                  │  │  │
│  │  │ wishlists: User wishlist items                       │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ carts: User shopping carts                           │  │  │
│  │  │ cart_items: Individual cart items                    │  │  │
│  │  │ orders: Main order records                           │  │  │
│  │  │ sub_orders: Per-store orders (1:N with Order)        │  │  │
│  │  │ order_items: Items within each sub_order             │  │  │
│  │  │ coupons: Discount coupons                            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Indexes:                                                    │  │
│  │ - users.gsm_number (unique)                                │  │
│  │ - products.search_vector (GIN index for full-text search)  │  │
│  │ - orders.buyer_id (FK index)                               │  │
│  │ - sub_orders.store_id (FK index)                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Veri Akışı

### 1. Kullanıcı Kayıt Akışı
```
[Frontend]                           [Backend]                    [Database]
User Input ─────────────────────→    RegisterView ────────────→   users table
  (GSM, Name)                        (Validate & Create)          (Insert User)
                                         ↓
                                    Signal: create_cart
                                         ↓
                                    carts table
                                    (Insert Cart)
                                         ↓
                    ←──── Success Response + User ID ─────
```

### 2. OTP Doğrulama ve Token Alımı
```
[Frontend]                           [Backend]                    [Database]
User Input ─────────────────────→    VerifyOTPView ────────────→  users table
  (GSM, OTP)                         (Validate OTP)               (Check OTP)
                                         ↓
                                    JWT Generation
                                    (SimpleJWT)
                                         ↓
                    ←──── JWT Tokens (Access + Refresh) ─────
                            + User Data
```

### 3. Ürün Listeleme Akışı
```
[Frontend]                           [Backend]                    [Database]
axios.get('/products/') ───────────→ ProductListView ─────────→  products table
  + Filters                          (Filter & Paginate)           (Query & Join)
  + Search                               ↓
                                    ProductListSerializer
                                         ↓
                    ←──── Paginated Product List ──────
                            (Status 200)
```

### 4. Sepet Yönetimi Akışı
```
[Frontend]                           [Backend]                    [Database]
User adds item ────────────────→     CartView ─────────────────→  carts table
  (variant_id, qty)                  AddToCartView                (Get/Create)
                                         ↓                             ↓
                                    ProductVariant Check      cartitems table
                                         ↓                    (Insert/Update)
                    ←──── Updated Cart with Items ──────
                            (Status 201/200)
```

### 5. Sipariş Oluşturma Akışı
```
[Frontend]                           [Backend]                    [Database]
POST /orders/ ─────────────────→     OrderListCreateView ──────→  orders table
  (address_id, card_number,          Transaction Start            (Insert Order)
   coupon_code)                           ↓
                                    Validate Address              addresses table
                                         ↓                         (Check)
                                    Get Cart Items                    ↓
                                         ↓                        cart_items table
                                    Create Order Record               ↓
                                         ↓                        products table
                                    Group by Store                    ↓
                                         ↓                        product_variants
                                    Create SubOrders                  ↓
                                         ↓                        sub_orders table
                                    Create OrderItems                ↓
                                         ↓                        order_items table
                                    Clear Cart                        ↓
                                         ↓                        carts table
                                    Commit Transaction               (Clear)
                                         ↓
                    ←──── Order Confirmation + Details ──────
```

## 🔐 Güvenlik Mimarisi

### Kimlik Doğrulama

```
┌─────────────────┐
│  Frontend App   │
│   localStorage  │ ──→ access_token (JWT)
│                 │ ──→ refresh_token (JWT)
└─────────────────┘
         ↓
  axios interceptor
         ↓
  Authorization: Bearer {access_token}
         ↓
┌─────────────────────────────────┐
│  Django REST Framework          │
│  JWT Authentication Middleware  │
│  ↓                              │
│  Token Verification             │
│  ↓                              │
│  User Extraction from Token     │
│  ↓                              │
│  Permission Check               │
│  ↓                              │
│  Route to View                  │
└─────────────────────────────────┘

Token Expiration → Refresh Token Kullan → New Access Token
```

### CORS Güvenliği

```
Frontend Request
    ↓
  OPTIONS (preflight)
    ↓
Backend CORS Middleware
    ↓
  CORS_ALLOWED_ORIGINS Check
    ↓
  Match? ──Yes──→ Response with CORS Headers
              ├─ Access-Control-Allow-Origin
              ├─ Access-Control-Allow-Credentials
              └─ Access-Control-Allow-Methods
    ↓
  No ──→ 403 CORS Error
```

## 🔄 Transaction Management

### Order Creation Transaction

```python
@transaction.atomic
def create_order():
    """
    ACID Properties:
    - Atomicity: Tüm işlemler bir bütün olarak gerçekleşir
    - Consistency: Veri bütünlüğü korunur
    - Isolation: Eşzamanlı işlemlerden etkilenmez
    - Durability: İşlem tamamlandıktan sonra kalıcıdır
    """
    
    # 1. Validate Address
    # 2. Get Cart Items
    # 3. Create Order Record
    # 4. Group Items by Store
    # 5. Create SubOrders for Each Store
    # 6. Create OrderItems
    # 7. Clear Cart
    
    # Hata oluşursa: ROLLBACK
    # Başarılı ise: COMMIT
```

## 📱 API Versioning

```
/api/v1/
├── /auth/
├── /products/
├── /categories/
├── /stores/
├── /cart/
├── /orders/
├── /seller/
└── /addresses/

Future:
/api/v2/
├── (Yeni özellikler)
├── (Geliştirilmiş endpoints)
└── (Eski endpoints hala destekli)
```

## 🐳 Container Mimarisi

```
docker-compose.yml
├── db (PostgreSQL 15)
│   └── volumes: postgres_data
├── backend (Django)
│   ├── depends_on: db
│   ├── ports: 8000:8000
│   └── environment: DB_HOST=db
├── frontend (Node + Nginx)
│   ├── depends_on: backend
│   ├── ports: 5173:5173
│   └── environment: VITE_API_BASE_URL=http://backend:8000/api/v1
└── networks: marketcell-network
```

## 📈 Ölçeklenebilirlik

### Mevcut Yapı (Single Server)
```
Single Django Process
    ↓
Single PostgreSQL Instance
    ↓
Single Nginx (Frontend Serving)
```

### Ölçeklenmiş Yapı (Production)
```
                    Load Balancer
                    /    |    \
        Nginx    Nginx   Nginx
         :80      :80     :80
          |        |       |
    ┌─────────────────────────┐
    │                         │
    Gunicorn  Gunicorn  Gunicorn
     :8000     :8000     :8000
      |         |        |
    ┌─────────────────────────┐
    │   Django Workers        │
    │   (Gevent/Uvicorn)      │
    └─────────────────────────┘
           ↓
    ┌─────────────────────────┐
    │   PostgreSQL            │
    │   (Master-Slave)        │
    └─────────────────────────┘
```

## 🔄 Caching Strategy (İleri)

```
Frontend (Browser Cache)
    ↓
CDN (Cloudflare)
    ↓
Redis Cache Layer
    ↓
Django (Memcached)
    ↓
PostgreSQL Database
```

## 📊 Monitoring & Logging

```
┌──────────────────────┐
│ Application Logs     │
│ - DEBUG              │
│ - INFO               │
│ - WARNING            │
│ - ERROR              │
└──────────────────────┘
        ↓
┌──────────────────────┐
│ Log Aggregation      │
│ - ELK Stack (opt)    │
│ - Sentry (opt)       │
│ - CloudWatch (opt)   │
└──────────────────────┘
        ↓
┌──────────────────────┐
│ Monitoring Dashboard │
│ - Grafana            │
│ - New Relic          │
│ - Datadog            │
└──────────────────────┘
```

## 🚀 CI/CD Pipeline (İleri)

```
Push to GitHub
    ↓
GitHub Actions Triggered
    ↓
├── Lint & Format Check
├── Unit Tests
├── Integration Tests
├── Security Scan
└── Coverage Report
    ↓
Build Docker Images
    ↓
Push to Registry
    ↓
Deploy to Staging
    ↓
Run E2E Tests
    ↓
Deploy to Production
    ↓
Health Checks
```

## 🛡️ Disaster Recovery

```
Backup Strategy:
├── Database: Daily automated backups
├── Frontend: Static assets in CDN
└── Code: Git repository (GitHub)

Recovery RTO: 1-4 hours
Recovery RPO: 1 hour
```

---

**Bu mimari, modern e-ticaret uygulamalarının best practices'lerini takip ederek tasarlanmıştır.**

**Scalability, Security, Performance ve Maintainability** göz önünde tutularak oluşturulmuştur.
