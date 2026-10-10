import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Grid,
    MenuItem,
    Box,
    Alert,
    Stepper,
    Step,
    StepLabel,
    IconButton,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    FormHelperText
} from '@mui/material';
import { Visibility, VisibilityOff, Store, Email, Phone, LocationOn, VpnKey, Info } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState('customer');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        pharmacy_name: '',
        address: '',
        contract_type: '',
        password_hint: '',
        password: '',
        password2: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const steps = ['Account Information', 'Business Details', 'Security Setup'];

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setError('');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleNext = () => {
        if (activeStep === 0) {
            if (!formData.email || !formData.phone) {
                setError('Please fill all required fields');
                return;
            }
            if (!formData.email.includes('@')) {
                setError('Please enter a valid email address');
                return;
            }
        }
        if (activeStep === 1) {
            if (!formData.pharmacy_name || !formData.address) {
                setError('Please fill all required fields');
                return;
            }
            if (selectedRole === 'customer' && !formData.contract_type) {
                setError('Please select a contract type');
                return;
            }
        }
        setError('');
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password2) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (!formData.password_hint) {
            setError('Please provide a password hint');
            return;
        }

        setLoading(true);
        try {
            // Prepare data without username - using email only
            const registrationData = {
                email: formData.email,
                password_hint: formData.password_hint,
                password: formData.password,
                password2: formData.password2,
                phone: formData.phone,
                address: formData.address,
                pharmacy_name: formData.pharmacy_name
            };

            // Add contract_type only for customers
            if (selectedRole === 'customer') {
                registrationData.contract_type = formData.contract_type;
                await authAPI.registerCustomer(registrationData);
            } else {
                await authAPI.registerSeller(registrationData);
            }
            
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            console.error('Registration error:', err);
            const errorData = err.response?.data;
            let errorMsg = 'Registration failed';
            
            if (errorData) {
                if (typeof errorData === 'object') {
                    const errors = [];
                    Object.keys(errorData).forEach(key => {
                        if (Array.isArray(errorData[key])) {
                            errors.push(`${key}: ${errorData[key].join(', ')}`);
                        } else if (typeof errorData[key] === 'object') {
                            errors.push(`${key}: ${JSON.stringify(errorData[key])}`);
                        } else {
                            errors.push(`${key}: ${errorData[key]}`);
                        }
                    });
                    errorMsg = errors.join(', ');
                } else if (typeof errorData === 'string') {
                    errorMsg = errorData;
                } else if (errorData.error) {
                    errorMsg = errorData.error;
                }
            }
            
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="your@email.com"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="+1234567890"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={selectedRole === 'seller' ? "Business Name" : "Pharmacy Name"}
                                name="pharmacy_name"
                                value={formData.pharmacy_name}
                                onChange={handleChange}
                                required
                                placeholder={selectedRole === 'seller' ? "Enter your business name" : "Enter your pharmacy name"}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Store color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                multiline
                                rows={3}
                                value={formData.address}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full business address"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationOn color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        {selectedRole === 'customer' && (
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Contract Type</InputLabel>
                                    <Select
                                        name="contract_type"
                                        value={formData.contract_type}
                                        onChange={handleChange}
                                        label="Contract Type"
                                    >
                                        <MenuItem value="">Select Contract Type</MenuItem>
                                        <MenuItem value="month-to-month">
                                            <Box>
                                                <Typography variant="body1"> Month-to-Month</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Cancel anytime - Flexible
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="1-year">
                                            <Box>
                                                <Typography variant="body1"> 1-Year Contract</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                     regular customers
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="2-year">
                                            <Box>
                                                <Typography variant="body1"> 2-Year Contract</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Best value
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="prepaid">
                                            <Box>
                                                <Typography variant="body1"> Prepaid</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Pay as you go
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="postpaid">
                                            <Box>
                                                <Typography variant="body1"> Postpaid</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Pay at end of month
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                    <FormHelperText>Choose your subscription plan</FormHelperText>
                                </FormControl>
                            </Grid>
                        )}
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Password Hint"
                                name="password_hint"
                                value={formData.password_hint}
                                onChange={handleChange}
                                required
                                placeholder="e.g., My favorite pet's name, My birth city"
                                helperText="A hint to help you remember your password if you forget it"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Info color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Create a strong password"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VpnKey color="primary" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                helperText="Password must be at least 6 characters"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                name="password2"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.password2}
                                onChange={handleChange}
                                required
                                placeholder="Confirm your password"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <VpnKey color="primary" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            default:
                return 'Unknown step';
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper 
                elevation={6} 
                sx={{ 
                    p: 4, 
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography 
                        variant="h4" 
                        gutterBottom 
                        sx={{ 
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Create Your Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Join MediStore and start ordering medicines online
                    </Typography>
                </Box>

                {/* Role Selection Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                    <Button
                        variant={selectedRole === 'customer' ? 'contained' : 'outlined'}
                        onClick={() => handleRoleChange('customer')}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            background: selectedRole === 'customer' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Customer
                    </Button>
                    <Button
                        variant={selectedRole === 'seller' ? 'contained' : 'outlined'}
                        onClick={() => handleRoleChange('seller')}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            background: selectedRole === 'seller' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Seller
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <form onSubmit={handleSubmit}>
                    {getStepContent(activeStep)}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                            sx={{ 
                                borderRadius: 2,
                                px: 4,
                                '&:hover': {
                                    transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Back
                        </Button>
                        {activeStep === steps.length - 1 ? (
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{ 
                                    borderRadius: 2,
                                    px: 4,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {loading ? 'Registering...' : 'Register'}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                variant="contained"
                                sx={{ 
                                    borderRadius: 2,
                                    px: 4,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </form>

                <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body2">
                        Already have an account?{' '}
                        <Link 
                            to="/login" 
                            style={{ 
                                textDecoration: 'none', 
                                color: '#667eea',
                                fontWeight: 600
                            }}
                        >
                            Login here
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default RegisterPage;