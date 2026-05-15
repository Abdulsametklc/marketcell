# MarketCell — Turkcell Dijital Pazar Yeri

Turkcell abonelerinin Paycell ile ödeme yaparak dijital ve fiziksel ürün alıp satabildiği **çok satıcılı (multi-vendor)** pazar yeri platformu.

> **Turkcell CodeNight 2026** hackathon projesi — 10 saat içinde geliştirildi.

---

## Ekran Görüntüleri

### Giriş & Kayıt

| Giriş Yap | Kayıt Ol |
|-----------|----------|
| ![](<sc/Ekran görüntüsü 2026-05-15 034041.png>) | ![](<sc/Ekran görüntüsü 2026-05-15 034048.png>) |

> Turkcell GSM numarası ile giriş → OTP kodu ekranda otomatik gösterilir → Doğrula.

---

### Ürün Kataloğu & Arama

**Ürün listesi — kategori filtresi, fiyat aralığı, sıralama:**

![](<sc/Ekran görüntüsü 2026-05-15 033547.png>)

**Metin arama — "sweatshirt" ile anlık arama:**

![](<sc/Ekran görüntüsü 2026-05-15 033613.png>)

---

### Ürün Detay & Sepete Ekleme

| Varyant Seçimi | Sepete Ekle |
|----------------|-------------|
| ![](<sc/Ekran görüntüsü 2026-05-15 033728.png>) | ![](<sc/Ekran görüntüsü 2026-05-15 033737.png>) |

> Beden (S/M/L/XL) veya renk seçimi, stok kontrolü, fiyat farkı gösterimi.

---

### Sepet

![](<sc/Ekran görüntüsü 2026-05-15 033750.png>)

> Ürünler satıcı bazında gruplandırılır. Adet güncelleme, kaldırma, toplam fiyat.

---

### Ödeme (Paycell Simülasyonu)

![](<sc/Ekran görüntüsü 2026-05-15 033806.png>)

> Teslimat adresi seçimi + Paycell kart girişi. `4242...` başarılı, `4000...` başarısız.

---

### Sipariş Onayı — Çok Satıcılı Bölünme

![](<sc/Ekran görüntüsü 2026-05-15 033818.png>)

> Sipariş satıcı bazlı alt siparişlere otomatik bölünür. Her satıcı kendi kargosunu yönetir.

---

### Sipariş Geçmişi

![](<sc/Ekran görüntüsü 2026-05-15 033833.png>)

> Tüm siparişler satıcı bazlı durum etiketleriyle listelenir: Ödendi / Hazırlanıyor / Kargoda / Teslim Edildi.

---

### Satıcı Paneli

![](<sc/Ekran görüntüsü 2026-05-15 033915.png>)

> Günlük/haftalık satış istatistikleri, sipariş listesi ve durum güncelleme (Ödendi → Hazırlanıyor → Kargoda).

---

### Admin Paneli

| Dashboard | Satıcı Yönetimi | Kategori Yönetimi |
|-----------|----------------|-------------------|
| ![](<sc/Ekran görüntüsü 2026-05-15 033959.png>) | ![](<sc/Ekran görüntüsü 2026-05-15 034009.png>) | ![](<sc/Ekran görüntüsü 2026-05-15 034021.png>) |

