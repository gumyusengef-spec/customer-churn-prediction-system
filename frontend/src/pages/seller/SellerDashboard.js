import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Paper
} from '@mui/material';
import {
    Medication as MedicineIcon,
    ShoppingCart as OrderIcon,
    People as CustomerIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { medicineAPI, orderAPI, customerAPI } from '../../services/api';

const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card
        onClick={onClick}
        sx={{
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
            '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.13)',
            },
        }}
    >
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography color="text.secondary" gutterBottom variant="overline">
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        {value}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        backgroundColor: color,
                        borderRadius: '50%',
                        width: 56,
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalMedicines: 0,
        lowStock: 0,
        totalOrders: 0,
        totalCustomers: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const medicinesResponse = await medicineAPI.getAll();
            const medicines = medicinesResponse.data.results || medicinesResponse.data;

            const ordersResponse = await orderAPI.getAll();
            const orders = ordersResponse.data.results || ordersResponse.data;

            const customersResponse = await customerAPI.getAnalytics();
            const customers = customersResponse.data;

            setStats({
                totalMedicines: medicines.length,
                lowStock: medicines.filter(m => m.stock_quantity < 10).length,
                totalOrders: orders.length,
                totalCustomers: customers.length,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
            try {
                const medicinesResponse = await medicineAPI.getAll();
                const medicines = medicinesResponse.data.results || medicinesResponse.data;
                setStats(prev => ({
                    ...prev,
                    totalMedicines: medicines.length,
                    lowStock: medicines.filter(m => m.stock_quantity < 10).length,
                }));
            } catch (err) {
                console.error('Error loading medicines:', err);
            }
        }
    };

    return (
        <DashboardLayout title="Dashboard">

            {/* ── Fixed top header bar ── */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 240,
                    right: 0,
                    zIndex: 99,
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    px: 4,
                    py: 2.5,
                    color: 'white',
                }}
            >
                <Typography variant="h5" fontWeight="bold">
                    Dashboard Overview
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    Welcome back! Here's a summary of your store activity.
                </Typography>
            </Box>

            {/* ── Push content below the fixed bar ── */}
            <Box sx={{ mt: '80px' }}>

                {/* ── Stat cards ── */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Medicines"
                            value={stats.totalMedicines}
                            icon={<MedicineIcon />}
                            color="#1976d2"
                            onClick={() => navigate('/seller/medicines')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Low Stock Alerts"
                            value={stats.lowStock}
                            icon={<WarningIcon />}
                            color="#f44336"
                            onClick={() => navigate('/seller/medicines')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Orders"
                            value={stats.totalOrders}
                            icon={<OrderIcon />}
                            color="#4caf50"
                            onClick={() => navigate('/seller/orders')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Customers"
                            value={stats.totalCustomers}
                            icon={<CustomerIcon />}
                            color="#ff9800"
                            onClick={() => navigate('/seller/customers')}
                        />
                    </Grid>
                </Grid>

                {/* ── Quick actions ── */}
                <Paper sx={{ mt: 4, p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                        Quick Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Use the sidebar to manage your medicines, orders, and customers.
                    </Typography>
                </Paper>

            </Box>
        </DashboardLayout>
    );
};

export default SellerDashboard;