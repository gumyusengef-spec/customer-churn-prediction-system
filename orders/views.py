from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from accounts.models import Customer
from medicines.models import Medicine
from .models import Order, OrderItem, DiscountRequest, Comment
from .serializers import (
    OrderSerializer,
    OrderItemSerializer,
    DiscountRequestSerializer,
    CommentSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    """Order management viewset"""
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'seller':
            return Order.objects.filter(seller=user).order_by('-created_at')
        return Order.objects.filter(customer=user).order_by('-created_at')

    # ─────────────────────────────────────────────────────────────────────────
    # CREATE ORDER
    # ─────────────────────────────────────────────────────────────────────────
    def create(self, request):
        """Customer places a new order."""
        data = request.data

        try:
            with transaction.atomic():
                order = Order.objects.create(
                    customer=request.user,
                    seller_id=data['seller_id'],
                    total_amount=data['total_amount'],
                    delivery_address=data.get('delivery_address', ''),
                    notes=data.get('notes', ''),
                    status='pending',
                )

                for item in data.get('items', []):
                    OrderItem.objects.create(
                        order=order,
                        medicine_id=item['medicine_id'],
                        quantity=item['quantity'],
                        unit_price=item['unit_price'],
                        subtotal=item['subtotal'],
                    )

                try:
                    customer = Customer.objects.get(user=request.user)
                    customer.update_usage_frequency()
                except Customer.DoesNotExist:
                    pass

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except KeyError as e:
            return Response(
                {'error': f'Missing required field: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create order: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # ─────────────────────────────────────────────────────────────────────────
    # UPDATE STATUS
    # ─────────────────────────────────────────────────────────────────────────
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Seller updates order status."""
        order      = self.get_object()
        new_status = request.data.get('status')

        VALID_STATUSES = {'pending', 'approved', 'completed', 'cancelled'}
        if new_status not in VALID_STATUSES:
            return Response(
                {'error': f'Invalid status. Choose from: {", ".join(VALID_STATUSES)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.user_type != 'seller':
            return Response(
                {'error': 'Only sellers can update order status'},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            old_status   = order.status
            order.status = new_status

            if new_status == 'approved' and old_status != 'approved':
                order.approved_at = timezone.now()

            elif new_status == 'completed' and old_status != 'completed':
                order.completed_at = timezone.now()

                # ── DEDUCT STOCK WHEN ORDER IS COMPLETED ──
                for item in order.items.all():
                    try:
                        medicine = Medicine.objects.select_for_update().get(
                            id=item.medicine_id
                        )
                        if item.edited_quantity and item.customer_accepted_item_edit is True:
                            qty_to_deduct = item.edited_quantity
                        else:
                            qty_to_deduct = item.quantity

                        medicine.stock_quantity = max(
                            0, medicine.stock_quantity - qty_to_deduct
                        )
                        medicine.save()
                    except Medicine.DoesNotExist:
                        continue

            order.save()

        # Refresh customer churn metrics
        try:
            customer = Customer.objects.get(user=order.customer)
            customer.update_all_metrics()
        except Customer.DoesNotExist:
            pass

        return Response(OrderSerializer(order).data)

    # ─────────────────────────────────────────────────────────────────────────
    # EDIT ORDER (seller modifies item quantities)
    # ─────────────────────────────────────────────────────────────────────────
    @action(detail=True, methods=['patch'])
    def edit_order(self, request, pk=None):
        """Seller edits item quantities; sends order back to customer for approval."""
        order = self.get_object()

        if request.user.user_type != 'seller':
            return Response(
                {'error': 'Only sellers can edit orders'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status not in ('pending', 'approved', 'pending_customer_approval'):
            return Response(
                {'error': f'Order cannot be edited in "{order.status}" status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            modified_items = request.data.get('items', [])
            edit_reason    = request.data.get('edit_reason', 'Order items modified')

            with transaction.atomic():
                for item_data in modified_items:
                    item_id      = item_data.get('id') or item_data.get('item_id')
                    new_quantity = item_data.get('quantity')

                    if not item_id or not new_quantity:
                        continue

                    try:
                        item         = OrderItem.objects.get(id=item_id, order=order)
                        new_quantity = int(new_quantity)
                        if new_quantity < 1:
                            return Response(
                                {'error': 'Quantity must be at least 1'},
                                status=status.HTTP_400_BAD_REQUEST,
                            )
                        item.edited_quantity             = new_quantity
                        item.edited_subtotal             = round(
                            new_quantity * float(item.unit_price), 2
                        )
                        item.item_edit_reason            = item_data.get('reason', edit_reason)
                        item.customer_accepted_item_edit = None
                        item.save()
                    except OrderItem.DoesNotExist:
                        continue

                order.is_edited              = True
                order.edit_reason            = edit_reason
                order.customer_accepted_edit = None
                order.edited_at              = timezone.now()
                order.status                 = 'pending_customer_approval'
                order.save()

            return Response({
                'message': 'Order edited. Waiting for customer approval.',
                'order':   OrderSerializer(order).data,
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to edit order: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # ─────────────────────────────────────────────────────────────────────────
    # RESPOND TO EDIT (customer accepts or rejects)
    # ─────────────────────────────────────────────────────────────────────────
    @action(detail=True, methods=['patch'])
    def respond_to_edit(self, request, pk=None):
        """Customer accepts or rejects the seller's edit."""
        order = self.get_object()

        if request.user.user_type != 'customer':
            return Response(
                {'error': 'Only customers can respond to edits'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not order.is_edited and order.status != 'pending_customer_approval':
            return Response(
                {'error': 'This order has no pending edits'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        accepted = request.data.get('accepted')

        with transaction.atomic():
            if accepted:
                new_total = 0
                for item in order.items.all():
                    if item.edited_quantity is not None:
                        item.customer_accepted_item_edit = True
                        item.quantity                    = item.edited_quantity
                        item.subtotal                    = float(item.edited_subtotal)
                        item.save()
                    new_total += float(item.subtotal)

                order.total_amount           = round(new_total, 2)
                order.customer_accepted_edit = True
                order.is_edited              = False
                order.status                 = 'approved'
                order.approved_at            = timezone.now()
                order.save()
                message = 'Order edit accepted. Quantities updated.'

            else:
                for item in order.items.all():
                    if item.edited_quantity is not None:
                        item.customer_accepted_item_edit = False
                        item.edited_quantity             = None
                        item.edited_subtotal             = None
                        item.save()

                order.customer_accepted_edit = False
                order.is_edited              = False
                order.status                 = 'cancelled'
                order.save()
                message = 'Order edit rejected. Order cancelled.'

        return Response({
            'message': message,
            'order':   OrderSerializer(order).data,
        })

    # ─────────────────────────────────────────────────────────────────────────
    # DELETE COMPLETED ORDER
    # ─────────────────────────────────────────────────────────────────────────
    @action(detail=True, methods=['delete'])
    def delete_completed(self, request, pk=None):
        """Seller deletes a completed order."""
        order = self.get_object()

        if request.user.user_type != 'seller':
            return Response(
                {'error': 'Only sellers can delete orders'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status != 'completed':
            return Response(
                {'error': 'Only completed orders can be deleted'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.delete()
        return Response(
            {'message': 'Order deleted successfully'},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# DISCOUNT REQUESTS
# ─────────────────────────────────────────────────────────────────────────────
class DiscountRequestViewSet(viewsets.ModelViewSet):
    """Discount request management"""
    serializer_class   = DiscountRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'seller':
            return DiscountRequest.objects.all().order_by('-requested_date')
        return DiscountRequest.objects.filter(customer=user).order_by('-requested_date')

    def create(self, request):
        """Customer creates a discount request."""
        data = request.data
        try:
            discount_request = DiscountRequest.objects.create(
                customer=request.user,
                order_id=data.get('order_id'),
                requested_discount=data['requested_discount'],
                reason=data['reason'],
                status='pending',
            )
            return Response(
                DiscountRequestSerializer(discount_request).data,
                status=status.HTTP_201_CREATED,
            )
        except KeyError as e:
            return Response(
                {'error': f'Missing required field: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['patch'])
    def respond(self, request, pk=None):
        """Seller approves or rejects a discount request."""
        if request.user.user_type != 'seller':
            return Response(
                {'error': 'Only sellers can respond to discount requests'},
                status=status.HTTP_403_FORBIDDEN,
            )

        discount_request = self.get_object()
        new_status       = request.data.get('status')

        if new_status not in ('approved', 'rejected'):
            return Response(
                {'error': 'Status must be "approved" or "rejected"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        discount_request.status            = new_status
        discount_request.approved_discount = request.data.get('approved_discount')
        discount_request.response_date     = timezone.now()
        discount_request.save()

        return Response(DiscountRequestSerializer(discount_request).data)


# ─────────────────────────────────────────────────────────────────────────────
# COMMENTS / FEEDBACK
# ─────────────────────────────────────────────────────────────────────────────
class CommentViewSet(viewsets.ModelViewSet):
    """Customer feedback and ratings"""
    serializer_class   = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'seller':
            return Comment.objects.filter(seller=user).order_by('-created_at')
        return Comment.objects.filter(customer=user).order_by('-created_at')

    def create(self, request):
        """Customer submits feedback/rating for an order."""
        data = request.data

        try:
            score = int(data['satisfaction_score'])
            if not (1 <= score <= 5):
                return Response(
                    {'error': 'satisfaction_score must be between 1 and 5'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            comment = Comment.objects.create(
                customer=request.user,
                seller_id=data['seller_id'],
                order_id=data.get('order_id'),
                comment_text=data['comment_text'],
                satisfaction_score=score,
            )

            try:
                customer = Customer.objects.get(user=request.user)
                customer.update_satisfaction_score()
                customer.update_complaints()
                customer.update_all_metrics()
            except Customer.DoesNotExist:
                pass

            return Response(
                CommentSerializer(comment).data,
                status=status.HTTP_201_CREATED,
            )

        except KeyError as e:
            return Response(
                {'error': f'Missing required field: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError:
            return Response(
                {'error': 'satisfaction_score must be an integer'},
                status=status.HTTP_400_BAD_REQUEST,
            )