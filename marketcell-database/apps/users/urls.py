from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/',     views.RegisterView.as_view(),    name='register'),
    path('verify-otp/',   views.VerifyOTPView.as_view(),   name='verify-otp'),
    path('token/refresh/',TokenRefreshView.as_view(),      name='token-refresh'),
    path('addresses/',    views.AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<uuid:pk>/', views.AddressDetailView.as_view(), name='address-detail'),
]