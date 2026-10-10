// src/pages/customer/HelpSupport.js
import React, { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Chat as ChatIcon,
    Article as ArticleIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import CustomerNav from '../../components/CustomerNav';
import api from '../../services/api';  // Use default api import instead of commentAPI

const HelpSupport = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        email: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const faqs = [
        {
            question: 'How do I place an order?',
            answer: 'Browse medicines, add to cart, proceed to checkout, enter delivery address, and confirm your order.'
        },
        {
            question: 'What payment methods are accepted?',
            answer: 'We accept Cash on Delivery (COD), Credit/Debit Cards, and Bank Transfers.'
        },
        {
            question: 'How long does delivery take?',
            answer: 'Delivery typically takes 2-4 business days depending on your location.'
        },
        {
            question: 'Can I cancel my order?',
            answer: 'Yes, you can cancel your order within 1 hour of placing it from the My Orders page.'
        },
        {
            question: 'How do I request a discount?',
            answer: 'Go to My Orders, find your pending order, and click "Request Discount" button.'
        },
        {
            question: 'How do I give feedback?',
            answer: 'After order completion, go to My Orders and click "Give Feedback" button.'
        }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmitSupport = async () => {
        if (!formData.subject || !formData.message) {
            toast.error('Please fill in both subject and message');
            return;
        }
        
        setLoading(true);
        
        try {
            // Format the data according to what your backend expects
            // The comment_text field is required, satisfaction_score is required
            const commentData = {
                comment_text: `[SUBJECT: ${formData.subject}]\n\n${formData.message}\n\nContact Email: ${formData.email || 'Not provided'}`,
                satisfaction_score: 3,  // Default neutral rating
                // If your model has an 'order' field, it might be optional
                // Don't send subject or email as separate fields if they don't exist in the model
            };
            
            console.log('Sending data to backend:', commentData);
            
            const response = await api.post('/comments/', commentData);
            
            console.log('Response:', response.data);
            
            setSnackbar({ 
                open: true, 
                message: 'Support ticket submitted successfully! We will contact you soon.', 
                severity: 'success' 
            });
            setFormData({ subject: '', message: '', email: '' });
            
        } catch (error) {
            console.error('Error submitting support ticket:', error);
            console.error('Error response data:', error.response?.data);
            
            // Show more specific error message from backend
            const errorMessage = error.response?.data?.comment_text?.[0] || 
                                error.response?.data?.satisfaction_score?.[0] ||
                                error.response?.data?.error ||
                                'Failed to submit support ticket. Please try again.';
            
            toast.error(errorMessage);
            
            setSnackbar({ 
                open: true, 
                message: errorMessage, 
                severity: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const drawerWidth = 280;

    return (
        <>
            <CustomerNav />
            <Box sx={{ ml: { md: `${drawerWidth}px` }, p: { xs: 2, md: 4 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
                <Container maxWidth="lg">
                    {/* Header */}
                    <Paper sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <Typography variant="h4" fontWeight="bold">Help & Support</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Get help with your orders, account, and more</Typography>
                    </Paper>

                    <Grid container spacing={3}>
                        {/* Contact Options */}
                        <Grid item xs={12}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#667eea' }}>How can we help you?</Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: 3, textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }, transition: 'all 0.3s ease' }}>
                                <EmailIcon sx={{ fontSize: 50, color: '#667eea', mb: 1 }} />
                                <Typography variant="h6">Email Support</Typography>
                                <Typography variant="body2" color="text.secondary">support@medistore.com</Typography>
                                <Typography variant="caption">Response within 24 hours</Typography>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: 3, textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }, transition: 'all 0.3s ease' }}>
                                <PhoneIcon sx={{ fontSize: 50, color: '#667eea', mb: 1 }} />
                                <Typography variant="h6">Phone Support</Typography>
                                <Typography variant="body2" color="text.secondary">+1 (800) 123-4567</Typography>
                                <Typography variant="caption">Mon-Fri, 9AM-6PM</Typography>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: 3, textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }, transition: 'all 0.3s ease' }}>
                                <ChatIcon sx={{ fontSize: 50, color: '#667eea', mb: 1 }} />
                                <Typography variant="h6">Live Chat</Typography>
                                <Typography variant="body2" color="text.secondary">Available 24/7</Typography>
                                <Typography variant="caption">Instant responses</Typography>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        {/* FAQ Section */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#667eea' }}>
                                        <ArticleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Frequently Asked Questions
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {faqs.map((faq, index) => (
                                        <Accordion key={index} sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle2" fontWeight="500">{faq.question}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Typography variant="body2" color="text.secondary">{faq.answer}</Typography>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Contact Form */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#667eea' }}>
                                        <SendIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Send us a Message
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    
                                    <TextField
                                        fullWidth
                                        label="Subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        margin="normal"
                                        placeholder="What is your issue about?"
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        margin="normal"
                                        placeholder="your@email.com"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Message"
                                        name="message"
                                        multiline
                                        rows={5}
                                        value={formData.message}
                                        onChange={handleChange}
                                        margin="normal"
                                        placeholder="Please describe your issue in detail..."
                                        required
                                    />
                                    
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleSubmitSupport}
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                                        sx={{ mt: 2, borderRadius: 2 }}
                                    >
                                        {loading ? 'Sending...' : 'Submit Ticket'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
            </Snackbar>
        </>
    );
};

export default HelpSupport;