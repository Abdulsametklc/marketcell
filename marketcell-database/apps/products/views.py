from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from .models import Product, Category, Store, Review
from .serializers import (
    ProductListSerializer, ProductDetailSerializer, CategorySerializer,
    StoreSerializer, ReviewSerializer
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