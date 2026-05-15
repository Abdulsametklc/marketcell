import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, gsm_number, name, password=None, **extra):
        user = self.model(gsm_number=gsm_number, name=name, **extra)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, gsm_number, name, password=None, **extra):
        extra.setdefault('is_admin', True)
        extra.setdefault('is_active', True)
        return self.create_user(gsm_number, name, password, **extra)


class User(AbstractBaseUser):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gsm_number = models.CharField(max_length=15, unique=True)
    name       = models.CharField(max_length=100)
    email      = models.EmailField(blank=True)
    is_buyer   = models.BooleanField(default=True)
    is_seller  = models.BooleanField(default=False)
    is_admin   = models.BooleanField(default=False)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    otp_code   = models.CharField(max_length=6, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'gsm_number'
    REQUIRED_FIELDS = ['name']
    objects = UserManager()

    class Meta:
        db_table = 'users'

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return self.is_admin


class Address(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    title        = models.CharField(max_length=100)
    full_address = models.TextField()
    city         = models.CharField(max_length=100)
    district     = models.CharField(max_length=100)
    is_default   = models.BooleanField(default=False)

    class Meta:
        db_table = 'addresses'