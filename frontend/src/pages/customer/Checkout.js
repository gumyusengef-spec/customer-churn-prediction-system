// src/pages/customer/Checkout.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    Grid,
    Divider,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Snackbar,
    Paper,
    Container
} from '@mui/material';
import {
    Payment as PaymentIcon,
    ShoppingCart as CartIcon,
    CheckCircle as CheckCircleIcon,
    ArrowBack as ArrowBackIcon,
    LocationOn as LocationIcon,
    Note as NoteIcon,
    Store as StoreIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import CustomerNav from '../../components/CustomerNav';
import { CartContext } from '../../context/CartContext';
import { orderAPI } from '../../services/api';

const steps = ['Review Cart', 'Delivery Details', 'Confirmation'];

/* ─── PageWrapper moved OUTSIDE Checkout so it is never remounted on re-render ── */
const PageWrapper = ({ children, cartCount, onBack }) => (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <CustomerNav cartCount={cartCount} />

        <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', overflow: 'auto' }}>
            {/* Page header */}
            <Box sx={{
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Checkout</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Complete your order securely</Typography>
                </Box>
                <Button
                    variant="outlined"
                    onClick={onBack}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        color: 'white', borderColor: 'white',
                        '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    Back to Cart
                </Button>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 } }}>{children}</Box>
        </Box>
    </Box>
);

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, clearCart, getCartCount } = useContext(CartContext);
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({ delivery_address: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [orderPlaced, setOrderPlaced] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleNext = () => {
        if (activeStep === 0 && cartItems.length === 0) {
            setSnackbarMessage('Your cart is empty! Add some items first.');
            setOpenSnackbar(true);
            return;
        }
        if (activeStep === 1 && !formData.delivery_address) {
            setSnackbarMessage('Please enter your delivery address');
            setOpenSnackbar(true);
            return;
        }
        if (activeStep === 2) {
            handlePlaceOrder();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) { toast.error('Your cart is empty'); return; }
        setLoading(true);
        try {
            const orderData = {
                seller_id: cartItems[0]?.seller || 1,
                total_amount: getCartTotal(),
                delivery_address: formData.delivery_address,
                notes: formData.notes,
                items: cartItems.map(item => ({
                    medicine_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    subtotal: item.price * item.quantity,
                })),
            };
            await orderAPI.create(orderData);
            setOrderPlaced(true);
            setActiveStep(3);
            clearCart();
            setSnackbarMessage('Order placed successfully!');
            setOpenSnackbar(true);
            setTimeout(() => navigate('/customer/orders'), 2000);
        } catch (error) {
            console.error('Order error:', error);
            toast.error('Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    const grandTotal = getCartTotal();

    // Empty cart state
    if (cartItems.length === 0 && activeStep === 0 && !orderPlaced) {
        return (
            <PageWrapper cartCount={getCartCount()} onBack={() => navigate('/customer/cart')}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <Card sx={{ p: 6, textAlign: 'center', maxWidth: 450, borderRadius: 4 }}>
                        <CartIcon sx={{ fontSize: 80, color: '#667eea', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h5" color="text.secondary" gutterBottom>Your cart is empty</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Add some medicines to your cart before checking out
                        </Typography>
                        <Button variant="contained" onClick={() => navigate('/customer/browse')} startIcon={<ArrowBackIcon />}>
                            Browse Medicines
                        </Button>
                    </Card>
                </Box>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper cartCount={getCartCount()} onBack={() => navigate('/customer/cart')}>
            <Container maxWidth="md">
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}><StepLabel>{label}</StepLabel></Step>
                    ))}
                </Stepper>

                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

                    {/* Step 0 — Review Cart */}
                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3, color: '#667eea' }}>
                                Order Summary
                            </Typography>
                            {cartItems.map((item) => (
                                <Box key={item.id} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={7}>
                                            <Typography variant="body1" fontWeight="bold" sx={{ color: '#1a1a2e' }}>
                                                {item.brand_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.dosage} {item.dosage_form}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                                Qty: {item.quantity}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body1" fontWeight="bold" color="#667eea" align="right">
                                                frw {(item.price * item.quantity).toFixed(2)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body1" color="text.secondary">Subtotal ({getCartCount()} items)</Typography>
                                <Typography variant="body1" fontWeight="bold">frw {getCartTotal().toFixed(2)}</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#667eea' }}>Total Amount</Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ color: '#667eea' }}>frw {grandTotal.toFixed(2)}</Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Step 1 — Delivery Details */}
                    {activeStep === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3, color: '#667eea' }}>
                                Delivery Information
                            </Typography>
                            <TextField
                                fullWidth label="Delivery Address" name="delivery_address"
                                multiline rows={3} value={formData.delivery_address}
                                onChange={handleChange} required margin="normal"
                                placeholder="Enter your complete delivery address"
                                InputProps={{ startAdornment: <LocationIcon sx={{ mr: 1, color: '#667eea' }} /> }}
                            />
                            <TextField
                                fullWidth label="Additional Notes (Optional)" name="notes"
                                multiline rows={2} value={formData.notes}
                                onChange={handleChange} margin="normal"
                                placeholder="Any special instructions for delivery?"
                                InputProps={{ startAdornment: <NoteIcon sx={{ mr: 1, color: '#667eea' }} /> }}
                            />
                        </Box>
                    )}

                    {/* Step 2 — Confirmation */}
                    {activeStep === 2 && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            {orderPlaced ? (
                                <>
                                    <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
                                    <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: '#667eea' }}>
                                        Order Placed Successfully!
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Thank you for your purchase.</Typography>
                                    <Button variant="contained" onClick={() => navigate('/customer/orders')}>View My Orders</Button>
                                </>
                            ) : (
                                <>
                                    <PaymentIcon sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />
                                    <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: '#667eea' }}>
                                        Confirm Your Order
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Please review your order before confirming
                                    </Typography>
                                    <Paper sx={{ p: 3, textAlign: 'left', bgcolor: '#f8f9ff', borderRadius: 3, mb: 3 }}>
                                        {cartItems.map((item) => (
                                            <Box key={item.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                                                <Typography variant="body1" fontWeight="bold">{item.brand_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.dosage} {item.dosage_form}</Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">Qty: {item.quantity}</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="#667eea">
                                                        frw {(item.price * item.quantity).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                        <Divider sx={{ my: 2 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                            <Typography variant="h6" fontWeight="bold">Grand Total</Typography>
                                            <Typography variant="h6" fontWeight="bold" color="#667eea">frw {grandTotal.toFixed(2)}</Typography>
                                        </Box>
                                    </Paper>
                                    <Typography variant="caption" color="text.secondary">
                                        <StoreIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                        Payment will be collected upon delivery
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}

                    {activeStep !== 2 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                            <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">Back</Button>
                            <Button variant="contained" onClick={handleNext} disabled={loading}>
                                {loading ? 'Processing...' : activeStep === 1 ? 'Review Order' : 'Next'}
                            </Button>
                        </Box>
                    )}
                    {activeStep === 2 && !orderPlaced && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Button variant="contained" onClick={handlePlaceOrder} disabled={loading} size="large">
                                {loading ? 'Placing Order...' : 'Confirm Order'}
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Container>

            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
                <Alert severity="success">{snackbarMessage}</Alert>
            </Snackbar>
        </PageWrapper>
    );
};

export default Checkout;