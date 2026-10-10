from django.db import models
from django.conf import settings


class Notification(models.Model):
    """Notification Model"""

    NOTIFICATION_TYPES = (
        ('account_created', 'Account Created'),
        ('order_submitted', 'Order Submitted'),
        ('order_status_changed', 'Order Status Changed'),
        ('discount_response', 'Discount Response'),
        ('new_medicine', 'New Medicine Available'),
        ('medicine_expiring', 'Medicine Expiring Soon'),
        ('seller_response', 'Seller Response'),
        ('new_order', 'New Order Received'),
        ('new_discount_request', 'New Discount Request'),
        ('new_comment', 'New Comment'),
        ('low_stock', 'Low Stock Alert'),
        ('medicine_expired', 'Medicine Expired'),
        ('high_churn_risk', 'High Churn Risk'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_id = models.IntegerField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
