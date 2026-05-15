from django.urls import path
from .views import (
    RegisterView, VerifyOTPView, 
    CategoryListView, ProductListView, ProductDetailView, SellerProductCreateView,
    CartView, CartItemView, CartItemDetailView, OrderAPIView,
    SellerOrderListView, SellerOrderStatusUpdateView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    
    # Categories & Products
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'), 
    path('products/<uuid:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('seller/products/', SellerProductCreateView.as_view(), name='seller-product-create'),
    
    # Cart & Checkout
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemView.as_view(), name='cart-items'),
    path('cart/items/<uuid:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    
    # Orders (GET & POST)
    path('orders/', OrderAPIView.as_view(), name='orders-list-create'),
    
    # Seller Orders
    path('seller/orders/', SellerOrderListView.as_view(), name='seller-orders'),
    path('seller/orders/<uuid:pk>/status/', SellerOrderStatusUpdateView.as_view(), name='seller-order-status'),
]