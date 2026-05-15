# MarketCell - Entegrasyon Rehberi

Bu dokümanda, MarketCell projesinin üç ana bileşeninin (Backend, Database, Frontend) nasıl entegre edileceği açıklanmaktadır.

## Proje Yapısı

```
marketcell-demo/
├── marketcell-backend/           # (Kullanılmayan - marketcell-database ile değiştirildi)
├── marketcell-database/          # Ana Backend API
│   ├── apps/
│   │   ├── users/               # Kullanıcı ve kimlik doğrulama
│   │   ├── products/            # Ürün ve mağaza yönetimi
│   │   └── orders/              # Sipariş ve sepet yönetimi
│   └── config/                  # Django ayarları
└── marketcell-frontend/          # React/Vite Frontend
    └── marketcell-frontend/
        ├── src/
        │   ├── api/             # API istemcisi
        │   ├── components/      # React bileşenleri
        │   ├── pages/           # Sayfa bileşenleri
        │   └── store/           # Zustand state management
        └── vite.config.js       # Vite konfigürasyonu
```

## Mimariye Genel Bakış

### Backend Mimarisi
- **Framework**: Django + Django REST Framework
- **Database**: PostgreSQL (varsayılan) veya SQLite (development)
- **Authentication**: JWT (JSON Web Tokens)
- **API Versioning**: v1
- **Dokumentasyon**: Swagger/OpenAPI (drf-spectacular)

### API Endpoints

#### Kullanıcı İşlemleri (`/api/v1/auth/`)
- POST `/register/` - Yeni kullanıcı kaydı
- POST `/verify-otp/` - OTP doğrulama ve token alma
- POST `/token/refresh/` - Token yenileme
- GET `/addresses/` - Adresleri listele
- POST `/addresses/` - Adres ekle
- GET `/addresses/{id}/` - Adres detayı
- PATCH `/addresses/{id}/` - Adres güncelle
- DELETE `/addresses/{id}/` - Adres sil

#### Ürün İşlemleri (`/api/v1/`)
- GET `/products/` - Ürünleri listele (search, filter destekli)
- GET `/products/{id}/` - Ürün detayı
- GET `/categories/` - Kategorileri listele
- GET `/stores/` - Mağazaları listele
- POST `/stores/` - Yeni mağaza oluştur (satıcılar için)

#### Sepet İşlemleri (`/api/v1/`)
- GET `/cart/` - Sepeti getir
- POST `/cart/items/` - Sepete ürün ekle
- PATCH `/cart/items/{id}/` - Sepet ürünü güncelle
- DELETE `/cart/items/{id}/` - Sepetten ürün çıkar

#### Sipariş İşlemleri (`/api/v1/`)
- GET `/orders/` - Siparişleri listele
- POST `/orders/` - Yeni sipariş oluştur
- GET `/orders/{id}/` - Sipariş detayı

#### Satıcı İşlemleri (`/api/v1/`)
- GET `/seller/orders/` - Satıcı siparişlerini listele
- PATCH `/seller/orders/{id}/status/` - Sipariş durumunu güncelle

## Kurulum Adımları

### 1. Backend Kurulumu

```bash
cd marketcell-database

# Virtual environment oluştur
python -m venv venv

# Virtual environment'ı aktifleştir
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Gerekli paketleri yükle
pip install -r requirements.txt

# .env dosyasını oluştur
cp .env.example .env

# Veritabanı migrasyonlarını çalıştır
python manage.py migrate

# Veritabanına örnek veri ekle (seed)
python manage.py seed  # Eğer seed komutu varsa

# Süper kullanıcı oluştur
python manage.py createsuperuser

# Development sunucusunu başlat
python manage.py runserver
```

**Sunucu**: http://localhost:8000
**Admin**: http://localhost:8000/admin
**API Docs**: http://localhost:8000/api/docs

### 2. Frontend Kurulumu

```bash
cd marketcell-frontend/marketcell-frontend

# Node paketlerini yükle
npm install

# .env.local dosyasını oluştur (eğer gerekirse)
# VITE_API_BASE_URL=http://localhost:8000/api/v1

# Development sunucusunu başlat
npm run dev
```

**Sunucu**: http://localhost:5173

