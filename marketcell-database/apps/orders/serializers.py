from rest_framework import serializers
from .models import Cart, CartItem, Order, SubOrder, OrderItem, Coupon


class CartProductSerializer(serializers.SerializerMethodField):
    pass


class CartVariantSerializer(serializers.Serializer):
    id           = serializers.UUIDField()
    variant_type = serializers.CharField()
    value        = serializers.CharField()
    price_diff   = serializers.DecimalField(max_digits=10, decimal_places=2)
    stock        = serializers.IntegerField()
    product      = serializers.SerializerMethodField()

    def get_product(self, obj):
        p = obj.product
        return {
            'id':         str(p.id),
            'name':       p.name,
            'base_price': str(p.base_price),
            'images':     p.images or [],
            'store':      {'name': p.store.name, 'id': str(p.store.id)},
        }


class CartItemSerializer(serializers.ModelSerializer):
    variant    = CartVariantSerializer(read_only=True)
    variant_id = serializers.UUIDField(write_only=True)
    unit_price = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model  = CartItem
        fields = ('id', 'variant', 'variant_id', 'quantity', 'unit_price', 'total_price')
        read_only_fields = ('id',)

    def get_unit_price(self, obj):
        return float(obj.variant.product.base_price + obj.variant.price_diff)

    def get_total_price(self, obj):
        unit = obj.variant.product.base_price + obj.variant.price_diff
        return float(unit * obj.quantity)


class CartSerializer(serializers.ModelSerializer):
    items       = CartItemSerializer(many=True, read_only=True)
    total       = serializers.SerializerMethodField()
    item_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Cart
        fields = ('id', 'items', 'total', 'item_count', 'updated_at')

    def get_total(self, obj):
        total = 0
        for item in obj.items.all():
            total += (item.variant.product.base_price + item.variant.price_diff) * item.quantity
        return float(total)

    def get_item_count(self, obj):
        return obj.items.count()


class OrderItemSerializer(serializers.ModelSerializer):
    variant = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = ('id', 'variant', 'quantity', 'unit_price')

    def get_variant(self, obj):
        return {
            'value':        obj.variant.value,
            'variant_type': obj.variant.variant_type,
            'product': {
                'name': obj.variant.product.name,
            },
        }


class SubOrderSerializer(serializers.ModelSerializer):
    items      = OrderItemSerializer(many=True, read_only=True)
    store      = serializers.SerializerMethodField()
    order      = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model  = SubOrder
        fields = ('id', 'store', 'order', 'subtotal', 'status',
                  'tracking_no', 'items', 'created_at', 'updated_at')
        read_only_fields = ('id', 'updated_at')

    def get_store(self, obj):
        return {'id': str(obj.store.id), 'name': obj.store.name}

    def get_order(self, obj):
        return {
            'id': str(obj.order.id),
            'buyer': {
                'name':       obj.order.buyer.name,
                'gsm_number': obj.order.buyer.gsm_number,
            },
        }

    def get_created_at(self, obj):
        return obj.order.created_at.isoformat() if obj.order.created_at else obj.updated_at.isoformat()


class OrderSerializer(serializers.ModelSerializer):
    sub_orders = SubOrderSerializer(many=True, read_only=True)
    address    = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = ('id', 'total_amount', 'payment_status', 'card_last4',
                  'discount_amount', 'address', 'sub_orders', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_address(self, obj):
        if not obj.address:
            return None
        return {
            'title':        obj.address.title,
            'full_address': obj.address.full_address,
            'city':         obj.address.city,
            'district':     obj.address.district,
        }


class CreateOrderSerializer(serializers.Serializer):
    address_id  = serializers.UUIDField()
    card_number = serializers.CharField(max_length=16)
    coupon_code = serializers.CharField(required=False, allow_blank=True)


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Coupon
        fields = ('id', 'code', 'discount_type', 'discount_value',
                  'min_order_amount', 'expires_at')