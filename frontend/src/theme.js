// src/theme.js
import { createTheme } from '@mui/material';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#667eea',
            light: '#8b9eff',
            dark: '#4c6ef5',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        secondary: {
            main: '#764ba2',
            light: '#9b6bc4',
            dark: '#5a3780'
        },
        background: {
            default: '#f5f7fa',
            paper: '#ffffff',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669'
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626'
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706'
        },
        info: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb'
        }
    },
    typography: {
        fontFamily: '"Inter", "Poppins", "Segoe UI", "Roboto", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0px 2px 4px rgba(0,0,0,0.05)',
        '0px 4px 8px rgba(0,0,0,0.05)',
        '0px 8px 16px rgba(0,0,0,0.05)',
        '0px 12px 24px rgba(0,0,0,0.05)',
        '0px 16px 32px rgba(0,0,0,0.05)',
        '0px 20px 40px rgba(0,0,0,0.05)',
        ...Array(18).fill('none'),
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                    },
                },
                contained: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                },
            },
        },
    },
});