> Platform geneli istatistikler, satıcı onay/ret işlemleri, kategori ekleme/silme.

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
git clone https://github.com/nisacetinel06/marketcell.git
cd marketcell
docker compose up
```

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1/ |
| Swagger Docs | http://localhost:8000/api/docs/ |

> `docker compose up` otomatik olarak migrate ve seed yapar. 30 ürün, 3 mağaza, 5 kategori hazır gelir.

---

## Demo Hesapları

| Rol | Telefon | Açıklama |
|-----|---------|----------|
| Admin | `5550000000` | Platform yöneticisi |
| Satıcı | `5551111111` | TechStore — Telefon & Laptop |
| Satıcı | `5552222222` | ModaHaus — Giyim |
| Satıcı | `5553333333` | GadgetHub — Aksesuar |
| Alıcı | Herhangi numara | Yeni hesap oluşturulur |

**Paycell test kartları:**
- `4242 4242 4242 4242` → Ödeme başarılı
- `4000 0000 0000 0000` → Ödeme reddedildi

**Kupon kodları:**
- `TURKCELL10` → %10 indirim (min. ₺500)
- `MARKETCELL500` → ₺500 sabit indirim (min. ₺2000)

---

## Özellikler

### Zorunlu Özellikler
- GSM + OTP ile kayıt/giriş (JWT + Refresh Token)
- Rol bazlı erişim: Alıcı, Satıcı, Admin
- Ürün kataloğu: metin arama, kategori (hiyerarşik), fiyat filtresi, sıralama, sayfalama
- Ürün detay: galeri, beden/renk varyantı, stok gösterimi
- Sepet yönetimi: ekleme, adet güncelleme, satıcı bazlı gruplama
- **Çok satıcılı sipariş bölünmesi:** tek sipariş → satıcı bazlı SubOrder'lara ayrılır
- **Atomik stok düşümü:** `select_for_update()` + `transaction.atomic` (race condition koruması)
- Paycell ödeme simülasyonu
- Sipariş state machine: `PAID → PREPARING → SHIPPED → DELIVERED`
- Satıcı paneli: sipariş yönetimi, durum güncelleme, günlük/haftalık istatistikler
- Admin paneli: platform istatistikleri, satıcı onayı, kategori yönetimi
- Adres yönetimi

### Bonus Özellikler
- Ürün değerlendirme ve yorum (1-5 yıldız + metin)
- Favorilere ekleme (Wishlist)
- Satıcı puanı (ortalama ürün puanı, sipariş tamamlama oranı)
- Kupon/indirim kodu sistemi (sabit tutar veya yüzde)
- Uygulama içi sipariş bildirimleri (navbar zili, 30sn polling)

---

## Proje Yapısı

```
marketcell/
├── docker-compose.yml
├── marketcell-database/          # Django Backend
│   ├── apps/
│   │   ├── users/               # Auth, OTP, JWT, Adres
│   │   ├── products/            # Ürün, Kategori, Mağaza, Yorum, Wishlist
│   │   └── orders/              # Sepet, Sipariş, SubOrder, Kupon, Bildirim
│   ├── config/
│   └── manage.py
└── marketcell-frontend/
    └── marketcell-frontend/      # React Frontend
        └── src/
            ├── pages/
            ├── api/
            ├── components/
            └── store/
```

---

## API Dokümantasyonu

Swagger UI: **http://localhost:8000/api/docs/**

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/auth/register/` | GSM ile kayıt + OTP |
| POST | `/api/v1/auth/verify-otp/` | OTP doğrula, JWT döner |
| POST | `/api/v1/auth/token/refresh/` | Token yenile |
| GET/POST | `/api/v1/auth/addresses/` | Adres listele / ekle |

### Ürünler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/products/?q=&cat=&min=&max=&sort=` | Arama + filtreleme |
| GET | `/api/v1/products/<id>/` | Ürün detay |
| GET | `/api/v1/categories/` | Kategori ağacı |
| GET/POST | `/api/v1/products/<id>/reviews/` | Yorumlar |
| GET/POST | `/api/v1/wishlist/<id>/` | Favori toggle |

### Sepet & Sipariş
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/cart/` | Sepetim |
| POST | `/api/v1/cart/items/` | Sepete ekle |
| POST | `/api/v1/orders/` | Sipariş oluştur (Paycell) |
| GET | `/api/v1/orders/` | Siparişlerim |
| POST | `/api/v1/coupons/validate/` | Kupon doğrula |
| GET | `/api/v1/notifications/` | Bildirimler |

### Satıcı & Admin
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/seller/orders/` | Satıcı siparişleri |
| PATCH | `/api/v1/seller/orders/<id>/status/` | Durum güncelle |
| GET | `/api/v1/seller/stats/` | Satış istatistikleri |
| GET | `/api/v1/admin/stats/` | Platform istatistikleri |
| GET | `/api/v1/admin/sellers/` | Satıcı listesi |

---

## Mimari

```
Browser (React SPA)
  │  axios + JWT interceptor (auto-refresh)
  ▼
Django REST API
  ├── apps/users    → Auth, OTP, JWT
  ├── apps/products → Ürün, Kategori, Mağaza, Yorum, Wishlist
  └── apps/orders   → Sepet, Sipariş, SubOrder, Kupon, Bildirim
        │
        │  @transaction.atomic + select_for_update()
        ▼
PostgreSQL 15 (Docker)
```

**Çok satıcılı sipariş bölünmesi:**
```
Sepet: [iPhone → TechStore] + [Sweatshirt → ModaHaus] + [AirPods → GadgetHub]
         ↓
Order (ana sipariş, toplam tutar, ödeme)
  ├── SubOrder #1 → TechStore   (atomik stok düşümü)
  ├── SubOrder #2 → ModaHaus    (atomik stok düşümü)
  └── SubOrder #3 → GadgetHub   (atomik stok düşümü)
```
