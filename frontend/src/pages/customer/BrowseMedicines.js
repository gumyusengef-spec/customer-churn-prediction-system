// src/pages/customer/BrowseMedicines.js
import React, { useState, useEffect, useContext } from 'react';
import {
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    TextField,
    MenuItem,
    Box,
    Chip,
    InputAdornment,
    IconButton,
    Pagination,
    Skeleton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Badge,
    Avatar,
    AppBar,
    Toolbar,
    useMediaQuery,
    ThemeProvider,
    createTheme
} from '@mui/material';
import { 
    ShoppingCart as CartIcon, 
    Search as SearchIcon,
    LocalOffer as OfferIcon,
    Inventory as StockIcon,
    Clear as ClearIcon,
    TrendingUp as TrendingIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Store as StoreIcon,
    Logout as LogoutIcon,
    LocalHospital as MedicineIcon,
    Menu as MenuIcon,
    Person as PersonIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { medicineAPI } from '../../services/api';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2563eb',
        },
    },
    components: {
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1a1a2e',
                    borderRight: 'none',
                },
            },
        },
    },
});

const drawerWidth = 280;

const BrowseMedicines = () => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, logout } = useContext(AuthContext);
    const { addToCart, getCartCount, cart } = useContext(CartContext);
    
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dosageFormFilter, setDosageFormFilter] = useState('');
    const [page, setPage] = useState(1);
    const [favorites, setFavorites] = useState([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const itemsPerPage = 9;

    useEffect(() => {
        setCartCount(getCartCount());
    }, [cart, getCartCount]);

    useEffect(() => {
        loadMedicines();
    }, []);

    const loadMedicines = async () => {
        setLoading(true);
        try {
            const response = await medicineAPI.getAll();
            const visibleMedicines = (response.data.results || response.data).filter(m => m.is_visible);
            setMedicines(visibleMedicines);
        } catch (error) {
            toast.error('Failed to load medicines');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (medicine) => {
        addToCart(medicine, 1);
        toast.success(`${medicine.brand_name} added to cart!`);
        setCartCount(getCartCount());
    };

    const handleToggleFavorite = (medicineId) => {
        if (favorites.includes(medicineId)) {
            setFavorites(favorites.filter(id => id !== medicineId));
            toast.info('Removed from favorites');
        } else {
            setFavorites([...favorites, medicineId]);
            toast.success('Added to favorites');
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setDosageFormFilter('');
        setPage(1);
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully!');
        navigate('/');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const filteredMedicines = medicines.filter(medicine => {
        const matchesSearch = medicine.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (medicine.generic_name && medicine.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesForm = !dosageFormFilter || medicine.dosage_form === dosageFormFilter;
        return matchesSearch && matchesForm;
    });

    const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
    const displayedMedicines = filteredMedicines.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    const dosageForms = [...new Set(medicines.map(m => m.dosage_form))];
    const firstName = user?.first_name || user?.username?.split('@')[0] || 'Customer';
    const userEmail = user?.email || 'customer@example.com';

    const mainMenuItems = [
        { text: 'Browse Medicines', icon: <MedicineIcon />, path: '/customer/browse' },
        { text: 'My Cart', icon: <CartIcon />, path: '/customer/cart', badge: cartCount },
        { text: 'My Orders', icon: <StoreIcon />, path: '/customer/orders' },
    ];

    const bottomMenuItems = [
        { text: 'Profile Settings', icon: <SettingsIcon />, path: '/customer/profile' },
    ];

    const drawerContent = (
        <Box sx={{ height: '100%', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
                p: 3, 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            }}>
                <Avatar 
                    sx={{ 
                        width: 80, 
                        height: 80, 
                        mx: 'auto', 
                        mb: 2,
                        border: '3px solid rgba(255,255,255,0.3)',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        bgcolor: 'rgba(255,255,255,0.2)'
                    }}
                >
                    {firstName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    {firstName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {userEmail}
                </Typography>
                <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 5 }}>
                    <PersonIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption">Customer</Typography>
                </Box>
            </Box>
            
            <List sx={{ mt: 2, px: 2 }}>
                {mainMenuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                        }}
                        sx={{
                            mb: 1,
                            borderRadius: 2,
                            '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.2)' },
                            bgcolor: window.location.pathname === item.path ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
                        }}
                    >
                        <ListItemIcon sx={{ color: '#3b82f6', minWidth: 40 }}>
                            {item.badge !== undefined && item.badge > 0 ? (
                                <Badge badgeContent={item.badge} color="error">
                                    {item.icon}
                                </Badge>
                            ) : (
                                item.icon
                            )}
                        </ListItemIcon>
                        <ListItemText 
                            primary={item.text} 
                            sx={{ '& .MuiTypography-root': { fontWeight: 500, color: 'white' } }} 
                        />
                    </ListItem>
                ))}
            </List>
            
            <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: 2, my: 2 }} />
            
            <List sx={{ px: 2 }}>
                {bottomMenuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                        }}
                        sx={{
                            mb: 1,
                            borderRadius: 2,
                            '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.2)' },
                        }}
                    >
                        <ListItemIcon sx={{ color: '#3b82f6', minWidth: 40 }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                            primary={item.text} 
                            sx={{ '& .MuiTypography-root': { fontWeight: 500, color: 'white' } }} 
                        />
                    </ListItem>
                ))}
            </List>
            
            <Box sx={{ p: 2, mt: 'auto' }}>
                <ListItem 
                    button 
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                    }}
                >
                    <ListItemIcon sx={{ color: '#f44336', minWidth: 40 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Logout" 
                        sx={{ '& .MuiTypography-root': { fontWeight: 500, color: '#f44336' } }} 
                    />
                </ListItem>
            </Box>
        </Box>
    );

    return (
        <ThemeProvider theme={theme}>
            {/* ── Root: full-viewport row ── */}
            <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f8fafc' }}>

                {/* ── Desktop: fixed sidebar, never slides ── */}
                {!isMobile && (
                    <Box
                        sx={{
                            width: drawerWidth,
                            flexShrink: 0,
                            height: '100vh',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            bgcolor: '#1a1a2e',
                        }}
                    >
                        {drawerContent}
                    </Box>
                )}

                {/* ── Mobile: top AppBar ── */}
                {isMobile && (
                    <AppBar 
                        position="fixed" 
                        sx={{ bgcolor: '#1a1a2e', zIndex: (t) => t.zIndex.drawer + 1 }}
                    >
                        <Toolbar>
                            <IconButton color="inherit" onClick={handleDrawerToggle} edge="start">
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 700 }}>
                                MediStore
                            </Typography>
                            <IconButton color="inherit" onClick={() => navigate('/customer/cart')} edge="end">
                                <Badge badgeContent={cartCount} color="error">
                                    <CartIcon />
                                </Badge>
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                )}

                {/* ── Mobile: temporary slide-in drawer ── */}
                {isMobile && (
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            '& .MuiDrawer-paper': { 
                                width: drawerWidth,
                                backgroundColor: '#1a1a2e',
                            },
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                )}

                {/* ── Main scrollable content ── */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        height: '100vh',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        ...(isMobile && { mt: '64px' }),
                    }}
                >
                    {/* Welcome Banner */}
                    <Box sx={{ 
                        p: 3, 
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        color: 'white',
                    }}>
                        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ m: 0 }}>
                            Welcome back, {firstName}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, m: 0 }}>
                            Find the best medicines at affordable prices
                        </Typography>
                    </Box>

                    {/* Search and Filter */}
                    <Box sx={{ 
                        p: 3, 
                        borderBottom: '1px solid #e2e8f0',
                        bgcolor: 'white',
                    }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={7}>
                                <TextField
                                    fullWidth
                                    placeholder="Search by medicine name or generic name..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: '#2563eb' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchTerm && (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setSearchTerm('')} size="small">
                                                    <ClearIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Filter by Form"
                                    value={dosageFormFilter}
                                    onChange={(e) => {
                                        setDosageFormFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <MenuItem value="">All Forms</MenuItem>
                                    {dosageForms.map(form => (
                                        <MenuItem key={form} value={form}>
                                            {form.charAt(0).toUpperCase() + form.slice(1)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={handleClearSearch}
                                    sx={{ 
                                        height: '56px',
                                        borderColor: '#2563eb',
                                        color: '#2563eb',
                                        '&:hover': {
                                            borderColor: '#1d4ed8',
                                            backgroundColor: 'rgba(37, 99, 235, 0.1)'
                                        }
                                    }}
                                >
                                    CLEAR
                                </Button>
                            </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Found {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''}
                            </Typography>
                            {filteredMedicines.length > 0 && (
                                <Chip 
                                    icon={<TrendingIcon />} 
                                    label={`Showing ${displayedMedicines.length} of ${filteredMedicines.length}`}
                                    size="small"
                                    sx={{ backgroundColor: '#e0e7ff', color: '#2563eb' }}
                                />
                            )}
                        </Box>
                    </Box>

                    {/* Medicines Grid */}
                    <Box sx={{ p: 3 }}>
                        {loading ? (
                            <Grid container spacing={3}>
                                {[1, 2, 3, 4, 5, 6].map((item) => (
                                    <Grid item xs={12} sm={6} md={4} key={item}>
                                        <Card sx={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                                            <CardContent>
                                                <Skeleton variant="text" width="80%" height={32} />
                                                <Skeleton variant="text" width="60%" height={24} />
                                                <Box sx={{ my: 1 }}>
                                                    <Skeleton variant="rectangular" width={60} height={24} sx={{ display: 'inline-block', mr: 1 }} />
                                                    <Skeleton variant="rectangular" width={60} height={24} sx={{ display: 'inline-block' }} />
                                                </Box>
                                                <Skeleton variant="text" width="90%" height={20} />
                                                <Skeleton variant="text" width="50%" height={20} />
                                                <Skeleton variant="text" width="40%" height={40} sx={{ mt: 2 }} />
                                            </CardContent>
                                            <CardActions>
                                                <Skeleton variant="rectangular" width="100%" height={36} />
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <>
                                <Grid container spacing={3}>
                                    {displayedMedicines.map((medicine) => (
                                        <Grid item xs={12} sm={6} md={4} key={medicine.id}>
                                            <Card 
                                                sx={{ 
                                                    transition: 'all 0.3s ease',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                                                    },
                                                    position: 'relative'
                                                }}
                                            >
                                                <IconButton
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        zIndex: 1,
                                                        backgroundColor: 'white',
                                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                                    }}
                                                    onClick={() => handleToggleFavorite(medicine.id)}
                                                >
                                                    {favorites.includes(medicine.id) ? (
                                                        <FavoriteIcon color="error" />
                                                    ) : (
                                                        <FavoriteBorderIcon />
                                                    )}
                                                </IconButton>

                                                {medicine.stock_quantity <= 10 && medicine.stock_quantity > 0 && (
                                                    <Chip
                                                        label={`Only ${medicine.stock_quantity} left`}
                                                        size="small"
                                                        color="warning"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            left: 8,
                                                            zIndex: 1,
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                )}

                                                <CardContent sx={{ pt: 3 }}>
                                                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ pr: 4 }}>
                                                        {medicine.brand_name}
                                                    </Typography>
                                                    
                                                    {medicine.generic_name && (
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            <strong>Generic:</strong> {medicine.generic_name}
                                                        </Typography>
                                                    )}
                                                    
                                                    <Box sx={{ my: 1.5 }}>
                                                        <Chip 
                                                            label={medicine.dosage_form} 
                                                            size="small" 
                                                            sx={{ 
                                                                mr: 1, 
                                                                backgroundColor: '#e0e7ff',
                                                                fontWeight: 500,
                                                                color: '#2563eb'
                                                            }} 
                                                        />
                                                        <Chip 
                                                            label={medicine.dosage} 
                                                            size="small" 
                                                            sx={{ 
                                                                backgroundColor: '#2563eb',
                                                                color: 'white',
                                                                fontWeight: 500
                                                            }} 
                                                        />
                                                    </Box>
                                                    
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {medicine.manufacturer}
                                                        </Typography>
                                                    </Box>
                                                    
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <StockIcon sx={{ fontSize: 16, color: medicine.stock_quantity > 0 ? '#22c55e' : '#ef4444', mr: 0.5 }} />
                                                        <Typography variant="body2" color={medicine.stock_quantity > 0 ? 'success.main' : 'error.main'}>
                                                            {medicine.stock_quantity > 0 ? `${medicine.stock_quantity} available` : 'Out of Stock'}
                                                        </Typography>
                                                    </Box>
                                                    
                                                    <Box sx={{ height: '1px', bgcolor: '#e2e8f0', my: 1.5 }} />
                                                    
                                                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 1 }}>
                                                        <Typography variant="h5" sx={{ color: '#2563eb', fontWeight: 'bold' }}>
                                                            frw {medicine.price}
                                                        </Typography>
                                                        {medicine.original_price && medicine.original_price > medicine.price && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                                                frw {medicine.original_price}
                                                            </Typography>
                                                        )}
                                                        {medicine.discount && (
                                                            <Chip 
                                                                label={`${medicine.discount}% OFF`}
                                                                size="small"
                                                                color="error"
                                                                sx={{ fontWeight: 'bold' }}
                                                            />
                                                        )}
                                                    </Box>
                                                </CardContent>
                                                
                                                <CardActions sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        startIcon={<CartIcon />}
                                                        onClick={() => handleAddToCart(medicine)}
                                                        disabled={medicine.stock_quantity === 0}
                                                        sx={{
                                                            py: 1,
                                                            background: medicine.stock_quantity === 0 ? '#9ca3af' : 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
                                                            '&:hover': {
                                                                background: medicine.stock_quantity === 0 ? '#9ca3af' : 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
                                                            }
                                                        }}
                                                    >
                                                        {medicine.stock_quantity === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                {filteredMedicines.length === 0 && (
                                    <Box sx={{ 
                                        p: 6, 
                                        textAlign: 'center', 
                                        border: '1px solid #e2e8f0',
                                        bgcolor: 'white',
                                    }}>
                                        <OfferIcon sx={{ fontSize: 60, color: '#2563eb', mb: 2, opacity: 0.5 }} />
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No medicines found
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Try adjusting your search or filter criteria
                                        </Typography>
                                        <Button 
                                            variant="outlined" 
                                            onClick={handleClearSearch}
                                            sx={{ mt: 2, borderColor: '#2563eb', color: '#2563eb' }}
                                        >
                                            Clear Filters
                                        </Button>
                                    </Box>
                                )}

                                {totalPages > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                                        <Pagination
                                            count={totalPages}
                                            page={page}
                                            onChange={(e, value) => setPage(value)}
                                            color="primary"
                                            size="large"
                                            sx={{
                                                '& .MuiPaginationItem-root.Mui-selected': {
                                                    background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
                                                    color: 'white'
                                                }
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default BrowseMedicines;