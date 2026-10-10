import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Grid,
    Card,
    CardContent,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    LinearProgress,
    Rating,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Person as PersonIcon,
    TrendingUp as TrendingUpIcon,
    ShoppingCart as OrderIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { customerAPI } from '../../services/api';

/* ─── CSS ────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  .cd-wrap * { font-family: 'DM Sans', sans-serif !important; }

  .cd-blue-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    border-radius: 0px;
    padding: 20px 28px;
    margin-bottom: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 20px rgba(37,99,235,0.3);
  }
  .cd-blue-header h1 { font-size:1.4rem; font-weight:700; color:white; margin:0 0 4px 0; }
  .cd-blue-header p  { font-size:0.8rem; color:rgba(255,255,255,0.85); margin:0; }

  .cd-btn-back {
    background: white !important; color: #2563eb !important;
    border-radius: 10px !important; font-weight: 700 !important;
    text-transform: none !important; padding: 8px 20px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    transition: all 0.2s ease !important;
  }
  .cd-btn-back:hover { transform: translateY(-1px) !important; box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important; }

  .cd-card {
    border-radius: 14px !important;
    border: 1.5px solid #e2e8f8 !important;
    box-shadow: 0 4px 24px rgba(59,91,219,.07) !important;
  }
  .cd-card-title {
    font-size: .72rem !important; font-weight: 700 !important;
    text-transform: uppercase !important; letter-spacing: .07em !important;
    color: #64748b !important; margin-bottom: 16px !important;
    display: flex; align-items: center; gap: 8px;
  }
  .cd-metric-label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#64748b; margin-bottom:2px; }
  .cd-metric-value { font-size:1.05rem; font-weight:700; color:#1a2340; }

  .cd-risk-high   { background:#fee2e2; color:#b91c1c; border-color:#fca5a5; }
  .cd-risk-medium { background:#fef9c3; color:#854d0e; border-color:#fde68a; }
  .cd-risk-low    { background:#dcfce7; color:#15803d; border-color:#86efac; }

  .cd-prob-number { font-size:3rem; font-weight:800; line-height:1; }
  .cd-prob-high   { color:#ef4444; }
  .cd-prob-medium { color:#f59e0b; }
  .cd-prob-low    { color:#22c55e; }

  .cd-order-chip-pending   { background:#fef9c3 !important; color:#854d0e !important; }
  .cd-order-chip-approved  { background:#dbeafe !important; color:#1d4ed8 !important; }
  .cd-order-chip-completed { background:#dcfce7 !important; color:#15803d !important; }
  .cd-order-chip-cancelled { background:#fee2e2 !important; color:#b91c1c !important; }

  .cd-table th {
    background:#f8faff !important; font-size:.7rem !important;
    font-weight:700 !important; text-transform:uppercase !important;
    letter-spacing:.06em !important; color:#64748b !important;
    border-bottom:1.5px solid #e2e8f8 !important;
  }
  .cd-table td { font-size:.85rem !important; color:#1a2340 !important; border-bottom:1px solid #f1f5fd !important; }

  .cd-feedback-box {
    background:#f8faff; border:1px solid #e2e8f8;
    border-radius:10px; padding:12px 16px; margin-bottom:12px;
  }
  .cd-info-row { display:flex; gap:8px; margin-bottom:8px; font-size:.85rem; }
  .cd-info-label { font-weight:700; color:#64748b; min-width:100px; flex-shrink:0; }
  .cd-info-value { color:#1a2340; }
`;

(function injectStyles() {
    const id = 'cd-detail-styles';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id; tag.textContent = CSS;
    document.head.appendChild(tag);
})();

/* ─── Helpers ────────────────────────────────────────────────────── */
const getRisk = (prob) => {
    if (prob >= 70) return { label: 'High Risk',   cls: 'cd-risk-high',   probCls: 'cd-prob-high' };
    if (prob >= 40) return { label: 'Medium Risk', cls: 'cd-risk-medium', probCls: 'cd-prob-medium' };
    return             { label: 'Low Risk',    cls: 'cd-risk-low',    probCls: 'cd-prob-low' };
};

const orderChipCls = (status) => ({
    pending:   'cd-order-chip-pending',
    approved:  'cd-order-chip-approved',
    completed: 'cd-order-chip-completed',
    cancelled: 'cd-order-chip-cancelled',
}[status] || '');

