// src/pages/customer/Cart.js
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    TextField,
    Card,
    CardContent,
    Grid,
    Alert,
    Snackbar,
    Chip,
    Paper
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    Add as AddIcon,
    Remove as RemoveIcon,
    ShoppingCart as CartIcon,
    Payment as PaymentIcon,
    ClearAll as ClearAllIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
// Removed: LocalShipping as ShippingIcon, Receipt as ReceiptIcon (not used)

import CustomerNav from '../../components/CustomerNav';
import { CartContext } from '../../context/CartContext';

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart } = useContext(CartContext);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            setSnackbarMessage('Your cart is empty! Add some medicines first.');
            setOpenSnackbar(true);
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate('/customer/checkout');
        }, 500);
    };

    const handleQuantityChange = (id, newQuantity, stockQuantity) => {
        if (newQuantity < 1) {
            setSnackbarMessage('Quantity cannot be less than 1');
            setOpenSnackbar(true);
            return;
        }
        if (newQuantity > stockQuantity) {
            setSnackbarMessage(`Only frw{stockQuantity} items available in stock`);
            setOpenSnackbar(true);
            return;
        }
        updateQuantity(id, newQuantity);
    };

    const handleRemoveItem = (id, name) => {
        removeFromCart(id);
        setSnackbarMessage(`frw{name} removed from cart`);
        setOpenSnackbar(true);
    };

    const handleClearCart = () => {
        if (cartItems.length === 0) return;
        clearCart();
        setSnackbarMessage('Cart cleared successfully');
        setOpenSnackbar(true);
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const tax = getCartTotal() * 0.1;
    const grandTotal = getCartTotal() + tax;
    const drawerWidth = 280;

    if (cartItems.length === 0) {
        return (
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
                <CustomerNav cartCount={getCartCount()} />
                <Box sx={{ 
                    flexGrow: 1, 
                    ml: `frw{drawerWidth}px`,
                    width: `calc(100% - frw{drawerWidth}px)`
                }}>
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <CartIcon sx={{ fontSize: 100, color: '#2563eb', mb: 3, opacity: 0.3 }} />
                        <Typography variant="h4" gutterBottom>Your cart is empty</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Looks like you haven't added any medicines to your cart yet
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/customer/browse')}
                            startIcon={<ArrowBackIcon />}
                            sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)', px: 4, py: 1.5 }}
                        >
                            Browse Medicines
                        </Button>
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <CustomerNav cartCount={getCartCount()} />
            
            {/* Main Content - DIRECTLY ATTACHED to sidebar, NO SPACE */}
            <Box sx={{ 
                flexGrow: 1,
                ml: `frw{drawerWidth}px`,
                width: `calc(100% - ${drawerWidth}px)`,
                bgcolor: '#f8fafc',
                margin: 0,
                padding: 0
            }}>
                {/* Header - ATTACHED DIRECTLY to sidebar */}
                <Box sx={{ 
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    color: 'white',
                    px: 3,
                    py: 2,
                    margin: 0,
                    width: '100%'
                }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ m: 0 }}>
                        Shopping Cart
                    </Typography>
                </Box>

                {/* Cart Items Table - DIRECTLY ATTACHED to sidebar */}
                <Box sx={{ 
                    p: 2, 
                    margin: 0, 
                    width: '100%'
                }}>
                    <Grid container spacing={2} sx={{ m: 0, p: 0 }}>
                        {/* Cart Items Table */}
                        <Grid item xs={12} lg={8} sx={{ p: 0 }}>
                            <Paper sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 0 }}>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Product</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Price</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Qty</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Total</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {cartItems.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {item.brand_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.dosage} {item.dosage_form}
                                                            </Typography>
                                                            {item.generic_name && (
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Generic: {item.generic_name}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight="bold" color="#2563eb">
                                                            frw{item.price}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.stock_quantity)}
                                                                sx={{ bgcolor: '#f1f5f9', width: 26, height: 26 }}
                                                            >
                                                                <RemoveIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                            <TextField 
                                                                type="number" 
                                                                value={item.quantity} 
                                                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value), item.stock_quantity)} 
                                                                inputProps={{ 
                                                                    min: 1, 
                                                                    max: item.stock_quantity, 
                                                                    style: { textAlign: 'center', width: 40, padding: '4px' } 
                                                                }} 
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ width: 60 }}
                                                            />
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.stock_quantity)}
                                                                sx={{ bgcolor: '#f1f5f9', width: 26, height: 26 }}
                                                            >
                                                                <AddIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight="bold" color="#2563eb">
                                                            frw{(item.price * item.quantity).toFixed(2)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton 
                                                            onClick={() => handleRemoveItem(item.id, item.brand_name)} 
                                                            sx={{ color: '#ef4444', p: 0.25 }}
                                                            size="small"
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                            
                            {/* Continue Shopping Button */}
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={() => navigate('/customer/browse')}
                                    startIcon={<ArrowBackIcon />}
                                    sx={{ borderColor: '#2563eb', color: '#2563eb', textTransform: 'none' }}
                                >
                                    Continue Shopping
                                </Button>
                                {cartItems.length > 0 && (
                                    <Button 
                                        variant="text" 
                                        size="small"
                                        onClick={handleClearCart}
                                        startIcon={<ClearAllIcon />}
                                        sx={{ color: '#ef4444', textTransform: 'none' }}
                                    >
                                        Clear Cart
                                    </Button>
                                )}
                            </Box>
                        </Grid>

                        {/* Order Summary */}
                        <Grid item xs={12} lg={4} sx={{ p: 0, pl: 2 }}>
                            <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 0 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Order Summary
                                    </Typography>
                                    
                                    <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                                        {cartItems.map((item) => (
                                            <Box key={item.id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {item.brand_name}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="#2563eb">
                                                        frw{(item.price * item.quantity).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.dosage} {item.dosage_form} × {item.quantity}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    
                                    <Box sx={{ height: '1px', bgcolor: '#e2e8f0', my: 1 }} />
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                                        <Typography variant="body2">frw{getCartTotal().toFixed(2)}</Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
                                        <Chip label="FREE" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Tax (10%)</Typography>
                                        <Typography variant="body2">frw{tax.toFixed(2)}</Typography>
                                    </Box>
                                    
                                    <Box sx={{ height: '1px', bgcolor: '#e2e8f0', my: 1 }} />
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                                        <Typography variant="h6" fontWeight="bold" color="#2563eb">
                                            frw{grandTotal.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="medium"
                                        onClick={handleCheckout}
                                        disabled={loading}
                                        startIcon={<PaymentIcon />}
                                        sx={{ 
                                            background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
                                            py: 1,
                                            textTransform: 'none',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)'
                                            }
                                        }}
                                    >
                                        {loading ? 'Processing...' : 'Checkout'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ borderRadius: 2 }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Cart;