// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Email, VpnKey } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.username, formData.password);

        if (result.success) {
            if (result.user.user_type === 'seller') {
                toast.success('Login successful! Welcome seller!');
                navigate('/seller/dashboard');  // Fixed: Changed from '/seller/SellerDashboard' to '/seller/dashboard'
            } 
            else if (result.user.user_type === 'customer') {
                toast.success('Login successful! Welcome customer!');
                navigate('/customer/browse');
            }
            else if (result.user.user_type === 'admin') {
                toast.success('Login successful! Welcome admin!');
                navigate('/admin/dashboard');
            }
            else {
                setError('Invalid user type');
                toast.error('Invalid user type');
            }
        } else {
            setError(result.error);
            toast.error(result.error);
        }

        setLoading(false);
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
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
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Login to your account
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                        required
                        placeholder="Enter your email or username"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email color="primary" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                        placeholder="Enter your password"
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
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ 
                            mt: 3, 
                            mb: 2,
                            py: 1.5,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>

                    <Box textAlign="center">
                        <Typography variant="body2">
                            Don't have an account?{' '}
                            <Link 
                                to="/register" 
                                style={{ 
                                    textDecoration: 'none', 
                                    color: '#667eea',
                                    fontWeight: 600
                                }}
                            >
                                Register here
                            </Link>
                        </Typography>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default LoginPage;