import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Box,
    Typography,
    Divider,
    Avatar,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Medication as MedicineIcon,
    ShoppingCart as OrderIcon,
    People as CustomerIcon,
    LocalOffer as DiscountIcon,
    Comment as FeedbackIcon,
    Logout as LogoutIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useContext(AuthContext);

    const menuItems = [
        { text: 'Dashboard',  icon: <DashboardIcon />, path: '/seller/dashboard' },
        { text: 'Medicines',  icon: <MedicineIcon />,  path: '/seller/medicines' },
        { text: 'Orders',     icon: <OrderIcon />,     path: '/seller/orders' },
        { text: 'Customers',  icon: <CustomerIcon />,  path: '/seller/customers' },
        { text: 'Discounts',  icon: <DiscountIcon />,  path: '/seller/discounts' },
        { text: 'Feedback',   icon: <FeedbackIcon />,  path: '/seller/feedback' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const firstName = user?.first_name || user?.username || 'Seller';

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a1a2e' }}>

            {/* ── Profile header ── */}
            <Box sx={{
                p: 2.5,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            }}>
                <Avatar sx={{
                    width: 64, height: 64, mx: 'auto', mb: 1,
                    border: '2px solid rgba(255,255,255,0.3)',
                    fontSize: '1.5rem', fontWeight: 'bold',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                }}>
                    {firstName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white' }}>
                    {firstName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    {user?.email || ''}
                </Typography>
                <Box sx={{
                    mt: 0.75, display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.3, borderRadius: 3,
                }}>
                    <PersonIcon sx={{ fontSize: 10, color: 'white' }} />
                    <Typography variant="caption" sx={{ color: 'white' }}>Seller Portal</Typography>
                </Box>
            </Box>

            {/* ── Main menu ── */}
            <List sx={{ mt: 1, px: 1.5, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => {
                                    navigate(item.path);
                                    if (mobileOpen) handleDrawerToggle();
                                }}
                                sx={{
                                    borderRadius: 1.5,
                                    py: 0.75,
                                    bgcolor: isActive ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
                                    '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.2)' },
                                    '&.Mui-selected': { bgcolor: 'rgba(37, 99, 235, 0.3)' },
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? '#60a5fa' : '#3b82f6', minWidth: 36 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{ '& .MuiTypography-root': { fontWeight: isActive ? 600 : 500, fontSize: '0.9rem', color: 'white' } }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ mx: 1.5, bgcolor: 'rgba(255,255,255,0.1)' }} />

            {/* ── Logout ── */}
            <List sx={{ px: 1.5, py: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={handleLogout}
                        sx={{
                            borderRadius: 1.5, py: 0.75,
                            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' },
                        }}
                    >
                        <ListItemIcon sx={{ color: '#f44336', minWidth: 36 }}>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Logout"
                            sx={{ '& .MuiTypography-root': { fontWeight: 500, fontSize: '0.9rem', color: '#f44336' } }}
                        />
                    </ListItemButton>
                </ListItem>
            </List>

        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>

            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        bgcolor: '#1a1a2e',
                        borderRight: 'none',
                    },
                }}
            >
                {drawer}
            </Drawer>

            {/* Desktop drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        bgcolor: '#1a1a2e',
                        borderRight: 'none',
                    },
                }}
                open
            >
                {drawer}
            </Drawer>

        </Box>
    );
};

export default Sidebar;