from django.db import models
from django.contrib.auth.models import User
from cloudinary.models import CloudinaryField
from marketplace.models import Product


class Transaction(models.Model):
    STATUS_CHOICES = (
        ('Created', 'Created'),     # Vừa tạo
        ('Funded', 'Funded'),       # Đã chuyển tiền vào Smart Contract
        ('Disputed', 'Disputed'),   # Buyer yêu cầu trả hàng, chờ Admin duyệt
        ('Completed', 'Completed'), # Đã xác nhận, tiền về ví seller
        ('Cancelled', 'Cancelled'), # Hủy, hoàn tiền buyer
    )

    buyer = models.ForeignKey(User, related_name='buyer_transactions', on_delete=models.CASCADE)
    seller = models.ForeignKey(User, related_name='seller_transactions', on_delete=models.CASCADE)
    product = models.OneToOneField(Product, on_delete=models.RESTRICT)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Created')
    smart_contract_tx_hash = models.CharField(max_length=66, unique=True, null=True, blank=True)
    receiver_name = models.CharField(max_length=100, blank=True, default='')
    receiver_phone = models.CharField(max_length=20, blank=True, default='')
    shipping_city = models.CharField(max_length=100, blank=True, default='')
    shipping_district = models.CharField(max_length=100, blank=True, default='')
    shipping_ward = models.CharField(max_length=100, blank=True, default='')
    shipping_address = models.CharField(max_length=300, blank=True, default='')
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tx {self.id} - {self.product.name} - {self.status}"


class RefundRequest(models.Model):
    REASON_CHOICES = (
        ('damaged', 'Hàng bị hư/hỏng'),
        ('not_as_described', 'Hàng không đúng mô tả'),
        ('wrong_item', 'Giao sai sản phẩm'),
        ('not_working', 'Hàng không hoạt động'),
        ('other', 'Lý do khác'),
    )

    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    )

    transaction = models.ForeignKey(Transaction, related_name='refund_requests', on_delete=models.CASCADE)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    reason_detail = models.TextField(blank=True, default='')
    evidence_image_1 = CloudinaryField('evidence_1', blank=True, null=True)
    evidence_image_2 = CloudinaryField('evidence_2', blank=True, null=True)
    evidence_image_3 = CloudinaryField('evidence_3', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    admin_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Refund #{self.id} — Tx #{self.transaction.id} — {self.get_reason_display()} — {self.status}"

    def get_evidence_urls(self):
        urls = []
        for field in [self.evidence_image_1, self.evidence_image_2, self.evidence_image_3]:
            if field:
                urls.append(field.url)
        return urls