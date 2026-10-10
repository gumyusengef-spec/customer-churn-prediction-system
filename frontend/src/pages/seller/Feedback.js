import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Rating,
} from '@mui/material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { commentAPI } from '../../services/api';

const feedbackCSS = `
  /* ── Blue header banner ── */
  .fb-header {
    background: #0d6efd;
    border-radius: 12px;
    padding: 10px 20px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(13,110,253,0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .fb-header h1 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    letter-spacing: -.3px;
  }
  .fb-chips {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .fb-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 16px;
    border-radius: 10px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
    min-width: 80px;
  }
  .fb-chip-label {
    font-size: .72rem;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: 2px;
  }
  .fb-chip-value {
    font-size: 1.2rem;
    font-weight: 800;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    line-height: 1;
  }
  .fb-chip-sub {
    font-size: .72rem;
    color: rgba(255,255,255,0.75);
    margin-top: 2px;
  }
`;

const Feedback = () => {
    const [comments, setComments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        average: 0,
    });

    useEffect(() => {
        loadComments();
    }, []);

    const loadComments = async () => {
        try {
            const response = await commentAPI.getAll();
            const fetchedComments = response.data.results || response.data;
            setComments(fetchedComments);

            const total = fetchedComments.length;
            const sum = fetchedComments.reduce((acc, c) => acc + c.satisfaction_score, 0);
            const average = total > 0 ? (sum / total).toFixed(1) : 0;

            setStats({ total, average });
        } catch (error) {
            toast.error('Failed to load feedback');
        }
    };

    return (
        <DashboardLayout title="Customer Feedback">
            <style>{feedbackCSS}</style>

            {/* ── Blue header banner ── */}
            <div className="fb-header">
                <h1>Customer Feedback</h1>
                <div className="fb-chips">
                    <div className="fb-chip">
                        <span className="fb-chip-label">Total Reviews</span>
                        <span className="fb-chip-value">{stats.total}</span>
                    </div>
                    <div className="fb-chip">
                        <span className="fb-chip-label">Avg Rating</span>
                        <span className="fb-chip-value">{stats.average}</span>
                        <span className="fb-chip-sub">out of 5</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.8px' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.8px' }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.8px' }}>Order</TableCell>
                            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.8px' }}>Rating</TableCell>
                            <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.8px' }}>Comment</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {comments.map((comment) => (
                            <TableRow key={comment.id}>
                                <TableCell>{new Date(comment.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>{comment.customer_name || 'N/A'}</TableCell>
                                <TableCell>#{comment.order || 'N/A'}</TableCell>
                                <TableCell>
                                    <Rating value={comment.satisfaction_score} readOnly size="small" />
                                </TableCell>
                                <TableCell>{comment.comment_text}</TableCell>
                            </TableRow>
                        ))}
                        {comments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No feedback yet
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </DashboardLayout>
    );
};

export default Feedback;