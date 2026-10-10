from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class User(AbstractUser):
    """Custom User Model"""
    USER_TYPE_CHOICES = (
        ('seller', 'Seller'),
        ('customer', 'Customer'),
    )

    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )

    user_type  = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    phone      = models.CharField(max_length=20, blank=True, null=True)
    address    = models.TextField(blank=True, null=True)
    gender     = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    dob        = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.user_type})"

    class Meta:
        ordering = ['-created_at']


class Customer(models.Model):
    """Extended Customer Information"""
    CONTRACT_TYPE_CHOICES = (
        ('month-to-month', 'Month-to-Month'),
        ('1-year',         '1-Year Contract'),
        ('2-year',         '2-Year Contract'),
        ('prepaid',        'Prepaid'),
        ('postpaid',       'Postpaid'),
    )

    user                   = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    contract_type          = models.CharField(max_length=20, choices=CONTRACT_TYPE_CHOICES)
    tenure                 = models.IntegerField(default=0, help_text="Months as customer")
    usage_frequency        = models.FloatField(default=0.0, help_text="Orders per month")
    total_complaints       = models.IntegerField(default=0)

    # FIX: default=None (nullable) so we can distinguish "no reviews yet" from a real 0 score
    avg_satisfaction_score = models.FloatField(
        default=None,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)]
    )
    churn_predicted        = models.BooleanField(default=False)
    churn_probability      = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    last_prediction_date   = models.DateTimeField(blank=True, null=True)
    tenure_last_updated    = models.DateField(blank=True, null=True,
                                              help_text="Date tenure was last recalculated")

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.contract_type}"

    class Meta:
        ordering = ['-user__created_at']

    def calculate_tenure(self):
        now        = timezone.now()
        created_at = self.user.created_at
        months = (now.year - created_at.year) * 12 + (now.month - created_at.month)
        if now.day < created_at.day:
            months -= 1
        return max(1, months)

    def update_tenure(self, force=False):
        today = timezone.now().date()
        if (not force
                and self.tenure_last_updated
                and self.tenure_last_updated.year  == today.year
                and self.tenure_last_updated.month == today.month):
            return
        new_tenure = self.calculate_tenure()
        if self.tenure != new_tenure:
            self.tenure = new_tenure
        self.tenure_last_updated = today
        Customer.objects.filter(pk=self.pk).update(
            tenure=self.tenure,
            tenure_last_updated=self.tenure_last_updated,
        )

    def update_usage_frequency(self):
        from orders.models import Order
        self.update_tenure(force=True)
        tenure_months        = max(1, self.tenure)
        total_orders         = Order.objects.filter(customer=self.user).count()
        self.usage_frequency = round(total_orders / tenure_months, 2)
        Customer.objects.filter(pk=self.pk).update(usage_frequency=self.usage_frequency)

    def update_complaints(self):
        from orders.models import Comment
        complaints = Comment.objects.filter(
            customer=self.user,
            satisfaction_score__lte=2
        ).count()
        self.total_complaints = complaints
        Customer.objects.filter(pk=self.pk).update(total_complaints=self.total_complaints)

    def update_satisfaction_score(self):
        from orders.models import Comment
        from django.db.models import Avg
        avg_score = Comment.objects.filter(
            customer=self.user
        ).aggregate(Avg('satisfaction_score'))['satisfaction_score__avg']
        # FIX: store None when no reviews exist — do NOT store 0
        self.avg_satisfaction_score = round(avg_score, 2) if avg_score is not None else None
        Customer.objects.filter(pk=self.pk).update(
            avg_satisfaction_score=self.avg_satisfaction_score
        )

    def update_all_metrics(self):
        self.update_tenure(force=True)
        self.update_usage_frequency()
        self.update_complaints()
        self.update_satisfaction_score()

    def get_churn_features(self):
        from datetime import datetime
        live_tenure = self.calculate_tenure()
        age = 0
        if self.user.dob:
            today = datetime.now().date()
            age = (today.year - self.user.dob.year
                   - ((today.month, today.day) < (self.user.dob.month, self.user.dob.day)))
        gender_encoded = 1 if self.user.gender == 'male' else 0
        contract_mapping = {
            'month-to-month': 1,
            '1-year':         2,
            '2-year':         3,
            'prepaid':        4,
            'postpaid':       5,
        }
        contract_encoded = contract_mapping.get(self.contract_type, 1)
        return {
            'customer_id':        self.user.id,
            'gender':             gender_encoded,
            'age':                age,
            'tenure':             live_tenure,
            'contract_type':      contract_encoded,
            'usage_frequency':    self.usage_frequency,
            'complaints':         self.total_complaints,
            'satisfaction_score': self.avg_satisfaction_score,
            'churn_probability':  self.churn_probability,
        }