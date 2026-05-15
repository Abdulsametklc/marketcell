from django.urls import path
from . import views

urlpatterns = [
    path('cart/',                           views.CartView.as_view(),              name='cart'),
    path('cart/items/',                     views.CartItemAddView.as_view(),        name='cart-item-add'),
    path('cart/items/<uuid:pk>/',           views.CartItemUpdateView.as_view(),     name='cart-item-update'),
    path('orders/',                         views.OrderListCreateView.as_view(),    name='order-list'),
    path('orders/<uuid:pk>/',               views.OrderDetailView.as_view(),        name='order-detail'),
    path('seller/orders/',                  views.SellerOrderListView.as_view(),    name='seller-orders'),
    path('seller/orders/<uuid:pk>/status/', views.SellerOrderStatusView.as_view(),  name='seller-order-status'),
    path('seller/stats/',                   views.SellerStatsView.as_view(),        name='seller-stats'),
    path('admin/stats/',                    views.AdminStatsView.as_view(),         name='admin-stats'),
    path('admin/sellers/',                  views.AdminSellersView.as_view(),       name='admin-sellers'),
    path('admin/stores/<uuid:pk>/',         views.AdminStoreApproveView.as_view(),  name='admin-store-approve'),
    path('coupons/validate/',               views.CouponValidateView.as_view(),     name='coupon-validate'),
    path('notifications/',                  views.NotificationListView.as_view(),   name='notifications'),
    path('notifications/read/',             views.NotificationMarkReadView.as_view(), name='notifications-read'),
]