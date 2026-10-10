// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await api.post('/auth/token/refresh/', {
                        refresh: refreshToken,
                    });
                    localStorage.setItem('access_token', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                } catch (err) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================
export const authAPI = {
    registerSeller: (data) => api.post('/auth/register-seller/', data),
    registerCustomer: (data) => api.post('/auth/register-customer/', data),
    login: (data) => api.post('/auth/login/', data),
    logout: (data) => api.post('/auth/logout/', data),
    getProfile: () => api.get('/auth/profile/'),
    updateProfile: (data) => api.put('/auth/profile/update/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
};

// ==================== MEDICINE API ====================
export const medicineAPI = {
    getAll: () => api.get('/medicines/'),
    getById: (id) => api.get(`/medicines/${id}/`),
    create: (data) => api.post('/medicines/', data),
    update: (id, data) => api.put(`/medicines/${id}/`, data),
    delete: (id) => api.delete(`/medicines/${id}/`),
    toggleVisibility: (id) => api.patch(`/medicines/${id}/toggle_visibility/`),
};

// ==================== ORDER API ====================
export const orderAPI = {
    getAll: () => api.get('/orders/'),
    getById: (id) => api.get(`/orders/${id}/`),
    create: (data) => api.post('/orders/', data),
    updateStatus: (id, status) => api.patch(`/orders/${id}/update_status/`, { status }),
    editOrder: (id, data, items) => {
        console.log('API editOrder called with:', { id, data, items });
        return api.patch(`/orders/${id}/edit_order/`, {
            edited_total_amount: data.edited_total_amount,
            edit_reason: data.edit_reason,
            items: items
        });
    },
    respondToEdit: (id, accepted) => api.patch(`/orders/${id}/respond_to_edit/`, { accepted }),
    deleteCompleted: (id) => api.delete(`/orders/${id}/delete_completed/`),
};

// ==================== DISCOUNT API ====================
export const discountAPI = {
    getAll: () => api.get('/discounts/'),
    create: (data) => api.post('/discounts/', data),
    respond: (id, data) => api.patch(`/discounts/${id}/respond/`, data),
    delete: (id) => api.delete(`/discounts/${id}/`),
};

// ==================== COMMENT API ====================
export const commentAPI = {
    getAll: () => api.get('/comments/'),
    create: (data) => api.post('/comments/', data),
};

// ==================== CUSTOMER ANALYTICS API ====================
export const customerAPI = {
    // Customer Analytics
    getAnalytics: () => api.get('/auth/customer-analytics/'),
    getDetail: (customerId) => api.get(`/auth/customer-detail/${customerId}/`),
    exportCSV: () => api.get('/auth/export-csv/', { responseType: 'blob' }),

    // Churn Predictions
    predictChurn: () => api.post('/auth/predict-churn/'),
    predictSingleChurn: (customerId) => api.post(`/auth/predict-churn/${customerId}/`),

    // Report & Recommendations
    getChurnReport: () => api.get('/auth/churn-report/'),
    getCustomerRecommendations: (customerId) => api.get(`/auth/customer-recommendations/${customerId}/`),

    // ✅ FIXED: was '/customers/${id}/' which doesn't exist in Django urls.py
    deleteCustomer: (id) => api.delete(`/auth/customer-delete/${id}/`),
};

// ==================== SUPPORT API ====================
export const supportAPI = {
    createTicket: (data) => api.post('/support/tickets/', data),
    getTickets: () => api.get('/support/tickets/'),
};

// Default export
export default api;