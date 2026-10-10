# accounts/ml_service.py
"""
Churn prediction service.
Loads the trained XGBoost artefacts once at startup and exposes a single
predict() function used by both bulk and single-customer endpoints.

Falls back to an improved rule-based engine when artefacts are missing.
"""

import os
import pickle
import logging
import numpy as np
from datetime import date
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
ML_DIR = getattr(
    settings,
    'ML_MODELS_DIR',
    os.path.join(settings.BASE_DIR, 'trained_models'),
)

_MODEL_PATH    = os.path.join(ML_DIR, 'best_xgboost_model.pkl')
_SCALER_PATH   = os.path.join(ML_DIR, 'scaler.pkl')
_FEATURES_PATH = os.path.join(ML_DIR, 'feature_names.pkl')

# ── Lazy singletons ───────────────────────────────────────────────────────────
_model         = None
_scaler        = None
_feature_names = None
_ml_available  = None


def _load_artifacts():
    global _model, _scaler, _feature_names, _ml_available
    if _ml_available is True:
        return True
    if _ml_available is False:
        return False
    try:
        with open(_FEATURES_PATH, 'rb') as f:
            _feature_names = pickle.load(f)
        with open(_SCALER_PATH, 'rb') as f:
            _scaler = pickle.load(f)
        with open(_MODEL_PATH, 'rb') as f:
            _model = pickle.load(f)
        logger.info('[ML] Churn artefacts loaded successfully from %s', ML_DIR)
        _ml_available = True
        return True
    except FileNotFoundError as exc:
        logger.warning('[ChurnModel] Model not found: %s — using rule-based fallback.', exc)
        _ml_available = False
        return False
    except Exception as exc:
        logger.error('[ML] Failed to load artefacts: %s', exc)
        _ml_available = False
        return False


# ── Helper queries ────────────────────────────────────────────────────────────

def _age_from_dob(dob) -> int:
    if dob is None:
        return 30
    today = date.today()
    return today.year - dob.year - (
        (today.month, today.day) < (dob.month, dob.day)
    )


def _last_interaction_days(user) -> int:
    """Days since the customer's most recent order (any status)."""
    from orders.models import Order
    from django.utils import timezone

    last = (
        Order.objects
        .filter(customer=user)
        .order_by('-created_at')
        .values_list('created_at', flat=True)
        .first()
    )
    if last is None:
        return 90
    delta = timezone.now() - last
    return max(0, delta.days)


def _total_orders(user) -> int:
    from orders.models import Order
    return Order.objects.filter(customer=user).count()


def _monthly_order_rate(user, tenure_months) -> float:
    """
    Real orders-per-month from the DB.
    This is the ground-truth usage signal — never use stored usage_frequency
    for churn scoring because it may not be updated.
    """
    total  = _total_orders(user)
    months = max(float(tenure_months or 1), 1.0)
    return round(total / months, 2)


def _avg_purchase_value(user) -> float:
    from orders.models import Order
    from django.db.models import Avg
    avg = (
        Order.objects
        .filter(customer=user, status__in=['approved', 'completed'])
        .aggregate(v=Avg('total_amount'))['v']
    )
    return float(avg or 0.0)


def _total_spend(user) -> float:
    from orders.models import Order
    from django.db.models import Sum
    total = (
        Order.objects
        .filter(customer=user, status__in=['approved', 'completed'])
        .aggregate(s=Sum('total_amount'))['s']
    )
    return float(total or 0.0)


# ── Feature builder ───────────────────────────────────────────────────────────

def build_feature_vector(customer_profile) -> dict:
    """Return a dict with all raw feature values for one Customer profile."""
    user   = customer_profile.user
    tenure = max(1, customer_profile.tenure or customer_profile.calculate_tenure())
    ct     = customer_profile.contract_type

    total_sp   = _total_spend(user)
    monthly_sp = round(total_sp / tenure, 4)
    avg_pv     = _avg_purchase_value(user)
    total_pur  = _total_orders(user)

    # FIX: use real DB order rate, not stored usage_frequency
    real_monthly_orders = _monthly_order_rate(user, tenure)
    sessions_per_month  = real_monthly_orders
    avg_session_dur     = min(tenure * 2, 30) if real_monthly_orders > 0 else 5
    pages_per_session   = 3 if real_monthly_orders >= 1 else 1

    satisfaction = customer_profile.avg_satisfaction_score
    if satisfaction is None or satisfaction == 0:
        satisfaction = 3.0

    contract_one_year = 1 if ct == '1-year' else 0
    contract_two_year = 1 if ct == '2-year' else 0
    gender_male       = 1 if user.gender == 'male' else 0

    return {
        'Age':                        _age_from_dob(user.dob),
        'TotalPurchases':             float(total_pur),
        'AveragePurchaseValue':       avg_pv,
        'TotalSpend':                 total_sp,
        'MonthlySpend':               monthly_sp,
        'SessionsPerMonth':           sessions_per_month,
        'AvgSessionDurationMinutes':  avg_session_dur,
        'PagesViewedPerSession':      pages_per_session,
        'SupportTickets':             float(customer_profile.total_complaints or 0),
        'HasPremiumMembership':       1 if ct in ('1-year', '2-year') else 0,
        'LastInteractionDaysAgo':     float(_last_interaction_days(user)),
        'Tenure':                     float(tenure),
        'SatisfactionScore':          float(satisfaction),
        'UsageFrequency':             float(real_monthly_orders),
        'Complaints':                 float(customer_profile.total_complaints or 0),
        'Gender_Male':                float(gender_male),
        'DeviceUsed_Mobile':          0.0,
        'DeviceUsed_Tablet':          0.0,
        'ContractType_One Year':      float(contract_one_year),
        'ContractType_Two Year':      float(contract_two_year),
    }


