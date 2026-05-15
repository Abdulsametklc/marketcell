from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.products.models import Category, Store, Product, ProductVariant
from apps.orders.models import Coupon


class Command(BaseCommand):
    help = 'Seed: 3 magaza, 5 kategori, 30 urun'

    def handle(self, *args, **kwargs):

        # Zaten seed yapilmissa atla
        if Product.objects.exists():
            self.stdout.write('Seed zaten yapilmis, atlaniyor.')
            return

        # Kategoriler
        elektronik, _ = Category.objects.get_or_create(slug='elektronik', defaults={'name': 'Elektronik', 'level': 0})
        giyim,      _ = Category.objects.get_or_create(slug='giyim',      defaults={'name': 'Giyim',      'level': 0})
        Category.objects.get_or_create(slug='telefon',     defaults={'name': 'Telefon',     'level': 1, 'parent': elektronik})
        Category.objects.get_or_create(slug='laptop',      defaults={'name': 'Laptop',      'level': 1, 'parent': elektronik})
        Category.objects.get_or_create(slug='erkek-giyim', defaults={'name': 'Erkek Giyim', 'level': 1, 'parent': giyim})
        self.stdout.write('Kategoriler OK')

        # Kullanicilar
        s1, _ = User.objects.get_or_create(gsm_number='5551111111', defaults={'name': 'Ahmet Yilmaz', 'is_seller': True})
        s2, _ = User.objects.get_or_create(gsm_number='5552222222', defaults={'name': 'Mehmet Kaya',  'is_seller': True})
        s3, _ = User.objects.get_or_create(gsm_number='5553333333', defaults={'name': 'Ayse Demir',   'is_seller': True})

        # Admin kullanici
        User.objects.get_or_create(gsm_number='5550000000', defaults={'name': 'Admin', 'is_admin': True, 'is_buyer': True})

        # Magazalar
        store1, _ = Store.objects.get_or_create(seller=s1, defaults={'name': 'TechStore',  'description': 'Elektronik urunler',     'logo_url': 'https://picsum.photos/200', 'is_approved': True})
        store2, _ = Store.objects.get_or_create(seller=s2, defaults={'name': 'ModaHaus',   'description': 'Trendy giyim',           'logo_url': 'https://picsum.photos/201', 'is_approved': True})
        store3, _ = Store.objects.get_or_create(seller=s3, defaults={'name': 'GadgetHub',  'description': 'Teknoloji aksesuarlari', 'logo_url': 'https://picsum.photos/202', 'is_approved': True})
        self.stdout.write('Magazalar OK')

        telefon_cat = Category.objects.get(slug='telefon')
        laptop_cat  = Category.objects.get(slug='laptop')
        erkek_cat   = Category.objects.get(slug='erkek-giyim')

        # TechStore - Telefonlar
        phones = [
            ('iPhone 15',    'Apple iPhone 15 128GB akilli telefon',       45000),
            ('Samsung S24',  'Samsung Galaxy S24 256GB akilli telefon',    38000),
            ('Xiaomi 14',    'Xiaomi 14 Pro 256GB akilli telefon',         28000),
            ('Huawei P60',   'Huawei P60 Pro 256GB akilli telefon',        32000),
            ('OnePlus 12',   'OnePlus 12 256GB akilli telefon',            25000),
        ]
        for name, desc, price in phones:
            p = Product.objects.create(store=store1, category=telefon_cat, name=name, description=desc, base_price=price, images=['https://picsum.photos/400'])
            ProductVariant.objects.create(product=p, variant_type='color', value='Siyah', price_diff=0,   stock=10)
            ProductVariant.objects.create(product=p, variant_type='color', value='Beyaz', price_diff=500, stock=5)

        # TechStore - Laptoplar
        laptops = [
            ('MacBook Air M3',   'Apple MacBook Air M3 8GB 256GB',         75000),
            ('Dell XPS 13',      'Dell XPS 13 Plus i7 16GB 512GB',         55000),
            ('Lenovo ThinkPad',  'Lenovo ThinkPad X1 Carbon i7',           48000),
            ('Asus ROG',         'Asus ROG Zephyrus G14 RTX4060',          42000),
            ('HP Spectre',       'HP Spectre x360 14 i7 16GB',             38000),
        ]
        for name, desc, price in laptops:
            p = Product.objects.create(store=store1, category=laptop_cat, name=name, description=desc, base_price=price, images=['https://picsum.photos/401'])
            ProductVariant.objects.create(product=p, variant_type='color', value='Uzay Grisi', price_diff=0, stock=8)

        # ModaHaus - Giyim
        clothes = [
            ('Slim Fit Gomlek',  'Erkek slim fit gomlek %100 pamuk',  450),
            ('Chino Pantolon',   'Erkek chino pantolon slim fit',      650),
            ('Polo Tisort',      'Erkek polo tisort pique kumas',      350),
            ('Denim Ceket',      'Erkek denim ceket oversize',         850),
            ('Kazak',            'Erkek yun kazak slim fit',           750),
            ('Mont',             'Erkek su gecirmez mont',            1200),
            ('Sweatshirt',       'Erkek kapsonlu sweatshirt',          550),
            ('Spor Ayakkabi',    'Erkek kosu ayakkabisi',              950),
            ('Kemer',            'Erkek deri kemer otomatik toka',     250),
            ('Sapka',            'Erkek beyzbol sapkasi',              180),
        ]
        for name, desc, price in clothes:
            p = Product.objects.create(store=store2, category=erkek_cat, name=name, description=desc, base_price=price, images=['https://picsum.photos/402'])
            for size in ['S', 'M', 'L', 'XL']:
                ProductVariant.objects.create(product=p, variant_type='size', value=size, price_diff=0, stock=15)

        # GadgetHub - Aksesuarlar
        gadgets = [
            ('AirPods Pro',      'Apple AirPods Pro 2. Nesil ANC',    5500),
            ('Galaxy Buds',      'Samsung Galaxy Buds2 Pro ANC',      3200),
            ('Apple Watch',      'Apple Watch Series 9 41mm GPS',    15000),
            ('Galaxy Watch',     'Samsung Galaxy Watch 6 44mm',       8500),
            ('iPad Air',         'Apple iPad Air M1 64GB WiFi',      22000),
            ('Galaxy Tab S9',    'Samsung Galaxy Tab S9 128GB',      18000),
            ('Powerbank 20K',    'Anker 20000mAh hizli sarj 65W',      800),
            ('USB-C Hub',        '7in1 USB-C Hub 4K HDMI 100W PD',     650),
            ('MagSafe Sarj',     'MagSafe uyumlu kablosuz sarj 15W',   450),
            ('Deri Kilif',       'MagSafe uyumlu deri telefon kilifi', 250),
        ]
        for name, desc, price in gadgets:
            p = Product.objects.create(store=store3, category=telefon_cat, name=name, description=desc, base_price=price, images=['https://picsum.photos/403'])
            ProductVariant.objects.create(product=p, variant_type='color', value='Siyah', price_diff=0, stock=20)
            ProductVariant.objects.create(product=p, variant_type='color', value='Beyaz', price_diff=0, stock=20)

        # Kuponlar
        expires = timezone.now() + timedelta(days=365)
        Coupon.objects.get_or_create(code='TURKCELL10', defaults={
            'discount_type': 'PERCENTAGE', 'discount_value': 10,
            'min_order_amount': 500, 'max_uses': 1000, 'expires_at': expires, 'is_active': True,
        })
        Coupon.objects.get_or_create(code='MARKETCELL500', defaults={
            'discount_type': 'FIXED', 'discount_value': 500,
            'min_order_amount': 2000, 'max_uses': 500, 'expires_at': expires, 'is_active': True,
        })
        self.stdout.write(self.style.SUCCESS('Seed tamamlandi: 3 magaza, 5 kategori, 30 urun, 2 kupon olusturuldu'))