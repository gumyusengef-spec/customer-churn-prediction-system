// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Home Page
import HomePage from './pages/HomePage';

// Login & Register Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer Pages
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import BrowseMedicines from './pages/customer/BrowseMedicines';
import Cart from './pages/customer/Cart';
import MyOrders from './pages/customer/MyOrders';
import Checkout from './pages/customer/Checkout';
import ProfileSettings from './pages/customer/ProfileSettings';
import HelpSupport from './pages/customer/HelpSupport';

// Seller Pages
import SellerLogin from './pages/seller/SellerLogin';
import SellerRegister from './pages/seller/SellerRegister';
import SellerDashboard from './pages/seller/SellerDashboard';
import Medicines from './pages/seller/Medicines';
import Orders from './pages/seller/Orders';
import Discounts from './pages/seller/Discounts';
import Feedback from './pages/seller/Feedback';
import Customers from './pages/seller/Customers';
import CustomerDetail from './pages/seller/CustomerDetail';
import ChurnReport from './pages/seller/ChurnReport';

// Protected Route Component
const ProtectedRoute = ({ children, requiredType }) => {
    const { isAuthenticated, user, loading } = useContext(AuthContext);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    if (requiredType && user.user_type !== requiredType) {
        return <Navigate to="/" />;
    }
    
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Home Page */}
            <Route path="/" element={<HomePage />} />
            
            {/* Unified Login & Register */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            
            {/* Customer Routes */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/customer/browse" element={
                <ProtectedRoute requiredType="customer"><BrowseMedicines /></ProtectedRoute>
            } />
            <Route path="/customer/cart" element={
                <ProtectedRoute requiredType="customer"><Cart /></ProtectedRoute>
            } />
            <Route path="/customer/orders" element={
                <ProtectedRoute requiredType="customer"><MyOrders /></ProtectedRoute>
            } />
            <Route path="/customer/checkout" element={
                <ProtectedRoute requiredType="customer"><Checkout /></ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
                <ProtectedRoute requiredType="customer"><ProfileSettings /></ProtectedRoute>
            } />
            <Route path="/customer/support" element={
                <ProtectedRoute requiredType="customer"><HelpSupport /></ProtectedRoute>
            } />
            
            {/* Seller Routes */}
            <Route path="/seller/login" element={<SellerLogin />} />
            <Route path="/seller/register" element={<SellerRegister />} />
            <Route path="/seller/dashboard" element={
                <ProtectedRoute requiredType="seller"><SellerDashboard /></ProtectedRoute>
            } />
            <Route path="/seller/medicines" element={
                <ProtectedRoute requiredType="seller"><Medicines /></ProtectedRoute>
            } />
            <Route path="/seller/orders" element={
                <ProtectedRoute requiredType="seller"><Orders /></ProtectedRoute>
            } />
            <Route path="/seller/discounts" element={
                <ProtectedRoute requiredType="seller"><Discounts /></ProtectedRoute>
            } />
            <Route path="/seller/feedback" element={
                <ProtectedRoute requiredType="seller"><Feedback /></ProtectedRoute>
            } />
            <Route path="/seller/customers" element={
                <ProtectedRoute requiredType="seller"><Customers /></ProtectedRoute>
            } />
            <Route path="/seller/customers/:customerId" element={
                <ProtectedRoute requiredType="seller"><CustomerDetail /></ProtectedRoute>
            } />
            
            <Route path="/seller/churn-report" element={
            <ProtectedRoute requiredType="seller"><ChurnReport /></ProtectedRoute>
} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <AppRoutes />
                    <ToastContainer position="top-right" autoClose={3000} />
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;