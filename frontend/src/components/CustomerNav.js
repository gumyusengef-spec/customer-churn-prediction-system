// src/components/CustomerNav.js
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Divider,
    Typography,
    IconButton,
    Badge,
    AppBar,
    Toolbar,
    useMediaQuery,
    useTheme as useMuiTheme
} from '@mui/material';
import {
    ShoppingCart as CartIcon,
    Logout as LogoutIcon,
    LocalHospital as MedicineIcon,
    Menu as MenuIcon,
    Store as StoreIcon,
    Person as PersonIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CustomerNav = ({ cartCount }) => {
    const navigate = useNavigate();
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
    const { user, logout } = useContext(AuthContext);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully!');
        navigate('/');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const firstName = user?.first_name || user?.username?.split('@')[0] || 'Customer';
    const userEmail = user?.email || 'customer@example.com';

    const mainMenuItems = [
        { text: 'Browse Medicines', icon: <MedicineIcon />, path: '/customer/browse' },
        { text: 'My Cart', icon: <CartIcon />, path: '/customer/cart', badge: cartCount },
        { text: 'My Orders', icon: <StoreIcon />, path: '/customer/orders' },
    ];

    // REMOVED Help & Support - only Profile Settings remains
    const bottomMenuItems = [
        { text: 'Profile Settings', icon: <SettingsIcon />, path: '/customer/profile' },
    ];

    const drawerWidth = 280;

    const drawerContent = (
        <Box sx={{ height: '100%', bgcolor: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column' }}>
            {/* Profile Header - Reduced padding */}
            <Box sx={{ 
                p: 2, 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            }}>
                <Avatar 
                    sx={{ 
                        width: 70, 
                        height: 70, 
                        mx: 'auto', 
                        mb: 1,
                        border: '2px solid rgba(255,255,255,0.3)',
                        fontSize: '1.75rem',
                        fontWeight: 'bold',
                        bgcolor: 'rgba(255,255,255,0.2)'
                    }}
                >
                    {firstName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold">
                    {firstName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {userEmail}
                </Typography>
                <Box sx={{ mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.3, borderRadius: 3 }}>
                    <PersonIcon sx={{ fontSize: 10 }} />
                    <Typography variant="caption">Customer</Typography>
                </Box>
            </Box>
            
            {/* Main Menu - Reduced spacing */}
            <List sx={{ mt: 1, px: 1.5 }}>
                {mainMenuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                        }}
                        sx={{
                            mb: 0.5,
                            borderRadius: 1.5,
                            '&:hover': {
                                bgcolor: 'rgba(37, 99, 235, 0.2)',
                            },
                            bgcolor: window.location.pathname === item.path ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
                            py: 0.75
                        }}
                    >
                        <ListItemIcon sx={{ color: '#3b82f6', minWidth: 36 }}>
                            {item.badge !== undefined ? (
                                <Badge badgeContent={item.badge} color="error">
                                    {item.icon}
                                </Badge>
                            ) : (
                                item.icon
                            )}
                        </ListItemIcon>
                        <ListItemText 
                            primary={item.text} 
                            sx={{ 
                                '& .MuiTypography-root': { 
                                    fontWeight: 500, 
                                    fontSize: '0.9rem',
                                    color: 'white' 
                                } 
                            }} 
                        />
                    </ListItem>
                ))}
            </List>
            
            <Divider sx={{ mx: 1.5, my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
            
            {/* Bottom Menu - Only Profile Settings, no Help & Support */}
            <List sx={{ px: 1.5 }}>
                {bottomMenuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                        }}
                        sx={{
                            mb: 0.5,
                            borderRadius: 1.5,
                            '&:hover': {
                                bgcolor: 'rgba(37, 99, 235, 0.2)',
                            },
                            py: 0.75
                        }}
                    >
                        <ListItemIcon sx={{ color: '#3b82f6', minWidth: 36 }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                            primary={item.text} 
                            sx={{ 
                                '& .MuiTypography-root': { 
                                    fontWeight: 500, 
                                    fontSize: '0.9rem',
                                    color: 'white' 
                                } 
                            }} 
                        />
                    </ListItem>
                ))}
            </List>
            
            {/* Logout Button */}
            <Box sx={{ p: 1.5, mt: 'auto' }}>
                <ListItem 
                    button 
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 1.5,
                        '&:hover': {
                            bgcolor: 'rgba(244, 67, 54, 0.2)',
                        },
                        py: 0.75
                    }}
                >
                    <ListItemIcon sx={{ color: '#f44336', minWidth: 36 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Logout" 
                        sx={{ 
                            '& .MuiTypography-root': { 
                                fontWeight: 500, 
                                fontSize: '0.9rem',
                                color: '#f44336' 
                            } 
                        }} 
                    />
                </ListItem>
            </Box>
        </Box>
    );

    return (
        <>
            {/* Mobile App Bar */}
            {isMobile && (
                <AppBar 
                    position="sticky" 
                    sx={{ 
                        bgcolor: '#1a1a2e',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        zIndex: 1200
                    }}
                >
                    <Toolbar>
                        <IconButton color="inherit" onClick={handleDrawerToggle}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 700 }}>
                            MediStore
                        </Typography>
                        <IconButton color="inherit" onClick={() => navigate('/customer/cart')}>
                            <Badge badgeContent={cartCount} color="error">
                                <CartIcon />
                            </Badge>
                        </IconButton>
                    </Toolbar>
                </AppBar>
            )}

            {/* Desktop Sidebar */}
            {!isMobile && (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            borderRight: 'none',
                            background: '#1a1a2e',
                            position: 'fixed',
                            height: '100vh',
                            top: 0,
                            left: 0
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Mobile Drawer */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': { 
                            width: drawerWidth, 
                            boxSizing: 'border-box',
                            background: '#1a1a2e'
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
};

export default CustomerNav;