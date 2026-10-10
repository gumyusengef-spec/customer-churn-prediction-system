# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views_customers import (
    CustomerAnalyticsView,
    CustomerDetailView,
    ExportCSVView,
    CustomerDeleteView,
    PredictChurnBulkView,
    PredictChurnSingleView,
    ChurnReportView,
    CustomerRecommendationsView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('register-seller/',   views.register_seller,   name='register_seller'),
    path('register-customer/', views.register_customer, name='register_customer'),
    path('login/',             views.login,             name='login'),
    path('logout/',            views.logout,            name='logout'),
    path('token/refresh/',     TokenRefreshView.as_view(), name='token_refresh'),

    # ── Profile ───────────────────────────────────────────────────────────────
    path('profile/',         views.get_profile,     name='profile'),
    path('profile/update/',  views.update_profile,  name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),

    # ── Customer Analytics ────────────────────────────────────────────────────
    path('customer-analytics/',                CustomerAnalyticsView.as_view(),   name='customer_analytics'),
    path('customer-detail/<int:customer_id>/', CustomerDetailView.as_view(),      name='customer_detail'),
    path('export-csv/',                        ExportCSVView.as_view(),           name='export_csv'),
    path('customer-delete/<int:customer_id>/', CustomerDeleteView.as_view(),      name='customer_delete'),

    # ── Churn Predictions ─────────────────────────────────────────────────────
    path('predict-churn/',                   PredictChurnBulkView.as_view(),    name='predict_churn'),
    path('predict-churn/<int:customer_id>/', PredictChurnSingleView.as_view(), name='predict_single_churn'),

    # ── Reports & Recommendations ─────────────────────────────────────────────
    path('churn-report/',                               ChurnReportView.as_view(),             name='churn_report'),
    path('customer-recommendations/<int:customer_id>/', CustomerRecommendationsView.as_view(), name='customer_recommendations'),
]