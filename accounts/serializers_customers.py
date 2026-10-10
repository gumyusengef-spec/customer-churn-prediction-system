# accounts/serializers_customers.py
"""
Serializers used by the customer-analytics / churn endpoints.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Customer

User = get_user_model()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _monthly_orders(user, tenure_months=1):
    """
    Count ALL orders for this customer and divide by tenure months
    to get a real monthly average — not just the current calendar month.
    """
    from orders.models import Order

    total  = Order.objects.filter(customer=user).count()
    months = max(float(tenure_months or 1), 1.0)
    return round(total / months, 1)


def _safe_satisfaction(value):
    """
    Return satisfaction as a float, or None when no reviews exist.
    Never returns 0 as a real score — 0 means 'not yet rated'.
    """
    if value is None or value == 0.0:
        return None
    return round(float(value), 2)


def _calc_confidence(prob_0_to_100):
    p = (prob_0_to_100 or 0) / 100.0
    return round(max(p, 1 - p) * 100, 1)


def _confidence_label(confidence):
    if confidence >= 85: return 'Very High'
    if confidence >= 70: return 'High'
    if confidence >= 55: return 'Moderate'
    if confidence >= 40: return 'Low'
    return 'Very Low'


# ── List serializer (used by getAnalytics) ────────────────────────────────────

class CustomerAnalyticsSerializer(serializers.ModelSerializer):
    id                 = serializers.IntegerField(source='user.id')
    customer_name      = serializers.SerializerMethodField()
    email              = serializers.EmailField(source='user.email')
    contract_type      = serializers.CharField()
    tenure             = serializers.IntegerField()
    satisfaction_score = serializers.SerializerMethodField()
    monthly_orders     = serializers.SerializerMethodField()
    churn_predicted    = serializers.BooleanField()
    churn_probability  = serializers.SerializerMethodField()
    confidence         = serializers.SerializerMethodField()
    confidence_label   = serializers.SerializerMethodField()

    class Meta:
        model  = Customer
        fields = [
            'id', 'customer_name', 'email',
            'contract_type', 'tenure', 'satisfaction_score',
            'monthly_orders',
            'churn_predicted', 'churn_probability',
            'confidence', 'confidence_label',
        ]

    def get_customer_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_satisfaction_score(self, obj):
        return _safe_satisfaction(obj.avg_satisfaction_score)

    def get_monthly_orders(self, obj):
        return _monthly_orders(obj.user, obj.tenure)

    def get_churn_probability(self, obj):
        return round(obj.churn_probability or 0, 1)

    def get_confidence(self, obj):
        return _calc_confidence(obj.churn_probability)

    def get_confidence_label(self, obj):
        return _confidence_label(_calc_confidence(obj.churn_probability))


# ── Detail serializer (used by getDetail) ────────────────────────────────────

class CustomerDetailSerializer(serializers.ModelSerializer):
    id             = serializers.IntegerField(source='user.id')
    customer_name  = serializers.SerializerMethodField()
    email          = serializers.EmailField(source='user.email')
    phone          = serializers.SerializerMethodField()
    gender         = serializers.SerializerMethodField()
    dob            = serializers.SerializerMethodField()
    address        = serializers.SerializerMethodField()
    joined_date    = serializers.DateTimeField(source='user.created_at')

    contract_type          = serializers.CharField()
    tenure                 = serializers.IntegerField()
    usage_frequency        = serializers.FloatField()
    total_complaints       = serializers.IntegerField()
    avg_satisfaction_score = serializers.SerializerMethodField()

    churn_predicted      = serializers.BooleanField()
    churn_probability    = serializers.SerializerMethodField()
    confidence           = serializers.SerializerMethodField()
    confidence_label     = serializers.SerializerMethodField()
    last_prediction_date = serializers.DateTimeField(allow_null=True)

    monthly_orders   = serializers.SerializerMethodField()
    recent_orders    = serializers.SerializerMethodField()
    feedback_history = serializers.SerializerMethodField()   # ← ADDED

    class Meta:
        model  = Customer
        fields = [
            'id', 'customer_name', 'email', 'phone', 'gender', 'dob',
            'address', 'joined_date',
            'contract_type', 'tenure', 'usage_frequency',
            'total_complaints', 'avg_satisfaction_score',
            'churn_predicted', 'churn_probability',
            'confidence', 'confidence_label', 'last_prediction_date',
            'monthly_orders', 'recent_orders',
            'feedback_history',                              # ← ADDED
        ]

    def get_customer_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_phone(self, obj):
        return getattr(obj.user, 'phone', '') or ''

    def get_gender(self, obj):
        return getattr(obj.user, 'gender', '') or ''

    def get_dob(self, obj):
        dob = getattr(obj.user, 'dob', None)
        return str(dob) if dob else None

    def get_address(self, obj):
        return getattr(obj.user, 'address', '') or ''

    def get_avg_satisfaction_score(self, obj):
        return _safe_satisfaction(obj.avg_satisfaction_score)

    def get_monthly_orders(self, obj):
        return _monthly_orders(obj.user, obj.tenure)

    def get_churn_probability(self, obj):
        return round(obj.churn_probability or 0, 1)

    def get_confidence(self, obj):
        return _calc_confidence(obj.churn_probability)

    def get_confidence_label(self, obj):
        return _confidence_label(_calc_confidence(obj.churn_probability))

    def get_recent_orders(self, obj):
        from orders.models import Order
        orders = (
            Order.objects
            .filter(customer=obj.user)
            .order_by('-created_at')[:5]
            .values('id', 'total_amount', 'status', 'created_at')
        )
        return list(orders)

    def get_feedback_history(self, obj):           # ← ADDED
        """
        Fetch the 10 most recent comments/feedback left by this customer.
        Mirrors the pattern used by get_recent_orders above.

        Adjust the import path if your app is named differently
        (e.g. 'feedback.models' instead of 'comments.models').
        Also adjust the FK filter field if your Comment model points to
        the user via a field other than 'customer' (e.g. filter(user=obj.user)).
        """
        from orders.models import Comment
        feedbacks = (
            Comment.objects
            .filter(customer=obj.user)
            .order_by('-created_at')[:10]
            .values('id', 'satisfaction_score', 'comment_text', 'created_at', 'order_id')
        )
        return [
            {
                'id':         fb['id'],
                'score':      fb['satisfaction_score'],
                'text':       fb['comment_text'],
                'created_at': fb['created_at'],
                'order':      fb['order_id'],
            }
            for fb in feedbacks
        ]