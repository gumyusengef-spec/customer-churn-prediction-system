from rest_framework import serializers
from .models import Medicine

class MedicineSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.get_full_name', read_only=True)
    
    class Meta:
        model = Medicine
        fields = '__all__'
        read_only_fields = ('seller', 'created_at', 'updated_at')
    
    def validate_expiry_date(self, value):
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value
    
    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value