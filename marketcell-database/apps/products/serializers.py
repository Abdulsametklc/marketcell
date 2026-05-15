from rest_framework import serializers
from .models import Category, Store, Product, ProductVariant, Review


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = ('id', 'name', 'slug', 'level', 'parent', 'children')

    def get_children(self, obj):
        return CategorySerializer(obj.children.all(), many=True).data


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Store
        fields = ('id', 'name', 'description', 'logo_url', 'phone', 'is_approved')
        read_only_fields = ('id', 'is_approved')


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductVariant
        fields = ('id', 'variant_type', 'value', 'price_diff', 'stock')
        read_only_fields = ('id',)


class ProductListSerializer(serializers.ModelSerializer):
    store_name    = serializers.CharField(source='store.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = Product
        fields = ('id', 'name', 'base_price', 'status', 'images',
                  'store_name', 'category_name', 'created_at')
        read_only_fields = ('id', 'created_at')


class ProductDetailSerializer(serializers.ModelSerializer):
    variants      = ProductVariantSerializer(many=True, read_only=True)
    store         = StoreSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    avg_rating    = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = ('id', 'name', 'description', 'base_price', 'status',
                  'images', 'store', 'category_name', 'variants',
                  'avg_rating', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / len(reviews), 1)


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model  = Review
        fields = ('id', 'rating', 'comment', 'user_name', 'created_at')
        read_only_fields = ('id', 'created_at')