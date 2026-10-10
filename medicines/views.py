from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Medicine
from .serializers import MedicineSerializer

class MedicineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Medicine CRUD operations
    """
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Sellers see only their medicines
        if user.user_type == 'seller':
            return Medicine.objects.filter(seller=user)
        
        # Customers see only visible medicines
        elif user.user_type == 'customer':
            queryset = Medicine.objects.filter(is_visible=True)
            
            # Apply search
            search = self.request.query_params.get('search', None)
            if search:
                queryset = queryset.filter(
                    Q(brand_name__icontains=search) |
                    Q(generic_name__icontains=search) |
                    Q(active_ingredient__icontains=search) |
                    Q(manufacturer__icontains=search)
                )
            
            # Apply filters
            dosage_form = self.request.query_params.get('dosageForm', None)
            if dosage_form:
                queryset = queryset.filter(dosage_form=dosage_form)
            
            min_price = self.request.query_params.get('minPrice', None)
            if min_price:
                queryset = queryset.filter(price__gte=min_price)
            
            max_price = self.request.query_params.get('maxPrice', None)
            if max_price:
                queryset = queryset.filter(price__lte=max_price)
            
            return queryset
        
        return Medicine.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def toggle_visibility(self, request, pk=None):
        """Toggle medicine visibility"""
        medicine = self.get_object()
        
        if medicine.seller != request.user:
            return Response({
                'error': 'You do not have permission to modify this medicine'
            }, status=status.HTTP_403_FORBIDDEN)
        
        medicine.is_visible = request.data.get('isVisible', not medicine.is_visible)
        medicine.save()
        
        return Response({
            'message': 'Visibility updated successfully',
            'medicine': MedicineSerializer(medicine).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def bulk_visibility(self, request):
        """Update visibility for multiple medicines"""
        medicine_ids = request.data.get('medicine_ids', [])
        is_visible = request.data.get('isVisible', True)
        
        medicines = Medicine.objects.filter(
            id__in=medicine_ids,
            seller=request.user
        )
        
        medicines.update(is_visible=is_visible)
        
        return Response({
            'message': f'Updated visibility for {medicines.count()} medicines'
        }, status=status.HTTP_200_OK)