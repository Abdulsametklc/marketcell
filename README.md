# MarketCell — Turkcell Dijital Pazar Yeri

Turkcell abonelerinin Paycell ile ödeme yaparak dijital ve fiziksel ürün alıp satabildiği çok satıcılı (multi-vendor) pazar yeri platformu.

> **Turkcell CodeNight 2026** hackathon projesi.

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend | Django 5.2, Django REST Framework |
| Veritabanı | PostgreSQL 15 |
| Auth | JWT + Refresh Token (SimpleJWT) |
| API Docs | Swagger (drf-spectacular) |
| Container | Docker, Docker Compose |

---

## Hızlı Başlangıç

**Tek komut ile tüm sistemi başlat:**

```bash
git clone <repo-url>
cd marketcell-demo
docker compose up
```

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1/ |
| Swagger Docs | http://localhost:8000/api/docs/ |

> `docker compose up` komutu otomatik olarak migrate ve seed işlemlerini yapar. 30 ürün, 3 mağaza, 5 kategori hazır gelir.

---

## Demo Hesapları

| Rol | Telefon | Açıklama |
|-----|---------|----------|
| Admin | `5550000000` | Platform yöneticisi |
| Satıcı | `5551111111` | TechStore (Telefon & Laptop) |
| Satıcı | `5552222222` | ModaHaus (Giyim) |
| Satıcı | `5553333333` | GadgetHub (Aksesuar) |
| Alıcı | Herhangi numara | Yeni hesap oluşturulur |

**Giriş akışı:** Telefon numarası gir → OTP kodu ekranda otomatik çıkar → Doğrula.

**Paycell test kartları:**
- `4242 4242 4242 4242` → Ödeme başarılı
- `4000 0000 0000 0000` → Ödeme reddedildi

---

## Özellikler

### Alıcı
- GSM + OTP ile kayıt/giriş (JWT)
- Ürün arama, kategori ve fiyat filtresi, sıralama
- Sayfalama (20 ürün/sayfa)
- Ürün detay: galeri, varyant seçimi (renk/beden), stok gösterimi
- Sepet yönetimi: ekleme, adet güncelleme, çıkarma
- Checkout: adres seçimi, Paycell ödeme simülasyonu
- Sipariş geçmişi ve detay görüntüleme
- Adres yönetimi

### Satıcı
- Satıcıya gelen siparişleri listeleme (mağaza bazlı izole)
- Sipariş durum güncelleme: `PAID → PREPARING → SHIPPED`
- Günlük / haftalık satış istatistikleri

### Admin
- Platform istatistikleri (kullanıcı, ürün, sipariş, gelir)
- Satıcı onaylama / onay kaldırma
- Kategori yönetimi (ekleme, silme)

### Teknik
- **Çok satıcılı sipariş bölünmesi:** Bir sepette farklı satıcılardan ürün varsa sipariş otomatik satıcı bazlı alt siparişlere bölünür
- **Atomik stok düşümü:** `select_for_update()` + `transaction.atomic` ile race condition koruması
- **Sipariş state machine:** PAID → PREPARING → SHIPPED → DELIVERED / CANCELLED
- **JWT Refresh Token:** Token süresi dolunca otomatik yenileme

---

## Proje Yapısı

```
marketcell-demo/
├── docker-compose.yml
├── marketcell-database/          # Django Backend
│   ├── apps/
│   │   ├── users/               # Auth, OTP, Adres
│   │   ├── products/            # Ürün, Kategori, Mağaza
│   │   └── orders/              # Sepet, Sipariş, SubOrder
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   └── manage.py
└── marketcell-frontend/
    └── marketcell-frontend/      # React Frontend
        └── src/
            ├── pages/
            ├── api/
            └── store/
```

---

## API Dokümantasyonu

Swagger UI: **http://localhost:8000/api/docs/**

### Auth

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/auth/register/` | GSM ile kayıt + OTP gönder |
| POST | `/api/v1/auth/verify-otp/` | OTP doğrulama, JWT döner |
| POST | `/api/v1/auth/token/refresh/` | Access token yenile |
| GET | `/api/v1/auth/addresses/` | Adreslerimi listele |
| POST | `/api/v1/auth/addresses/` | Yeni adres ekle |
| PATCH | `/api/v1/auth/addresses/<id>/` | Adres güncelle |
| DELETE | `/api/v1/auth/addresses/<id>/` | Adres sil |

### Ürünler & Kategoriler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/products/` | Ürün listesi (filtreli, sayfalı) |
| GET | `/api/v1/products/?q=iphone` | Metin arama |
| GET | `/api/v1/products/?cat=<uuid>` | Kategori filtresi |
| GET | `/api/v1/products/?min=1000&max=5000` | Fiyat aralığı |
| GET | `/api/v1/products/?sort=price_asc` | Sıralama |
| GET | `/api/v1/products/<id>/` | Ürün detay (varyantlar dahil) |
| GET | `/api/v1/categories/` | Kategori ağacı |

### Sepet & Sipariş

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/cart/` | Sepetim |
| POST | `/api/v1/cart/items/` | Sepete ekle `{variant_id, quantity}` |
| PATCH | `/api/v1/cart/items/<id>/` | Adet güncelle `{quantity}` |
| DELETE | `/api/v1/cart/items/<id>/` | Sepetten çıkar |
| POST | `/api/v1/orders/` | Sipariş oluştur (Paycell ödeme) |
| GET | `/api/v1/orders/` | Siparişlerim |
| GET | `/api/v1/orders/<id>/` | Sipariş detay |

### Satıcı Paneli

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/seller/orders/` | Satıcıya gelen siparişler |
| PATCH | `/api/v1/seller/orders/<id>/status/` | Sipariş durumu güncelle `{status}` |
| GET | `/api/v1/seller/stats/` | Günlük/haftalık istatistikler |

### Admin

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/admin/stats/` | Platform istatistikleri |
| GET | `/api/v1/admin/sellers/` | Tüm satıcılar |
| PATCH | `/api/v1/admin/stores/<id>/` | Mağaza onayla/reddet |

---

## Örnek API İstekleri

**Kayıt:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"gsm_number": "5551234567", "name": "Ali Veli"}'
```

**OTP Doğrulama:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp/ \
  -H "Content-Type: application/json" \
  -d '{"gsm_number": "5551234567", "otp_code": "123456"}'
```

**Ürün Arama:**
```bash
curl "http://localhost:8000/api/v1/products/?q=iphone&sort=price_asc"
```

**Sipariş Oluşturma:**
```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"address_id": "<uuid>", "card_number": "4242424242424242"}'
```

---

## Mimari

```
Browser
  │
  ▼
React SPA (port 5173)
  │  axios + JWT interceptor
  ▼
Django REST API (port 8000)
  │
  ├── apps/users    → Auth, OTP, JWT
  ├── apps/products → Ürün, Kategori, Mağaza
  └── apps/orders   → Sepet, Sipariş, SubOrder
        │
        │  @transaction.atomic
        │  select_for_update()
        ▼
PostgreSQL (port 5432)
```

**Çok satıcılı sipariş bölünmesi:**
```
Sepet [iPhone (TechStore) + Gömlek (ModaHaus)]
  │
  ▼ POST /api/v1/orders/
  │
  ├── Order (ana sipariş, toplam tutar, ödeme)
  │     ├── SubOrder → TechStore (iPhone)
  │     └── SubOrder → ModaHaus (Gömlek)
  │
  └── Stok atomik düşümü (select_for_update)
```
