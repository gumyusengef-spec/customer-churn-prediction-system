import React, { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Medication as MedicationIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { medicineAPI } from '../../services/api';

/* ─── Injected CSS ───────────────────────────────────────────────────────── */
const tableCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  .med-root {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 32px);
    min-height: 400px;
    font-family: 'DM Sans', sans-serif;
    background: #f4f6f8;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e6ea;
  }

  /* ── Compact top bar ── */
  .med-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 16px;
    background: #0d6efd;
    border-bottom: none;
    flex-shrink: 0;
  }

  .med-logo {
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  .med-logo-icon {
    width: 30px;
    height: 30px;
    background: rgba(255,255,255,0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .med-logo-text {
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1;
  }

  .med-divider {
    width: 1px;
    height: 28px;
    background: rgba(255,255,255,0.3);
    flex-shrink: 0;
  }

  .med-search-wrap {
    flex: 1;
    position: relative;
  }

  .med-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: #6c757d;
    pointer-events: none;
    line-height: 1;
  }

  .med-search-wrap input {
    width: 100%;
    height: 34px;
    padding: 0 12px 0 34px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    background: rgba(255,255,255,0.9);
    color: #212529;
    outline: none;
    transition: border-color .15s, box-shadow .15s, background .15s;
  }

  .med-search-wrap input::placeholder { color: #6c757d; }

  .med-search-wrap input:focus {
    border-color: rgba(255,255,255,0.7);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(255,255,255,.15);
  }

  .med-pills {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .mpill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    white-space: nowrap;
  }

  .mpill-total { background: rgba(255,255,255,0.2); color: #ffffff; }
  .mpill-low   { background: #fff3cd; color: #854F0B; }
  .mpill-exp   { background: #fde8e8; color: #A32D2D; }

  .med-add-btn {
    height: 34px;
    padding: 0 14px;
    background: #ffffff;
    color: #0d6efd;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background .15s, color .15s;
  }

  .med-add-btn:hover { background: #e8f0fe; color: #0b5ed7; }

  /* ── Scrollable table area ── */
  .med-table-scroll {
    flex: 1;
    overflow: auto;
    background: #fff;
  }

  .med-table-scroll::-webkit-scrollbar        { width: 6px; height: 6px; }
  .med-table-scroll::-webkit-scrollbar-track  { background: #f1f3f5; }
  .med-table-scroll::-webkit-scrollbar-thumb  { background: #ced4da; border-radius: 3px; }
  .med-table-scroll::-webkit-scrollbar-thumb:hover { background: #adb5bd; }

  .med-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
  }

  /* Bold, capitalized, highly visible column headers */
  .med-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #ffffff;
    border-bottom: 2px solid #dee2e6;
    padding: 12px 14px;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .8px;
    color: #212529;
    white-space: nowrap;
    text-align: left;
  }

  .med-table thead th:first-child { border-radius: 0; }

  .med-table tbody tr {
    border-bottom: 1px solid #f1f3f5;
    transition: background .1s;
  }

  .med-table tbody tr:last-child { border-bottom: none; }
  .med-table tbody tr:hover      { background: #f0f5ff; }

  .med-table td {
    padding: 11px 14px;
    vertical-align: middle;
    color: #343a40;
  }

  .cell-brand   { font-weight: 600; font-size: 13px; color: #1a1a2e; }
  .cell-generic { font-size: 11.5px; color: #6c757d; margin-top: 2px; }
  .cell-mono    { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #495057; }
  .cell-price   { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; color: #0f5132; }

  .form-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    background: #e7f0ff;
    color: #185FA5;
    text-transform: capitalize;
    border: 1px solid #b8d0f5;
  }

  .sbadge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    white-space: nowrap;
  }

  .sbadge-ok   { background: #d1f2e0; color: #0f5132; }
  .sbadge-low  { background: #fff3cd; color: #664d03; }
  .sbadge-crit { background: #fde8e8; color: #842029; }

  .vbadge {
    display: inline-flex;
    align-items: center;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
  }

  .vbadge-on  { background: #d1f2e0; color: #0f5132; }
  .vbadge-off { background: #e9ecef; color: #495057; }

  .expiry-ok   { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #6c757d; }
  .expiry-warn { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #dc3545; font-weight: 600; }

  .act-wrap { display: flex; gap: 3px; }

  .act-btn {
    width: 28px;
    height: 28px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6c757d;
    transition: background .12s, color .12s, border-color .12s;
  }

  .act-btn:hover     { background: #f0f2f5; color: #212529; border-color: #ced4da; }
  .act-btn.del:hover { background: #fde8e8; color: #dc3545; border-color: #f5c6cb; }

  .tbl-empty {
    text-align: center;
    padding: 60px 24px;
    color: #adb5bd;
    font-size: 14px;
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const isExpiringSoon = date =>
    (new Date(date) - Date.now()) / (1000 * 60 * 60 * 24) < 90;

const stockClass = qty =>
    qty === 0 ? 'sbadge sbadge-crit' : qty < 10 ? 'sbadge sbadge-low' : 'sbadge sbadge-ok';

const stockLabel = qty =>
    qty === 0 ? 'Out of stock' : qty < 10 ? `Low — ${qty}` : qty.toLocaleString();

const DOSAGE_FORMS = ['tablet','capsule','syrup','injection','cream','ointment','drops','powder'];

const EMPTY_FORM = {
    brand_name: '', generic_name: '', active_ingredient: '',
    dosage: '', dosage_form: 'tablet', expiry_date: '',
    manufacturer: '', price: '', stock_quantity: '', is_visible: true,
};

/* ─── Component ──────────────────────────────────────────────────────────── */
const Medicines = () => {
    const [medicines, setMedicines]             = useState([]);
    const [open, setOpen]                       = useState(false);
    const [editMode, setEditMode]               = useState(false);
    const [currentMedicine, setCurrentMedicine] = useState(null);
    const [searchTerm, setSearchTerm]           = useState('');
    const [formData, setFormData]               = useState(EMPTY_FORM);

    useEffect(() => { loadMedicines(); }, []);

    /* ── API ── */
    const loadMedicines = async () => {
        try {
            const res = await medicineAPI.getAll();
            setMedicines(res.data.results ?? res.data);
        } catch {
            toast.error('Failed to load medicines');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await medicineAPI.update(currentMedicine.id, formData);
                toast.success('Medicine updated');
            } else {
                await medicineAPI.create(formData);
                toast.success('Medicine added');
            }
            handleClose();
            loadMedicines();
        } catch {
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this medicine?')) return;
        try {
            await medicineAPI.delete(id);
            toast.success('Medicine deleted');
            loadMedicines();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleToggleVisibility = async (medicine) => {
        try {
            await medicineAPI.toggleVisibility(medicine.id, !medicine.is_visible);
            toast.success('Visibility updated');
            loadMedicines();
        } catch {
            toast.error('Failed to update visibility');
        }
    };

    /* ── Dialog helpers ── */
    const handleOpen = () => {
        setFormData(EMPTY_FORM);
        setEditMode(false);
        setCurrentMedicine(null);
        setOpen(true);
    };

    const handleEdit = (m) => {
        setCurrentMedicine(m);
        setFormData({
            brand_name:        m.brand_name,
            generic_name:      m.generic_name      ?? '',
            active_ingredient: m.active_ingredient ?? '',
            dosage:            m.dosage,
            dosage_form:       m.dosage_form,
            expiry_date:       m.expiry_date,
            manufacturer:      m.manufacturer,
            price:             m.price,
            stock_quantity:    m.stock_quantity,
            is_visible:        m.is_visible,
        });
        setEditMode(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false);
        setCurrentMedicine(null);
    };

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    /* ── Filtered list ── */
    const q = searchTerm.toLowerCase();
    const filtered = medicines.filter(m =>
        m.brand_name.toLowerCase().includes(q) ||
        (m.generic_name ?? '').toLowerCase().includes(q)
    );

    /* ── Stats ── */
    const lowCount = medicines.filter(m => m.stock_quantity > 0 && m.stock_quantity < 10).length;
    const expCount = medicines.filter(m => isExpiringSoon(m.expiry_date)).length;

    /* ── Render ── */
    return (
        <DashboardLayout title="Medicines">
            <style>{tableCSS}</style>

            <div className="med-root">

                {/* Compact top bar */}
                <div className="med-topbar">
                    <div className="med-logo">
                        <div className="med-logo-icon">
                            <MedicationIcon style={{ fontSize: 17 }} />
                        </div>
                        <span className="med-logo-text">Medicine Inventory</span>
                    </div>

                    <div className="med-divider" />

                    <div className="med-search-wrap">
                        <span className="med-search-icon">&#128269;</span>
                        <input
                            type="text"
                            placeholder="Search by brand or generic name…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="med-pills">
                        <span className="mpill mpill-total">{medicines.length} Total</span>
                        {lowCount > 0 && (
                            <span className="mpill mpill-low">⚠ {lowCount} Low Stock</span>
                        )}
                        {expCount > 0 && (
                            <span className="mpill mpill-exp">⚠ {expCount} Expiring</span>
                        )}
                    </div>

                    <button className="med-add-btn" onClick={handleOpen}>
                        <AddIcon style={{ fontSize: 16 }} />
                        Add Medicine
                    </button>
                </div>

                {/* Scrollable table */}
                <div className="med-table-scroll">
                    <table className="med-table">
                        <thead>
                            <tr>
                                <th>Brand / Generic</th>
                                <th>Dosage</th>
                                <th>Form</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Expiry</th>
                                <th>Manufacturer</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9}>
                                        <div className="tbl-empty">
                                            {searchTerm
                                                ? 'No medicines match your search'
                                                : 'No medicines found — add one to get started'}
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <div className="cell-brand">{m.brand_name}</div>
                                        {m.generic_name && (
                                            <div className="cell-generic">{m.generic_name}</div>
                                        )}
                                    </td>
                                    <td className="cell-mono">{m.dosage}</td>
                                    <td><span className="form-tag">{m.dosage_form}</span></td>
                                    <td className="cell-price">
                                        Frw {parseFloat(m.price).toFixed(2)}
                                    </td>
                                    <td>
                                        <span className={stockClass(m.stock_quantity)}>
                                            {(m.stock_quantity === 0 || m.stock_quantity < 10) ? '⚠ ' : ''}
                                            {stockLabel(m.stock_quantity)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={isExpiringSoon(m.expiry_date) ? 'expiry-warn' : 'expiry-ok'}>
                                            {isExpiringSoon(m.expiry_date) ? '⚠ ' : ''}{m.expiry_date}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 12, color: '#6c757d' }}>
                                        {m.manufacturer}
                                    </td>
                                    <td>
                                        <span className={`vbadge ${m.is_visible ? 'vbadge-on' : 'vbadge-off'}`}>
                                            {m.is_visible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="act-wrap">
                                            <Tooltip title={m.is_visible ? 'Hide' : 'Show'}>
                                                <button
                                                    className="act-btn"
                                                    onClick={() => handleToggleVisibility(m)}
                                                >
                                                    {m.is_visible
                                                        ? <VisibilityIcon style={{ fontSize: 15 }} />
                                                        : <VisibilityOffIcon style={{ fontSize: 15 }} />}
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <button
                                                    className="act-btn"
                                                    onClick={() => handleEdit(m)}
                                                >
                                                    <EditIcon style={{ fontSize: 15 }} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <button
                                                    className="act-btn del"
                                                    onClick={() => handleDelete(m.id)}
                                                >
                                                    <DeleteIcon style={{ fontSize: 15 }} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Add / Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '12px' } }}>

                <DialogTitle sx={{
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    borderBottom: '1px solid #e2e6ea',
                    pb: 1.5,
                }}>
                    {editMode ? 'Edit Medicine' : 'Add New Medicine'}
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ pt: 2 }}>
                        <Grid container spacing={2}>

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Brand Name" name="brand_name"
                                    value={formData.brand_name} onChange={handleChange}
                                    required size="small" />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Generic Name" name="generic_name"
                                    value={formData.generic_name} onChange={handleChange}
                                    size="small" />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Active Ingredient" name="active_ingredient"
                                    value={formData.active_ingredient} onChange={handleChange}
                                    size="small" />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Dosage (e.g. 500mg)" name="dosage"
                                    value={formData.dosage} onChange={handleChange}
                                    required size="small" />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth select label="Dosage Form" name="dosage_form"
                                    value={formData.dosage_form} onChange={handleChange}
                                    required size="small">
                                    {DOSAGE_FORMS.map(f => (
                                        <MenuItem key={f} value={f}>
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Manufacturer" name="manufacturer"
                                    value={formData.manufacturer} onChange={handleChange}
                                    required size="small" />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Price (Frw)" name="price" type="number"
                                    value={formData.price} onChange={handleChange}
                                    required size="small"
                                    inputProps={{ step: '0.01', min: '0' }} />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Stock Quantity" name="stock_quantity" type="number"
                                    value={formData.stock_quantity} onChange={handleChange}
                                    required size="small"
                                    inputProps={{ min: '0' }} />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Expiry Date" name="expiry_date" type="date"
                                    value={formData.expiry_date} onChange={handleChange}
                                    required size="small"
                                    InputLabelProps={{ shrink: true }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth select label="Visibility" name="is_visible"
                                    value={formData.is_visible} onChange={handleChange}
                                    size="small">
                                    <MenuItem value={true}>Visible to Customers</MenuItem>
                                    <MenuItem value={false}>Hidden</MenuItem>
                                </TextField>
                            </Grid>

                        </Grid>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #e2e6ea', gap: 1 }}>
                        <Button onClick={handleClose} variant="outlined" size="small"
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" size="small"
                            sx={{
                                borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                                background: '#0d6efd', '&:hover': { background: '#0b5ed7' },
                            }}>
                            {editMode ? 'Save Changes' : 'Add Medicine'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
};

export default Medicines;