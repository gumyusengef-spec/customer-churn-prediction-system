
/** Churn probability thresholds (percentage, 0–100) */
export const CHURN_THRESHOLD = {
    HIGH:   50,   // >= 50% → High Risk   (model predicts WILL churn)
    MEDIUM: 30,   // >= 30% → Medium Risk (borderline)
                  //  < 30% → Low Risk    (model predicts will NOT churn)
};

/** Fallback probability assigned when no model output is available */
export const CHURN_FALLBACK_PROB = {
    PREDICTED_CHURN:    75,   // customer flagged as will-churn but no probability stored
    PREDICTED_STABLE:   15,   // customer flagged as stable but no probability stored
};

/**
 * Derive risk level metadata from a churn probability (0–100).
 * @param {number|null} p - probability percentage, or null if not yet predicted
 * @returns {{ label: string, cls: string, color: string, bgColor: string }}
 */
export const getRiskLevel = (p) => {
    if (p == null) return {
        label:   'Not Predicted',
        cls:     'ca-risk ca-risk-none',
        color:   '#64748b',
        bgColor: '#f1f5f9',
    };
    if (p >= CHURN_THRESHOLD.HIGH) return {
        label:   'High Risk',
        cls:     'ca-risk ca-risk-high',
        color:   '#b91c1c',
        bgColor: '#fee2e2',
    };
    if (p >= CHURN_THRESHOLD.MEDIUM) return {
        label:   'Medium Risk',
        cls:     'ca-risk ca-risk-medium',
        color:   '#854d0e',
        bgColor: '#fef9c3',
    };
    return {
        label:   'Low Risk',
        cls:     'ca-risk ca-risk-low',
        color:   '#15803d',
        bgColor: '#dcfce7',
    };
};

/**
 * Normalise a churn probability value from the backend to an integer 0–100.
 *
 * Handles:
 *   - null / undefined → null (not yet predicted)
 *   - decimal fractions  (0.0 – 1.0)  → multiplied by 100
 *   - percentages        (1.0 – 100)  → rounded as-is
 *
 * Edge-case fix: the old implementation treated exactly 1.0 as a percentage
 * (returning 1%) instead of a probability (100%).  We now only treat a value
 * as a fraction when it is STRICTLY less than 1, so 1.0 correctly becomes 100.
 *
 * @param {number|string|null|undefined} value
 * @returns {number|null}
 */
export const normalizeChurnProb = (value) => {
    if (value == null) return null;
    const num = Number(value);
    if (!isFinite(num)) return null;
    // Strictly less-than-1 → treat as 0-1 fraction
    return num < 1 ? Math.round(num * 100) : Math.round(num);
};

/**
 * Resolve a customer object's effective churn probability (0–100).
 * Falls back to CHURN_FALLBACK_PROB values when the backend did not return
 * a numeric probability, so callers always get a number (never NaN/null).
 *
 * @param {object} customer
 * @returns {number}
 */
export const resolveChurnProb = (customer) => {
    // Already normalised on a previous pass (_prob set by report fallback)
    if (customer._prob != null) return customer._prob;

    const normalised = normalizeChurnProb(customer.churn_probability);
    if (normalised !== null) return normalised;

    // No probability stored — use flag-based fallback
    if (customer.churn_predicted === true)  return CHURN_FALLBACK_PROB.PREDICTED_CHURN;
    if (customer.churn_predicted === false) return CHURN_FALLBACK_PROB.PREDICTED_STABLE;

    // Completely unknown — treat as low risk
    return CHURN_FALLBACK_PROB.PREDICTED_STABLE;
};

/** Safe number helper — returns fallback when value is non-finite */
export const safeNum = (val, fallback = 0) => {
    const n = Number(val);
    return isFinite(n) ? n : fallback;
};