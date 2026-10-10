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
    Alert
} from '@mui/material';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CustomerRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password_hint: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        gender: '',
        dob: '',
        contract_type: ''
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

        if (formData.password !== formData.password2) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await authAPI.registerCustomer(formData);
            toast.success('Registration successful! Please login.');
            navigate('/customer/login');
        } catch (err) {
            const errorData = err.response?.data;
            const errorMsg = typeof errorData === 'object'
                ? Object.values(errorData).flat().join(', ')
                : errorData?.error || 'Registration failed';
            setError(errorMsg);
            toast.error('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Customer Registration
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Create your customer account to browse and order medicines
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Password Hint"
                                name="password_hint"
                                value={formData.password_hint}
                                onChange={handleChange}
                                required
                                helperText="A hint to help you remember your password"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                multiline
                                rows={2}
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Contract Type"
                                name="contract_type"
                                value={formData.contract_type}
                                onChange={handleChange}
                                required
                                helperText="Choose your subscription plan"
                            >
                                <MenuItem value="month-to-month">Month-to-Month </MenuItem>
                                <MenuItem value="1-year">1-Year Contract</MenuItem>
                                <MenuItem value="2-year">2-Year Contract</MenuItem>
                                <MenuItem value="prepaid">Prepaid</MenuItem>
                                <MenuItem value="postpaid">Postpaid</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                name="password2"
                                type="password"
                                value={formData.password2}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </Button>

                    <Box textAlign="center">
                        <Typography variant="body2">
                            Already have an account?{' '}
                            <Link to="/customer/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                                Login here
                            </Link>
                        </Typography>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default CustomerRegister;