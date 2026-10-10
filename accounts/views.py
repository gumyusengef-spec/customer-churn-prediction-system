# accounts/views.py - COMPLETE CORRECTED VERSION
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Avg, Sum, Count
from django.http import HttpResponse
from django.contrib.auth import logout as auth_logout
from django.contrib.auth import update_session_auth_hash
import csv
import os
import pickle
import numpy as np
import pandas as pd
from .models import User, Customer
from .serializers import (
    UserRegistrationSerializer,
    CustomerRegistrationSerializer,
    SellerRegistrationSerializer,   # ← FIXED: was missing
    UserSerializer,
    CustomerSerializer,
)

# ─────────────────────────────────────────────────────────────────────────────
# FEATURES
# ─────────────────────────────────────────────────────────────────────────────
FEATURES = [
    'age', 'tenure', 'monthly_charges', 'total_charges',
    'support_calls', 'usage_frequency', 'complaints', 'satisfaction_score',
    'male', 'mtm', 'c1yr', 'c2yr',
    'pay_cr', 'pay_db', 'pay_upi',
    'fiber', 'dsl', 'ts', 'os',
    'high_charge', 'high_support', 'low_sat', 'high_complaints', 'low_usage',
    'sat_proxy', 'adherence', 'risk_score',
    'mtm_premium', 'mtm_no_ts', 'mtm_burden',
    'sup_x_charge', 'prem_no_ts', 'sat_x_charge', 'complaint_x_charge',
    'charge_per_t', 'support_per_t',
    'loyal', 'v_loyal', 'new_cust',
    'tenure_log', 'monthly_log', 'total_log',
    'tenure_sq', 'monthly_sq',
]

BINARY_FEATURES = {
    'male', 'mtm', 'c1yr', 'c2yr',
    'pay_cr', 'pay_db', 'pay_upi',
    'fiber', 'dsl', 'ts', 'os',
    'high_charge', 'high_support', 'low_sat', 'high_complaints', 'low_usage',
    'loyal', 'v_loyal', 'new_cust',
    'mtm_no_ts', 'mtm_burden', 'prem_no_ts',
}
SCALE_COLS = [f for f in FEATURES if f not in BINARY_FEATURES]

# ─────────────────────────────────────────────────────────────────────────────
# THRESHOLDS
# ─────────────────────────────────────────────────────────────────────────────
THRESHOLD_CHURN  = 30
THRESHOLD_HIGH   = 60
THRESHOLD_MEDIUM = 25

# ─────────────────────────────────────────────────────────────────────────────
# CONTRACT ENCODING
# ─────────────────────────────────────────────────────────────────────────────
def _encode_contract(contract_type):
    ct = (contract_type or '').strip().lower()
    if ct in ('month-to-month', 'monthly', 'prepaid', 'postpaid'):
        return 1, 0, 0
    elif ct in ('1-year', '1 year', 'one year', 'yearly'):
        return 0, 1, 0
    elif ct in ('2-year', '2 year', 'two year', 'biennial'):
        return 0, 0, 1
    return 0, 0, 0

# ─────────────────────────────────────────────────────────────────────────────
# MONTHLY CHARGE BASELINES
# ─────────────────────────────────────────────────────────────────────────────
MONTHLY_BASELINE = {
    'month-to-month': 78.0,
    '1-year':         58.0,
    '2-year':         46.0,
    'prepaid':        72.0,
    'postpaid':       65.0,
}
MONTHLY_BASELINE_DEFAULT = 58.0


def _compute_monthly_charges(customer):
    from orders.models import Order
    agg = Order.objects.filter(
        customer=customer.user,
        status__in=['completed', 'approved'],
    ).aggregate(total=Sum('total_amount'), count=Count('id'), avg=Avg('total_amount'))

    order_count   = int(agg['count'] or 0)
    total_from_db = float(agg['total'] or 0)
    avg_from_db   = float(agg['avg']   or 0)

    ct       = (customer.contract_type or '').strip().lower()
    baseline = MONTHLY_BASELINE.get(ct, MONTHLY_BASELINE_DEFAULT)

    if order_count > 0 and avg_from_db >= 10:
        monthly_charges = round(avg_from_db, 2)
        total_charges   = round(total_from_db, 2)
    else:
        usage = float(customer.usage_frequency or 0)
        if usage > 0:
            raw = usage * 12.5
            monthly_charges = round(max(min(raw, 120.0), baseline * 0.6), 2)
        else:
            monthly_charges = baseline
        total_charges = round(monthly_charges * max(float(customer.tenure or 1), 1), 2)

    return monthly_charges, total_charges


