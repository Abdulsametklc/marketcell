from django.urls import path
from . import views

urlpatterns = [
    path('products/',                              views.ProductListView.as_view(),             name='product-list'),
    path('products/<uuid:pk>/',                    views.ProductDetailView.as_view(),           name='product-detail'),
    path('products/<uuid:pk>/reviews/',            views.ProductReviewListCreateView.as_view(), name='product-reviews'),
    path('categories/',                            views.CategoryListView.as_view(),            name='category-list'),
    path('stores/',                                views.StoreListCreateView.as_view(),         name='store-list'),
    path('stores/<uuid:store_id>/score/',          views.SellerScoreView.as_view(),             name='seller-score'),
    path('wishlist/',                              views.WishlistView.as_view(),                name='wishlist'),
    path('wishlist/<uuid:product_id>/',            views.WishlistToggleView.as_view(),          name='wishlist-toggle'),
]