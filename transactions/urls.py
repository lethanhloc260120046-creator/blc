from django.urls import path
from . import views

app_name = 'transactions'

urlpatterns = [
    path('checkout/<int:product_id>/', views.checkout, name='checkout'),
    path('history/', views.transaction_history, name='history'),
    path('order/<int:transaction_id>/', views.transaction_detail, name='transaction_detail'),
    path('api/update_status/', views.update_transaction_status, name='update_status'),
    path('api/abandon_checkout/', views.abandon_checkout, name='abandon_checkout'),
    path('api/refund_request/', views.create_refund_request, name='create_refund_request'),
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/orders/', views.admin_order_list, name='admin_order_list'),
    path('admin/orders/<int:transaction_id>/', views.admin_order_detail, name='admin_order_detail'),
    path('admin/orders/<int:transaction_id>/toggle-lock/', views.admin_order_toggle_lock, name='admin_order_toggle_lock'),
    path('admin/refunds/', views.admin_refund_list, name='admin_refund_list'),
    path('admin/refunds/<int:refund_id>/', views.admin_refund_detail, name='admin_refund_detail'),
    path('api/admin/resolve_refund/', views.admin_resolve_refund, name='admin_resolve_refund'),
]
