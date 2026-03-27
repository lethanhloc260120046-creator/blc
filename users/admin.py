from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'wallet_address', 'nonce')
    search_fields = ('wallet_address', 'user__username')