# ── Confidence label ──────────────────────────────────────────────────────────

def _confidence_label(conf: float) -> str:
    if conf >= 85:
        return 'Very High'
    if conf >= 70:
        return 'High'
    if conf >= 55:
        return 'Moderate'
    if conf >= 40:
        return 'Low'
    return 'Very Low'


# ── Rule-based fallback ───────────────────────────────────────────────────────

def _rule_based_predict(customer_profile) -> dict:
    """
    Transparent scoring fallback when the ML model is unavailable.

    Scoring logic (all signals push toward or away from churn):
      - Contract type  : prepaid/month-to-month = higher risk
      - Satisfaction   : 1→+30 risk, 5→-20 risk
      - Real orders/mo : fetched live from DB (not stored usage_frequency)
      - Complaints     : each complaint raises risk
      - Tenure         : longer = more loyal = lower risk
      - Monthly spend  : higher spend = more invested = lower risk
    """
    ct     = customer_profile.contract_type
    tenure = max(1, customer_profile.tenure or customer_profile.calculate_tenure())
    complaints = customer_profile.total_complaints or 0

    # FIX: always read real order rate from DB, never trust stored usage_frequency
    real_orders_per_month = _monthly_order_rate(customer_profile.user, tenure)

    monthly_sp = _total_spend(customer_profile.user) / tenure

    satisfaction = customer_profile.avg_satisfaction_score
    if satisfaction is None or satisfaction == 0:
        satisfaction = 3.0  # neutral when no reviews

    score = 0.0  # neutral start (will map to ~35% base probability)

    # ── Contract type ─────────────────────────────────────────────────────────
    contract_scores = {
        'month-to-month': +25,
        'prepaid':        +10,  # some risk but less than month-to-month
        'postpaid':        +5,
        '1-year':           0,
        '2-year':         -15,
    }
    score += contract_scores.get(ct, 0)

    # ── Satisfaction (strongest single signal) ────────────────────────────────
    # 1→+30, 2→+15, 3→0, 4→-15, 5→-30
    score += (3.0 - satisfaction) * 15

    # ── Real orders/month (live from DB) ──────────────────────────────────────
    # High activity = strong retention; zero orders = high churn risk
    if real_orders_per_month >= 5:
        score -= 25   # very active → very low risk
    elif real_orders_per_month >= 3:
        score -= 15
    elif real_orders_per_month >= 1:
        score -= 8
    elif real_orders_per_month >= 0.5:
        score += 5
    else:
        score += 20   # no orders at all → high risk

    # ── Complaints ────────────────────────────────────────────────────────────
    if complaints >= 3:
        score += 20
    elif complaints >= 1:
        score += 10

    # ── Tenure ───────────────────────────────────────────────────────────────
    if tenure >= 24:
        score -= 10
    elif tenure >= 12:
        score -= 5
    elif tenure <= 2:
        score += 5

    # ── Monthly spend ─────────────────────────────────────────────────────────
    if monthly_sp >= 100:
        score -= 8
    elif monthly_sp >= 50:
        score -= 4

    # ── Score → probability ───────────────────────────────────────────────────
    # score=0 → 35% base; each point ≈ 0.6%
    prob      = round(max(5.0, min(95.0, 35 + score * 0.6)), 1)
    predicted = prob >= 50.0
    confidence = round(min(abs(prob - 50) + 50, 95.0), 1)

    logger.info(
        '[Churn][rule] %-24s contract=%-15s orders/mo=%.1f sat=%.1f '
        'complaints=%d tenure=%d -> %.1f%%',
        customer_profile.user.get_full_name() or customer_profile.user.username,
        ct, real_orders_per_month, satisfaction, complaints, tenure, prob,
    )

    return {
        'churn_probability': prob,
        'churn_predicted':   predicted,
        'confidence':        confidence,
        'confidence_label':  _confidence_label(confidence),
    }


# ── Public API ────────────────────────────────────────────────────────────────

def predict(customer_profile) -> dict:
    """
    Run churn prediction for a single Customer profile instance.

    Returns:
        {
            'churn_probability': float  (0-100, 1 decimal place),
            'churn_predicted':   bool,
            'confidence':        float  (0-100, 1 decimal place),
            'confidence_label':  str,
        }
    """
    if not _load_artifacts():
        return _rule_based_predict(customer_profile)

    raw    = build_feature_vector(customer_profile)
    age_val  = raw['Age']
    to_scale = np.array(
        [[raw[f] for f in _feature_names if f != 'Age']],
        dtype=float,
    )
    scaled      = _scaler.transform(to_scale)[0]
    feature_vec = np.concatenate([[age_val], scaled]).reshape(1, -1)

    proba      = float(_model.predict_proba(feature_vec)[0][1])
    pct        = round(proba * 100, 1)
    predicted  = pct >= 50.0
    confidence = round(max(proba, 1.0 - proba) * 100, 1)

    return {
        'churn_probability': pct,
        'churn_predicted':   predicted,
        'confidence':        confidence,
        'confidence_label':  _confidence_label(confidence),
    }


def predict_bulk(customer_profiles) -> list:
    """
    Run predictions for a list of Customer profile instances.
    Returns results in the same order as the input list.
    """
    _load_artifacts()
    return [predict(cp) for cp in customer_profiles]