### 3. Tam Entegrasyon Kontrol Listesi

- [ ] PostgreSQL veya SQLite veritabanı kurulu ve çalışıyor mu?
- [ ] Backend `python manage.py runserver` ile çalışıyor mu?
- [ ] API Docs sayfası (`http://localhost:8000/api/docs`) açılabiliyor mu?
- [ ] Frontend `npm run dev` ile çalışıyor mu?
- [ ] Frontend, backend'e bağlanabiliyor mu?
- [ ] Test API çağrıları başarılı mı?

## CORS Konfigürasyonu

Backend, aşağıdaki kaynaklardan istek almaya izin verilecek şekilde yapılandırılmıştır:
- `http://localhost:5173` - Vite development sunucusu
- `http://localhost:3000` - Alternatif frontend sunucusu
- `http://localhost:8000` - Backend sunucusu

Üretim ortamı için `config/settings.py` dosyasında `CORS_ALLOWED_ORIGINS` değerini güncelle.

## Kimlik Doğrulama Akışı

1. **Kayıt**: Kullanıcı GSM numarası ve adı ile kaydolur
2. **OTP Doğrulama**: Kullanıcı OTP kodunu doğrular ve JWT token alır
3. **Token Kullanımı**: API isteklerinde `Authorization: Bearer {token}` header'ı kullan
4. **Token Yenileme**: Erken dönüş için `refresh_token` kullan

## Veri Modelleri

### Kullanıcı (User)
- UUID primary key
- GSM numarası (unique)
- Ad, email
- Alıcı/Satıcı/Admin rolleri
- OTP kodu

### Ürün (Product)
- UUID primary key
- Mağaza ilişkisi
- Kategori ilişkisi
- Ad, açıklama, temel fiyat
- Durum (Aktif, Pasif, Stok Dışı)
- Görseller (JSON)
- Varyantlar (Beden, Renk vb.)

### Sipariş (Order)
- UUID primary key
- Alıcı ilişkisi
- Adres ilişkisi
- Toplam tutar, ödeme durumu
- Kupon/İndirim desteği
- Alt siparişler (Her mağaza için bir alt sipariş)

### Sepet (Cart)
- UUID primary key
- Kullanıcı ilişkisi (One-to-One)
- Sepet ürünleri

## Hata Giderme

### Veritabanı Hataları
```bash
# Migrasyonları kontrol et
python manage.py showmigrations

# Tüm migrasyonları uygula
python manage.py migrate

# Veritabanını sıfırla (geliştirme sırasında)
python manage.py flush
```

### CORS Hataları
- Browser konsolunda "Access-Control-Allow-Origin" hatası görülüyorsa:
  1. Backend sunucusunun çalıştığını kontrol et
  2. `CORS_ALLOWED_ORIGINS` ayarını kontrol et
  3. CORS middleware'nin doğru sırada yüklü olduğunu kontrol et

### Frontend Bağlantı Hataları
- `axios.js` dosyasındaki `baseURL` kontrol et
- Network sekmesinde API çağrılarını kontrol et
- Backend response headers'ında CORS headers'ını kontrol et

## İleri Konular

### Docker ile Üretim Kurulumu

Backend ve Frontend için Dockerfile'lar eklenebilir:
- Backend: Django uygulaması için
- Frontend: Statik dosya sunucusu (nginx)
- Database: PostgreSQL container'ı

### Statik Dosyalar
```bash
python manage.py collectstatic
```

### SüpUser
```bash
python manage.py createsuperuser
```

## Yaygın Görevler

### Yeni API Endpoint Ekleme
1. `models.py` dosyasında model tanımla
2. `serializers.py` dosyasında serializer oluştur
3. `views.py` dosyasında view sınıfı yaz
4. `urls.py` dosyasında URL pattern ekle
5. Migration oluştur: `python manage.py makemigrations`
6. Migration uygula: `python manage.py migrate`

### Seed Verisi Ekleme
```bash
python manage.py management/commands/seed.py
# veya
python manage.py seed
```

## İletişim ve Destek

- Sorunlar için Issues sayfasını kontrol et
- Pull Request ile katkı sağla
- Dokümantasyon güncellemeleri karşılanır
