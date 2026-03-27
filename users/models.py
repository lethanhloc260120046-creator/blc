from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    # Nối 1-1 với bảng auth_user mặc định
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    wallet_address = models.CharField(max_length=42, unique=True)
    nonce = models.CharField(max_length=255)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.wallet_address}"