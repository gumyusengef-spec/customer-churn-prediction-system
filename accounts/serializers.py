from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Customer

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'first_name', 'last_name', 
                  'phone', 'address', 'gender', 'dob', 'user_type')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class CustomerRegistrationSerializer(serializers.Serializer):
    # Modified to accept email and pharmacy_name instead of username, first_name, last_name, gender, dob
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    password_hint = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)
    address = serializers.CharField(required=True)
    pharmacy_name = serializers.CharField(required=True)
    contract_type = serializers.ChoiceField(choices=Customer.CONTRACT_TYPE_CHOICES, required=True)
    
    def validate_email(self, value):
        # Check if email already exists
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Email already exists")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        contract_type = validated_data.pop('contract_type')
        pharmacy_name = validated_data.pop('pharmacy_name')
        password_hint = validated_data.pop('password_hint')  # Store if needed
        email = validated_data.pop('email')
        validated_data.pop('password2')
        
        # Create user with email as username and pharmacy_name as first_name
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            first_name=pharmacy_name,
            last_name='',  # Empty last_name
            phone=validated_data.get('phone', ''),
            address=validated_data.get('address', ''),
            gender='other',  # Default value
            dob='2000-01-01',  # Default value
            user_type='customer'
        )
        
        # Create customer profile
        customer = Customer.objects.create(
            user=user,
            contract_type=contract_type
        )
        
        # If you have password_hint field in Customer model, add it:
        # customer.password_hint = password_hint
        # customer.save()
        
        return user


class SellerRegistrationSerializer(serializers.Serializer):
    # Add this serializer for seller registration
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    password_hint = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)
    address = serializers.CharField(required=True)
    pharmacy_name = serializers.CharField(required=True)
    
    def validate_email(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Email already exists")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        pharmacy_name = validated_data.pop('pharmacy_name')
        password_hint = validated_data.pop('password_hint')
        email = validated_data.pop('email')
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            first_name=pharmacy_name,
            last_name='',
            phone=validated_data.get('phone', ''),
            address=validated_data.get('address', ''),
            gender='other',
            dob='2000-01-01',
            user_type='seller'
        )
        
        # If you have Seller model, create it here
        # from .models import Seller
        # seller = Seller.objects.create(
        #     user=user,
        #     business_name=business_name
        # )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 
                  'phone', 'address', 'gender', 'dob', 'user_type', 'created_at')
        read_only_fields = ('id', 'created_at')


class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'