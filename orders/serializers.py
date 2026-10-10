from rest_framework import serializers
from .models import Order, OrderItem, DiscountRequest, Comment
from medicines.serializers import MedicineSerializer
from accounts.models import User

class OrderItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('order',)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    seller_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('customer', 'created_at', 'approved_at', 'completed_at', 'edited_at')
    
    def get_customer_name(self, obj):
        return obj.customer.get_full_name() if obj.customer else None
    
    def get_seller_name(self, obj):
        return obj.seller.get_full_name() if obj.seller else None


class DiscountRequestSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DiscountRequest
        fields = '__all__'
        read_only_fields = ('customer', 'requested_date', 'response_date')
    
    def get_customer_name(self, obj):
        return obj.customer.get_full_name() if obj.customer else None


class CommentSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('customer', 'seller', 'created_at')
    
    def get_customer_name(self, obj):
        return obj.customer.get_full_name() if obj.customer else None