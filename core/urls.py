from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),
    path('marketplace/', include('marketplace.urls')),
    path('transactions/', include('transactions.urls')),
    path('', lambda request: redirect('marketplace:product_list')),
]
