// FinRescue X — Bank Verification & Consent Routes
import { Router, Response } from 'express';
import { addRecord, findMany } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// POST /api/bank/verify-demo
router.post('/verify-demo', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId, accountHolderName, bankName, accountNumber, ifscCode, accountType } = req.body;
  if (!applicationId || !accountHolderName || !bankName || !accountNumber || !ifscCode) {
    return res.status(400).json({ error: 'All bank details are required' });
  }

  const masked = 'X'.repeat(Math.max(0, accountNumber.length - 4)) + accountNumber.slice(-4);
  const verification = {
    id: `bv-${Date.now().toString(36)}`, applicationId,
    accountHolderName, bankName, maskedAccountNumber: masked, ifscCode,
    accountType: accountType || 'CURRENT',
    status: 'VERIFIED', referenceId: `PD-SIM-${Date.now().toString(36)}`,
    verifiedAt: new Date().toISOString()
  };

  addRecord('bankVerifications', verification);
  addRecord('applicationEvents', { id: uuid(), applicationId, type: 'BANK_VERIFIED', description: `Bank account verified (simulated): ${bankName} - ${masked}`, timestamp: new Date().toISOString(), actor: 'system' });

  res.json({
    verification: { ...verification, note: 'SIMULATED penny-drop verification. No real bank API was called.' },
    message: 'Bank verification completed (SIMULATED)'
  });
});

export default router;
