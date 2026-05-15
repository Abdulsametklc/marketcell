import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Address
from .serializers import RegisterSerializer, VerifyOTPSerializer, UserSerializer, AddressSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        gsm_number = request.data.get('gsm_number')
        if not gsm_number:
            return Response({'detail': 'gsm_number zorunludur.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = str(random.randint(100000, 999999))

        existing = User.objects.filter(gsm_number=gsm_number).first()
        if existing:
            existing.otp_code = otp_code
            existing.save()
            user = existing
        else:
            serializer = RegisterSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            user = serializer.save()
            user.otp_code = otp_code
            user.save()

        return Response({
            'detail': 'OTP kodu gönderildi.',
            'gsm_number': user.gsm_number,
            'otp_code': otp_code,
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            gsm_number = serializer.validated_data['gsm_number']
            otp_code = serializer.validated_data['otp_code']
            
            try:
                user = User.objects.get(gsm_number=gsm_number, otp_code=otp_code)
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response(
                    {'detail': 'Invalid OTP or GSM number'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)