from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User
from .models import Cart


@receiver(post_save, sender=User)
def create_cart_for_new_user(sender, instance, created, **kwargs):
    """Automatically create a cart when a new user is created"""
    if created:
        Cart.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_cart_for_user(sender, instance, **kwargs):
    """Ensure user has a cart"""
    if hasattr(instance, 'cart'):
        instance.cart.save()
