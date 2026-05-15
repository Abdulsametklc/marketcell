from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import (
    User, Product, Cart, CartItem, ProductVariant, 
    Order, SubOrder, OrderItem, Store, Category, 
    ProductStatus, SubOrderStatus
)
from .serializers import (
    UserSerializer, ProductSerializer, CartSerializer, 
    CategorySerializer, OrderSerializer, SubOrderSerializer
)

# --- AUTH VIEWS ---
class RegisterView(APIView):
    def post(self, request):
        gsm_number = request.data.get('gsm_number')
        name = request.data.get('name')
        
        if not gsm_number or not name:
            return Response({"error": "GSM ve İsim zorunludur."}, status=status.HTTP_400_BAD_REQUEST)
            
        user, created = User.objects.get_or_create(gsm_number=gsm_number, defaults={'name': name})
        return Response({"message": "OTP kodu gönderildi (Simülasyon: 1234)"}, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    def post(self, request):
        gsm_number = request.data.get('gsm_number')
        otp_code = request.data.get('otp_code')
        
        if otp_code != "1234":
            return Response({"error": "Geçersiz OTP kodu."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(gsm_number=gsm_number)
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response({"error": "Kullanıcı bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

# --- ÜRÜN LİSTELEME VE GELİŞMİŞ ARAMA ---
class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.filter(is_deleted=False)
        
        # 1. Metin Arama (isim veya açıklama içinde)
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(Q(name__icontains=q) | Q(description__icontains=q))
            
        # 2. Kategori Filtreleme
        category_id = self.request.query_params.get('cat')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        # 3. Fiyat Sıralama (?sort=price_asc veya ?sort=price_desc)
        sort = self.request.query_params.get('sort')
        if sort == 'price_asc':
            queryset = queryset.order_by('base_price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-base_price')
        else:
            queryset = queryset.order_by('-created_at') # Varsayılan en yeni ürünler
            
        return queryset


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(level=0) # Sadece kök kategorileri getirir, serializer children ile alt kategorileri de getirir.

class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_deleted=False)

class SellerProductCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_seller:
            return Response({"error": "Sadece satıcılar ürün ekleyebilir."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            store = request.user.store
        except Store.DoesNotExist:
            return Response({"error": "Satıcı mağazası bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save(store=store)
            
            variants_data = request.data.get('variants', [])
            for v_data in variants_data:
                ProductVariant.objects.create(product=product, **v_data)
            
            # Return fresh data including variants
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        variant_id = request.data.get('variant_id')
        quantity = request.data.get('quantity', 1)

        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response({"error": "Miktar 0'dan büyük olmalıdır."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"error": "Miktar sayı olmalıdır."}, status=status.HTTP_400_BAD_REQUEST)

        if not variant_id:
            return Response({"error": "variant_id zorunludur."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            variant = ProductVariant.objects.filter(id=variant_id).first()
        except ValidationError:
            return Response({"error": "Geçersiz variant_id formatı."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not variant:
            return Response({
                "error": "Geçerli bir varyant bulunamadı. Lütfen ürün listesindeki 'variants' içindeki id'yi kullandığınızdan emin olun."
            }, status=status.HTTP_404_NOT_FOUND)

        cart, _ = Cart.objects.get_or_create(user=request.user)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, 
            variant=variant,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response({
            "message": f"{variant.product.name} ({variant.value}) sepete eklendi.",
            "cart_id": cart.id
        }, status=status.HTTP_201_CREATED)

class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            cart_item = CartItem.objects.get(id=pk, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({"error": "Sepet ürünü bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        
        quantity = request.data.get('quantity')
        if quantity is not None:
            try:
                quantity = int(quantity)
                if quantity <= 0:
                    return Response({"error": "Miktar 0'dan büyük olmalıdır."}, status=status.HTTP_400_BAD_REQUEST)
                cart_item.quantity = quantity
                cart_item.save()
            except (ValueError, TypeError):
                return Response({"error": "Miktar sayı olmalıdır."}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response({"message": "Adet güncellendi."}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            cart_item = CartItem.objects.get(id=pk, cart__user=request.user)
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({"error": "Sepet ürünü bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

class OrderAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(buyer=request.user).order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        card_number = request.data.get('card_number', '')
        if not card_number:
            return Response({"error": "Kredi kartı numarası zorunludur. (örn: 4242...)"}, status=status.HTTP_400_BAD_REQUEST)
        
        if str(card_number).startswith('4000'):
            return Response({"error": "Paycell: Ödeme reddedildi (Bakiye yetersiz veya kart geçersiz)."}, status=status.HTTP_400_BAD_REQUEST)
        elif not str(card_number).startswith('4242'):
            return Response({"error": "Paycell: Lütfen geçerli bir simülasyon kartı girin (4242... başarılı, 4000... başarısız)."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic(): # Hata olursa hiçbir şey kaydedilmez
            try:
                cart = request.user.cart
            except Cart.DoesNotExist:
                return Response({"error": "Sepet boş"}, status=status.HTTP_400_BAD_REQUEST)

            if not cart.items.exists():
                return Response({"error": "Sepetiniz boş"}, status=status.HTTP_400_BAD_REQUEST)

            address = request.user.addresses.filter(is_default=True).first()
            if not address:
                return Response({"error": "Lütfen adres ekleyin"}, status=status.HTTP_400_BAD_REQUEST)

            # Atomik Stok Kontrolü ve Düşümü
            items = cart.items.select_related('variant', 'variant__product').all()
            total_amount = 0
            
            variants_to_update = []
            for item in items:
                variant = ProductVariant.objects.select_for_update().get(id=item.variant.id)
                if variant.stock < item.quantity:
                    # Yetersiz stok varsa işlemi iptal et (rollback yapacak)
                    return Response({"error": f"{variant.product.name} ({variant.value}) için yeterli stok yok. Mevcut stok: {variant.stock}"}, status=status.HTTP_400_BAD_REQUEST)
                
                variant.stock -= item.quantity
                variants_to_update.append(variant)
                total_amount += (variant.product.base_price + variant.price_diff) * item.quantity

            ProductVariant.objects.bulk_update(variants_to_update, ['stock'])

            # Ana Siparişi Oluştur
            order = Order.objects.create(
                buyer=request.user,
                address=address,
                total_amount=total_amount,
                payment_status='PAID',
                card_last4=str(card_number)[-4:] if len(str(card_number)) >= 4 else str(card_number)
            )

            # Ürünleri Satıcılarına Göre Böl (Multi-vendor)
            stores = set(item.variant.product.store for item in items)

            for store in stores:
                store_items = [si for si in items if si.variant.product.store == store]
                subtotal = sum((si.variant.product.base_price + si.variant.price_diff) * si.quantity for si in store_items)
                
                sub_order = SubOrder.objects.create(
                    order=order,
                    store=store,
                    subtotal=subtotal,
                    status='PAID'
                )

                for si in store_items:
                    OrderItem.objects.create(
                        sub_order=sub_order,
                        variant=si.variant,
                        quantity=si.quantity,
                        unit_price=si.variant.product.base_price + si.variant.price_diff
                    )

            # İşlem bitince sepeti temizle
            cart.items.all().delete()
            return Response({"message": "Sipariş satıcılara bölünerek oluşturuldu ve stoklar düşüldü!", "order_id": order.id}, status=status.HTTP_201_CREATED)

class SellerOrderListView(generics.ListAPIView):
    serializer_class = SubOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_seller:
            return SubOrder.objects.none()
        try:
            return SubOrder.objects.filter(store=self.request.user.store).order_by('-updated_at')
        except Store.DoesNotExist:
            return SubOrder.objects.none()

class SellerOrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_seller:
            return Response({"error": "Sadece satıcılar erişebilir."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            sub_order = SubOrder.objects.get(id=pk, store=request.user.store)
        except (SubOrder.DoesNotExist, Store.DoesNotExist):
            return Response({"error": "Sipariş bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        if new_status not in [choice[0] for choice in SubOrderStatus.choices]:
            return Response({"error": f"Geçersiz sipariş durumu. Geçerli durumlar: {[c[0] for c in SubOrderStatus.choices]}"}, status=status.HTTP_400_BAD_REQUEST)
            
        sub_order.status = new_status
        if 'tracking_no' in request.data:
            sub_order.tracking_no = request.data['tracking_no']
            
        sub_order.save()
        return Response({"message": "Sipariş durumu güncellendi."}, status=status.HTTP_200_OK)