from rest_framework import serializers
from .models import User, Store, Product, Category, Cart, CartItem, ProductVariant, Order, SubOrder, OrderItem

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'gsm_number', 'name', 'is_buyer', 'is_seller', 'is_admin']

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'level', 'parent', 'children']

    def get_children(self, obj):
        # Yalnızca alt kategorileri varsa recursive olarak çağır
        if hasattr(obj, 'children') and obj.children.exists():
            return CategorySerializer(obj.children.all(), many=True).data
        return []

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'variant_type', 'value', 'price_diff', 'stock']
        
class ProductSerializer(serializers.ModelSerializer):
    # Bu alan burada tanımlı...
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        # ...bu listenin içine de 'variants' olarak MUTLAKA eklenmeli:
        fields = [
            'id', 'store', 'category', 'name', 'description', 
            'base_price', 'status', 'images', 'variants', 'created_at'
        ]

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='variant.product.name')
    price = serializers.ReadOnlyField(source='variant.product.base_price')

    class Meta:
        model = CartItem
        fields = ['id', 'variant', 'product_name', 'price', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price']

    def get_total_price(self, obj):
        return sum((item.variant.product.base_price + item.variant.price_diff) * item.quantity for item in obj.items.all())

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='variant.product.name')
    variant_value = serializers.ReadOnlyField(source='variant.value')
    
    class Meta:
        model = OrderItem
        fields = ['id', 'variant', 'product_name', 'variant_value', 'quantity', 'unit_price']

class SubOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    store_name = serializers.ReadOnlyField(source='store.name')

    class Meta:
        model = SubOrder
        fields = ['id', 'store', 'store_name', 'subtotal', 'status', 'tracking_no', 'items', 'updated_at']

class OrderSerializer(serializers.ModelSerializer):
    sub_orders = SubOrderSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'total_amount', 'payment_status', 'card_last4', 'created_at', 'sub_orders']