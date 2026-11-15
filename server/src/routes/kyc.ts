// FinRescue X — KYC, Bank Verification & Consent Routes
import { Router, Response } from 'express';
import { findMany, findById, addRecord, updateRecord } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// POST /api/kyc/start
router.post('/start', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId } = req.body;
  if (!applicationId) return res.status(400).json({ error: 'applicationId required' });
  
  const existing = findMany('kycSessions', (k: any) => k.applicationId === applicationId)[0];
  if (existing) return res.json({ session: existing, message: 'KYC session already exists' });

  const session = {
    id: `kyc-${Date.now().toString(36)}`, applicationId,
    panVerified: false, panNameMatched: false, ckycFetched: false,
    aadhaarOtpVerified: false, selfieUploaded: false,
    livenessScore: 0, faceMatchScore: 0,
    status: 'IN_PROGRESS', completedAt: null
  };
  addRecord('kycSessions', session);
  addRecord('applicationEvents', { id: uuid(), applicationId, type: 'KYC_STARTED', description: 'KYC verification process started (simulated)', timestamp: new Date().toISOString(), actor: req.user.merchantId });
  res.json({ session, note: 'SIMULATED KYC — No real verification service is being called.' });
});

// POST /api/kyc/verify-demo
router.post('/verify-demo', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId, step } = req.body;
  if (!applicationId) return res.status(400).json({ error: 'applicationId required' });

  const session = findMany('kycSessions', (k: any) => k.applicationId === applicationId)[0];
  if (!session) return res.status(404).json({ error: 'KYC session not found. Start KYC first.' });

  const updates: any = {};
  switch (step) {
    case 'pan':
      updates.panVerified = true;
      updates.panNameMatched = true;
      break;
    case 'ckyc':
      updates.ckycFetched = true;
      break;
    case 'aadhaar_otp':
      updates.aadhaarOtpVerified = true;
      break;
    case 'selfie':
      updates.selfieUploaded = true;
      updates.livenessScore = 98.4;
      updates.faceMatchScore = 96.2;
      break;
    case 'complete':
      updates.panVerified = true;
      updates.panNameMatched = true;
      updates.ckycFetched = true;
      updates.aadhaarOtpVerified = true;
      updates.selfieUploaded = true;
      updates.livenessScore = 98.4;
      updates.faceMatchScore = 96.2;
      updates.status = 'VERIFIED_DEMO';
      updates.completedAt = new Date().toISOString();
      break;
    default:
      return res.status(400).json({ error: 'Invalid step. Use: pan, ckyc, aadhaar_otp, selfie, complete' });
  }

  const updated = updateRecord('kycSessions', session.id, updates);
  
  // Check if all steps complete
  if (updated.panVerified && updated.aadhaarOtpVerified && updated.selfieUploaded && updated.status !== 'VERIFIED_DEMO') {
    updateRecord('kycSessions', session.id, { status: 'VERIFIED_DEMO', completedAt: new Date().toISOString() });
  }

  addRecord('applicationEvents', { id: uuid(), applicationId, type: `KYC_${step?.toUpperCase()}_VERIFIED`, description: `KYC step '${step}' verified (simulated)`, timestamp: new Date().toISOString(), actor: 'system' });

  res.json({
    session: findById('kycSessions', session.id),
    message: `KYC step '${step}' completed (SIMULATED). No real verification was performed.`
  });
});

export default router;
