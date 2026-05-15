from rest_framework import serializers
import random
from .models import User, Address


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('gsm_number', 'name', 'email')
        extra_kwargs = {'email': {'required': False, 'allow_blank': True}}

    def create(self, validated_data):
        otp_code = str(random.randint(100000, 999999))
        user = User.objects.create_user(
            gsm_number=validated_data['gsm_number'],
            name=validated_data['name'],
            email=validated_data.get('email', ''),
            otp_code=otp_code
        )
        user.set_unusable_password()
        user.save()
        return user


class VerifyOTPSerializer(serializers.Serializer):
    gsm_number = serializers.CharField()
    otp_code   = serializers.CharField(max_length=6)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ('id', 'gsm_number', 'name', 'email', 'is_buyer', 'is_seller', 'is_admin', 'created_at')
        read_only_fields = ('id', 'created_at')


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Address
        fields = ('id', 'title', 'full_address', 'city', 'district', 'is_default')
        read_only_fields = ('id',)