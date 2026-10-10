// src/pages/seller/ChurnReport.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Grid, Card, CardContent,
    Button, LinearProgress, Chip, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    People as PeopleIcon,
    CalendarToday as CalendarIcon,
    Speed as SpeedIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Star as StarIcon,
    Assessment as AssessmentIcon,
    ShoppingCart as OrdersIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { customerAPI } from '../../services/api';

import {
    CHURN_THRESHOLD,
    getRiskLevel,
    resolveChurnProb,
    safeNum,
} from '../../constants/churnConstants';

/* ─── Simple Donut Chart ─────────────────────────────────────────── */
const SimpleDonutChart = ({ high, medium, low }) => {
    const total = high + medium + low;
    const CIRC  = 251.2;
    const highArc   = total > 0 ? (high   / total) * CIRC : 0;
    const mediumArc = total > 0 ? (medium / total) * CIRC : 0;
    const lowArc    = total > 0 ? (low    / total) * CIRC : 0;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative', width: 160, height: 160 }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f8" strokeWidth="15" />
                    {highArc > 0 && (
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e53935" strokeWidth="15"
                            strokeDasharray={`${highArc} ${CIRC}`} strokeDashoffset="0"
                            transform="rotate(-90 50 50)" />
                    )}
                    {mediumArc > 0 && (
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#fb8c00" strokeWidth="15"
                            strokeDasharray={`${mediumArc} ${CIRC}`} strokeDashoffset={`-${highArc}`}
                            transform="rotate(-90 50 50)" />
                    )}
                    {lowArc > 0 && (
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#43a047" strokeWidth="15"
                            strokeDasharray={`${lowArc} ${CIRC}`} strokeDashoffset={`-${highArc + mediumArc}`}
                            transform="rotate(-90 50 50)" />
                    )}
                    <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1a2340">{total}</text>
                    <text x="50" y="70" textAnchor="middle" fontSize="8" fill="#64748b">Customers</text>
                </svg>
            </Box>
            <Box>
                {[
                    { color: '#e53935', label: 'High Risk',   count: high   },
                    { color: '#fb8c00', label: 'Medium Risk', count: medium },
                    { color: '#43a047', label: 'Low Risk',    count: low    },
                ].map(({ color, label, count }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: color, borderRadius: 2 }} />
                        <Typography sx={{ fontSize: '.75rem' }}>
                            {label}: <strong>{count}</strong>
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

/* ─── Vertical Bar Chart ─────────────────────────────────────────── */
const SimpleBarChart = ({ data, labels, colors }) => {
    const maxValue = Math.max(...data, 1);
    return (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 1, height: 180, px: 1 }}>
            {labels.map((label, idx) => (
                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: '.72rem', fontWeight: 700, color: colors?.[idx] || '#3b5bdb', mb: 0.5 }}>{data[idx]}</Typography>
                    <Box sx={{ width: '100%', bgcolor: '#f0f4ff', borderRadius: '6px 6px 0 0', height: '100%', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                        <Box sx={{
                            width: '100%',
                            height: `${(data[idx] / maxValue) * 100}%`,
                            bgcolor: colors?.[idx] || '#3b5bdb',
                            borderRadius: '6px 6px 0 0',
                            minHeight: data[idx] > 0 ? 4 : 0,
                            transition: 'height 0.4s ease',
                        }} />
                    </Box>
                    <Typography sx={{ fontSize: '.65rem', fontWeight: 500, color: '#64748b', mt: 0.8, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {label.replace(' ', '\n')}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

/* ─── KPI Card ───────────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon, color, trendLabel, trend }) => (
    <Card sx={{ borderRadius: 3, border: '1.5px solid #e2e8f8', boxShadow: '0 2px 12px rgba(59,91,219,.07)', overflow: 'visible', position: 'relative' }}>
        <Box sx={{ width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bgcolor: color, borderRadius: '4px 0 0 4px' }} />
        <CardContent sx={{ pl: 3, pb: '14px !important' }}>
            <Typography sx={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#64748b', mb: 0.5 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon && React.cloneElement(icon, { sx: { fontSize: 22, color } })}
                <Typography sx={{ fontSize: '1.9rem', fontWeight: 700, color, letterSpacing: '-.03em', lineHeight: 1 }}>{value}</Typography>
            </Box>
            {trendLabel && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.5 }}>
                    {trend === 'up'
                        ? <ArrowUpIcon   sx={{ fontSize: 13, color: '#e53935' }} />
                        : <ArrowDownIcon sx={{ fontSize: 13, color: '#43a047' }} />}
                    <Typography sx={{ fontSize: '.72rem', color: '#64748b' }}>{trendLabel}</Typography>
                </Box>
            )}
        </CardContent>
    </Card>
);

/* ─── Risk Badge ─────────────────────────────────────────────────── */
const RiskBadge = ({ prob }) => {
    const { label, color, bgColor } = getRiskLevel(prob);
    return (
        <Chip
            label={prob != null ? `${prob}% ${label}` : label}
            size="small"
            sx={{ bgcolor: bgColor, color, fontWeight: 700, fontSize: '.72rem' }}
        />
    );
};

/* ─── Section Label ──────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <Typography sx={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#667eea', mb: 1.5, mt: 0.5 }}>
        {children}
    </Typography>
);

/* ─── Estimated Badge ────────────────────────────────────────────── */
const EstimatedBadge = () => (
    <Chip label="est." size="small"
        sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 700, fontSize: '.62rem', height: 16, ml: 0.5 }} />
);

/* ─── Orders Badge (inline for the report table) ─────────────────── */
const OrdersBadge = ({ count }) => {
    const n = Number(count) || 0;
    const bg    = n >= 5 ? '#f0fdf4' : n >= 1 ? '#eff6ff' : '#f8fafc';
    const color = n >= 5 ? '#15803d' : n >= 1 ? '#1d4ed8' : '#94a3b8';
    const border= n >= 5 ? '#bbf7d0' : n >= 1 ? '#bfdbfe' : '#e2e8f0';
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            bgcolor: bg, color, border: `1px solid ${border}`,
            borderRadius: '8px', px: '8px', py: '3px',
            fontSize: '.78rem', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
            <OrdersIcon sx={{ fontSize: 13 }} />
            {n === 0 ? 'No orders' : `${n} / mo`}
        </Box>
    );
};

/* ─── Helper: resolve monthly orders from any known field name ──── */
const resolveMonthlyOrders = (c) => {
    const val =
        c.monthly_orders ??
        c.orders_per_month ??
        c.avg_monthly_orders ??
        c.order_count ??
        null;
    return val !== null ? safeNum(val) : null;
};

/* ─── Compute risk factors from the customer list ────────────────── */
const computeRiskFactors = (customers = []) => ({
    low_engagement:   customers.filter(c => safeNum(c.usage_frequency) < 2   && resolveChurnProb(c) >= CHURN_THRESHOLD.MEDIUM).length,
    low_satisfaction: customers.filter(c => safeNum(c.satisfaction_score ?? c.avg_satisfaction ?? c.satisfaction) <= 2.5 && resolveChurnProb(c) >= CHURN_THRESHOLD.MEDIUM).length,
    new_customers:    customers.filter(c => safeNum(c.tenure) <= 3 && resolveChurnProb(c) >= CHURN_THRESHOLD.MEDIUM).length,
    inactive:         customers.filter(c => safeNum(c.usage_frequency) < 1   && resolveChurnProb(c) >= CHURN_THRESHOLD.MEDIUM).length,
});

/* ─── Compute overview stats from the full analytics list ─────────── */
const computeOverviewStats = (customers = []) => {
    const total = customers.length;
    if (total === 0) return { avgTenure: 0, avgUsage: 0, avgSat: null };

    const avgTenure = Math.round(
        customers.reduce((s, c) => s + safeNum(c.tenure), 0) / total
    );

    const withOrders = customers.filter(c => resolveMonthlyOrders(c) !== null);
    const avgUsage = withOrders.length > 0
        ? (withOrders.reduce((s, c) => s + resolveMonthlyOrders(c), 0) / withOrders.length).toFixed(1)
        : (0).toFixed(1);

    const validSat = customers.filter(c => {
        const v = c.satisfaction_score ?? c.avg_satisfaction ?? c.satisfaction;
        return v != null && isFinite(Number(v));
    });
    const avgSat = validSat.length > 0
        ? (validSat.reduce((s, c) => {
            const v = c.satisfaction_score ?? c.avg_satisfaction ?? c.satisfaction;
            return s + Number(v);
          }, 0) / validSat.length).toFixed(1)
        : null;

    return { avgTenure, avgUsage, avgSat };
};

/* ─── Main Component ─────────────────────────────────────────────── */
const ChurnReport = () => {
    const navigate = useNavigate();
    const [report, setReport]             = useState(null);
    const [loading, setLoading]           = useState(true);
    const [imputedCount, setImputedCount] = useState(0);

    const loadReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await customerAPI.getChurnReport();
            const d = response.data;

            const topAtRisk = Array.isArray(d.top_at_risk) ? d.top_at_risk : [];

            let allCustomers = topAtRisk;
            try {
                const analyticsRes = await customerAPI.getAnalytics();
                allCustomers = Array.isArray(analyticsRes.data) ? analyticsRes.data : topAtRisk;
            } catch {
                // If analytics fails just use top_at_risk for stats
            }

            const overview    = computeOverviewStats(allCustomers);
            const riskFactors = computeRiskFactors(allCustomers);

            const imputed = allCustomers.filter(c =>
                c.churn_probability == null || !isFinite(Number(c.churn_probability))
            ).length;
            setImputedCount(imputed);

            setReport({
                summary: {
                    total_customers:        safeNum(d.total_customers),
                    high_risk_count:        safeNum(d.high_risk),
                    medium_risk_count:      safeNum(d.medium_risk),
                    low_risk_count:         safeNum(d.low_risk),
                    will_churn_count:       safeNum(d.predicted_churn),
                    churn_rate:             safeNum(d.churn_rate_pct),
                    avg_churn_probability:  safeNum(d.avg_churn_probability),
                    avg_tenure_months:      overview.avgTenure,
                    avg_usage_frequency:    overview.avgUsage,
                    avg_satisfaction_score: overview.avgSat,
                },
                risk_factors:  riskFactors,
                top_at_risk:   topAtRisk,
                all_customers: allCustomers,
                by_contract:   d.by_contract || {},
                report_date:   new Date().toISOString(),
            });

        } catch (primaryErr) {
            console.warn('getChurnReport failed, using analytics fallback:', primaryErr);

            try {
                const analyticsRes = await customerAPI.getAnalytics();
                const data = Array.isArray(analyticsRes.data) ? analyticsRes.data : [];

                const total = data.length;

                let imputed = 0;
                const resolved = data.map(c => {
                    const hasReal = c.churn_probability != null && isFinite(Number(c.churn_probability));
                    if (!hasReal) imputed++;
                    return { ...c, _prob: resolveChurnProb(c), _isImputed: !hasReal };
                });
                setImputedCount(imputed);

                const highRisk   = resolved.filter(c => c._prob >= CHURN_THRESHOLD.HIGH).length;
                const mediumRisk = resolved.filter(c => c._prob >= CHURN_THRESHOLD.MEDIUM && c._prob < CHURN_THRESHOLD.HIGH).length;
                const lowRisk    = resolved.filter(c => c._prob < CHURN_THRESHOLD.MEDIUM).length;
                const willChurn  = resolved.filter(c => c.churn_predicted).length;
                const avgProb    = Math.round(resolved.reduce((s, c) => s + c._prob, 0) / (total || 1));

                const overview    = computeOverviewStats(data);
                const riskFactors = computeRiskFactors(resolved);

                const topAtRisk = [...resolved]
                    .sort((a, b) => b._prob - a._prob)
                    .slice(0, 10);

                setReport({
                    summary: {
                        total_customers:        total,
                        high_risk_count:        highRisk,
                        medium_risk_count:      mediumRisk,
                        low_risk_count:         lowRisk,
                        will_churn_count:       willChurn,
                        churn_rate:             total > 0 ? Math.round((willChurn / total) * 100) : 0,
                        avg_churn_probability:  avgProb,
                        avg_tenure_months:      overview.avgTenure,
                        avg_usage_frequency:    overview.avgUsage,
                        avg_satisfaction_score: overview.avgSat,
                    },
                    risk_factors:  riskFactors,
                    top_at_risk:   topAtRisk,
                    all_customers: resolved,
                    by_contract:   {},
                    report_date:   new Date().toISOString(),
                });
            } catch (err) {
                console.error('Fallback also failed:', err);
                toast.error('Failed to load report');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadReport(); }, [loadReport]);

    /* ── Loading state ─────────────────────────────────────────────── */
    if (loading) {
        return (
            <DashboardLayout title="Churn Analysis Report">
                <Box sx={{ p: 3 }}>
                    <LinearProgress sx={{ borderRadius: 2 }} />
                    <Typography sx={{ mt: 2, textAlign: 'center', color: '#64748b' }}>Loading report…</Typography>
                </Box>
            </DashboardLayout>
        );
    }

    if (!report) {
        return (
            <DashboardLayout title="Churn Analysis Report">
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="error">Failed to load report. Please try again.</Typography>
                    <Button onClick={loadReport} sx={{ mt: 2 }} variant="contained">Retry</Button>
                </Box>
            </DashboardLayout>
        );
    }

    /* ── Derived display values ────────────────────────────────────── */
    const { summary, risk_factors } = report;

    const avgChurnProb = safeNum(summary.avg_churn_probability, 0);
    const churnRate    = safeNum(summary.churn_rate, 0);
    const totalC       = safeNum(summary.total_customers, 1);

    const riskPct = {
        high:   Math.round((safeNum(summary.high_risk_count)   / totalC) * 100),
        medium: Math.round((safeNum(summary.medium_risk_count) / totalC) * 100),
        low:    Math.round((safeNum(summary.low_risk_count)    / totalC) * 100),
    };

    const topChurners = (report.top_at_risk || []).slice(0, 8);

    const avgSatDisplay = summary.avg_satisfaction_score != null
        ? `${Number(summary.avg_satisfaction_score).toFixed(1)}/5`
        : 'N/A';

    const avgTenureDisplay = summary.avg_tenure_months != null && !isNaN(summary.avg_tenure_months)
        ? `${summary.avg_tenure_months} mo`
        : 'N/A';

    const avgOrdersDisplay = summary.avg_usage_frequency != null
        ? `${summary.avg_usage_frequency}`
        : 'N/A';

    /* ── Render ────────────────────────────────────────────────────── */
    return (
        <DashboardLayout title="Churn Analysis Report">
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, position: 'relative' }}>

                {/* ── STICKY HEADER ── */}
                <Box sx={{
                    position: 'sticky', top: 0, zIndex: 1200,
                    background: 'linear-gradient(135deg, #667eea 0%, #4c6ef5 100%)',
                    boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
                }}>
                    <Box sx={{ px: { xs: 2.5, md: 3.5 }, py: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                    <AssessmentIcon sx={{ color: 'white', fontSize: 28 }} />
                                    <Typography sx={{ fontSize: { xs: '1.3rem', md: '1.7rem' }, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                                        Churn Risk Analysis Report
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <CalendarIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                                        <Typography sx={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.8)' }}>
                                            Generated {new Date(report.report_date).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Chip label="Live Data" size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '.68rem', height: 22 }} />
                                </Box>
                            </Box>
                            <Button variant="contained" startIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/seller/customers')}
                                sx={{
                                    borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.15)',
                                    color: 'white', fontWeight: 500, textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'translateY(-1px)' },
                                }}>
                                Back
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* ── SCROLLABLE CONTENT ── */}
                <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#f6f8ff', p: { xs: 2, md: 3 } }}>

                    {/* Imputed probability banner */}
                    {imputedCount > 0 && (
                        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon sx={{ fontSize: 16, color: '#b45309', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '.78rem', color: '#92400e' }}>
                                <strong>{imputedCount} customer{imputedCount !== 1 ? 's' : ''}</strong> have not been through the prediction model yet.
                                Their churn probabilities are estimated (shown with an <strong>"est."</strong> badge).
                                Run <strong>Predict All</strong> from the Customers page for accurate results.
                            </Typography>
                        </Box>
                    )}

                    {/* ── KPI CARDS ── */}
                    <SectionLabel>Key Performance Indicators</SectionLabel>
                    <Grid container spacing={2} sx={{ mb: 3.5 }}>
                        {[
                            { label: 'Total Customers',  value: summary.total_customers,   icon: <PeopleIcon />,       color: '#3b5bdb' },
                            { label: 'Will Churn',        value: summary.will_churn_count,  icon: <WarningIcon />,      color: '#e53935', trend: 'up',   trendLabel: `${churnRate}% churn rate` },
                            { label: 'High Risk',         value: summary.high_risk_count,   icon: <TrendingDownIcon />, color: '#e53935', trendLabel: `${riskPct.high}% of base` },
                            { label: 'Medium Risk',       value: summary.medium_risk_count, icon: <TrendingDownIcon />, color: '#fb8c00', trendLabel: `${riskPct.medium}% of base` },
                            { label: 'Low Risk',          value: summary.low_risk_count,    icon: <TrendingUpIcon />,   color: '#43a047', trend: 'down', trendLabel: `${riskPct.low}% of base` },
                            { label: 'Avg. Churn Prob.',  value: `${avgChurnProb}%`,        icon: <SpeedIcon />,        color: '#fb8c00' },
                        ].map(k => (
                            <Grid item xs={6} sm={4} md={2} key={k.label}>
                                <KpiCard {...k} />
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── RISK DISTRIBUTION + RISK FACTOR ANALYSIS ── */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1.5px solid #e2e8f8', boxShadow: '0 2px 12px rgba(59,91,219,.06)', height: '100%' }}>
                                <SectionLabel>Risk Distribution</SectionLabel>
                                <SimpleDonutChart
                                    high={summary.high_risk_count}
                                    medium={summary.medium_risk_count}
                                    low={summary.low_risk_count}
                                />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1.5px solid #e2e8f8', boxShadow: '0 2px 12px rgba(59,91,219,.06)', height: '100%' }}>
                                <SectionLabel>Risk Factor Analysis</SectionLabel>
                                <SimpleBarChart
                                    data={[
                                        risk_factors.low_engagement,
                                        risk_factors.low_satisfaction,
                                        risk_factors.new_customers,
                                        risk_factors.inactive,
                                    ]}
                                    labels={['Low Engagement', 'Low Satisfaction', 'New Customers', 'Inactive']}
                                    colors={['#fb8c00', '#e53935', '#fb8c00', '#e53935']}
                                />
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* ── CUSTOMER OVERVIEW ── */}
                    <SectionLabel>Customer Overview</SectionLabel>
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1.5px solid #e2e8f8', boxShadow: '0 2px 12px rgba(59,91,219,.06)', mb: 3 }}>
                        <Grid container spacing={2}>
                            {[
                                { label: 'Avg. Tenure',        value: avgTenureDisplay,      color: '#3b5bdb', bg: '#eef2ff' },
                                { label: 'Avg. Orders / mo',   value: avgOrdersDisplay,      color: '#0891b2', bg: '#ecfeff' },
                                { label: 'Avg. Satisfaction',  value: avgSatDisplay,         color: '#15803d', bg: '#f0fdf4' },
                                { label: 'Inactive Customers', value: risk_factors.inactive, color: '#b91c1c', bg: '#fff1f1' },
                                { label: 'Churn Rate',         value: `${churnRate}%`,       color: '#e53935', bg: '#fff5f5' },
                                { label: 'Avg. Churn Prob.',   value: `${avgChurnProb}%`,    color: '#fb8c00', bg: '#fffbeb' },
                            ].map(s => (
                                <Grid item xs={6} sm={3} md={3} key={s.label}>
                                    <Box sx={{ bgcolor: s.bg, borderRadius: 2, p: 1.8 }}>
                                        <Typography sx={{ fontSize: '.64rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '.06em', mb: 0.4 }}>
                                            {s.label}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, lineHeight: 1.3 }}>
                                            {s.value}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* ── AT-RISK CUSTOMER TABLE ── */}
                    {topChurners.length > 0 && (
                        <>
                            <SectionLabel>At-Risk Customer Details</SectionLabel>
                            <Paper sx={{ borderRadius: 3, border: '1.5px solid #e2e8f8', boxShadow: '0 2px 12px rgba(59,91,219,.06)', mb: 3, overflow: 'hidden' }}>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8faff' }}>
                                                {/* "Customer" column header kept, name/email removed from rows */}
                                                {['Customer', 'Contract', 'Tenure', 'Satisfaction', 'Orders / mo', 'Churn Risk', 'Prediction', 'Confidence'].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1.5px solid #e2e8f8', py: 1.5 }}>
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {topChurners.map((c, i) => {
                                                const satVal    = c.satisfaction_score ?? c.avg_satisfaction ?? c.satisfaction;
                                                const prob      = resolveChurnProb(c);
                                                const isImputed = c._isImputed || (c.churn_probability == null);
                                                const orders    = resolveMonthlyOrders(c);
                                                // Sequential 1-based display number (report shows top 8)
                                                const displayNum = i + 1;
                                                return (
                                                    <TableRow key={c.id || i} sx={{ '&:hover': { bgcolor: '#f8faff' }, '&:last-child td': { borderBottom: 'none' } }}>

                                                        {/* ── Anonymous customer label — name & email hidden ── */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd' }}>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '.85rem', color: '#1a2340' }}>
                                                                Customer #{displayNum}
                                                            </Typography>
                                                        </TableCell>

                                                        {/* Contract */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd' }}>
                                                            <Chip label={c.contract_type || '—'} size="small" sx={{ bgcolor: '#eef2ff', color: '#3b5bdb', fontWeight: 600, fontSize: '.72rem' }} />
                                                        </TableCell>

                                                        {/* Tenure */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd', fontWeight: 600, fontSize: '.85rem' }}>
                                                            {c.tenure != null ? `${c.tenure}mo` : 'N/A'}
                                                        </TableCell>

                                                        {/* Satisfaction */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <StarIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
                                                                <Typography sx={{ fontSize: '.85rem', fontWeight: 600 }}>
                                                                    {satVal != null ? `${Number(satVal).toFixed(1)}/5` : 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Orders / mo */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd' }}>
                                                            {orders !== null
                                                                ? <OrdersBadge count={orders} />
                                                                : <Typography sx={{ fontSize: '.82rem', color: '#94a3b8' }}>—</Typography>
                                                            }
                                                        </TableCell>

                                                        {/* Churn Risk */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <RiskBadge prob={prob} />
                                                                {isImputed && <EstimatedBadge />}
                                                            </Box>
                                                        </TableCell>

                                                        {/* Prediction */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd' }}>
                                                            {c.churn_predicted
                                                                ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><CancelIcon sx={{ fontSize: 15, color: '#e53935' }} /><Typography sx={{ fontSize: '.82rem', fontWeight: 700, color: '#e53935' }}>Will Churn</Typography></Box>
                                                                : <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><CheckCircleIcon sx={{ fontSize: 15, color: '#43a047' }} /><Typography sx={{ fontSize: '.82rem', fontWeight: 700, color: '#43a047' }}>Stable</Typography></Box>
                                                            }
                                                        </TableCell>

                                                        {/* Confidence */}
                                                        <TableCell sx={{ py: 1.2, borderBottom: '1px solid #f1f5fd', fontSize: '.82rem', color: '#64748b', fontWeight: 600 }}>
                                                            {c.confidence ? `${c.confidence}%` : '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </>
                    )}

                    {/* ── FOOTER ── */}
                    <Box sx={{ mt: 3.5, pt: 2, borderTop: '1.5px solid #e2e8f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography sx={{ fontSize: '.72rem', color: '#94a3b8' }}>
                            Customer Churn Analytics Report · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                        <Chip
                            label={`${summary.total_customers ?? 0} customers analysed`}
                            size="small"
                            sx={{ bgcolor: '#eef2ff', color: '#3b5bdb', fontWeight: 600, fontSize: '.68rem' }}
                        />
                    </Box>
                </Box>
            </Box>
        </DashboardLayout>
    );
};

export default ChurnReport;