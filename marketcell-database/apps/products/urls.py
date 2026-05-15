from django.urls import path
from . import views

urlpatterns = [
    path('products/',           views.ProductListView.as_view(),    name='product-list'),
    path('products/<uuid:pk>/', views.ProductDetailView.as_view(),  name='product-detail'),
    path('categories/',         views.CategoryListView.as_view(),   name='category-list'),
    path('stores/',             views.StoreListCreateView.as_view(),name='store-list'),
]