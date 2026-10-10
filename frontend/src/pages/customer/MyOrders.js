// src/pages/customer/MyOrders.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Rating,
    Alert,
    Grid,
    AppBar,
    Toolbar,
    Card,
    LinearProgress
} from '@mui/material';
import {
    ShoppingBag as OrdersIcon,
    LocalOffer as DiscountIcon,
    Feedback as FeedbackIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Visibility as ViewIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import CustomerNav from '../../components/CustomerNav';
import { orderAPI, discountAPI, commentAPI } from '../../services/api';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
    const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
    const [editDetailsDialogOpen, setEditDetailsDialogOpen] = useState(false);
    const [discountData, setDiscountData] = useState({
        requested_discount: '',
        reason: ''
    });
    const [feedbackData, setFeedbackData] = useState({
        satisfaction_score: 5,
        comment_text: ''
    });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.getAll();
            setOrders(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestDiscount = (order) => {
        setSelectedOrder(order);
        setDiscountDialogOpen(true);
    };

    const handleGiveFeedback = (order) => {
        setSelectedOrder(order);
        setFeedbackDialogOpen(true);
    };

    const handleViewEditDetails = (order) => {
        setSelectedOrder(order);
        setEditDetailsDialogOpen(true);
    };

    // FIX 1: Removed unused 'action' variable and fixed the confirm string
    const handleRespondToEdit = async (orderId, accepted) => {
        if (window.confirm(`Are you sure you want to ${accepted ? 'accept' : 'reject'} this order edit?`)) {
            try {
                await orderAPI.respondToEdit(orderId, accepted);
                toast.success(accepted ? 'Order edit accepted!' : 'Order edit rejected');
                loadOrders();
                setEditDetailsDialogOpen(false);
            } catch (error) {
                toast.error('Failed to respond to edit');
            }
        }
    };

    const submitDiscountRequest = async () => {
        if (discountData.requested_discount === '' || !discountData.reason) {
            toast.error('Please fill in both discount percentage and reason');
            return;
        }
        const discount = parseFloat(discountData.requested_discount);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            toast.error('Please enter a valid discount percentage between 1 and 100');
            return;
        }
        try {
            await discountAPI.create({
                order_id: selectedOrder.id,
                requested_discount: discount,
                reason: discountData.reason
            });
            toast.success('Discount request submitted');
            setDiscountDialogOpen(false);
            setDiscountData({ requested_discount: '', reason: '' });
        } catch (error) {
            toast.error('Failed to submit discount request');
        }
    };

    const submitFeedback = async () => {
        if (!feedbackData.satisfaction_score) {
            toast.error('Please select a satisfaction rating');
            return;
        }
        if (!feedbackData.comment_text.trim()) {
            toast.error('Please enter a comment');
            return;
        }
        try {
            await commentAPI.create({
                seller_id: selectedOrder.seller,
                order_id: selectedOrder.id,
                satisfaction_score: feedbackData.satisfaction_score,
                comment_text: feedbackData.comment_text
            });
            toast.success('Feedback submitted');
            setFeedbackDialogOpen(false);
            setFeedbackData({ satisfaction_score: 5, comment_text: '' });
        } catch (error) {
            toast.error('Failed to submit feedback');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            approved: 'info',
            completed: 'success',
            cancelled: 'error'
        };
        return colors[status] || 'default';
    };

    const getStatusLabel = (status) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const drawerWidth = 280;

    return (
        <>
            <CustomerNav />

            {/* Header with Blue Background */}
            <AppBar
                position="sticky"
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                    ml: { md: `${drawerWidth}px` },
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    zIndex: 1100
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', py: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                            My Orders
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Track and manage your orders
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => window.location.href = '/customer/browse'}
                            startIcon={<ArrowBackIcon />}
                            sx={{
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Continue Shopping
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* FIX 2: Fixed broken template literal frw{drawerWidth} -> ${drawerWidth} */}
            <Box sx={{ ml: { md: `${drawerWidth}px` }, p: { xs: 2, md: 4 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
                <Container maxWidth="xl">
                    {/* Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                borderRadius: 3,
                                p: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <OrdersIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {orders.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Total Orders
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: 3, p: 2, bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {orders.filter(o => o.status === 'completed').length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Completed
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: 3, p: 2, bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CancelIcon sx={{ fontSize: 40, color: '#f44336' }} />
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {orders.filter(o => o.status === 'cancelled').length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Cancelled
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: 3, p: 2, bgcolor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <DiscountIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {orders.filter(o => o.status === 'pending').length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Pending
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>

                    {loading && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}

                    {/* Orders Table */}
                    <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Items</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Total Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id} sx={{ '&:hover': { bgcolor: '#faf5ff' }, transition: 'all 0.3s ease' }}>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {order.items?.length || 0} items
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="h6" fontWeight="bold" color="#667eea">
                                                frw {parseFloat(order.total_amount).toFixed(2)}
                                            </Typography>
                                            {order.is_edited && order.customer_accepted_edit === null && (
                                                <Chip
                                                    label="Edited by Seller"
                                                    color="warning"
                                                    size="small"
                                                    sx={{ mt: 0.5 }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(order.status)}
                                                color={getStatusColor(order.status)}
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {order.is_edited && order.customer_accepted_edit === null && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<ViewIcon />}
                                                            onClick={() => handleViewEditDetails(order)}
                                                            sx={{ borderRadius: 2 }}
                                                        >
                                                            View Edit
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            onClick={() => handleRespondToEdit(order.id, true)}
                                                            sx={{ borderRadius: 2 }}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="error"
                                                            onClick={() => handleRespondToEdit(order.id, false)}
                                                            sx={{ borderRadius: 2 }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {order.status === 'pending' && !order.is_edited && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<DiscountIcon />}
                                                        onClick={() => handleRequestDiscount(order)}
                                                        sx={{ borderRadius: 2 }}
                                                    >
                                                        Request Discount
                                                    </Button>
                                                )}
                                                {(order.status === 'completed' || order.status === 'approved') && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        startIcon={<FeedbackIcon />}
                                                        onClick={() => handleGiveFeedback(order)}
                                                        sx={{ borderRadius: 2 }}
                                                    >
                                                        Feedback
                                                    </Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                            <OrdersIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary">
                                                No orders yet
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Start shopping to see your orders here
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                onClick={() => window.location.href = '/customer/browse'}
                                                sx={{ mt: 2, borderRadius: 2 }}
                                            >
                                                Browse Medicines
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Container>
            </Box>

            {/* Dialogs */}
            <Dialog open={editDetailsDialogOpen} onClose={() => setEditDetailsDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#667eea', color: 'white' }}>Order Edit Details</DialogTitle>
                <DialogContent>
                    {selectedOrder && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>The seller has modified quantities. Please review below.</Alert>
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Items Comparison</Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Medicine</TableCell>
                                                <TableCell>Original Qty</TableCell>
                                                <TableCell>New Qty</TableCell>
                                                <TableCell>Unit Price</TableCell>
                                                <TableCell>New Subtotal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedOrder.items?.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.medicine_detail?.brand_name || 'N/A'}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight="bold" color="warning.main">
                                                            {item.edited_quantity || item.quantity}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>frw {parseFloat(item.unit_price).toFixed(2)}</TableCell>
                                                    <TableCell>frw {item.edited_subtotal ? parseFloat(item.edited_subtotal).toFixed(2) : parseFloat(item.subtotal).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                            <Alert severity="warning">Accept to update quantities, reject to cancel order.</Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDetailsDialogOpen(false)}>Close</Button>
                    <Button onClick={() => handleRespondToEdit(selectedOrder?.id, false)} color="error" variant="outlined">Reject</Button>
                    <Button onClick={() => handleRespondToEdit(selectedOrder?.id, true)} color="success" variant="contained">Accept</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#667eea', color: 'white' }}>Request Discount</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Discount Percentage"
                        type="number"
                        value={discountData.requested_discount}
                        onChange={(e) => setDiscountData({ ...discountData, requested_discount: e.target.value })}
                        margin="normal"
                        inputProps={{ min: 0, max: 100 }}
                    />
                    <TextField
                        fullWidth
                        label="Reason"
                        multiline
                        rows={3}
                        value={discountData.reason}
                        onChange={(e) => setDiscountData({ ...discountData, reason: e.target.value })}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
                    <Button onClick={submitDiscountRequest} variant="contained">Submit</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#667eea', color: 'white' }}>Give Feedback</DialogTitle>
                <DialogContent>
                    <Box sx={{ my: 2 }}>
                        <Typography gutterBottom>Satisfaction Rating</Typography>
                        <Rating
                            value={feedbackData.satisfaction_score}
                            onChange={(e, newValue) => setFeedbackData({ ...feedbackData, satisfaction_score: newValue })}
                            size="large"
                        />
                    </Box>
                    <TextField
                        fullWidth
                        label="Comments"
                        multiline
                        rows={4}
                        value={feedbackData.comment_text}
                        onChange={(e) => setFeedbackData({ ...feedbackData, comment_text: e.target.value })}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
                    <Button onClick={submitFeedback} variant="contained">Submit</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MyOrders;