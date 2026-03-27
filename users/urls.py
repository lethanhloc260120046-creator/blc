from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('login/', views.login_page, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_page, name='profile'),
    path('api/get_nonce/', views.get_nonce_api, name='get_nonce_api'),
    path('api/verify_signature/', views.verify_signature_api, name='verify_signature_api'),

    # Admin: User Management
    path('admin/users/', views.admin_user_list, name='admin_user_list'),
    path('admin/users/<int:user_id>/toggle-lock/', views.admin_toggle_lock, name='admin_toggle_lock'),
]
