from django.db import models
from django.db.models import F
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User
from medicines.models import Medicine


class Order(models.Model):
    """Customer Order Model"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_orders')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_address = models.TextField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    is_edited = models.BooleanField(default=False)
    edit_reason = models.TextField(blank=True, null=True)
    customer_accepted_edit = models.BooleanField(null=True, blank=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer.get_full_name()}"

    def save(self, *args, **kwargs):
        """
        Override save to automatically deduct medicine stock
        when an order transitions to 'approved' or 'completed'.
        Stock is only deducted once per transition (not on every save).
        """
        if self.pk:
            try:
                old = Order.objects.get(pk=self.pk)
                old_status = old.status
            except Order.DoesNotExist:
                old_status = None
        else:
            old_status = None

        super().save(*args, **kwargs)

        # Deduct stock only on the moment status changes to approved or completed
        status_changed = old_status != self.status
        should_deduct  = self.status in ('approved', 'completed')
        # Never deduct twice: skip if it was already approved and is now completed
        already_deducted = old_status == 'approved' and self.status == 'completed'

        if status_changed and should_deduct and not already_deducted:
            self._deduct_stock()

    def _deduct_stock(self):
        """
        Deduct the effective quantity of each order item from Medicine.stock_quantity.
        Uses get_effective_quantity() so edited+accepted quantities are respected.
        Logs a warning if stock is insufficient rather than going negative.
        """
        for item in self.items.select_related('medicine').all():
            qty = item.get_effective_quantity()
            medicine = item.medicine

            if medicine.stock_quantity >= qty:
                # Atomic DB-level subtraction — safe under concurrent requests
                Medicine.objects.filter(pk=medicine.pk).update(
                    stock_quantity=F('stock_quantity') - qty
                )
            else:
                # Stock is insufficient — deduct what's available and log
                print(
                    f"[Stock Warning] Order #{self.id}: insufficient stock for "
                    f"'{medicine.brand_name}' "
                    f"(requested {qty}, available {medicine.stock_quantity}). "
                    f"Stock set to 0."
                )
                Medicine.objects.filter(pk=medicine.pk).update(stock_quantity=0)

    def recalculate_total(self):
        """Recalculate total based on current item quantities"""
        total = sum(item.get_effective_subtotal() for item in self.items.all())
        self.total_amount = total
        self.save()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['seller']),
            models.Index(fields=['status']),
        ]


class OrderItem(models.Model):
    """Individual items in an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    # Seller can edit quantity per item
    edited_quantity = models.IntegerField(null=True, blank=True)
    edited_subtotal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_edit_reason = models.TextField(blank=True, null=True)
    customer_accepted_item_edit = models.BooleanField(null=True, blank=True)

    def get_effective_quantity(self):
        """Return edited quantity if accepted by customer, otherwise original"""
        if self.edited_quantity is not None and self.customer_accepted_item_edit is True:
            return self.edited_quantity
        return self.quantity

    def get_effective_subtotal(self):
        """Return edited subtotal if accepted by customer, otherwise original"""
        if self.edited_subtotal is not None and self.customer_accepted_item_edit is True:
            return self.edited_subtotal
        return self.subtotal

    def __str__(self):
        return f"{self.medicine.brand_name} x {self.quantity}"


class DiscountRequest(models.Model):
    """Discount request from customer"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discount_requests')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='discount_requests', null=True, blank=True)
    requested_discount = models.FloatField(help_text="Requested discount percentage")
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_discount = models.FloatField(blank=True, null=True)
    requested_date = models.DateTimeField(auto_now_add=True)
    response_date = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Discount Request #{self.id} - {self.customer.get_full_name()}"

    class Meta:
        ordering = ['-requested_date']


class Comment(models.Model):
    """Customer feedback/comments"""
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_comments')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    comment_text = models.TextField()
    satisfaction_score = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.customer.get_full_name()} - Score: {self.satisfaction_score}"

    class Meta:
        ordering = ['-created_at']