from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from . import views as core_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),
    path('marketplace/', include('marketplace.urls')),
    path('transactions/', include('transactions.urls')),
    path('', lambda request: redirect('marketplace:product_list')),

    # Vietnam provinces API proxy
    path('api/provinces/', core_views.api_provinces, name='api_provinces'),
    path('api/districts/<int:province_code>/', core_views.api_districts, name='api_districts'),
    path('api/wards/<int:district_code>/', core_views.api_wards, name='api_wards'),
]
