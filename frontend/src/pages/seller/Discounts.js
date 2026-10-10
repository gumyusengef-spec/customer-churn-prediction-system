import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { discountAPI } from '../../services/api';

const tableCSS = `
  .disc-table-wrap {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,.07);
    overflow: hidden;
    border: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
  }

  /* ↕ scrollable body */
  .disc-table-scroll {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 520px;
    flex: 1;
  }

  .disc-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    font-size: .875rem;
  }
  .disc-table thead tr {
    background: #f8f9fa;
  }
  /* Sticky header stays visible while scrolling */
  .disc-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f8f9fa;
    padding: 12px 16px;
    font-size: .78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .5px;
    color: #0d6efd;
    border-bottom: 2px solid #dee2e6;
    white-space: nowrap;
    text-align: left;
    box-shadow: 0 1px 0 #dee2e6;
  }
  .disc-table tbody tr {
    border-bottom: 1px solid #f0f0f0;
    transition: background .12s;
  }
  .disc-table tbody tr:last-child { border-bottom: none; }
  .disc-table tbody tr:hover { background: #f8f9fa; }
  .disc-table td {
    padding: 13px 16px;
    vertical-align: middle;
    color: #343a40;
    font-size: .875rem;
  }

  .disc-id      { font-family: 'Courier New', monospace; font-size: .82rem; font-weight: 600; color: #1a6b4a; }
  .disc-cust    { font-weight: 600; color: #212529; }
  .disc-pct     { font-family: 'Courier New', monospace; font-weight: 700; color: #0d6efd; font-size: .9rem; }
  .disc-reason  { color: #6c757d; font-size: .82rem; max-width: 220px; }

  .status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 11px; border-radius: 20px;
    font-size: .72rem; font-weight: 700; letter-spacing: .2px;
  }
  .status-badge::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  }
  .badge-pending  { background: #fff3cd; color: #664d03; } .badge-pending::before  { background: #ffc107; }
  .badge-approved { background: #d1e7dd; color: #0f5132; } .badge-approved::before { background: #198754; }
  .badge-rejected { background: #f8d7da; color: #842029; } .badge-rejected::before { background: #dc3545; }

  .approved-tag {
    display: inline-block; padding: 2px 9px; border-radius: 6px;
    background: #d1e7dd; color: #0f5132;
    font-size: .75rem; font-weight: 600; font-family: 'Courier New', monospace;
  }

  .btn-review {
    padding: 5px 14px; border-radius: 7px;
    border: 1.5px solid #0d6efd; color: #0d6efd;
    background: transparent; font-size: .8rem; font-weight: 500;
    cursor: pointer; transition: all .15s;
    font-family: inherit;
  }
  .btn-review:hover { background: #0d6efd; color: #fff; }

  .btn-del {
    padding: 5px 14px; border-radius: 7px;
    border: 1.5px solid #dc3545; color: #dc3545;
    background: transparent; font-size: .8rem; font-weight: 500;
    cursor: pointer; transition: all .15s;
    font-family: inherit;
  }
  .btn-del:hover { background: #dc3545; color: #fff; }

  .action-group { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }

  .tbl-empty {
    text-align: center; padding: 52px 24px;
    color: #adb5bd; font-size: .9rem;
  }

  /* Footer pinned outside the scroll area */
  .tbl-footer {
    padding: 10px 16px; border-top: 1px solid #dee2e6;
    font-size: .78rem; color: #6c757d; background: #f8f9fa;
    flex-shrink: 0;
  }

  /* ── Blue header banner ── */
  .disc-header {
    background: #0d6efd;
    border-radius: 12px;
    padding: 20px 28px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(13,110,253,0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  .disc-header h1 {
    font-size: 1.6rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -.3px;
  }
  .disc-chips { display: flex; gap: 10px; flex-wrap: wrap; }
  .disc-chip {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 10px;
    background: rgba(255,255,255,0.18);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3);
  }
  .disc-chip-label {
    font-size: .75rem; font-weight: 600;
    color: rgba(255,255,255,0.85);
    text-transform: uppercase; letter-spacing: .4px;
  }
  .disc-chip-value {
    font-size: 1.1rem; font-weight: 800; color: #ffffff;
    font-family: 'Courier New', monospace; min-width: 20px; text-align: center;
  }
  .disc-chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-pending  { background: #ffc107; }
  .dot-approved { background: #4ade80; }
  .dot-rejected { background: #f87171; }

  /* Thin scrollbar */
  .disc-table-scroll::-webkit-scrollbar        { width: 6px; height: 6px; }
  .disc-table-scroll::-webkit-scrollbar-track  { background: #f1f1f1; }
  .disc-table-scroll::-webkit-scrollbar-thumb  { background: #c1c1c1; border-radius: 3px; }
  .disc-table-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
`;

