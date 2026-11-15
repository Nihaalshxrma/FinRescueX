// FinRescue X — Auth Routes
import { Router, Response } from 'express';
import { findMany, addRecord, updateRecord, getDB } from '../database';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// POST /api/auth/demo-login — Send OTP (simulated)
router.post('/demo-login', (req, res: Response) => {
  const { mobile } = req.body;
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ error: 'Valid 10-digit Indian mobile number required' });
  }
  const user = findMany('users', (u: any) => u.mobile === mobile)[0];
  if (!user) {
    return res.status(404).json({ error: 'No demo account found for this number. Use 9876543210 (merchant) or 9999999999 (admin).' });
  }
  // Update OTP (always 123456 for demo)
  updateRecord('users', user.id, { otp: '123456', otpExpiry: new Date(Date.now() + 600000).toISOString() });
  res.json({
    success: true,
    message: 'Demo OTP sent (simulated). Use OTP: 123456',
    demoOtp: '123456',
    note: 'This is a SIMULATED OTP for hackathon demonstration. No real SMS was sent.'
  });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res: Response) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP required' });
  }
  const user = findMany('users', (u: any) => u.mobile === mobile)[0];
  if (!user) { return res.status(404).json({ error: 'User not found' }); }
  if (user.otp !== otp) { return res.status(400).json({ error: 'Invalid OTP' }); }

  const token = generateToken(user.id);
  addRecord('auditLogs', { id: uuid(), actor: user.id, action: 'LOGIN', entityType: 'USER', entityId: user.id, details: { method: 'demo-otp' }, timestamp: new Date().toISOString() });
  
  const { passwordHash, otp: _, otpExpiry, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const { passwordHash, otp, otpExpiry, ...safeUser } = req.user;
  const merchant = req.user.merchantId ? findMany('merchants', (m: any) => m.id === req.user.merchantId)[0] : null;
  res.json({ user: safeUser, merchant: merchant || null });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  addRecord('auditLogs', { id: uuid(), actor: req.user.id, action: 'LOGOUT', entityType: 'USER', entityId: req.user.id, details: {}, timestamp: new Date().toISOString() });
  res.json({ success: true, message: 'Logged out' });
});

export default router;
