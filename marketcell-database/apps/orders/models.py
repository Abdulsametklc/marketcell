import uuid
from django.db import models
from apps.users.models import User, Address
from apps.products.models import Store, ProductVariant


class DiscountType(models.TextChoices):
    FIXED      = 'FIXED', 'Sabit TL'
    PERCENTAGE = 'PERCENTAGE', 'Yüzde'


class Coupon(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code             = models.CharField(max_length=30, unique=True)
    discount_type    = models.CharField(max_length=15, choices=DiscountType.choices)
    discount_value   = models.DecimalField(max_digits=8, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses         = models.PositiveIntegerField(default=100)
    used_count       = models.PositiveIntegerField(default=0)
    expires_at       = models.DateTimeField()
    is_active        = models.BooleanField(default=True)

    class Meta:
        db_table = 'coupons'


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


class PaymentStatus(models.TextChoices):
    PENDING  = 'PENDING', 'Bekliyor'
    PAID     = 'PAID', 'Ödendi'
    FAILED   = 'FAILED', 'Başarısız'
    REFUNDED = 'REFUNDED', 'İade Edildi'


class Order(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer           = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    address         = models.ForeignKey(Address, on_delete=models.PROTECT)
    total_amount    = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status  = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    card_last4      = models.CharField(max_length=4, blank=True)
    coupon          = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at      = models.DateTimeField(auto_now_add=True)

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
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_items'


class Notification(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message    = models.CharField(max_length=300)
    order_id   = models.UUIDField(null=True, blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']