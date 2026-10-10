// src/pages/seller/Customers.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip,
    TextField,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton,
    Tooltip,
    TablePagination,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Search as SearchIcon,
    Psychology as PredictIcon,
    Assessment as ReportIcon,
    DeleteOutline as DeleteIcon,
    ShoppingCart as OrdersIcon,
    Close as CloseIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { customerAPI } from '../../services/api';
import { getRiskLevel, normalizeChurnProb } from '../../constants/churnConstants';

/* ─── Satisfaction chip class ────────────────────────────────────── */
const getSatClass = (score) => {
    if (score === null || score === undefined) return 'ca-chip-sat-mid';
    if (score >= 4) return 'ca-chip-sat-high';
    if (score >= 3) return 'ca-chip-sat-mid';
    return 'ca-chip-sat-low';
};

/* ─── CSS ────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  :root {
    --ca-bg:        #f0f4ff;
    --ca-surface:   #ffffff;
    --ca-border:    #e2e8f8;
    --ca-primary:   #3b5bdb;
    --ca-primary-h: #2f4ac4;
    --ca-success:   #12b76a;
    --ca-warning:   #f79009;
    --ca-danger:    #f04438;
    --ca-text:      #1a2340;
    --ca-muted:     #64748b;
    --ca-radius:    14px;
    --ca-shadow:    0 4px 24px rgba(59,91,219,.08);
  }

  .ca-wrap * { font-family: 'DM Sans', sans-serif !important; }

  .ca-blue-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    border-radius: 0px;
    padding: 20px 28px;
    margin-bottom: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
  }
  .ca-header-title h1 { font-size: 1.4rem; font-weight: 700; color: white; margin: 0 0 4px 0; }
  .ca-header-title p  { font-size: 0.8rem; color: rgba(255,255,255,0.85); margin: 0; }
  .ca-header-buttons  { display: flex; gap: 12px; flex-wrap: wrap; }

  .ca-btn-header {
    background: rgba(255,255,255,0.15) !important;
    backdrop-filter: blur(10px);
    color: white !important;
    border-radius: 10px !important; font-weight: 600 !important;
    text-transform: none !important; padding: 8px 22px !important;
    transition: all 0.2s ease !important;
    border: 1px solid rgba(255,255,255,0.2) !important;
  }
  .ca-btn-header:hover {
    background: rgba(255,255,255,0.25) !important;
    transform: translateY(-1px) !important;
    border-color: rgba(255,255,255,0.4) !important;
  }
  .ca-btn-header-primary {
    background: white !important; color: #2563eb !important;
    border-radius: 10px !important; font-weight: 700 !important;
    text-transform: none !important; padding: 8px 24px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    transition: all 0.2s ease !important;
  }
  .ca-btn-header-primary:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
  }

  .ca-search .MuiOutlinedInput-root {
    border-radius: 12px !important;
    background: var(--ca-surface) !important;
    box-shadow: var(--ca-shadow) !important;
  }

  .ca-table-wrap {
    border-radius: var(--ca-radius) !important;
    border: 1.5px solid var(--ca-border) !important;
    box-shadow: var(--ca-shadow) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .ca-table-scroll { overflow-x: auto; overflow-y: auto; max-height: 700px; flex: 1; }

  .ca-table-head th {
    position: sticky !important; top: 0 !important; z-index: 2 !important;
    background: #f8faff !important; color: #000000 !important;
    font-size: .72rem !important; font-weight: 700 !important;
    text-transform: uppercase !important;
    border-bottom: 1.5px solid var(--ca-border) !important;
    padding: 13px 16px !important; white-space: nowrap !important;
    box-shadow: 0 1px 0 var(--ca-border) !important;
  }

  /* Main data row */
  .ca-table-row td {
    padding: 12px 16px !important;
    border-bottom: none !important;
    font-size: .88rem !important; color: var(--ca-text) !important;
    transition: background 0.15s ease !important;
    vertical-align: top !important;
  }
  .ca-table-row:hover td { background: #f8faff !important; }
  .ca-table-row.deleting td {
    background: #fff5f5 !important; opacity: 0.55 !important; pointer-events: none !important;
  }

  /* Prediction inline panel — sits inside the same row group */
  .ca-inline-predict-row td {
    padding: 0 16px 14px 16px !important;
    border-bottom: 1.5px solid var(--ca-border) !important;
    background: #f8faff !important;
  }
  .ca-inline-predict-row:hover td { background: #f8faff !important; }

  /* Separator between row groups */
  .ca-table-row td { border-top: 1.5px solid var(--ca-border) !important; }
  .ca-table-row:first-of-type td { border-top: none !important; }

  .ca-inline-predict-inner {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    padding: 12px 4px 4px 4px;
    align-items: flex-start;
  }
  .ca-reveal-block-label {
    font-size: .65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .07em;
    color: var(--ca-muted); margin-bottom: 4px;
  }

  .ca-anon-id {
    font-weight: 600 !important;
    color: var(--ca-text) !important;
    font-size: .88rem !important;
  }

  .ca-chip-contract {
    background: #eef2ff !important; color: var(--ca-primary) !important;
    font-weight: 600 !important; border-radius: 6px !important; height: 22px !important;
  }
  .ca-chip-sat-high { background: #dcfce7 !important; color: #15803d !important; }
  .ca-chip-sat-mid  { background: #fef9c3 !important; color: #854d0e !important; }
  .ca-chip-sat-low  { background: #fee2e2 !important; color: #b91c1c !important; }
  .ca-chip-sat-none { background: #f1f5f9 !important; color: #64748b !important; }

  .ca-orders-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #eff6ff; color: #1d4ed8;
    border-radius: 8px; padding: 4px 10px;
    font-size: .78rem; font-weight: 700;
    border: 1px solid #bfdbfe; white-space: nowrap;
  }
  .ca-orders-badge.high { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
  .ca-orders-badge.low  { background: #fef9c3; color: #854d0e; border-color: #fde68a; }
  .ca-orders-badge.none { background: #f8fafc; color: #94a3b8; border-color: #e2e8f0; }

  .ca-risk {
    display: inline-flex !important; align-items: center !important;
    gap: 5px !important; padding: 3px 10px !important;
    border-radius: 20px !important; font-size: .76rem !important; font-weight: 700 !important;
  }
  .ca-risk-high   { background: #fee2e2 !important; color: #b91c1c !important; }
  .ca-risk-medium { background: #fef9c3 !important; color: #854d0e !important; }
  .ca-risk-low    { background: #dcfce7 !important; color: #15803d !important; }
  .ca-risk-none   { background: #f1f5f9 !important; color: #64748b !important; }
  .ca-risk-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

  .ca-verdict-churn   { font-weight: 700; font-size: .84rem; color: #f04438; }
  .ca-verdict-nochurn { font-weight: 700; font-size: .84rem; color: #12b76a; }
  .ca-verdict-conf    { font-size: .75rem; color: var(--ca-muted); margin-top: 2px; }

  .ca-btn-delete {
    color: #ef4444 !important; border-radius: 8px !important;
    padding: 5px !important; width: 32px !important; height: 32px !important;
    transition: all 0.15s ease !important;
    border: 1px solid #fecaca !important; background: #fff5f5 !important;
  }
  .ca-btn-delete:hover {
    background: #fee2e2 !important; border-color: #fca5a5 !important;
    transform: scale(1.08) !important;
  }
  .ca-btn-delete:disabled { opacity: 0.4 !important; pointer-events: none !important; }

  .ca-predict-banner {
    background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: 10px; padding: 10px 16px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 12px;
    font-size: .85rem; color: #1d4ed8;
  }
  .ca-predict-banner-label { font-weight: 600; white-space: nowrap; }
  .ca-predict-banner-bar   { flex: 1; height: 6px; background: #bfdbfe; border-radius: 3px; overflow: hidden; }
  .ca-predict-banner-fill  { height: 100%; background: #2563eb; border-radius: 3px; }
  .ca-predict-banner-pct   { font-weight: 700; white-space: nowrap; min-width: 44px; text-align: right; }

  .ca-progress { background: #e0e7ff !important; border-radius: 4px !important; margin-bottom: 20px !important; }
  .ca-progress .MuiLinearProgress-bar { background: var(--ca-primary) !important; }
  .ca-empty       { color: var(--ca-muted) !important; padding: 40px !important; text-align: center !important; }
  .ca-empty-initial { color: var(--ca-muted) !important; padding: 40px !important; text-align: center !important; font-style: italic; }
  .ca-error-banner {
    background: #fff1f1; border: 1px solid #fecaca; border-radius: 10px;
    padding: 10px 16px; margin-bottom: 16px; font-size: .85rem; color: #b91c1c;
    display: flex; align-items: center; gap: 8px;
  }

  .ca-no-predict-note {
    font-size: .78rem; color: var(--ca-muted); font-style: italic;
  }

  .ca-table-scroll::-webkit-scrollbar        { width: 6px; height: 6px; }
  .ca-table-scroll::-webkit-scrollbar-track  { background: #f1f1f1; }
  .ca-table-scroll::-webkit-scrollbar-thumb  { background: #c1c1c1; border-radius: 3px; }
  .ca-table-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }

  @keyframes fadeInRow { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .ca-table-row { animation: fadeInRow 0.18s ease both; }
`;

(function injectStyles() {
    const id = 'ca-customers-styles';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id; tag.textContent = CSS;
    document.head.appendChild(tag);
})();

/* ─── Satisfaction Chip ──────────────────────────────────────────── */
const SatisfactionChip = ({ score }) => {
    if (score === null || score === undefined) {
        return <Chip label="No rating" className="ca-chip-sat-none" size="small" />;
    }
    return (
        <Chip
            label={`${score}/5`}
            className={getSatClass(score)}
            size="small"
        />
    );
};

/* ─── Orders Badge ───────────────────────────────────────────────── */
const OrdersBadge = ({ count }) => {
    const n   = Number(count) || 0;
    const cls = n >= 5 ? 'ca-orders-badge high' : n >= 1 ? 'ca-orders-badge' : 'ca-orders-badge none';
    const label = n === 0 ? 'No orders' : `${n} / mo`;
    return (
        <span className={cls}>
            <OrdersIcon style={{ fontSize: 13 }} />
            {label}
        </span>
    );
};

/* ─── Predict Progress Banner ────────────────────────────────────── */
const PredictProgressBanner = ({ count }) => (
    <div className="ca-predict-banner">
        <PredictIcon style={{ fontSize: 17, flexShrink: 0 }} />
        <span className="ca-predict-banner-label">
            Running predictions for {count} customer{count !== 1 ? 's' : ''}…
        </span>
        <div className="ca-predict-banner-bar">
            <div className="ca-predict-banner-fill" style={{
                width: '40%',
                animation: 'predictPulse 1.4s ease-in-out infinite',
            }} />
        </div>
        <span className="ca-predict-banner-pct" style={{ color: '#2563eb' }}>…</span>
        <style>{`
          @keyframes predictPulse {
            0%   { margin-left: 0;   width: 30%; }
            50%  { margin-left: 35%; width: 35%; }
            100% { margin-left: 70%; width: 30%; }
          }
        `}</style>
    </div>
);

/* ─── Inline Prediction Panel ────────────────────────────────────── */
// Always visible — no toggle needed
const InlinePredictPanel = ({ customer }) => {
    const churnProb  = normalizeChurnProb(customer.churn_probability);
    const confidence = customer.confidence ?? null;
    const confLabel  = customer.confidence_label ?? '—';
    const isChurn    = customer.churn_predicted ?? null;
    const orders     = customer.monthly_orders ?? 0;
    const risk       = getRiskLevel(churnProb);

    const reco = isChurn === null
        ? 'Run "Predict All" to generate a churn recommendation for this customer.'
        : isChurn
            ? 'Schedule a retention call within 48 hours. Consider offering a discount or contract upgrade.'
            : 'Customer is stable. Maintain regular engagement and offer loyalty incentives.';

    return (
        <div className="ca-inline-predict-inner">
            {/* Churn Risk */}
            <div className="ca-reveal-block">
                <div className="ca-reveal-block-label">Churn Risk</div>
                <span className={`ca-risk ${risk.cls}`}>
                    <span className="ca-risk-dot" style={{
                        background: risk.cls.includes('high') ? '#b91c1c'
                            : risk.cls.includes('medium') ? '#854d0e'
                            : risk.cls.includes('low') ? '#15803d' : '#94a3b8'
                    }} />
                    {churnProb !== null ? `${churnProb}%` : 'N/A'} — {risk.label}
                </span>
            </div>

            {/* Prediction verdict */}
            <div className="ca-reveal-block">
                <div className="ca-reveal-block-label">Prediction</div>
                {isChurn === null ? (
                    <div className="ca-no-predict-note">No prediction yet — click Predict All</div>
                ) : (
                    <div className={isChurn ? 'ca-verdict-churn' : 'ca-verdict-nochurn'}>
                        {isChurn ? '⚠ Will Churn' : '✓ Will Not Churn'}
                    </div>
                )}
                <div className="ca-verdict-conf">
                    {confidence !== null ? `${confidence}% confidence (${confLabel})` : '—'}
                </div>
            </div>

            {/* Orders */}
            <div className="ca-reveal-block">
                <div className="ca-reveal-block-label">Orders / Month</div>
                <OrdersBadge count={orders} />
                <div style={{ fontSize: '.72rem', color: 'var(--ca-muted)', marginTop: 4 }}>
                    {orders >= 5 ? 'Highly active buyer' : orders >= 1 ? 'Moderate activity' : 'No recent orders'}
                </div>
            </div>

            {/* Recommendation */}
            <div className="ca-reveal-block" style={{ flexBasis: '260px' }}>
                <div className="ca-reveal-block-label">Recommendation</div>
                <div style={{ fontSize: '.8rem', color: 'var(--ca-muted)', lineHeight: 1.5 }}>
                    {reco}
                </div>
            </div>
        </div>
    );
};

/* ─── Delete Confirm Dialog ──────────────────────────────────────── */
const DeleteDialog = ({ open, customer, onConfirm, onCancel, isDeleting }) => (
    <Dialog
        open={open}
        onClose={isDeleting ? undefined : onCancel}
        PaperProps={{ sx: { borderRadius: '16px', maxWidth: 420, width: '100%', p: 1 } }}
    >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: '#fff1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WarningIcon sx={{ fontSize: 20, color: '#ef4444' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#1a2340', fontSize: '1rem' }}>
                Delete Customer
            </Typography>
            {!isDeleting && (
                <IconButton onClick={onCancel} size="small" sx={{ ml: 'auto', color: '#94a3b8' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            )}
        </DialogTitle>
        <DialogContent sx={{ pt: '4px !important' }}>
            <DialogContentText sx={{ fontSize: '.88rem', color: '#64748b', lineHeight: 1.65 }}>
                Are you sure you want to permanently delete{' '}
                <strong style={{ color: '#1a2340' }}>Customer #{customer?.id}</strong>?
                <br /><br />
                This will remove all their data — orders, churn predictions, and history.{' '}
                <strong style={{ color: '#ef4444' }}>This cannot be undone.</strong>
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={onCancel} disabled={isDeleting}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b', borderRadius: 2 }}>
                Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isDeleting} variant="contained"
                startIcon={<DeleteIcon />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#ef4444',
                    '&:hover': { bgcolor: '#dc2626' },
                    '&.Mui-disabled': { bgcolor: '#fca5a5', color: 'white' } }}>
                {isDeleting ? 'Deleting…' : 'Yes, Delete'}
            </Button>
        </DialogActions>
    </Dialog>
);

/* ─── Customer Row ───────────────────────────────────────────────── */
const CustomerRow = ({ customer, index, onDeleteClick, isDeleting }) => {
    return (
        <>
            {/* Main data row */}
            <TableRow className={`ca-table-row${isDeleting ? ' deleting' : ''}`}>
                {/* Anonymous sequential number only */}
                <TableCell>
                    <div className="ca-anon-id">Customer #{index}</div>
                </TableCell>

                <TableCell>
                    <Chip label={customer.contract_type} className="ca-chip-contract" size="small" />
                </TableCell>

                <TableCell>
                    <strong>{customer.tenure}</strong>
                    <span style={{ fontSize: '.75rem', color: 'var(--ca-muted)', marginLeft: 2 }}>mo</span>
                </TableCell>

                <TableCell>
                    <SatisfactionChip score={customer.satisfaction_score} />
                </TableCell>

                <TableCell>
                    <OrdersBadge count={customer.monthly_orders ?? 0} />
                </TableCell>

                <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'nowrap' }}>
                        <Tooltip title="Delete customer" placement="top" arrow>
                            <span>
                                <IconButton size="small" className="ca-btn-delete"
                                    onClick={() => onDeleteClick(customer)}
                                    disabled={isDeleting}
                                    aria-label={`Delete Customer #${index}`}>
                                    <DeleteIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </TableCell>
            </TableRow>

            {/* Prediction panel — always visible, no toggle */}
            <TableRow className="ca-inline-predict-row">
                <TableCell colSpan={6}>
                    <InlinePredictPanel customer={customer} />
                </TableCell>
            </TableRow>
        </>
    );
};

/* ─── Main Component ─────────────────────────────────────────────── */
const Customers = () => {
    const navigate = useNavigate();

    const [customers, setCustomers]       = useState([]);
    const [searchTerm, setSearchTerm]     = useState('');
    const [loading, setLoading]           = useState(false);
    const [hasLoaded, setHasLoaded]       = useState(false);
    const [error, setError]               = useState(null);
    const [isPredicting, setIsPredicting] = useState(false);

    const [page, setPage]               = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [deleteTarget, setDeleteTarget]         = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId]             = useState(null);

    const loadCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await customerAPI.getAnalytics();
            setCustomers(response.data);
            setHasLoaded(true);
        } catch (err) {
            const msg = 'Failed to load customers. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    const handleExportCSV = async () => {
        try {
            const response = await customerAPI.exportCSV();
            const url  = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'customer_data.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('CSV exported successfully');
        } catch {
            toast.error('Failed to export CSV');
        }
    };

    const handlePredictAll = async () => {
        setIsPredicting(true);
        setLoading(true);
        try {
            const response = await customerAPI.predictChurn();
            const data  = response?.data ?? {};
            const count = data.updated ?? data.predicted_count ?? customers.length;
            toast.success(`Predictions updated — ${count} customer${count !== 1 ? 's' : ''} processed`);
            await loadCustomers();
        } catch {
            toast.error('Failed to run predictions. Please try again.');
        } finally {
            setIsPredicting(false);
            setLoading(false);
        }
    };

    const handleDeleteClick = useCallback((customer) => {
        setDeleteTarget(customer);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteCancel = useCallback(() => {
        if (deletingId) return;
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
    }, [deletingId]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        const { id } = deleteTarget;
        setDeletingId(id);
        setDeleteDialogOpen(false);
        try {
            await customerAPI.deleteCustomer(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
            toast.success(`Customer #${id} deleted successfully`);
            setDeleteTarget(null);
        } catch {
            toast.error(`Failed to delete Customer #${id}. Please try again.`);
        } finally {
            setDeletingId(null);
        }
    };

    // Search by contract type or tenure only (no name/email exposed)
    const filteredCustomers = useMemo(() =>
        customers.filter(c =>
            c.contract_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(c.tenure).includes(searchTerm)
        ), [customers, searchTerm]);

    const paginatedCustomers = useMemo(() =>
        filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredCustomers, page, rowsPerPage]);

    const handleChangePage        = useCallback((_, p) => setPage(p), []);
    const handleChangeRowsPerPage = useCallback((e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }, []);
    const handleSearchChange      = useCallback((e) => { setSearchTerm(e.target.value); setPage(0); }, []);

    return (
        <DashboardLayout title="Customer Analytics">
            <div className="ca-wrap">
                <div className="ca-blue-header">
                    <div className="ca-header-title">
                        <h1>Customer Churn Analytics</h1>
                        <p>{customers.length} customers · Track, predict and manage churn</p>
                    </div>
                    <div className="ca-header-buttons">
                        <Button className="ca-btn-header" startIcon={<DownloadIcon />}
                            onClick={handleExportCSV} disabled={isPredicting}>
                            Export CSV
                        </Button>
                        <Button className="ca-btn-header" startIcon={<PredictIcon />}
                            onClick={handlePredictAll} disabled={loading || isPredicting}>
                            {isPredicting ? 'Predicting…' : 'Predict All'}
                        </Button>
                        <Button className="ca-btn-header-primary" startIcon={<ReportIcon />}
                            onClick={() => navigate('/seller/churn-report')} disabled={isPredicting}>
                            View Report
                        </Button>
                    </div>
                </div>

                {loading && !isPredicting && <LinearProgress className="ca-progress" />}
                {isPredicting && <PredictProgressBanner count={customers.length} />}

                {error && (
                    <div className="ca-error-banner">
                        <WarningIcon style={{ fontSize: 16 }} />
                        {error}
                        <Button size="small" onClick={loadCustomers}
                            sx={{ ml: 'auto', textTransform: 'none', fontWeight: 600, color: '#b91c1c', fontSize: '.78rem' }}>
                            Retry
                        </Button>
                    </div>
                )}

                <TextField fullWidth className="ca-search"
                    placeholder="Search by contract type or tenure…"
                    value={searchTerm} onChange={handleSearchChange}
                    sx={{ mb: 3 }}
                    InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'var(--ca-muted)' }} /> }}
                />

                <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#2563eb', fontWeight: 600, fontSize: '.72rem', letterSpacing: '.07em' }}>
                    CUSTOMER DETAILS — {filteredCustomers.length} shown
                </Typography>

                <TableContainer component={Paper} className="ca-table-wrap" elevation={0}>
                    <div className="ca-table-scroll">
                        <Table>
                            <TableHead className="ca-table-head">
                                <TableRow>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Contract</TableCell>
                                    <TableCell>Tenure</TableCell>
                                    <TableCell>Satisfaction</TableCell>
                                    <TableCell>Orders / Month</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedCustomers.map((customer, index) => (
                                    <CustomerRow
                                        key={customer.id ?? index}
                                        customer={customer}
                                        index={page * rowsPerPage + index + 1}
                                        onDeleteClick={handleDeleteClick}
                                        isDeleting={deletingId === customer.id}
                                    />
                                ))}
                                {filteredCustomers.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className={error ? 'ca-empty-initial' : 'ca-empty'}>
                                            {error ? 'Could not load customers — see error above.'
                                                : hasLoaded ? 'No customers found'
                                                : 'Loading customers…'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <TablePagination
                        component="div"
                        count={filteredCustomers.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        sx={{
                            borderTop: '1.5px solid #e2e8f8', fontSize: '.8rem',
                            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '.8rem' },
                        }}
                    />
                </TableContainer>

                <DeleteDialog
                    open={deleteDialogOpen}
                    customer={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    isDeleting={deletingId !== null}
                />
            </div>
        </DashboardLayout>
    );
};

export default Customers;