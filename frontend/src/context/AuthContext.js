import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const response = await authAPI.getProfile();
                setUser(response.data.user);
            } catch (error) {
                logout();
            }
        }
        setLoading(false);
    };

    const login = async (username, password) => {
        try {
            const response = await authAPI.login({ username, password });
            const { tokens, user } = response.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            setUser(user);
            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const logout = async () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isSeller: user?.user_type === 'seller',
    };

    return (                          // ← this was missing
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};