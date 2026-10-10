import React, { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const DashboardLayout = ({ children, title }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: 0,
                    ml: { sm: 0 },
                    overflow: 'auto',         // ← scroll happens here, not on the page
                    height: '100vh',          // ← full viewport height
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default DashboardLayout;