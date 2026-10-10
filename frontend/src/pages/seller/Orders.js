import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { orderAPI } from '../../services/api';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css');

  :root {
    --brand:        #1a6b4a;
    --brand-light:  #e8f5ef;
    --brand-mid:    #2d9166;
    --accent:       #f0a500;
    --accent-light: #fff8e6;
    --danger:       #dc3545;
    --danger-light: #fdecea;
    --info:         #0d6efd;
    --info-light:   #e8f0fe;
    --warn:         #fd7e14;
    --warn-light:   #fff3e0;
    --success:      #198754;
    --success-light:#e6f4ee;
    --ink:          #111827;
    --ink-2:        #374151;
    --ink-3:        #6b7280;
    --line:         #e5e7eb;
    --surface:      #ffffff;
    --bg:           #f3f6f4;
    --radius:       12px;
    --radius-sm:    8px;
    --shadow-sm:    0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
    --shadow:       0 4px 16px rgba(0,0,0,.08);
    --shadow-lg:    0 8px 32px rgba(0,0,0,.12);
    --font:         'DM Sans', sans-serif;
    --mono:         'DM Mono', monospace;
    --transition:   .18s cubic-bezier(.4,0,.2,1);
  }

  .ord-page { font-family: var(--font); background: var(--bg); min-height: 100vh; padding: 28px 32px; }

  /* ── Header ── */
  .ord-header {
    margin-bottom: 28px;
    background: #0d6efd;
    border-radius: 12px;
    padding: 20px 28px;
    box-shadow: 0 4px 12px rgba(13,110,253,0.3);
  }
  .ord-header h1 { font-size: 1.75rem; font-weight: 700; color: #ffffff; letter-spacing: -.3px; margin: 0; }
  .ord-header p  { font-size: .875rem; color: rgba(255,255,255,0.8); margin: 4px 0 0; }

  /* ── Stat cards ── */
  .stat-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 18px 22px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 16px;
    transition: box-shadow var(--transition), transform var(--transition);
  }
  .stat-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
  .stat-icon {
    width: 44px; height: 44px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem; flex-shrink: 0;
  }
  .stat-icon.all     { background: var(--brand-light);   color: var(--brand); }
  .stat-icon.pending { background: var(--warn-light);    color: var(--warn); }
  .stat-icon.approved{ background: var(--info-light);    color: var(--info); }
  .stat-icon.done    { background: var(--success-light); color: var(--success); }
  .stat-icon.cancel  { background: var(--danger-light);  color: var(--danger); }
  .stat-val  { font-size: 1.5rem; font-weight: 600; color: var(--ink); line-height: 1; }
  .stat-lbl  { font-size: .75rem; color: var(--ink-3); margin-top: 3px; text-transform: uppercase; letter-spacing: .5px; }

  /* ── Tab strip ── */
  .tab-strip {
    display: flex; gap: 4px;
    background: var(--surface);
    border-radius: var(--radius);
    padding: 6px;
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
    margin-bottom: 20px;
    overflow-x: auto;
  }
  .tab-btn {
    padding: 8px 18px; border-radius: var(--radius-sm);
    border: none; background: transparent;
    font-family: var(--font); font-size: .875rem; font-weight: 500;
    color: var(--ink-3); cursor: pointer; white-space: nowrap;
    transition: all var(--transition);
    display: flex; align-items: center; gap: 6px;
  }
  .tab-btn:hover  { background: var(--bg); color: var(--ink-2); }
  .tab-btn.active { background: var(--brand); color: #fff; }
  .tab-badge {
    background: rgba(255,255,255,.25); color: inherit;
    border-radius: 20px; padding: 1px 7px; font-size: .7rem; font-weight: 600;
  }
  .tab-btn:not(.active) .tab-badge { background: var(--line); color: var(--ink-3); }

  /* ── Table card ── */
  .table-card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .ord-table { width: 100%; border-collapse: collapse; }
  .ord-table thead th {
    background: var(--bg); padding: 12px 16px;
    font-size: .75rem; font-weight: 600; color: var(--ink-3);
    text-transform: uppercase; letter-spacing: .6px;
    border-bottom: 1px solid var(--line); white-space: nowrap;
  }
  .ord-table tbody tr { border-bottom: 1px solid var(--line); transition: background var(--transition); }
  .ord-table tbody tr:last-child { border-bottom: none; }
  .ord-table tbody tr:hover { background: #f9fafb; }
  .ord-table td { padding: 14px 16px; font-size: .875rem; color: var(--ink-2); vertical-align: middle; }

  .ord-id { font-family: var(--mono); font-size: .8rem; font-weight: 500; color: var(--brand); }
  .cust-name { font-weight: 500; color: var(--ink); }
  .amount { font-family: var(--mono); font-weight: 500; }

  /* ── Status badges ── */
  .badge-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px;
    font-size: .75rem; font-weight: 600; letter-spacing: .2px;
  }
  .badge-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .badge-pending  { background: var(--warn-light);    color: var(--warn);    } .badge-pending::before    { background: var(--warn); }
  .badge-approved { background: var(--info-light);    color: var(--info);    } .badge-approved::before   { background: var(--info); }
  .badge-completed{ background: var(--success-light); color: var(--success); } .badge-completed::before  { background: var(--success); }
  .badge-cancelled{ background: var(--danger-light);  color: var(--danger);  } .badge-cancelled::before  { background: var(--danger); }
  .badge-awaiting { background: #ede9fe;              color: #7c3aed;        } .badge-awaiting::before   { background: #7c3aed; }
  .badge-edited   { background: var(--accent-light);  color: var(--accent);  padding: 2px 8px; margin-left: 6px; }

  /* ── Buttons ── */
  .btn-view {
    padding: 6px 14px; border-radius: var(--radius-sm);
    border: 1.5px solid var(--brand); color: var(--brand);
    background: transparent; font-family: var(--font); font-size: .8rem; font-weight: 500;
    cursor: pointer; transition: all var(--transition);
  }
  .btn-view:hover { background: var(--brand); color: #fff; }
  .btn-primary {
    padding: 9px 20px; border-radius: var(--radius-sm);
    background: var(--brand); color: #fff; border: none;
    font-family: var(--font); font-size: .875rem; font-weight: 500;
    cursor: pointer; transition: all var(--transition);
  }
  .btn-primary:hover { background: var(--brand-mid); }
  .btn-secondary {
    padding: 9px 20px; border-radius: var(--radius-sm);
    background: var(--surface); color: var(--ink-2);
    border: 1.5px solid var(--line);
    font-family: var(--font); font-size: .875rem; font-weight: 500;
    cursor: pointer; transition: all var(--transition);
  }
  .btn-secondary:hover { border-color: var(--ink-3); background: var(--bg); }
  .btn-danger {
    padding: 9px 20px; border-radius: var(--radius-sm);
    background: var(--danger-light); color: var(--danger);
    border: 1.5px solid #f5c6cb;
    font-family: var(--font); font-size: .875rem; font-weight: 500;
    cursor: pointer; transition: all var(--transition);
  }
  .btn-danger:hover { background: var(--danger); color: #fff; }
  .btn-success {
    padding: 9px 20px; border-radius: var(--radius-sm);
    background: var(--success); color: #fff; border: none;
    font-family: var(--font); font-size: .875rem; font-weight: 500;
    cursor: pointer; transition: all var(--transition);
  }
  .btn-success:hover { background: #146c43; }
  .btn-warn {
    padding: 9px 20px; border-radius: var(--radius-sm);
    background: var(--warn-light); color: var(--warn);
    border: 1.5px solid #ffd9b3;
    font-family: var(--font); font-size: .875rem; font-weight: 500;
    cursor: pointer; transition: all var(--transition);
  }
  .btn-warn:hover { background: var(--warn); color: #fff; }
  .btn-icon-sm {
    padding: 4px 10px; border-radius: 6px; font-size: .75rem;
    background: var(--danger-light); color: var(--danger);
    border: 1px solid #f5c6cb; cursor: pointer;
    font-family: var(--font); font-weight: 500;
    transition: all var(--transition);
  }
  .btn-icon-sm:hover { background: var(--danger); color: #fff; }

  /* ── Modal overlay ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(17,24,39,.45); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; animation: fadeIn .15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-box {
    background: var(--surface); border-radius: 16px;
    box-shadow: var(--shadow-lg); width: 100%; max-width: 680px;
    max-height: 90vh; display: flex; flex-direction: column;
    animation: slideUp .2s cubic-bezier(.4,0,.2,1);
  }
  .modal-box.sm { max-width: 460px; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .modal-head {
    padding: 20px 24px 16px; border-bottom: 1px solid var(--line);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .modal-head h2 { font-size: 1.1rem; font-weight: 600; color: var(--ink); margin: 0; }
  .modal-close {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: var(--bg); color: var(--ink-3); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    transition: all var(--transition);
  }
  .modal-close:hover { background: var(--line); color: var(--ink); }
  .modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
  .modal-foot {
    padding: 16px 24px; border-top: 1px solid var(--line);
    display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;
  }

  /* ── Info section inside modal ── */
  .info-section {
    background: var(--bg); border-radius: var(--radius-sm);
    padding: 16px; margin-bottom: 16px; border: 1px solid var(--line);
  }
  .info-section h3 { font-size: .8rem; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: .6px; margin: 0 0 12px; }
  .info-row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; font-size: .875rem; }
  .info-row .lbl { color: var(--ink-3); }
  .info-row .val { font-weight: 500; color: var(--ink); }

  .edited-alert {
    background: var(--accent-light); border: 1px solid #fcd97a;
    border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 16px;
  }
  .edited-alert strong { color: var(--ink); font-size: .85rem; display: block; margin-bottom: 4px; }
  .edited-alert span  { font-size: .8rem; color: var(--ink-2); }

  /* ── Items mini-table ── */
  .items-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
  .items-table th {
    background: var(--bg); padding: 8px 12px; font-size: .72rem;
    font-weight: 600; color: var(--ink-3); text-transform: uppercase;
    letter-spacing: .5px; text-align: left; border-bottom: 1px solid var(--line);
  }
  .items-table td { padding: 10px 12px; border-bottom: 1px solid var(--line); color: var(--ink-2); vertical-align: middle; }
  .items-table tr:last-child td { border-bottom: none; }
  .qty-input {
    width: 64px; padding: 4px 8px; border-radius: 6px;
    border: 1.5px solid var(--line); font-family: var(--mono); font-size: .85rem;
    text-align: center; outline: none; transition: border var(--transition);
  }
  .qty-input:focus { border-color: var(--brand); }
  .total-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 12px 0; border-top: 1px solid var(--line); margin-top: 8px;
  }
  .total-row .hint { font-size: .78rem; color: var(--ink-3); }
  .total-row .total-val { font-size: 1rem; font-weight: 600; color: var(--ink); font-family: var(--mono); }

  /* ── Form fields ── */
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: .8rem; font-weight: 500; color: var(--ink-2); margin-bottom: 6px; }
  .form-input {
    width: 100%; padding: 10px 14px; border-radius: var(--radius-sm);
    border: 1.5px solid var(--line); font-family: var(--font); font-size: .875rem;
    color: var(--ink); outline: none; transition: border var(--transition);
    background: var(--surface);
  }
  .form-input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(26,107,74,.12); }
  .form-input:disabled { background: var(--bg); color: var(--ink-3); cursor: not-allowed; }
  textarea.form-input { resize: vertical; min-height: 90px; }

  /* ── Empty state ── */
  .empty-state { text-align: center; padding: 56px 24px; }
  .empty-icon { font-size: 2.5rem; margin-bottom: 12px; opacity: .4; }
  .empty-state p { color: var(--ink-3); font-size: .9rem; }
`;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const statusLabel = s => s === 'pending_customer_approval' ? 'Awaiting Customer' : s?.replace(/_/g, ' ');
const statusClass = s => ({
  pending: 'badge-pending',
  pending_customer_approval: 'badge-awaiting',
  approved: 'badge-approved',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
}[s] || 'badge-pending');

const fmtDate  = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtDateT = d => new Date(d).toLocaleString('en-US',  { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ── Stat Card ────────────────────────────────────────────────────────────── */
const StatCard = ({ icon, value, label, cls }) => (
  <div className="stat-card">
    <div className={`stat-icon ${cls}`}>{icon}</div>
    <div>
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  </div>
);

/* ── Main Component ───────────────────────────────────────────────────────── */
const Orders = () => {
  const [orders, setOrders]               = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen]     = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tabValue, setTabValue]           = useState('all');
  const [editFormData, setEditFormData]   = useState({ edited_total_amount: '', edit_reason: '' });

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await orderAPI.getAll();
      setOrders(res.data.results || res.data);
    } catch { toast.error('Failed to load orders'); }
  };

  const handleViewDetails = order => { setSelectedOrder(order); setDetailsOpen(true); };

  const handleUpdateStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      toast.success(`Order ${status}`);
      loadOrders();
      setDetailsOpen(false);
    } catch { toast.error('Failed to update order status'); }
  };

  const handleQtyChange = (idx, qty) => {
    if (qty < 1) return;
    const items = [...selectedOrder.items];
    items[idx] = { ...items[idx], quantity: qty };
    setSelectedOrder({ ...selectedOrder, items });
  };

  const handleRemoveItem = idx => {
    if (selectedOrder.items.length === 1) { toast.error('Cannot remove the last item.'); return; }
    setSelectedOrder({ ...selectedOrder, items: selectedOrder.items.filter((_, i) => i !== idx) });
  };

  const calcTotal = () =>
    (selectedOrder?.items || []).reduce((s, it) => s + it.quantity * parseFloat(it.unit_price), 0);

  const handleSaveChanges = () => {
    const newTotal = calcTotal();
    if (newTotal === parseFloat(selectedOrder.total_amount)) { toast.info('No changes made'); return; }
    setEditFormData({ edited_total_amount: newTotal.toFixed(2), edit_reason: 'Order items modified by seller' });
    setEditDialogOpen(true);
    setDetailsOpen(false);
  };

  const handleEditOrder = async () => {
    try {
      const itemsData = selectedOrder.items.map(it => ({ id: it.id, quantity: it.quantity }));
      await orderAPI.editOrder(selectedOrder.id, editFormData, itemsData);
      toast.success('Order sent to customer for approval');
      loadOrders();
      setEditDialogOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to edit order');
    }
  };

  const handleDeleteOrder = async id => {
    if (!window.confirm('Delete this completed order?')) return;
    try {
      await orderAPI.deleteCompleted(id);
      toast.success('Order deleted');
      loadOrders();
      setDetailsOpen(false);
    } catch { toast.error('Failed to delete order'); }
  };

  const counts = {
    all:       orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    approved:  orders.filter(o => o.status === 'approved').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const filtered = orders.filter(o => tabValue === 'all' || o.status === tabValue);

  const tabs = [
    { id: 'all',       label: 'All',       icon: '' },
    { id: 'pending',   label: 'Pending',   icon: '' },
    { id: 'approved',  label: 'Approved',  icon: '' },
    { id: 'completed', label: 'Completed', icon: '' },
    { id: 'cancelled', label: 'Cancelled', icon: '' },
  ];

  return (
    <>
      <style>{css}</style>
      <DashboardLayout title="Orders">
        <div className="ord-page">

          {/* Header — blue background */}
          <div className="ord-header">
            <h1>Order Management</h1>
            <p>Track and manage all customer pharmacy orders</p>
          </div>

          {/* Stat cards */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-xl">
              <StatCard icon="" value={counts.all}       label="Total Orders"  cls="all"     />
            </div>
            <div className="col-6 col-md-4 col-xl">
              <StatCard icon="" value={counts.pending}   label="Pending"       cls="pending"  />
            </div>
            <div className="col-6 col-md-4 col-xl">
              <StatCard icon="" value={counts.approved}  label="Approved"      cls="approved" />
            </div>
            <div className="col-6 col-md-4 col-xl">
              <StatCard icon="" value={counts.completed} label="Completed"     cls="done"     />
            </div>
            <div className="col-6 col-md-4 col-xl">
              <StatCard icon="" value={counts.cancelled} label="Cancelled"     cls="cancel"   />
            </div>
          </div>

          {/* Tab strip */}
          <div className="tab-strip">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${tabValue === t.id ? 'active' : ''}`}
                onClick={() => setTabValue(t.id)}
              >
                {t.icon} {t.label}
                <span className="tab-badge">{counts[t.id]}</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="table-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="ord-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-icon"></div>
                          <p>No orders found in this category</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(order => (
                    <tr key={order.id}>
                      <td><span className="ord-id">{order.id}</span></td>
                      <td><span className="cust-name">{order.customer_name || '—'}</span></td>
                      <td style={{ color: 'var(--ink-3)', fontSize: '.8rem' }}>{fmtDate(order.created_at)}</td>
                      <td>
                        <span className="amount">frw {parseFloat(order.total_amount).toFixed(2)}</span>
                        {order.is_edited && <span className="badge-pill badge-edited">Edited</span>}
                      </td>
                      <td>
                        <span className={`badge-pill ${statusClass(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <button className="btn-view" onClick={() => handleViewDetails(order)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </DashboardLayout>

      {/* ── Order Details Modal ───────────────────────────────────────────── */}
      {detailsOpen && selectedOrder && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDetailsOpen(false); }}>
          <div className="modal-box">
            <div className="modal-head">
              <div>
                <h2>Order Details</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className="ord-id">#{selectedOrder.id}</span>
                  <span className={`badge-pill ${statusClass(selectedOrder.status)}`}>
                    {statusLabel(selectedOrder.status)}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailsOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Customer info */}
              <div className="info-section">
                <h3>Customer Information</h3>
                <div className="info-row">
                  <span className="lbl">Name</span>
                  <span className="val">{selectedOrder.customer_name || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Order Date</span>
                  <span className="val">{fmtDateT(selectedOrder.created_at)}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Delivery Address</span>
                  <span className="val">{selectedOrder.delivery_address || '—'}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="info-row">
                    <span className="lbl">Notes</span>
                    <span className="val">{selectedOrder.notes}</span>
                  </div>
                )}
              </div>

              {/* Edited alert */}
              {selectedOrder.is_edited && (
                <div className="edited-alert">
                  <strong>⚠ Order was edited</strong>
                  <span>New amount: <b>frw {selectedOrder.edited_total_amount}</b> · {selectedOrder.edit_reason}</span>
                  <br />
                  <span style={{ fontSize: '.75rem', color: 'var(--ink-3)' }}>
                    Edited: {fmtDateT(selectedOrder.edited_at)}
                  </span>
                </div>
              )}

              {/* Items */}
              <div className="info-section" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ margin: 0 }}>Order Items</h3>
                </div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                      {selectedOrder.status === 'pending' && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500, color: 'var(--ink)' }}>
                          {item.medicine?.brand_name || '—'}
                        </td>
                        <td>
                          {selectedOrder.status === 'pending' ? (
                            <input
                              type="number"
                              className="qty-input"
                              value={item.quantity}
                              min={1}
                              onChange={e => handleQtyChange(i, parseInt(e.target.value) || 0)}
                            />
                          ) : item.quantity}
                        </td>
                        <td style={{ fontFamily: 'var(--mono)' }}>frw {parseFloat(item.unit_price).toFixed(2)}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>
                          frw {(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                        </td>
                        {selectedOrder.status === 'pending' && (
                          <td>
                            <button className="btn-icon-sm" onClick={() => handleRemoveItem(i)}>Remove</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="total-row">
                  {selectedOrder.status === 'pending'
                    ? <span className="hint">* Edit quantities to recalculate total</span>
                    : <span />
                  }
                  <span className="total-val">Total: frw {calcTotal().toFixed(2)}</span>
                </div>
                <div style={{ height: 12 }} />
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn-secondary" onClick={() => setDetailsOpen(false)}>Close</button>
              {selectedOrder.status === 'pending' && <>
                <button className="btn-danger" onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}>
                  Reject Order
                </button>
                <button className="btn-warn" onClick={handleSaveChanges}>
                  Save &amp; Send to Customer
                </button>
                <button className="btn-primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'approved')}>
                  Approve As Is
                </button>
              </>}
              {selectedOrder.status === 'approved' && (
                <button className="btn-success" onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}>
                  Mark as Completed
                </button>
              )}
              {selectedOrder.status === 'completed' && (
                <button className="btn-danger" onClick={() => handleDeleteOrder(selectedOrder.id)}>
                  Delete Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Edit Modal ────────────────────────────────────────────── */}
      {editDialogOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditDialogOpen(false); }}>
          <div className="modal-box sm">
            <div className="modal-head">
              <h2>Confirm Order Changes</h2>
              <button className="modal-close" onClick={() => setEditDialogOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '.875rem', color: 'var(--ink-3)', marginBottom: 20 }}>
                The edited order will be sent to the customer for approval before it is processed.
              </p>
              <div className="form-group">
                <label>New Total Amount</label>
                <input
                  className="form-input"
                  type="number"
                  value={editFormData.edited_total_amount}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Reason for Edit</label>
                <textarea
                  className="form-input"
                  value={editFormData.edit_reason}
                  onChange={e => setEditFormData({ ...editFormData, edit_reason: e.target.value })}
                  placeholder="Explain why you're changing the order (optional)..."
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={() => setEditDialogOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditOrder}>Send to Customer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;