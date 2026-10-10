# accounts/views_customers.py
"""
Views wired to customerAPI in frontend/src/services/api.js:

  GET  /api/auth/customer-analytics/           → getAnalytics()
  GET  /api/auth/customer-detail/<id>/         → getDetail(id)
  GET  /api/auth/export-csv/                   → exportCSV()
  POST /api/auth/predict-churn/                → predictChurn()
  POST /api/auth/predict-churn/<id>/           → predictSingleChurn(id)
  GET  /api/auth/churn-report/                 → getChurnReport()
  GET  /api/auth/customer-recommendations/<id>/→ getCustomerRecommendations(id)
  DEL  /api/auth/customer-delete/<id>/         → deleteCustomer(id)
"""

import csv
import logging
from io import StringIO

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Customer
from .serializers_customers import (
    CustomerAnalyticsSerializer,
    CustomerDetailSerializer,
)
from .ml_service import predict, predict_bulk

User = get_user_model()
logger = logging.getLogger(__name__)


# ── Permission helper ─────────────────────────────────────────────────────────

class SellerRequired(IsAuthenticated):
    """Only authenticated sellers may access these views."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, 'user_type', None) == 'seller'


# ── Utility ───────────────────────────────────────────────────────────────────

def _get_seller_customers(seller):
    """
    Return all Customer profiles whose user has placed at least one order
    with this seller. Falls back to all customers if none found.
    """
    from orders.models import Order
    customer_user_ids = (
        Order.objects
        .filter(seller=seller)
        .values_list('customer_id', flat=True)
        .distinct()
    )
    qs = Customer.objects.select_related('user').filter(
        user_id__in=customer_user_ids
    )
    if not qs.exists():
        qs = Customer.objects.select_related('user').filter(
            user__user_type='customer'
        )
    return qs


# ── 1. Customer Analytics list ────────────────────────────────────────────────

class CustomerAnalyticsView(APIView):
    permission_classes = [SellerRequired]

    def get(self, request):
        profiles = _get_seller_customers(request.user)
        for p in profiles:
            p.update_tenure()
        serializer = CustomerAnalyticsSerializer(profiles, many=True)
        return Response(serializer.data)


# ── 2. Customer Detail ────────────────────────────────────────────────────────

class CustomerDetailView(APIView):
    permission_classes = [SellerRequired]

    def get(self, request, customer_id):
        try:
            profile = Customer.objects.select_related('user').get(
                user_id=customer_id
            )
        except Customer.DoesNotExist:
            return Response(
                {'error': 'Customer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        profile.update_tenure()
        serializer = CustomerDetailSerializer(profile)
        return Response(serializer.data)


# ── 3. Export CSV ─────────────────────────────────────────────────────────────

class ExportCSVView(APIView):
    permission_classes = [SellerRequired]

    def get(self, request):
        profiles = _get_seller_customers(request.user)

        buf = StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            'Customer Name', 'Email', 'Contract Type', 'Tenure (months)',
            'Satisfaction Score', 'Usage Frequency', 'Complaints',
            'Churn Probability (%)', 'Churn Predicted', 'Last Prediction Date',
        ])

        for p in profiles:
            writer.writerow([
                p.user.get_full_name() or p.user.username,
                p.user.email,
                p.contract_type,
                p.tenure,
                round(p.avg_satisfaction_score or 0, 2),
                round(p.usage_frequency or 0, 2),
                p.total_complaints,
                round(p.churn_probability or 0, 1),
                'Yes' if p.churn_predicted else 'No',
                p.last_prediction_date.strftime('%Y-%m-%d %H:%M') if p.last_prediction_date else '',
            ])

        response = HttpResponse(buf.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customer_data.csv"'
        return response


# ── 4. Predict Churn — all customers ─────────────────────────────────────────

class PredictChurnBulkView(APIView):
    permission_classes = [SellerRequired]

    def post(self, request):
        profiles = list(_get_seller_customers(request.user))
        if not profiles:
            return Response(
                {'message': 'No customers found.', 'updated': 0},
                status=status.HTTP_200_OK,
            )

        results = predict_bulk(profiles)
        updated = 0
        now = timezone.now()

        for profile, result in zip(profiles, results):
            Customer.objects.filter(pk=profile.pk).update(
                churn_probability    = result['churn_probability'],
                churn_predicted      = result['churn_predicted'],
                last_prediction_date = now,
            )
            updated += 1

        return Response({
            'message': f'Predictions updated for {updated} customer(s).',
            'updated': updated,
        })


# ── 5. Predict Churn — single customer ───────────────────────────────────────

class PredictChurnSingleView(APIView):
    permission_classes = [SellerRequired]

    def post(self, request, customer_id):
        try:
            profile = Customer.objects.select_related('user').get(
                user_id=customer_id
            )
        except Customer.DoesNotExist:
            return Response(
                {'error': 'Customer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        profile.update_all_metrics()
        result = predict(profile)
        now = timezone.now()

        Customer.objects.filter(pk=profile.pk).update(
            churn_probability    = result['churn_probability'],
            churn_predicted      = result['churn_predicted'],
            last_prediction_date = now,
        )

        return Response({
            **result,
            'customer_id': customer_id,
            'last_prediction_date': now,
        })


# ── 6. Churn Report ───────────────────────────────────────────────────────────

class ChurnReportView(APIView):
    permission_classes = [SellerRequired]

    def get(self, request):
        profiles = list(_get_seller_customers(request.user))
        total = len(profiles)

        if total == 0:
            return Response({
                'total_customers': 0,
                'high_risk': 0,
                'medium_risk': 0,
                'low_risk': 0,
                'predicted_churn': 0,
                'churn_rate_pct': 0,
                'avg_churn_probability': 0,
                'by_contract': {},
                'top_at_risk': [],
            })

        high_risk       = [p for p in profiles if (p.churn_probability or 0) >= 60]
        medium_risk     = [p for p in profiles if 25 <= (p.churn_probability or 0) < 60]
        low_risk        = [p for p in profiles if (p.churn_probability or 0) < 25]
        predicted_churn = [p for p in profiles if p.churn_predicted]

        avg_prob = round(
            sum(p.churn_probability or 0 for p in profiles) / total, 1
        )

        by_contract = {}
        for p in profiles:
            ct = p.contract_type
            by_contract.setdefault(ct, {'total': 0, 'at_risk': 0})
            by_contract[ct]['total'] += 1
            if p.churn_predicted:
                by_contract[ct]['at_risk'] += 1

        top_at_risk_profiles = sorted(
            profiles, key=lambda p: p.churn_probability or 0, reverse=True
        )[:10]
        top_at_risk = CustomerAnalyticsSerializer(top_at_risk_profiles, many=True).data

        return Response({
            'total_customers':       total,
            'high_risk':             len(high_risk),
            'medium_risk':           len(medium_risk),
            'low_risk':              len(low_risk),
            'predicted_churn':       len(predicted_churn),
            'churn_rate_pct':        round(len(predicted_churn) / total * 100, 1),
            'avg_churn_probability': avg_prob,
            'by_contract':           by_contract,
            'top_at_risk':           top_at_risk,
        })


# ── 7. Customer Recommendations ───────────────────────────────────────────────

class CustomerRecommendationsView(APIView):
    permission_classes = [SellerRequired]

    def get(self, request, customer_id):
        try:
            profile = Customer.objects.select_related('user').get(
                user_id=customer_id
            )
        except Customer.DoesNotExist:
            return Response(
                {'error': 'Customer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        prob = profile.churn_probability or 0
        recommendations = _build_recommendations(profile, prob)

        return Response({
            'customer_id':       customer_id,
            'customer_name':     profile.user.get_full_name() or profile.user.username,
            'churn_probability': round(prob, 1),
            'churn_predicted':   profile.churn_predicted,
            'recommendations':   recommendations,
        })


def _build_recommendations(profile, prob):
    recs = []

    if prob >= 60:
        recs.append({
            'priority': 'high',
            'action':   'Immediate retention call',
            'detail':   'Schedule a personal call within 48 hours to understand concerns.',
        })
        recs.append({
            'priority': 'high',
            'action':   'Offer contract upgrade incentive',
            'detail':   'Provide a 10–20% discount to upgrade to a longer-term contract.',
        })
    elif prob >= 25:
        recs.append({
            'priority': 'medium',
            'action':   'Proactive engagement',
            'detail':   'Send a personalised check-in message or loyalty offer.',
        })

    if (profile.total_complaints or 0) >= 3:
        recs.append({
            'priority': 'high',
            'action':   'Resolve outstanding complaints',
            'detail':   f'{profile.total_complaints} complaint(s) recorded — address them promptly.',
        })

    if (profile.avg_satisfaction_score or 5) < 3:
        recs.append({
            'priority': 'medium',
            'action':   'Satisfaction recovery',
            'detail':   'Low satisfaction score. Consider a service quality review.',
        })

    if (profile.usage_frequency or 1) < 1:
        recs.append({
            'priority': 'low',
            'action':   'Re-engagement campaign',
            'detail':   'Low order frequency. Send product highlights or a special offer.',
        })

    if profile.contract_type == 'month-to-month':
        recs.append({
            'priority': 'medium',
            'action':   'Promote longer contract',
            'detail':   'Month-to-month customers churn more. Highlight annual plan savings.',
        })

    if not recs:
        recs.append({
            'priority': 'low',
            'action':   'Maintain engagement',
            'detail':   'Customer is stable. Keep regular touchpoints and loyalty rewards.',
        })

    return recs


# ── 8. Delete Customer ────────────────────────────────────────────────────────

class CustomerDeleteView(APIView):
    permission_classes = [SellerRequired]

    def delete(self, request, customer_id):
        try:
            user = User.objects.get(id=customer_id, user_type='customer')
        except User.DoesNotExist:
            return Response(
                {'error': 'Customer not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        name = user.get_full_name() or user.username
        user.delete()  # CASCADE removes Customer profile, orders, comments, etc.

        return Response(
            {'message': f'Customer "{name}" deleted successfully.'},
            status=status.HTTP_200_OK,
        )