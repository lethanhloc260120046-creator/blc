from django.contrib import admin
from .models import Transaction, RefundRequest


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'seller', 'product', 'amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('buyer__username', 'seller__username', 'product__name')


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'reason', 'status', 'created_at')
    list_filter = ('status', 'reason')
    search_fields = ('transaction__product__name', 'reason_detail')
    raw_id_fields = ('transaction',)
