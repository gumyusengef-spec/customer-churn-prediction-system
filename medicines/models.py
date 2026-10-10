from django.db import models
from accounts.models import User

class Medicine(models.Model):
    """Medicine Inventory Model"""
    DOSAGE_FORM_CHOICES = (
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('syrup', 'Syrup'),
        ('injection', 'Injection'),
        ('cream', 'Cream'),
        ('ointment', 'Ointment'),
        ('drops', 'Drops'),
        ('powder', 'Powder'),
    )
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medicines')
    brand_name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True, null=True)
    active_ingredient = models.CharField(max_length=200, blank=True, null=True)
    dosage = models.CharField(max_length=100, help_text="e.g., 500mg, 10ml")
    dosage_form = models.CharField(max_length=50, choices=DOSAGE_FORM_CHOICES)
    expiry_date = models.DateField()
    manufacturer = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    is_visible = models.BooleanField(default=True, help_text="Visible to customers")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.brand_name} ({self.dosage} {self.dosage_form})"
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['seller']),
            models.Index(fields=['brand_name']),
            models.Index(fields=['is_visible']),
        ]