// FinRescue X — Consent Routes
import { Router, Response } from 'express';
import { addRecord, findMany } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// POST /api/consents
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId, purpose, description, granted } = req.body;
  if (!applicationId || !purpose) return res.status(400).json({ error: 'applicationId and purpose required' });

  const consent = {
    id: `consent-${Date.now().toString(36)}`, applicationId, purpose,
    description: description || purpose,
    granted: granted === true,
    ipAddress: req.ip || '0.0.0.0',
    timestamp: new Date().toISOString()
  };

  addRecord('consents', consent);
  addRecord('auditLogs', { id: uuid(), actor: req.user.id, action: 'GRANT_CONSENT', entityType: 'CONSENT', entityId: consent.id, details: { purpose, granted: consent.granted }, timestamp: new Date().toISOString() });

  res.json({ consent });
});

// GET /api/consents?applicationId=xxx
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId } = req.query;
  const consents = applicationId
    ? findMany('consents', (c: any) => c.applicationId === applicationId)
    : findMany('consents');
  res.json({ consents });
});

export default router;
