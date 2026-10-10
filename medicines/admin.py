from django.contrib import admin
from .models import Medicine

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('brand_name', 'generic_name', 'dosage', 'dosage_form', 'price', 'stock_quantity', 'is_visible', 'expiry_date')
    list_filter = ('dosage_form', 'is_visible', 'seller')
    search_fields = ('brand_name', 'generic_name', 'active_ingredient', 'manufacturer')
    date_hierarchy = 'created_at'