import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Store, Category, Product, ProductVariant, Address

def run_seed():
    print("Veritabanı verileri oluşturuluyor...")

    # Kategoriler
    elektronik, _ = Category.objects.get_or_create(name='Elektronik', slug='elektronik', defaults={'level': 0})
    giyim, _      = Category.objects.get_or_create(name='Giyim',      slug='giyim',      defaults={'level': 0})
    telefon, _    = Category.objects.get_or_create(name='Telefon',     slug='telefon',    defaults={'level': 1, 'parent': elektronik})
    laptop, _     = Category.objects.get_or_create(name='Laptop',      slug='laptop',     defaults={'level': 1, 'parent': elektronik})
    erkek, _      = Category.objects.get_or_create(name='Erkek Giyim', slug='erkek-giyim',defaults={'level': 1, 'parent': giyim})
    print("Kategoriler OK")

    # Satici 1
    s1, created = User.objects.get_or_create(gsm_number='5551111111', defaults={'name': 'Ahmet Yilmaz', 'is_seller': True, 'is_buyer': True})
    if created:
        s1.set_password('pass1234')
        s1.save()
    Address.objects.get_or_create(user=s1, title='Ev', defaults={'full_address': 'Kadikoy Mah. No:1', 'city': 'Istanbul', 'district': 'Kadikoy', 'is_default': True})
    store1, _ = Store.objects.get_or_create(seller=s1, defaults={'name': 'TechStore', 'description': 'Elektronik urunler', 'logo_url': 'https://picsum.photos/200', 'is_approved': True})

    # Satici 2
    s2, created = User.objects.get_or_create(gsm_number='5552222222', defaults={'name': 'Mehmet Kaya', 'is_seller': True, 'is_buyer': True})
    if created:
        s2.set_password('pass1234')
        s2.save()
    Address.objects.get_or_create(user=s2, title='Ev', defaults={'full_address': 'Besiktas Mah. No:2', 'city': 'Istanbul', 'district': 'Besiktas', 'is_default': True})
    store2, _ = Store.objects.get_or_create(seller=s2, defaults={'name': 'ModaHaus', 'description': 'Trendy giyim', 'logo_url': 'https://picsum.photos/201', 'is_approved': True})

    # Satici 3
    s3, created = User.objects.get_or_create(gsm_number='5553333333', defaults={'name': 'Ayse Demir', 'is_seller': True, 'is_buyer': True})
    if created:
        s3.set_password('pass1234')
        s3.save()
    Address.objects.get_or_create(user=s3, title='Ev', defaults={'full_address': 'Sisli Mah. No:3', 'city': 'Istanbul', 'district': 'Sisli', 'is_default': True})
    store3, _ = Store.objects.get_or_create(seller=s3, defaults={'name': 'GadgetHub', 'description': 'Teknoloji aksesuarlari', 'logo_url': 'https://picsum.photos/202', 'is_approved': True})

    # Alici kullanici (demo icin)
    buyer, created = User.objects.get_or_create(gsm_number='5320000000', defaults={'name': 'Test Alici', 'is_buyer': True, 'is_seller': False})
    if created:
        buyer.set_password('1234')
        buyer.save()
    Address.objects.get_or_create(user=buyer, title='Ev Adresim', defaults={'full_address': 'Merkez Mah. Ataturk Cad. No:1923', 'city': 'Istanbul', 'district': 'Arnavutkoy', 'is_default': True})

    print("Kullanicilar ve magazalar OK")

    # TechStore - Telefonlar
    phones = [
        ('iPhone 15',   'Apple iPhone 15 128GB akilli telefon',    45000),
        ('Samsung S24', 'Samsung Galaxy S24 256GB akilli telefon', 38000),
        ('Xiaomi 14',   'Xiaomi 14 Pro 256GB akilli telefon',      28000),
        ('Huawei P60',  'Huawei P60 Pro 256GB akilli telefon',     32000),
        ('OnePlus 12',  'OnePlus 12 256GB akilli telefon',         25000),
    ]
    for name, desc, price in phones:
        p, _ = Product.objects.get_or_create(store=store1, name=name, defaults={'category': telefon, 'description': desc, 'base_price': price, 'images': ['https://picsum.photos/400']})
        ProductVariant.objects.get_or_create(product=p, variant_type='color', value='Siyah', defaults={'price_diff': 0,   'stock': 10})
        ProductVariant.objects.get_or_create(product=p, variant_type='color', value='Beyaz', defaults={'price_diff': 500, 'stock': 5})

    # TechStore - Laptoplar
    laptops = [
        ('MacBook Air M3',  'Apple MacBook Air M3 8GB 256GB',  75000),
        ('Dell XPS 13',     'Dell XPS 13 Plus i7 16GB 512GB',  55000),
        ('Lenovo ThinkPad', 'Lenovo ThinkPad X1 Carbon i7',    48000),
        ('Asus ROG',        'Asus ROG Zephyrus G14 RTX4060',   42000),
        ('HP Spectre',      'HP Spectre x360 14 i7 16GB',      38000),
    ]
    for name, desc, price in laptops:
        p, _ = Product.objects.get_or_create(store=store1, name=name, defaults={'category': laptop, 'description': desc, 'base_price': price, 'images': ['https://picsum.photos/401']})
        ProductVariant.objects.get_or_create(product=p, variant_type='color', value='Uzay Grisi', defaults={'price_diff': 0, 'stock': 8})

    # ModaHaus - Giyim
    clothes = [
        ('Slim Fit Gomlek', 'Erkek slim fit gomlek %100 pamuk',  450),
        ('Chino Pantolon',  'Erkek chino pantolon slim fit',      650),
        ('Polo Tisort',     'Erkek polo tisort pique kumas',      350),
        ('Denim Ceket',     'Erkek denim ceket oversize',         850),
        ('Kazak',           'Erkek yun kazak slim fit',           750),
        ('Mont',            'Erkek su gecirmez mont',            1200),
        ('Sweatshirt',      'Erkek kapsonlu sweatshirt',          550),
        ('Spor Ayakkabi',   'Erkek kosu ayakkabisi',              950),
        ('Kemer',           'Erkek deri kemer otomatik toka',     250),
        ('Sapka',           'Erkek beyzbol sapkasi',              180),
    ]
    for name, desc, price in clothes:
        p, _ = Product.objects.get_or_create(store=store2, name=name, defaults={'category': erkek, 'description': desc, 'base_price': price, 'images': ['https://picsum.photos/402']})
        for size in ['S', 'M', 'L', 'XL']:
            ProductVariant.objects.get_or_create(product=p, variant_type='size', value=size, defaults={'price_diff': 0, 'stock': 15})

    # GadgetHub - Aksesuarlar
    gadgets = [
        ('AirPods Pro',   'Apple AirPods Pro 2. Nesil ANC',     5500),
        ('Galaxy Buds',   'Samsung Galaxy Buds2 Pro ANC',       3200),
        ('Apple Watch',   'Apple Watch Series 9 41mm GPS',     15000),
        ('Galaxy Watch',  'Samsung Galaxy Watch 6 44mm',        8500),
        ('iPad Air',      'Apple iPad Air M1 64GB WiFi',       22000),
        ('Galaxy Tab S9', 'Samsung Galaxy Tab S9 128GB',       18000),
        ('Powerbank 20K', 'Anker 20000mAh hizli sarj 65W',       800),
        ('USB-C Hub',     '7in1 USB-C Hub 4K HDMI 100W PD',      650),
        ('MagSafe Sarj',  'MagSafe uyumlu kablosuz sarj 15W',    450),
        ('Deri Kilif',    'MagSafe uyumlu deri telefon kilifi',  250),
    ]
    for name, desc, price in gadgets:
        p, _ = Product.objects.get_or_create(store=store3, name=name, defaults={'category': telefon, 'description': desc, 'base_price': price, 'images': ['https://picsum.photos/403']})
        ProductVariant.objects.get_or_create(product=p, variant_type='color', value='Siyah', defaults={'price_diff': 0, 'stock': 20})
        ProductVariant.objects.get_or_create(product=p, variant_type='color', value='Beyaz', defaults={'price_diff': 0, 'stock': 20})

    print("Urunler OK")
    print(f"TAMAMLANDI: {User.objects.count()} kullanici, {Store.objects.count()} magaza, {Category.objects.count()} kategori, {Product.objects.count()} urun")

if __name__ == "__main__":
    run_seed()