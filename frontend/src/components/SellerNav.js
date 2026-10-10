// frontend/src/components/SellerNav.js
import React, { useContext } from 'react';
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
    AppBar,
    Toolbar,
    IconButton,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    ShoppingCart as OrdersIcon,
    LocalOffer as DiscountIcon,
    Feedback as FeedbackIcon,
    People as CustomersIcon,
    Assessment as ReportIcon,  // ADD THIS
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Store as StoreIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SellerNav = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, logout } = useContext(AuthContext);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully!');
        navigate('/');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const firstName = user?.first_name || user?.username?.split('@')[0] || 'Seller';
    const userEmail = user?.email || 'seller@example.com';

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/seller/dashboard' },
        { text: 'Medicines', icon: <InventoryIcon />, path: '/seller/medicines' },
        { text: 'Orders', icon: <OrdersIcon />, path: '/seller/orders' },
        { text: 'Discounts', icon: <DiscountIcon />, path: '/seller/discounts' },
        { text: 'Feedback', icon: <FeedbackIcon />, path: '/seller/feedback' },
        { text: 'Customers', icon: <CustomersIcon />, path: '/seller/customers' },
        { text: 'Churn Report', icon: <ReportIcon />, path: '/seller/churn-report' }, // ADD THIS LINE
    ];

    const drawerWidth = 280;

    const drawerContent = (
        <Box sx={{ height: '100%', bgcolor: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '3px solid rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.2)' }}>
                    {firstName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">{firstName}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{userEmail}</Typography>
                <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 5 }}>
                    <StoreIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption">Seller</Typography>
                </Box>
            </Box>
            
            <List sx={{ mt: 2, px: 2 }}>
                {menuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text} 
                        onClick={() => { navigate(item.path); setMobileOpen(false); }} 
                        sx={{ 
                            mb: 1, 
                            borderRadius: 2, 
                            '&:hover': { bgcolor: 'rgba(102,126,234,0.2)' }, 
                            bgcolor: window.location.pathname === item.path ? 'rgba(102,126,234,0.3)' : 'transparent' 
                        }}
                    >
                        <ListItemIcon sx={{ color: '#667eea', minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontWeight: 500, color: 'white' } }} />
                    </ListItem>
                ))}
            </List>
            
            <Divider sx={{ mx: 2, my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
            
            <Box sx={{ p: 2, mt: 'auto' }}>
                <ListItem button onClick={handleLogout} sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(244,67,54,0.2)' } }}>
                    <ListItemIcon sx={{ color: '#f44336', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { fontWeight: 500, color: '#f44336' } }} />
                </ListItem>
            </Box>
        </Box>
    );

    return (
        <>
            {isMobile && (
                <AppBar position="sticky" sx={{ bgcolor: '#1a1a2e', zIndex: 1200 }}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={handleDrawerToggle}><MenuIcon /></IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>Seller Panel</Typography>
                    </Toolbar>
                </AppBar>
            )}

            {!isMobile && (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            bgcolor: '#1a1a2e',
                            position: 'fixed',
                            height: '100vh',
                            borderRight: 'none'
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            )}

            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    sx={{ '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#1a1a2e' } }}
                >
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
};

export default SellerNav;