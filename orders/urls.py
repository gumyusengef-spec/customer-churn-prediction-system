from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, DiscountRequestViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'discounts', DiscountRequestViewSet, basename='discounts')
router.register(r'comments', CommentViewSet, basename='comments')

urlpatterns = [
    path('', include(router.urls)),
]