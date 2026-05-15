from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from .models import Product, Category, Store, Review, Wishlist
from .serializers import (
    ProductListSerializer, ProductDetailSerializer, CategorySerializer,
    StoreSerializer, ReviewSerializer, WishlistSerializer
)


class ProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(status='ACTIVE', is_deleted=False)
    serializer_class = ProductListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get('q') or self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        cat_id = self.request.query_params.get('cat') or self.request.query_params.get('category')
        if cat_id:
            try:
                from .models import Category
                cat = Category.objects.get(id=cat_id)
                if cat.level == 0:
                    child_ids = Category.objects.filter(parent=cat).values_list('id', flat=True)
                    queryset = queryset.filter(category_id__in=list(child_ids) + [cat.id])
                else:
                    queryset = queryset.filter(category_id=cat.id)
            except Exception:
                pass

        min_price = self.request.query_params.get('min')
        if min_price:
            queryset = queryset.filter(base_price__gte=min_price)

        max_price = self.request.query_params.get('max')
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)

        sort = self.request.query_params.get('sort')
        if sort == 'price_asc':
            queryset = queryset.order_by('base_price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-base_price')
        else:
            queryset = queryset.order_by('-id')

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer
    lookup_field = 'pk'


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(level=0)
    serializer_class = CategorySerializer


class StoreListCreateView(generics.ListCreateAPIView):
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Store.objects.filter(is_approved=True)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class ProductReviewListCreateView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk, is_deleted=False)
        reviews = Review.objects.filter(product=product).select_related('user').order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        avg = reviews.aggregate(avg=Avg('rating'))['avg']
        return Response({
            'reviews':   serializer.data,
            'avg_rating': round(avg, 1) if avg else None,
            'count':     reviews.count(),
        })

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk, is_deleted=False)
        if Review.objects.filter(product=product, user=request.user).exists():
            return Response({'detail': 'Bu ürünü zaten değerlendirdiniz.'}, status=status.HTTP_400_BAD_REQUEST)
        rating = request.data.get('rating')
        if not rating or not (1 <= int(rating) <= 5):
            return Response({'detail': 'Puan 1-5 arasında olmalıdır.'}, status=status.HTTP_400_BAD_REQUEST)
        review = Review.objects.create(
            product=product,
            user=request.user,
            rating=int(rating),
            comment=request.data.get('comment', ''),
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        Review.objects.filter(product=product, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user).select_related('product')
        return Response(WishlistSerializer(items, many=True).data)


class WishlistToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id, is_deleted=False)
        obj, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if not created:
            obj.delete()
            return Response({'wishlisted': False})
        return Response({'wishlisted': True}, status=status.HTTP_201_CREATED)

    def get(self, request, product_id):
        exists = Wishlist.objects.filter(user=request.user, product_id=product_id).exists()
        return Response({'wishlisted': exists})


class SellerScoreView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, store_id):
        store = get_object_or_404(Store, pk=store_id, is_approved=True)
        from apps.orders.models import SubOrder
        products = Product.objects.filter(store=store, is_deleted=False)
        avg_rating = Review.objects.filter(product__in=products).aggregate(avg=Avg('rating'))['avg']
        total = SubOrder.objects.filter(store=store).count()
        delivered = SubOrder.objects.filter(store=store, status='DELIVERED').count()
        completion_rate = round((delivered / total * 100), 1) if total else 0
        return Response({
            'store_name':       store.name,
            'avg_rating':       round(avg_rating, 1) if avg_rating else None,
            'total_orders':     total,
            'delivered_orders': delivered,
            'completion_rate':  completion_rate,
        })