const statusClass = s => ({ pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[s] || 'badge-pending');
const statusLabel = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const Discounts = () => {
    const [discountRequests, setDiscountRequests] = useState([]);
    const [selectedRequest, setSelectedRequest]   = useState(null);
    const [dialogOpen, setDialogOpen]             = useState(false);
    const [approvedDiscount, setApprovedDiscount] = useState('');

    useEffect(() => { loadDiscountRequests(); }, []);

    const loadDiscountRequests = async () => {
        try {
            const response = await discountAPI.getAll();
            setDiscountRequests(response.data.results || response.data);
        } catch { toast.error('Failed to load discount requests'); }
    };

    const handleOpenDialog = (request) => {
        setSelectedRequest(request);
        setApprovedDiscount(request.requested_discount.toString());
        setDialogOpen(true);
    };

    const handleApprove = async () => {
        try {
            await discountAPI.respond(selectedRequest.id, {
                status: 'approved',
                approved_discount: parseFloat(approvedDiscount)
            });
            toast.success('Discount approved');
            loadDiscountRequests();
            setDialogOpen(false);
        } catch { toast.error('Failed to approve discount'); }
    };

    const handleReject = async () => {
        try {
            await discountAPI.respond(selectedRequest.id, { status: 'rejected' });
            toast.success('Discount rejected');
            loadDiscountRequests();
            setDialogOpen(false);
        } catch { toast.error('Failed to reject discount'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this discount request?')) return;
        try {
            await discountAPI.delete(id);
            toast.success('Discount request deleted');
            loadDiscountRequests();
        } catch { toast.error('Failed to delete discount request'); }
    };

    const pending  = discountRequests.filter(r => r.status === 'pending').length;
    const approved = discountRequests.filter(r => r.status === 'approved').length;
    const rejected = discountRequests.filter(r => r.status === 'rejected').length;

    return (
        <DashboardLayout title="Discount Requests">
            <style>{tableCSS}</style>

            {/* ── Blue header banner with summary chips ── */}
            <div className="disc-header">
                <h1>Discount Requests</h1>
                <div className="disc-chips">
                    <div className="disc-chip">
                        <span className="disc-chip-dot dot-pending" />
                        <span className="disc-chip-label">Pending</span>
                        <span className="disc-chip-value">{pending}</span>
                    </div>
                    <div className="disc-chip">
                        <span className="disc-chip-dot dot-approved" />
                        <span className="disc-chip-label">Approved</span>
                        <span className="disc-chip-value">{approved}</span>
                    </div>
                    <div className="disc-chip">
                        <span className="disc-chip-dot dot-rejected" />
                        <span className="disc-chip-label">Rejected</span>
                        <span className="disc-chip-value">{rejected}</span>
                    </div>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className="disc-table-wrap">

                {/* This div scrolls vertically and horizontally */}
                <div className="disc-table-scroll">
                    <table className="disc-table">
                        <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>Customer</th>
                                <th>Order ID</th>
                                <th>Requested %</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discountRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="tbl-empty">No discount requests found</div>
                                    </td>
                                </tr>
                            ) : discountRequests.map((request) => (
                                <tr key={request.id}>
                                    <td><span className="disc-id">#{request.id}</span></td>
                                    <td><span className="disc-cust">{request.customer_name || 'N/A'}</span></td>
                                    <td><span className="disc-id">#{request.order || 'N/A'}</span></td>
                                    <td><span className="disc-pct">{request.requested_discount}%</span></td>
                                    <td><span className="disc-reason">{request.reason}</span></td>
                                    <td>
                                        <span className={`status-badge ${statusClass(request.status)}`}>
                                            {statusLabel(request.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            {request.status === 'pending' && (
                                                <button className="btn-review" onClick={() => handleOpenDialog(request)}>
                                                    Review
                                                </button>
                                            )}
                                            {request.status === 'approved' && (
                                                <span className="approved-tag">✓ {request.approved_discount}% off</span>
                                            )}
                                            <button className="btn-del" onClick={() => handleDelete(request.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer is outside the scroll area so it's always visible */}
                {discountRequests.length > 0 && (
                    <div className="tbl-footer">
                        {discountRequests.length} total request{discountRequests.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Review Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>Review Discount Request</DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box>
                            <Typography gutterBottom>
                                Customer requested: {selectedRequest.requested_discount}%
                            </Typography>
                            <Typography gutterBottom>
                                Reason: {selectedRequest.reason}
                            </Typography>
                            <TextField
                                fullWidth
                                label="Approved Discount %"
                                type="number"
                                value={approvedDiscount}
                                onChange={(e) => setApprovedDiscount(e.target.value)}
                                margin="normal"
                                inputProps={{ min: 0, max: 100 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleReject} color="error">Reject</Button>
                    <Button onClick={handleApprove} variant="contained">Approve</Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
};

export default Discounts;