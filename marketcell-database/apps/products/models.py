import uuid
from django.db import models
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from apps.users.models import User


class Category(models.Model):
    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    name   = models.CharField(max_length=100)
    slug   = models.SlugField(unique=True)
    level  = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name


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

    def __str__(self):
        return self.name


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
    images        = models.JSONField(default=list)
    search_vector = SearchVectorField(null=True, blank=True)
    is_deleted    = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products'
        indexes  = [GinIndex(fields=['search_vector'])]

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product      = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    variant_type = models.CharField(max_length=20)
    value        = models.CharField(max_length=50)
    price_diff   = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    stock        = models.PositiveIntegerField(default=0)

    class Meta:
        db_table        = 'product_variants'
        unique_together = [('product', 'variant_type', 'value')]

    def __str__(self):
        return f"{self.product.name} - {self.variant_type}: {self.value}"


class Review(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    rating     = models.PositiveSmallIntegerField()
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