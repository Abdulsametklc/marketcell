# models.py — tüm uygulamalar için

import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex


# ─── AUTH ────────────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, gsm_number, name, password=None, **extra):
        user = self.model(gsm_number=gsm_number, name=name, **extra)
        user.set_password(password)
        user.save()
        return user

class User(AbstractBaseUser):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gsm_number  = models.CharField(max_length=15, unique=True)
    name        = models.CharField(max_length=100)
    email       = models.EmailField(blank=True)
    is_buyer    = models.BooleanField(default=True)
    is_seller   = models.BooleanField(default=False)
    is_admin    = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)
    otp_code    = models.CharField(max_length=6, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'gsm_number'
    objects = UserManager()

    class Meta:
        db_table = 'users'


# ─── STORE ───────────────────────────────────────────────────────────────────

class Store(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller      = models.OneToOneField(User, on_delete=models.CASCADE, related_name='store')
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo_url    = models.URLField(blank=True)
    phone       = models.CharField(max_length=20, blank=True)
    is_approved = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stores'


# ─── CATEGORY ────────────────────────────────────────────────────────────────

class Category(models.Model):
    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent  = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    name    = models.CharField(max_length=100)
    slug    = models.SlugField(unique=True)
    level   = models.PositiveSmallIntegerField(default=0)  # 0=root, 1=alt

    class Meta:
        db_table = 'categories'


# ─── PRODUCT ─────────────────────────────────────────────────────────────────

class ProductStatus(models.TextChoices):
    ACTIVE       = 'ACTIVE', 'Aktif'
    INACTIVE     = 'INACTIVE', 'Pasif'
    OUT_OF_STOCK = 'OUT_OF_STOCK', 'Stokta Yok'

class Product(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store         = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    category      = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    name          = models.CharField(max_length=200)
    description   = models.TextField()
    base_price    = models.DecimalField(max_digits=10, decimal_places=2)
    status        = models.CharField(max_length=20, choices=ProductStatus.choices, default=ProductStatus.ACTIVE)
    images        = models.JSONField(default=list)          # ["url1", "url2"]
    search_vector = SearchVectorField(null=True, blank=True) # PostgreSQL tsvector
    is_deleted    = models.BooleanField(default=False)       # soft delete
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products'
        indexes  = [GinIndex(fields=['search_vector'])]     # full-text search index

class ProductVariant(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product      = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    variant_type = models.CharField(max_length=20)   # 'size' | 'color'
    value        = models.CharField(max_length=50)   # 'XL', 'Kırmızı'
    price_diff   = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    stock        = models.PositiveIntegerField(default=0)

    class Meta:
        db_table        = 'product_variants'
        unique_together = [('product', 'variant_type', 'value')]


# ─── ADDRESS ─────────────────────────────────────────────────────────────────

class Address(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    title        = models.CharField(max_length=100)   # "Ev", "İş"
    full_address = models.TextField()
    city         = models.CharField(max_length=100)
    district     = models.CharField(max_length=100)
    is_default   = models.BooleanField(default=False)

    class Meta:
        db_table = 'addresses'


# ─── CART ────────────────────────────────────────────────────────────────────

class Cart(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

class CartItem(models.Model):
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart     = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant  = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table        = 'cart_items'
        unique_together = [('cart', 'variant')]


# ─── ORDER ───────────────────────────────────────────────────────────────────

class PaymentStatus(models.TextChoices):
    PENDING  = 'PENDING', 'Bekliyor'
    PAID     = 'PAID', 'Ödendi'
    FAILED   = 'FAILED', 'Başarısız'
    REFUNDED = 'REFUNDED', 'İade Edildi'

class Order(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer          = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    address        = models.ForeignKey(Address, on_delete=models.PROTECT)
    total_amount   = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    card_last4     = models.CharField(max_length=4, blank=True)
    coupon         = models.ForeignKey('Coupon', null=True, blank=True, on_delete=models.SET_NULL)
    discount_amount= models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'orders'

class SubOrderStatus(models.TextChoices):
    PAID      = 'PAID', 'Ödendi'
    PREPARING = 'PREPARING', 'Hazırlanıyor'
    SHIPPED   = 'SHIPPED', 'Kargoda'
    DELIVERED = 'DELIVERED', 'Teslim Edildi'
    CANCELLED = 'CANCELLED', 'İptal'

class SubOrder(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order       = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='sub_orders')
    store       = models.ForeignKey(Store, on_delete=models.PROTECT, related_name='sub_orders')
    subtotal    = models.DecimalField(max_digits=12, decimal_places=2)
    status      = models.CharField(max_length=20, choices=SubOrderStatus.choices, default=SubOrderStatus.PAID)
    tracking_no = models.CharField(max_length=100, blank=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sub_orders'

class OrderItem(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_order  = models.ForeignKey(SubOrder, on_delete=models.CASCADE, related_name='items')
    variant    = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    quantity   = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # sipariş anındaki fiyat

    class Meta:
        db_table = 'order_items'


# ─── BONUS ───────────────────────────────────────────────────────────────────

class Review(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    rating     = models.PositiveSmallIntegerField()   # 1-5
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'reviews'
        unique_together = [('product', 'user')]

class Wishlist(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    product    = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'wishlists'
        unique_together = [('user', 'product')]

class DiscountType(models.TextChoices):
    FIXED      = 'FIXED', 'Sabit TL'
    PERCENTAGE = 'PERCENTAGE', 'Yüzde'

class Coupon(models.Model):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code              = models.CharField(max_length=30, unique=True)
    discount_type     = models.CharField(max_length=15, choices=DiscountType.choices)
    discount_value    = models.DecimalField(max_digits=8, decimal_places=2)
    min_order_amount  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses          = models.PositiveIntegerField(default=100)
    used_count        = models.PositiveIntegerField(default=0)
    expires_at        = models.DateTimeField()
    is_active         = models.BooleanField(default=True)

    class Meta:
        db_table = 'coupons'