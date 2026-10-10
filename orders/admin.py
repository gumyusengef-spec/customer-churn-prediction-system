from django.contrib import admin
from .models import Order, OrderItem, DiscountRequest, Comment

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'seller', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer__username', 'seller__username')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'medicine', 'quantity', 'unit_price', 'subtotal')

@admin.register(DiscountRequest)
class DiscountRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'requested_discount', 'status', 'requested_date')
    list_filter = ('status', 'requested_date')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'seller', 'satisfaction_score', 'created_at')
    list_filter = ('satisfaction_score', 'created_at')