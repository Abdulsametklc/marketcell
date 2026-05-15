from django.contrib import admin
from .models import User, Address


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('gsm_number', 'name', 'is_buyer', 'is_seller', 'is_active')
    search_fields = ('gsm_number', 'name')


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'city', 'is_default')