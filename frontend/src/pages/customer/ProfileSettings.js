// src/pages/customer/ProfileSettings.js
import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Divider,
    Alert,
    Snackbar,
    Card,
    CardContent,
    IconButton,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    VpnKey as PasswordIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import CustomerNav from '../../components/CustomerNav';
import { AuthContext } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const ProfileSettings = () => {
    const { user, updateUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
    });
    
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            // Try to update profile
            const response = await authAPI.updateProfile(formData);
            if (updateUser) {
                updateUser(response.data);
            }
            toast.success('Profile updated successfully!');
            setEditMode(false);
        } catch (error) {
            console.error('Update profile error:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to update profile';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordData.new_password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (!passwordData.current_password) {
            toast.error('Please enter your current password');
            return;
        }
        
        setLoading(true);
        try {
            await authAPI.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            toast.success('Password changed successfully!');
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            console.error('Change password error:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to change password';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const drawerWidth = 280;

    return (
        <>
            <CustomerNav />
            <Box sx={{ ml: { md: `${drawerWidth}px` }, p: { xs: 2, md: 4 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
                <Container maxWidth="lg">
                    {/* Header */}
                    <Paper sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <Typography variant="h4" fontWeight="bold">Profile Settings</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Manage your account information and security settings</Typography>
                    </Paper>

                    <Grid container spacing={3}>
                        {/* Profile Information Section */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea' }}>
                                            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Personal Information
                                        </Typography>
                                        <IconButton onClick={() => setEditMode(!editMode)} sx={{ color: '#667eea' }}>
                                            <EditIcon />
                                        </IconButton>
                                    </Box>
                                    <Divider sx={{ mb: 3 }} />
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="First Name"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Last Name"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Email Address"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={!editMode}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>
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
                                                disabled={!editMode}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment>
                                                }}
                                            />
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
                                                disabled={!editMode}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><LocationOnIcon /></InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                    
                                    {editMode && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleUpdateProfile}
                                            disabled={loading}
                                            startIcon={<SaveIcon />}
                                            sx={{ mt: 3, borderRadius: 2 }}
                                        >
                                            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Change Password Section */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea', mb: 3 }}>
                                        <PasswordIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Change Password
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    
                                    <TextField
                                        fullWidth
                                        label="Current Password"
                                        name="current_password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        margin="normal"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><PasswordIcon /></InputAdornment>,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        name="new_password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        margin="normal"
                                        helperText="Password must be at least 6 characters"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><PasswordIcon /></InputAdornment>,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Confirm New Password"
                                        name="confirm_password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        margin="normal"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><PasswordIcon /></InputAdornment>
                                        }}
                                    />
                                    
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleChangePassword}
                                        disabled={loading}
                                        sx={{ mt: 3, borderRadius: 2 }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Change Password'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </>
    );
};

export default ProfileSettings;