const fmt = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const fmtMoney = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

/* ─── Component ──────────────────────────────────────────────────── */
const CustomerDetail = () => {
    const { customerId } = useParams();
    const navigate       = useNavigate();
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await customerAPI.getDetail(customerId);
            setData(res.data);
        } catch {
            toast.error('Failed to load customer details');
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <DashboardLayout title="Customer Details">
            <LinearProgress sx={{ borderRadius: 2 }} />
        </DashboardLayout>
    );

    if (!data) return (
        <DashboardLayout title="Customer Details">
            <Typography color="text.secondary">Customer not found.</Typography>
        </DashboardLayout>
    );

    /*
     * The CustomerDetailSerializer returns a FLAT structure:
     *   data.id, data.customer_name, data.email, data.phone ...
     *   data.tenure, data.usage_frequency, data.total_complaints,
     *   data.avg_satisfaction_score,
     *   data.churn_probability, data.churn_predicted, data.confidence,
     *   data.last_prediction_date,
     *   data.monthly_orders, data.recent_orders,
     *   data.feedback_history   ← now included from the backend
     */
    const prob           = data.churn_probability  ?? 0;
    const sat            = data.avg_satisfaction_score ?? null;
    const risk           = getRisk(prob);
    const recentOrders   = data.recent_orders    ?? [];
    const feedbackList   = data.feedback_history ?? [];   // ← now populated by the API

    return (
        <DashboardLayout title="Customer Details">
            <div className="cd-wrap">

                {/* ── Header ── */}
                <div className="cd-blue-header">
                    <div>
                        <h1>Customer Details</h1>
                        <p>{data.customer_name} · {data.contract_type}</p>
                    </div>
                    <Button
                        className="cd-btn-back"
                        startIcon={<BackIcon />}
                        onClick={() => navigate('/seller/customers')}
                    >
                        Back to Customers
                    </Button>
                </div>

                <Grid container spacing={3}>

                    {/* ── Customer Info ── */}
                    <Grid item xs={12} md={4}>
                        <Card className="cd-card">
                            <CardContent>
                                <div className="cd-card-title">
                                    <PersonIcon sx={{ fontSize: 16 }} /> Customer Info
                                </div>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                                    <Box sx={{
                                        width: 52, height: 52, borderRadius: '50%',
                                        bgcolor: '#eff6ff', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', mr: 2, flexShrink: 0,
                                    }}>
                                        <PersonIcon sx={{ color: '#2563eb', fontSize: 28 }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: '#1a2340', fontSize: '1rem' }}>
                                            {data.customer_name}
                                        </Typography>
                                        <Typography sx={{ fontSize: '.8rem', color: '#64748b' }}>
                                            {data.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                {[
                                    ['Phone',        data.phone      || '—'],
                                    ['Address',      data.address    || '—'],
                                    ['Gender',       data.gender     || '—'],
                                    ['DOB',          fmt(data.dob)],
                                    ['Contract',     data.contract_type],
                                    ['Member since', fmt(data.joined_date)],
                                ].map(([label, value]) => (
                                    <div className="cd-info-row" key={label}>
                                        <span className="cd-info-label">{label}</span>
                                        <span className="cd-info-value">{value}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ── Metrics ── */}
                    <Grid item xs={12} md={4}>
                        <Card className="cd-card">
                            <CardContent>
                                <div className="cd-card-title">
                                    <TrendingUpIcon sx={{ fontSize: 16 }} /> Customer Metrics
                                </div>

                                {[
                                    ['Tenure',         `${data.tenure ?? 0} months`],
                                    ['Orders / Month', `${data.monthly_orders ?? data.usage_frequency ?? 0} / mo`],
                                    ['Complaints',     data.total_complaints ?? 0],
                                ].map(([label, value]) => (
                                    <Box sx={{ mb: 2 }} key={label}>
                                        <div className="cd-metric-label">{label}</div>
                                        <div className="cd-metric-value">{value}</div>
                                    </Box>
                                ))}

                                <Box sx={{ mb: 2 }}>
                                    <div className="cd-metric-label">Satisfaction</div>
                                    {sat !== null ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Rating value={sat} readOnly precision={0.1} size="small" />
                                            <span className="cd-metric-value">{sat}/5</span>
                                        </Box>
                                    ) : (
                                        <div className="cd-metric-value" style={{ color: '#94a3b8' }}>No rating yet</div>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ── Churn Prediction ── */}
                    <Grid item xs={12} md={4}>
                        <Card className="cd-card">
                            <CardContent>
                                <div className="cd-card-title">Churn Prediction</div>

                                <Box sx={{ textAlign: 'center', my: 2 }}>
                                    <div className={`cd-prob-number ${risk.probCls}`}>{prob}%</div>
                                    <Box sx={{ mt: 1 }}>
                                        <span style={{
                                            display: 'inline-block', padding: '4px 14px',
                                            borderRadius: 20, fontWeight: 700, fontSize: '.8rem',
                                            border: '1.5px solid',
                                        }} className={risk.cls}>
                                            {risk.label}
                                        </span>
                                    </Box>
                                    <Typography sx={{ mt: 1.5, fontSize: '.8rem', color: '#64748b' }}>
                                        {data.confidence}% confidence ({data.confidence_label})
                                    </Typography>
                                </Box>

                                {data.last_prediction_date && (
                                    <Typography sx={{ fontSize: '.75rem', color: '#94a3b8', textAlign: 'center' }}>
                                        Last predicted: {fmt(data.last_prediction_date)}
                                    </Typography>
                                )}

                                {prob >= 70 && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff5f5', borderRadius: 2, border: '1px solid #fecaca' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '.8rem', color: '#b91c1c', mb: 1 }}>
                                            ⚠ Action Recommended
                                        </Typography>
                                        <Typography sx={{ fontSize: '.78rem', color: '#7f1d1d', lineHeight: 1.8 }}>
                                            • Offer special discount<br />
                                            • Schedule retention call<br />
                                            • Resolve satisfaction issues
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ── Recent Orders ── */}
                    <Grid item xs={12} md={6}>
                        <Card className="cd-card">
                            <CardContent>
                                <div className="cd-card-title">
                                    <OrderIcon sx={{ fontSize: 16 }} /> Recent Orders
                                </div>
                                <TableContainer>
                                    <Table size="small" className="cd-table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order ID</TableCell>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Total</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {recentOrders.length > 0 ? recentOrders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell>#{order.id}</TableCell>
                                                    <TableCell>{fmt(order.created_at)}</TableCell>
                                                    <TableCell>{fmtMoney(order.total_amount)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.status}
                                                            size="small"
                                                            className={orderChipCls(order.status)}
                                                            sx={{ fontWeight: 600, fontSize: '.72rem', height: 22, borderRadius: '6px' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ color: '#94a3b8', py: 3 }}>
                                                        No orders yet
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* ── Feedback History ── */}
                    <Grid item xs={12} md={6}>
                        <Card className="cd-card">
                            <CardContent>
                                <div className="cd-card-title">Feedback History</div>

                                {feedbackList.length > 0 ? feedbackList.map((fb) => (
                                    /*
                                     * KEY: use fb.id (stable DB primary key) instead of
                                     * array index so React reconciles correctly.
                                     *
                                     * FIELDS from the serializer:
                                     *   fb.score      → satisfaction_score (number 1-5)
                                     *   fb.text       → comment_text (string)
                                     *   fb.created_at → ISO datetime string
                                     *   fb.order      → order_id (number or null)
                                     */
                                    <div className="cd-feedback-box" key={fb.id}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Rating value={fb.score} readOnly size="small" precision={0.5} />
                                                <Typography sx={{ fontSize: '.78rem', fontWeight: 600, color: '#475569' }}>
                                                    {fb.score}/5
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '.75rem', color: '#94a3b8' }}>
                                                {fmt(fb.created_at)}
                                            </Typography>
                                        </Box>

                                        {fb.order && (
                                            <Typography sx={{ fontSize: '.72rem', color: '#94a3b8', mb: 0.5 }}>
                                                Order #{fb.order}
                                            </Typography>
                                        )}

                                        <Typography sx={{ fontSize: '.83rem', color: '#475569' }}>
                                            {fb.text || '—'}
                                        </Typography>
                                    </div>
                                )) : (
                                    <Typography sx={{ color: '#94a3b8', fontSize: '.85rem' }}>
                                        No feedback yet
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>
            </div>
        </DashboardLayout>
    );
};

export default CustomerDetail;