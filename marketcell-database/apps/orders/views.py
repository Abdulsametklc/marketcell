from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Cart, CartItem, Order, SubOrder, OrderItem, Coupon, Notification
from .serializers import (
    CartSerializer, CartItemSerializer, OrderSerializer,
    CreateOrderSerializer, SubOrderSerializer
)
from apps.products.models import ProductVariant, Store, Product
from apps.users.models import Address, User


class CartView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CartItemAddView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            variant_id = request.data.get('variant_id')
            quantity = request.data.get('quantity', 1)
            
            variant = ProductVariant.objects.get(id=variant_id)
            cart, _ = Cart.objects.get_or_create(user=request.user)
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                variant=variant,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except ProductVariant.DoesNotExist:
            return Response({'detail': 'Product variant not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CartItemUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            cart_item = CartItem.objects.get(id=pk, cart__user=request.user)
            quantity = request.data.get('quantity')
            
            if quantity is not None:
                if quantity <= 0:
                    cart_item.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
                cart_item.quantity = quantity
                cart_item.save()
            
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        try:
            cart_item = CartItem.objects.get(id=pk, cart__user=request.user)
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)


class OrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        orders = Order.objects.filter(buyer=request.user).prefetch_related('sub_orders')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            card_number = serializer.validated_data['card_number'].replace(' ', '')

            # Paycell simulasyonu
            if card_number.startswith('4000'):
                return Response(
                    {'detail': 'Paycell: Odeme reddedildi. Kart gecersiz veya bakiye yetersiz.'},
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )
            if not card_number.startswith('4242'):
                return Response(
                    {'detail': 'Paycell: Gecersiz kart. Test icin 4242... kullanin.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            address_id = serializer.validated_data['address_id']
            address = Address.objects.get(id=address_id, user=request.user)

            cart = Cart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response({'detail': 'Sepet bos'}, status=status.HTTP_400_BAD_REQUEST)

            # Atomik stok kontrolu ve dusumu (select_for_update ile race condition onlenir)
            cart_items = cart.items.select_related(
                'variant', 'variant__product', 'variant__product__store'
            ).all()

            total_amount = 0
            variants_to_update = []

            for item in cart_items:
                variant = ProductVariant.objects.select_for_update().get(id=item.variant.id)
                if variant.stock < item.quantity:
                    return Response(
                        {'detail': f'{variant.product.name} ({variant.value}) icin yeterli stok yok. Mevcut: {variant.stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                variant.stock -= item.quantity
                variants_to_update.append(variant)
                total_amount += (variant.product.base_price + variant.price_diff) * item.quantity

            # Stok dusum (toplu guncelleme)
            ProductVariant.objects.bulk_update(variants_to_update, ['stock'])

            # Kupon
            discount_amount = 0
            coupon = None
            coupon_code = serializer.validated_data.get('coupon_code')
            if coupon_code:
                try:
                    coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                    if coupon.discount_type == 'FIXED':
                        discount_amount = coupon.discount_value
                    else:
                        discount_amount = (total_amount * coupon.discount_value) / 100
                except Coupon.DoesNotExist:
                    pass

            final_amount = max(0, total_amount - discount_amount)

            # Siparis olustur
            order = Order.objects.create(
                buyer=request.user,
                address=address,
                total_amount=final_amount,
                discount_amount=discount_amount,
                coupon=coupon,
                card_last4=card_number[-4:],
                payment_status='PAID',
            )

            # Magazaya gore grupla ve alt siparis olustur (cok satici bolunmesi)
            stores_items = {}
            for item in cart_items:
                store = item.variant.product.store
                if store not in stores_items:
                    stores_items[store] = []
                stores_items[store].append(item)

            for store, items in stores_items.items():
                subtotal = sum(
                    (item.variant.product.base_price + item.variant.price_diff) * item.quantity
                    for item in items
                )
                sub_order = SubOrder.objects.create(
                    order=order, store=store, subtotal=subtotal, status='PAID'
                )
                for item in items:
                    OrderItem.objects.create(
                        sub_order=sub_order,
                        variant=item.variant,
                        quantity=item.quantity,
                        unit_price=item.variant.product.base_price + item.variant.price_diff,
                    )

            cart.items.all().delete()

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except Address.DoesNotExist:
            return Response({'detail': 'Adres bulunamadi'}, status=status.HTTP_404_NOT_FOUND)
        except Cart.DoesNotExist:
            return Response({'detail': 'Sepet bulunamadi'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)


class SellerOrderListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            store = request.user.store
            sub_orders = SubOrder.objects.filter(store=store).prefetch_related('items')
            serializer = SubOrderSerializer(sub_orders, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except:
            return Response({'detail': 'User is not a seller'}, status=status.HTTP_403_FORBIDDEN)


STATUS_LABELS = {
    'PAID':      'Ödendi',
    'PREPARING': 'Hazırlanıyor',
    'SHIPPED':   'Kargoya Verildi',
    'DELIVERED': 'Teslim Edildi',
    'CANCELLED': 'İptal Edildi',
}

class SellerOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            store = request.user.store
            sub_order = SubOrder.objects.get(id=pk, store=store)

            status_value = request.data.get('status')
            if status_value:
                sub_order.status = status_value
                sub_order.save()

                # Alıcıya bildirim gönder
                label = STATUS_LABELS.get(status_value, status_value)
                Notification.objects.create(
                    user=sub_order.order.buyer,
                    message=f'{store.name} siparişinizi güncelledi: {label}',
                    order_id=sub_order.order.id,
                )

            serializer = SubOrderSerializer(sub_order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except SubOrder.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        except:
            return Response({'detail': 'User is not a seller'}, status=status.HTTP_403_FORBIDDEN)


class SellerStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            store = request.user.store
        except:
            return Response({'detail': 'Not a seller'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)

        today_qs = SubOrder.objects.filter(store=store, created_at__gte=today_start)
        week_qs  = SubOrder.objects.filter(store=store, created_at__gte=week_start)

        return Response({
            'today_orders':   today_qs.count(),
            'today_revenue':  str(today_qs.aggregate(t=Sum('subtotal'))['t'] or 0),
            'week_orders':    week_qs.count(),
            'week_revenue':   str(week_qs.aggregate(t=Sum('subtotal'))['t'] or 0),
        })


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'total_users':    User.objects.count(),
            'total_sellers':  User.objects.filter(is_seller=True).count(),
            'total_products': Product.objects.filter(is_deleted=False).count(),
            'total_orders':   Order.objects.count(),
            'total_revenue':  str(Order.objects.aggregate(t=Sum('total_amount'))['t'] or 0),
            'pending_sellers': Store.objects.filter(is_approved=False).count(),
        })


class AdminSellersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        sellers = User.objects.filter(is_seller=True).prefetch_related('store')
        result = []
        for u in sellers:
            try:
                store = u.store
                result.append({
                    'id': str(u.id),
                    'name': u.name,
                    'gsm_number': u.gsm_number,
                    'created_at': u.created_at,
                    'store': {
                        'id': str(store.id),
                        'name': store.name,
                        'is_approved': store.is_approved,
                    },
                })
            except:
                pass
        return Response(result)


class AdminStoreApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        store = get_object_or_404(Store, id=pk)
        store.is_approved = request.data.get('is_approved', store.is_approved)
        store.save()
        return Response({'id': str(store.id), 'is_approved': store.is_approved})


class CouponValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
            if coupon.used_count >= coupon.max_uses:
                return Response({'detail': 'Kupon kullanım limiti doldu.'}, status=status.HTTP_400_BAD_REQUEST)
            if timezone.now() > coupon.expires_at:
                return Response({'detail': 'Kupon süresi dolmuş.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'code':           coupon.code,
                'discount_type':  coupon.discount_type,
                'discount_value': str(coupon.discount_value),
                'min_order_amount': str(coupon.min_order_amount),
            })
        except Coupon.DoesNotExist:
            return Response({'detail': 'Geçersiz kupon kodu.'}, status=status.HTTP_404_NOT_FOUND)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(user=request.user)[:20]
        data = [{
            'id':         str(n.id),
            'message':    n.message,
            'order_id':   str(n.order_id) if n.order_id else None,
            'is_read':    n.is_read,
            'created_at': n.created_at.isoformat(),
        } for n in notifs]
        unread = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'notifications': data, 'unread_count': unread})


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'Tüm bildirimler okundu olarak işaretlendi.'})