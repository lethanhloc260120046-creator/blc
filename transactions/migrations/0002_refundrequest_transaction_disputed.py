from django.db import migrations, models
import cloudinary.models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaction',
            name='status',
            field=models.CharField(
                choices=[
                    ('Created', 'Created'),
                    ('Funded', 'Funded'),
                    ('Disputed', 'Disputed'),
                    ('Completed', 'Completed'),
                    ('Cancelled', 'Cancelled'),
                ],
                default='Created',
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name='RefundRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(
                    choices=[
                        ('damaged', 'Hàng bị hư/hỏng'),
                        ('not_as_described', 'Hàng không đúng mô tả'),
                        ('wrong_item', 'Giao sai sản phẩm'),
                        ('not_working', 'Hàng không hoạt động'),
                        ('other', 'Lý do khác'),
                    ],
                    max_length=30,
                )),
                ('reason_detail', models.TextField(blank=True, default='')),
                ('evidence_image_1', cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='evidence_1')),
                ('evidence_image_2', cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='evidence_2')),
                ('evidence_image_3', cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='evidence_3')),
                ('status', models.CharField(
                    choices=[
                        ('Pending', 'Pending'),
                        ('Approved', 'Approved'),
                        ('Rejected', 'Rejected'),
                    ],
                    default='Pending',
                    max_length=20,
                )),
                ('admin_note', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('transaction', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='refund_requests',
                    to='transactions.transaction',
                )),
            ],
        ),
    ]
