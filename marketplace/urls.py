from django.urls import path
from . import views

app_name = 'marketplace'

urlpatterns = [
    path('', views.product_list, name='product_list'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    path('product/<int:product_id>/edit/', views.edit_product, name='edit_product'),
    path('my-products/', views.my_products, name='my_products'),
    path('cart/', views.cart_view, name='cart'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('sell/', views.sell_item, name='sell_item'),

    # Admin: Product Management
    path('admin/products/', views.admin_product_list, name='admin_product_list'),
    path('admin/products/<int:product_id>/approve/', views.admin_product_approve, name='admin_product_approve'),
    path('admin/products/<int:product_id>/reject/', views.admin_product_reject, name='admin_product_reject'),
    path('admin/products/<int:product_id>/toggle-hide/', views.admin_product_toggle_hide, name='admin_product_toggle_hide'),
]
