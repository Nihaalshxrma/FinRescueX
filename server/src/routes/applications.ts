// FinRescue X — Application Routes
import { Router, Response } from 'express';
import { findMany, findById, addRecord, updateRecord, getDB } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// POST /api/applications — Create new application
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { requestedAmountINR, loanPurpose, businessCategory, requiredTenureMonths, userType } = req.body;
  if (!requestedAmountINR || !loanPurpose) {
    return res.status(400).json({ error: 'Requested amount and loan purpose are required' });
  }
  const appId = `FNX-${Date.now().toString(36).toUpperCase()}`;
  const application = {
    id: appId,
    merchantId: req.user.merchantId || req.user.id,
    userType: userType || (req.user.merchantId ? 'MERCHANT' : 'NORMAL_USER'),
    stage: 'STAGE_1_REQUIREMENTS',
    status: 'DRAFT',
    requestedAmountINR,
    loanPurpose,
    businessCategory: businessCategory || 'Personal & Retail',
    requiredTenureMonths: requiredTenureMonths || 12,
    personalDetails: null,
    businessDetails: null,
    bankDetails: null,
    documents: [],
    selectedOfferId: null,
    selectedOffer: null,
    kycSession: null,
    consents: [],
    partnerAcknowledgement: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  addRecord('applications', application);
  addRecord('applicationEvents', { id: uuid(), applicationId: appId, type: 'APPLICATION_CREATED', description: `Loan application created for ₹${requestedAmountINR.toLocaleString('en-IN')}`, timestamp: new Date().toISOString(), actor: req.user.id });
  res.status(201).json({ success: true, application });
});

// GET /api/applications — List user's applications based on mode
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const isMerchant = !!req.user.merchantId;
  const targetUserType = isMerchant ? 'MERCHANT' : 'NORMAL_USER';

  let apps = findMany('applications', (a: any) => 
    (a.merchantId === req.user.merchantId || a.merchantId === req.user.id) &&
    (a.userType === targetUserType || !a.userType)
  );

  // If new user mode has no apps, surface the pre-seeded demo applications for demonstration!
  if (apps.length === 0) {
    apps = findMany('applications', (a: any) => a.userType === targetUserType);
  }

  res.json({ applications: apps });
});

// GET /api/applications/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const app = findById('applications', req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  const docs = findMany('documents', (d: any) => d.applicationId === app.id);
  const offers = findMany('loanOffers', (o: any) => o.applicationId === app.id);
  res.json({ application: { ...app, documents: docs, availableOffers: offers } });
});

// PATCH /api/applications/:id — Update application
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const app = findById('applications', req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const updates = req.body;
  const allowed = [
    'personalDetails', 'businessDetails', 'bankDetails',
    'stage', 'status', 'requestedAmountINR', 'loanPurpose',
    'businessCategory', 'requiredTenureMonths', 'selectedOfferId',
    'selectedOffer', 'userType'
  ];
  const filtered: any = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  const updated = updateRecord('applications', app.id, filtered);

  if (updates.stage && updates.stage !== app.stage) {
    addRecord('applicationEvents', {
      id: uuid(), applicationId: app.id,
      type: 'STAGE_CHANGED',
      description: `Application stage updated to ${updates.stage}`,
      timestamp: new Date().toISOString(), actor: req.user.id
    });
  }

  res.json({ success: true, application: updated });
});

// POST /api/applications/:id/rollback — Step Reversal
router.post('/:id/rollback', authenticateToken, (req: AuthRequest, res: Response) => {
  const app = findById('applications', req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  const { targetStage } = req.body;

  const validStages = [
    'STAGE_1_REQUIREMENTS',
    'STAGE_2_PERSONAL_DETAILS',
    'STAGE_3_BUSINESS_DETAILS',
    'STAGE_4_BANK_DETAILS',
    'STAGE_5_DOCUMENTS',
    'STAGE_6_OFFER_SELECTION',
    'STAGE_7_KYC_VERIFICATION',
    'STAGE_8_FINAL_REVIEW'
  ];

  if (!targetStage || !validStages.includes(targetStage)) {
    return res.status(400).json({ error: 'Valid targetStage required' });
  }

  const updated = updateRecord('applications', app.id, {
    stage: targetStage,
    status: targetStage === 'STAGE_5_DOCUMENTS' ? 'DOCUMENTS_PENDING' : 'DRAFT'
  });

  addRecord('applicationEvents', {
    id: uuid(), applicationId: app.id,
    type: 'APPLICATION_ROLLBACK',
    description: `Application navigated back to ${targetStage}`,
    timestamp: new Date().toISOString(), actor: req.user.id
  });

  res.json({
    success: true,
    message: `Navigated back to ${targetStage}. Your saved data remains intact.`,
    application: updated
  });
});

// POST /api/applications/:id/submit-demo
router.post('/submit-demo', authenticateToken, (req: AuthRequest, res: Response) => {
  res.status(400).json({ error: 'Use parameterized URL /api/applications/:id/submit-demo' });
});

router.post('/:id/submit-demo', authenticateToken, (req: AuthRequest, res: Response) => {
  const app = findById('applications', req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const selectedOffer = app.selectedOfferId ? findMany('loanOffers', (o: any) => o.id === app.selectedOfferId)[0] : null;
  const ack = {
    ackId: `ACK-${Date.now().toString(36).toUpperCase()}`,
    partnerName: selectedOffer?.lenderName || (app.userType === 'NORMAL_USER' ? 'Paytm Consumer Lending (Piramal)' : 'Demo Lender A'),
    submittedAt: new Date().toISOString(),
    expectedSlaHours: app.userType === 'NORMAL_USER' ? 12 : 24,
    status: 'SUBMITTED',
    referenceNumber: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
    responseNote: `Application successfully submitted and acknowledged by ${selectedOffer?.lenderName || 'Lending Partner'}. Simulated verification completed without friction.`
  };

  updateRecord('applications', app.id, {
    stage: 'STAGE_9_SUBMITTED',
    status: 'SUBMITTED_TO_PARTNER',
    partnerAcknowledgement: ack
  });

  addRecord('applicationEvents', { id: uuid(), applicationId: app.id, type: 'APPLICATION_SUBMITTED', description: `Application submitted to ${ack.partnerName}`, timestamp: new Date().toISOString(), actor: req.user.id });

  res.json({
    success: true,
    message: 'Application submitted to simulated lending partner.',
    acknowledgement: ack
  });
});

export default router;
