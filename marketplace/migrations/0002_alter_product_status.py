from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='status',
            field=models.CharField(
                choices=[
                    ('AVAILABLE', 'Available'),
                    ('PENDING_APPROVAL', 'Pending Approval'),
                    ('HIDDEN', 'Hidden'),
                    ('SOLD', 'Sold'),
                ],
                default='AVAILABLE',
                max_length=20,
            ),
        ),
    ]