# ─────────────────────────────────────────────────────────────────────────────
# VERDICT BUILDER
# ─────────────────────────────────────────────────────────────────────────────
def _build_verdict(probability):
    p = round(float(probability), 1)
    churn_predicted = p >= THRESHOLD_CHURN

    if churn_predicted:
        verdict    = 'Will Churn'
        confidence = round(50.0 + (p - THRESHOLD_CHURN) / (100.0 - THRESHOLD_CHURN) * 50.0, 1)
    else:
        verdict    = 'Will Not Churn'
        confidence = round(100.0 - (p / THRESHOLD_CHURN) * 50.0, 1)

    confidence = min(max(confidence, 50.0), 100.0)

    confidence_label = (
        'High'   if confidence >= 85 else
        'Medium' if confidence >= 70 else
        'Low'
    )

    risk_level = (
        'High'   if p >= THRESHOLD_HIGH   else
        'Medium' if p >= THRESHOLD_MEDIUM else
        'Low'
    )

    return {
        'verdict':           verdict,
        'confidence':        confidence,
        'confidence_label':  confidence_label,
        'churn_predicted':   churn_predicted,
        'churn_probability': p,
        'risk_level':        risk_level,
    }


# ─────────────────────────────────────────────────────────────────────────────
# AUTH VIEWS
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_seller(request):
    # ← FIXED: now uses SellerRegistrationSerializer (not UserRegistrationSerializer)
    serializer = SellerRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {'message': 'Seller registered successfully',
             'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_customer(request):
    serializer = CustomerRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({'message': 'Customer registered successfully',
                         'user': UserSerializer(user).data},
                        status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'error': 'Please provide both username and password'},
                        status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(username=username, password=password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        customer_profile = None
        if user.user_type == 'customer':
            try:
                customer = Customer.objects.get(user=user)
                customer_profile = CustomerSerializer(customer).data
            except Customer.DoesNotExist:
                pass
        return Response({
            'message': 'Login successful',
            'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)},
            'user': UserSerializer(user).data,
            'customer_profile': customer_profile,
        }, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get('refresh_token'))
        token.blacklist()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    user = request.user
    customer_profile = None
    if user.user_type == 'customer':
        try:
            customer = Customer.objects.get(user=user)
            customer_profile = CustomerSerializer(customer).data
        except Customer.DoesNotExist:
            pass
    return Response({'user': UserSerializer(user).data,
                     'customer_profile': customer_profile},
                    status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data

    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'email' in data:
        user.email = data['email']
    if 'phone' in data:
        user.phone = data['phone']
    if 'address' in data:
        user.address = data['address']

    user.save()

    customer_profile = None
    if user.user_type == 'customer':
        try:
            customer = Customer.objects.get(user=user)
            customer_profile = CustomerSerializer(customer).data
        except Customer.DoesNotExist:
            pass

    return Response({
        'user': UserSerializer(user).data,
        'customer_profile': customer_profile,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'error': 'Both current and new password are required'},
                        status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'},
                        status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters'},
                        status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)

    return Response({'message': 'Password changed successfully'},
                    status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# EXPORT CSV
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_customer_data_csv(request):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can export data'}, status=403)

    from orders.models import Comment

    customers = Customer.objects.select_related('user').all()

    for c in customers:
        try:
            c.update_all_metrics()
        except Exception as e:
            print(f'[Export] update_all_metrics failed for customer {c.id}: {e}')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="customer_churn_data.csv"'
    writer = csv.writer(response)

    writer.writerow([
        'customer_id', 'age', 'tenure', 'gender', 'contract_type',
        'monthly_charges', 'total_charges', 'support_calls',
        'usage_frequency', 'complaints', 'satisfaction_score',
        'total_comments', 'latest_comment', 'avg_rating',
        'churn_probability', 'churned',
    ])

    for c in customers:
        try:
            row = _build_feature_row(c)
        except Exception as e:
            print(f'[Export] _build_feature_row failed for customer {c.id}: {e}')
            continue

        comments       = Comment.objects.filter(customer=c.user).order_by('-created_at')
        total_comments = comments.count()
        latest_comment = comments.first().comment_text if total_comments > 0 else ''
        avg_rating     = comments.aggregate(Avg('satisfaction_score'))['satisfaction_score__avg']
        avg_rating     = round(avg_rating, 2) if avg_rating else 0.0

        writer.writerow([
            c.id,
            row['age'],
            row['tenure'],
            'Male' if row['male'] else 'Female',
            c.contract_type,
            row['monthly_charges'],
            row['total_charges'],
            row['support_calls'],
            row['usage_frequency'],
            row['complaints'],
            row['satisfaction_score'],
            total_comments,
            latest_comment,
            avg_rating,
            round(c.churn_probability, 1),
            1 if c.churn_predicted else 0,
        ])

    return response


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOMER ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customer_analytics(request):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can view analytics'}, status=403)

    customers      = Customer.objects.select_related('user').all()
    analytics_data = []

    for c in customers:
        try:
            c.update_all_metrics()
        except Exception as e:
            print(f'[Analytics] update_all_metrics failed for customer {c.id}: {e}')

        try:
            f = c.get_churn_features()
        except Exception:
            f = {}

        stored_prob = float(c.churn_probability or 0)
        verdict     = _build_verdict(stored_prob)

        analytics_data.append({
            'id':                   c.id,
            'customer_name':        c.user.get_full_name(),
            'email':                c.user.email,
            'phone':                c.user.phone,
            'contract_type':        c.contract_type,
            'gender':               c.user.gender,
            'age':                  f.get('age'),
            'tenure':               c.tenure,
            'usage_frequency':      c.usage_frequency,
            'complaints':           c.total_complaints,
            'satisfaction_score':   c.avg_satisfaction_score,
            'churn_predicted':      c.churn_predicted,
            'churn_probability':    stored_prob,
            'confidence':           verdict['confidence'],
            'confidence_label':     verdict['confidence_label'],
            'risk_level':           verdict['risk_level'],
            'last_prediction_date': c.last_prediction_date,
        })

    return Response(analytics_data)


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOMER DETAIL
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customer_detail(request, customer_id):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can view customer details'}, status=403)
    try:
        customer = Customer.objects.get(id=customer_id)
        customer.update_all_metrics()
        from orders.models import Order, Comment
        orders   = Order.objects.filter(customer=customer.user).order_by('-created_at')
        comments = Comment.objects.filter(customer=customer.user).order_by('-created_at')
        try:
            f = customer.get_churn_features()
        except Exception:
            f = {}

        stored_prob = float(customer.churn_probability or 0)
        verdict     = _build_verdict(stored_prob)

        return Response({
            'customer': {
                'id':            customer.id,
                'name':          customer.user.get_full_name(),
                'email':         customer.user.email,
                'phone':         customer.user.phone,
                'address':       customer.user.address,
                'gender':        customer.user.gender,
                'dob':           customer.user.dob,
                'contract_type': customer.contract_type,
                'created_at':    customer.user.created_at,
            },
            'metrics': {
                'age':                f.get('age'),
                'tenure':             customer.tenure,
                'usage_frequency':    customer.usage_frequency,
                'complaints':         customer.total_complaints,
                'satisfaction_score': customer.avg_satisfaction_score,
            },
            'churn_info': {
                'predicted':         customer.churn_predicted,
                'probability':       stored_prob,
                'confidence':        verdict['confidence'],
                'confidence_label':  verdict['confidence_label'],
                'risk_level':        verdict['risk_level'],
                'last_prediction':   customer.last_prediction_date,
            },
            'order_history': [
                {'id': o.id, 'date': o.created_at,
                 'total': float(o.total_amount), 'status': o.status}
                for o in orders
            ],
            'feedback_history': [
                {'date': c.created_at, 'score': c.satisfaction_score,
                 'text': c.comment_text}
                for c in comments
            ],
        })
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=404)


# ─────────────────────────────────────────────────────────────────────────────
# MODEL LOADING
# ─────────────────────────────────────────────────────────────────────────────
def _load_model():
    base        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path  = os.path.join(base, 'trained_models', 'churn_model.pkl')
    scaler_path = os.path.join(base, 'trained_models', 'churn_scaler.pkl')

    if not os.path.exists(model_path):
        print('[ChurnModel] Model not found: %s' % model_path)
        return None, None

    try:
        import joblib  # ← FIXED: use joblib to avoid STACK_GLOBAL pickle errors
        model = joblib.load(model_path)
        if isinstance(model, dict) or not hasattr(model, 'predict_proba'):
            print('[ChurnModel] ERROR: not a classifier. Re-run train_model.py.')
            return None, None
        scaler_data = None
        if os.path.exists(scaler_path):
            raw = joblib.load(scaler_path)
            if isinstance(raw, dict) and 'scaler' in raw:
                scaler_data = raw
        print('[ChurnModel] Model loaded successfully')
        return model, scaler_data
    except Exception as e:
        print('[ChurnModel] Error loading model: %s' % e)
        return None, None


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE BUILDER
# ─────────────────────────────────────────────────────────────────────────────
def _build_feature_row(customer):
    customer.update_all_metrics()

    dob = getattr(customer.user, 'dob', None)
    age = float((timezone.now().date() - dob).days // 365) if dob else 35.0

    tenure             = float(customer.tenure or 0)
    usage_frequency    = float(customer.usage_frequency or 0)
    complaints         = float(customer.total_complaints or 0)
    support_calls      = complaints
    raw_sat            = customer.avg_satisfaction_score or 0.0
    satisfaction_score = float(raw_sat) if raw_sat > 0.0 else 3.0

    monthly_charges, total_charges = _compute_monthly_charges(customer)

    gender = (getattr(customer.user, 'gender', '') or '').strip().lower()
    male   = 1 if gender == 'male' else 0
    mtm, c1yr, c2yr = _encode_contract(customer.contract_type)
    pay_cr = pay_db = pay_upi = fiber = dsl = ts = os_val = 0

    high_charge     = 1 if monthly_charges    >  80 else 0
    high_support    = 1 if support_calls      >= 3  else 0
    low_sat         = 1 if satisfaction_score <= 2  else 0
    high_complaints = 1 if complaints         >= 4  else 0
    low_usage       = 1 if usage_frequency    <  10 else 0

    sat_proxy = ((1 if support_calls < 3 else 0) * 2 + ts +
                 (1 if monthly_charges < 80 else 0) + (1 if tenure > 24 else 0))
    expected_usage     = round(monthly_charges / 120.0 * 30.0, 0)
    adherence          = usage_frequency / (expected_usage + 1)
    risk_score         = mtm*2 + (1-ts) + (1-os_val) + high_support + high_charge
    mtm_premium        = mtm  * monthly_charges
    mtm_no_ts          = mtm  * (1 - ts)
    mtm_burden         = mtm  * high_support
    sup_x_charge       = support_calls      * monthly_charges
    prem_no_ts         = high_charge        * (1 - ts)
    sat_x_charge       = satisfaction_score * monthly_charges
    complaint_x_charge = complaints         * monthly_charges
    charge_per_t       = monthly_charges / (tenure + 1)
    support_per_t      = support_calls   / (tenure + 1)
    loyal    = 1 if tenure > 24 else 0
    v_loyal  = 1 if tenure > 48 else 0
    new_cust = 1 if tenure <= 6 else 0
    tenure_log  = np.log1p(tenure)
    monthly_log = np.log1p(monthly_charges)
    total_log   = np.log1p(total_charges)
    tenure_sq   = tenure ** 2
    monthly_sq  = monthly_charges ** 2

    return {
        'age': age, 'tenure': tenure,
        'monthly_charges': monthly_charges, 'total_charges': total_charges,
        'support_calls': support_calls, 'usage_frequency': usage_frequency,
        'complaints': complaints, 'satisfaction_score': satisfaction_score,
        'male': male, 'mtm': mtm, 'c1yr': c1yr, 'c2yr': c2yr,
        'pay_cr': pay_cr, 'pay_db': pay_db, 'pay_upi': pay_upi,
        'fiber': fiber, 'dsl': dsl, 'ts': ts, 'os': os_val,
        'high_charge': high_charge, 'high_support': high_support,
        'low_sat': low_sat, 'high_complaints': high_complaints, 'low_usage': low_usage,
        'sat_proxy': sat_proxy, 'adherence': adherence, 'risk_score': risk_score,
        'mtm_premium': mtm_premium, 'mtm_no_ts': mtm_no_ts, 'mtm_burden': mtm_burden,
        'sup_x_charge': sup_x_charge, 'prem_no_ts': prem_no_ts,
        'sat_x_charge': sat_x_charge, 'complaint_x_charge': complaint_x_charge,
        'charge_per_t': charge_per_t, 'support_per_t': support_per_t,
        'loyal': loyal, 'v_loyal': v_loyal, 'new_cust': new_cust,
        'tenure_log': tenure_log, 'monthly_log': monthly_log, 'total_log': total_log,
        'tenure_sq': tenure_sq, 'monthly_sq': monthly_sq,
    }


# ─────────────────────────────────────────────────────────────────────────────
# RULE-BASED SCORER
# ─────────────────────────────────────────────────────────────────────────────
def _rule_based_score(customer):
    raw_sat = customer.avg_satisfaction_score or 0.0
    sat     = float(raw_sat) if raw_sat > 0.0 else 3.0
    usage   = float(customer.usage_frequency or 0)
    tenure  = float(customer.tenure or 0)
    ct      = (customer.contract_type or '').strip().lower()
    comps   = float(customer.total_complaints or 0)

    monthly, _ = _compute_monthly_charges(customer)

    score = 15.0

    if ct in ('month-to-month', 'prepaid', 'postpaid', 'monthly'):
        score += 25
    if comps >= 3: score += 20
    if comps >= 4: score += 5
    if sat <= 2:
        score += 15
    elif sat >= 4:
        score -= 25
    if usage < 5:
        score += 10
    elif usage < 10:
        score += 5
    if monthly > 80:
        score += 15
    if tenure > 48:
        score -= 8
    elif tenure > 24:
        score -= 12
    if tenure <= 6:
        score += 8

    score = min(max(score, 0.0), 100.0)

    print(
        '[Churn][rule] %-24s contract=%-15s monthly=$%5.1f '
        'sat=%.1f complaints=%.0f usage=%.1f tenure=%.0f -> %.1f%%' % (
            customer.user.get_full_name(), customer.contract_type,
            monthly, sat, comps, usage, tenure, score,
        )
    )
    return round(score, 1)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PREDICTION FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
def run_churn_prediction(customer, model=None, scaler_data=None):
    rule_prob = _rule_based_score(customer)

    if model is None:
        return _build_verdict(rule_prob)

    try:
        row = _build_feature_row(customer)
        df  = pd.DataFrame([row], columns=FEATURES)

        if scaler_data and isinstance(scaler_data, dict) and 'scaler' in scaler_data:
            sc_cols       = scaler_data.get('scale_cols', SCALE_COLS)
            cols_to_scale = [c for c in sc_cols if c in df.columns]
            df[cols_to_scale] = scaler_data['scaler'].transform(df[cols_to_scale])

        ml_prob = float(model.predict_proba(df)[0][1]) * 100

        if ml_prob > 5.0:
            probability = round(0.60 * ml_prob + 0.40 * rule_prob, 1)
            mode = 'hybrid'
        else:
            probability = rule_prob
            mode = 'rule-only (ML near-zero)'

        print(
            '[Churn] %-24s contract=%-15s ml=%.1f%% rule=%.1f%% '
            'mode=%s -> final=%.1f%%' % (
                customer.user.get_full_name(), customer.contract_type,
                ml_prob, rule_prob, mode, probability,
            )
        )

    except Exception as e:
        print('[Churn] Model failed for customer %d: %s' % (customer.id, e))
        probability = rule_prob

    return _build_verdict(probability)


# ─────────────────────────────────────────────────────────────────────────────
# PREDICTION ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_customer_churn(request):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can run predictions'}, status=403)
    try:
        customers = Customer.objects.all()
        if not customers.exists():
            return Response({'message': 'No customers found',
                             'total_customers': 0, 'timestamp': timezone.now()}, status=200)

        model, scaler_data = _load_model()
        predictions_made   = 0
        results            = []

        for customer in customers:
            try:
                customer.update_all_metrics()
                verdict = run_churn_prediction(customer, model, scaler_data)

                customer.churn_probability    = verdict['churn_probability']
                customer.churn_predicted      = verdict['churn_predicted']
                customer.last_prediction_date = timezone.now()
                customer.save()
                predictions_made += 1

                results.append({
                    'customer_id':       customer.id,
                    'name':              customer.user.get_full_name(),
                    'email':             customer.user.email,
                    'contract_type':     customer.contract_type,
                    'verdict':           verdict['verdict'],
                    'confidence':        verdict['confidence'],
                    'confidence_label':  verdict['confidence_label'],
                    'churn_probability': verdict['churn_probability'],
                    'churn_predicted':   verdict['churn_predicted'],
                    'risk_level':        verdict['risk_level'],
                })
            except Exception as e:
                print('[Churn] Error for customer %d: %s' % (customer.id, e))

        high_risk   = sum(1 for r in results if r['risk_level'] == 'High')
        medium_risk = sum(1 for r in results if r['risk_level'] == 'Medium')
        low_risk    = sum(1 for r in results if r['risk_level'] == 'Low')

        return Response({
            'message':           'Predictions completed for %d customers' % predictions_made,
            'total_customers':   predictions_made,
            'high_risk_count':   high_risk,
            'medium_risk_count': medium_risk,
            'low_risk_count':    low_risk,
            'predictions':       results,
            'timestamp':         timezone.now(),
        }, status=200)

    except Exception as e:
        return Response({'error': 'Prediction failed: %s' % str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_single_customer_churn(request, customer_id):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can run predictions'}, status=403)
    try:
        customer = Customer.objects.get(id=customer_id)
        customer.update_all_metrics()
        model, scaler_data = _load_model()
        verdict            = run_churn_prediction(customer, model, scaler_data)

        customer.churn_probability    = verdict['churn_probability']
        customer.churn_predicted      = verdict['churn_predicted']
        customer.last_prediction_date = timezone.now()
        customer.save()

        return Response({
            'message':           'Prediction completed for %s' % customer.user.get_full_name(),
            'customer_id':       customer.id,
            'verdict':           verdict['verdict'],
            'confidence':        verdict['confidence'],
            'confidence_label':  verdict['confidence_label'],
            'churn_probability': verdict['churn_probability'],
            'churn_predicted':   verdict['churn_predicted'],
            'risk_level':        verdict['risk_level'],
            'timestamp':         timezone.now(),
        }, status=200)

    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=404)
    except Exception as e:
        return Response({'error': 'Prediction failed: %s' % str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# REPORT AND RECOMMENDATIONS
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_churn_report(request):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can view reports'}, status=403)

    customers = Customer.objects.select_related('user').all()

    for customer in customers:
        try:
            customer.update_all_metrics()
        except Exception:
            pass

    total_customers = customers.count()
    if total_customers == 0:
        return Response({'message': 'No customers found'}, status=200)

    high_risk   = sum(1 for c in customers if c.churn_probability >= 60)
    medium_risk = sum(1 for c in customers if 25 <= c.churn_probability < 60)
    low_risk    = sum(1 for c in customers if c.churn_probability < 25)

    avg_tenure       = sum(c.tenure for c in customers) / total_customers
    avg_usage        = sum(c.usage_frequency for c in customers) / total_customers
    avg_satisfaction = sum(c.avg_satisfaction_score for c in customers) / total_customers

    risk_factors = {
        'low_engagement':   sum(1 for c in customers if c.usage_frequency < 2 and c.churn_probability >= 25),
        'low_satisfaction': sum(1 for c in customers if c.avg_satisfaction_score <= 2.5 and c.avg_satisfaction_score > 0 and c.churn_probability >= 25),
        'high_complaints':  sum(1 for c in customers if c.total_complaints >= 3),
        'month_to_month':   sum(1 for c in customers if c.contract_type == 'month-to-month' and c.churn_probability >= 25),
        'new_customers':    sum(1 for c in customers if c.tenure <= 3 and c.churn_probability >= 25),
        'inactive':         sum(1 for c in customers if c.usage_frequency < 1 and c.churn_probability >= 25),
    }

    suggestions = []

    if high_risk > 0:
        suggestions.append({
            'priority': 'High',
            'title': '⚠️ Immediate Retention Actions Needed',
            'description': f'{high_risk} customers are at high risk of churning.',
            'actions': [
                'Send personalized discount offers (15-25% off)',
                'Schedule customer satisfaction follow-up calls',
                'Offer free upgrade or bonus for contract renewal',
                'Investigate and resolve any outstanding issues',
            ]
        })

    if risk_factors['low_engagement'] > 0:
        suggestions.append({
            'priority': 'Medium',
            'title': '📉 Low Engagement Customers',
            'description': f'{risk_factors["low_engagement"]} customers have low engagement levels.',
            'actions': [
                'Launch re-engagement email campaign with special offers',
                'Send personalized product recommendations',
                'Offer loyalty points for next purchase',
                'Create targeted promotions for inactive customers',
            ]
        })

    churn_trend = {
        'next_30_days':    int(high_risk * 0.6 + medium_risk * 0.3),
        'next_90_days':    int(high_risk * 0.8 + medium_risk * 0.5 + low_risk * 0.1),
        'revenue_at_risk': sum(
            c.avg_order_value * c.usage_frequency * 3
            for c in customers if c.churn_probability >= 60
        ) if any(c.churn_probability >= 60 for c in customers) else 0,
    }

    return Response({
        'summary': {
            'total_customers':        total_customers,
            'high_risk_count':        high_risk,
            'medium_risk_count':      medium_risk,
            'low_risk_count':         low_risk,
            'will_churn_count':       sum(1 for c in customers if c.churn_predicted),
            'avg_tenure_months':      round(avg_tenure, 1),
            'avg_usage_frequency':    round(avg_usage, 2),
            'avg_satisfaction_score': round(avg_satisfaction, 1) if avg_satisfaction > 0 else 3.0,
            'churn_rate':             round((high_risk + medium_risk * 0.5) / total_customers * 100, 1),
        },
        'risk_factors': risk_factors,
        'suggestions':  suggestions,
        'churn_trend':  churn_trend,
        'report_date':  timezone.now(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customer_recommendations(request, customer_id):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can view recommendations'}, status=403)

    try:
        customer = Customer.objects.select_related('user').get(id=customer_id)
        customer.update_all_metrics()

        recommendations = []

        if customer.churn_probability >= 60:
            recommendations.append({
                'type': 'Retention',
                'priority': 'Urgent',
                'suggestion': 'High churn risk detected. Immediate action required.',
                'actions': [
                    f'Offer {15 + int(customer.churn_probability / 10)}% discount on next purchase',
                    'Schedule a personal follow-up call',
                    'Investigate any unresolved issues',
                    'Provide premium support for next 30 days',
                ]
            })

        if customer.usage_frequency < 2:
            recommendations.append({
                'type': 'Engagement',
                'priority': 'High',
                'suggestion': 'Customer has low engagement. Need to increase activity.',
                'actions': [
                    'Send personalized product recommendations',
                    'Offer free delivery on next 3 orders',
                    'Create a loyalty rewards program',
                    'Send health tips and medicine reminders',
                ]
            })

        if customer.contract_type == 'month-to-month':
            recommendations.append({
                'type': 'Upsell',
                'priority': 'Medium',
                'suggestion': 'Opportunity to upgrade to long-term contract',
                'actions': [
                    'Offer 10% discount for 1-year commitment',
                    'Highlight benefits of annual plan',
                    'Provide exclusive perks for long-term customers',
                    'Create custom bundle for their needs',
                ]
            })

        if not recommendations:
            recommendations.append({
                'type': 'General',
                'priority': 'Low',
                'suggestion': 'Customer is doing well. Maintain good relationship.',
                'actions': [
                    'Send periodic health tips and newsletters',
                    'Share new arrivals and promotions',
                    'Offer referral bonuses',
                    'Provide birthday discounts',
                ]
            })

        return Response({
            'customer': {
                'id':                customer.id,
                'name':              customer.user.get_full_name(),
                'email':             customer.user.email,
                'churn_probability': customer.churn_probability,
                'risk_level':        'High' if customer.churn_probability >= 60 else 'Medium' if customer.churn_probability >= 25 else 'Low',
            },
            'metrics': {
                'tenure_months':      round(customer.tenure, 1),
                'usage_frequency':    round(customer.usage_frequency, 2),
                'satisfaction_score': round(customer.avg_satisfaction_score, 1) if customer.avg_satisfaction_score > 0 else 'No data',
                'contract_type':      customer.contract_type,
            },
            'recommendations': recommendations,
        })

    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=404)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE CUSTOMER
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_customer(request, customer_id):
    if request.user.user_type != 'seller':
        return Response({'error': 'Only sellers can delete customers'}, status=403)
    try:
        customer = Customer.objects.get(id=customer_id)
        user = customer.user
        customer_name = user.get_full_name()
        customer.delete()
        user.delete()
        return Response(
            {'message': f'Customer "{customer_name}" deleted successfully'},
            status=status.HTTP_200_OK
        )
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Delete failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)