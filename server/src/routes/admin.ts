// FinRescue X — Admin Intelligence Dashboard Routes
import { Router, Response } from 'express';
import { findMany, findById, updateRecord, resetDB, addRecord } from '../database';
import { createSeedData } from '../seed';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { calculateFrictionScore } from '../services/frictionEngine';
import { analyzeRootCause } from '../services/rootCause';
import { UnderwritingChecklistService } from '../services/underwritingChecklist';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET /api/admin/shortlisting — Filterable lender shortlisting queue
router.get('/shortlisting', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const { category, decision } = req.query;
  let applications = findMany('applications');
  const documents = findMany('documents');

  // Filter out any without shortlistingPrediction or compute on the fly
  applications = applications.map((app: any) => {
    if (!app.shortlistingPrediction) {
      app.shortlistingPrediction = UnderwritingChecklistService.evaluateApplication(app);
      updateRecord('applications', app.id, { shortlistingPrediction: app.shortlistingPrediction });
    }
    const appDocs = documents.filter((d: any) => d.applicationId === app.id);
    return {
      ...app,
      documents: appDocs
    };
  });

  if (category && category !== 'ALL') {
    applications = applications.filter((a: any) => a.applicantCategory === category);
  }

  if (decision && decision !== 'ALL') {
    applications = applications.filter((a: any) => a.shortlistingPrediction?.decisionPrediction === decision);
  }

  res.json({
    applications,
    total: applications.length,
    summary: {
      salariedCount: applications.filter((a: any) => a.applicantCategory === 'SALARIED').length,
      selfEmployedCount: applications.filter((a: any) => a.applicantCategory === 'SELF_EMPLOYED').length,
      shortlistRecommended: applications.filter((a: any) => a.shortlistingPrediction?.decisionPrediction === 'SHORTLIST_RECOMMENDED').length,
      manualReview: applications.filter((a: any) => a.shortlistingPrediction?.decisionPrediction === 'MANUAL_UNDERWRITING_REVIEW').length,
      highRiskDecline: applications.filter((a: any) => a.shortlistingPrediction?.decisionPrediction === 'NOT_SHORTLISTED_HIGH_RISK').length,
    }
  });
});

// POST /api/admin/simulate-underwriting — Interactive What-If Loan Simulator
router.post('/simulate-underwriting', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const { applicationId, adjustedAmount, adjustedTenure } = req.body;
  const app = findById('applications', applicationId);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const recalculated = UnderwritingChecklistService.evaluateApplication(
    app,
    adjustedAmount ? Number(adjustedAmount) : undefined,
    adjustedTenure ? Number(adjustedTenure) : undefined
  );

  res.json({
    applicationId,
    originalAmount: app.requestedAmountINR,
    originalTenure: app.requiredTenureMonths,
    simulatedAmount: adjustedAmount || app.requestedAmountINR,
    simulatedTenure: adjustedTenure || app.requiredTenureMonths,
    prediction: recalculated
  });
});

// POST /api/admin/shortlist-action — Underwriter Actions (Approve, Counter-offer, Nudge, Decline)
router.post('/shortlist-action', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const { applicationId, action, counterAmount, counterTenure, reason } = req.body;
  const app = findById('applications', applicationId);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  let newStatus = app.status;
  let newStage = app.stage;
  let note = reason || '';

  switch (action) {
    case 'APPROVE':
      newStatus = 'PARTNER_ACKNOWLEDGED';
      note = note || 'Shortlisted and forwarded to lending partner underwriting queue.';
      break;
    case 'COUNTER_OFFER':
      newStatus = 'NEEDS_APPLICANT_ATTENTION';
      note = note || `Counter-offer proposed: ₹${counterAmount || app.requestedAmountINR} for ${counterTenure || app.requiredTenureMonths} months.`;
      break;
    case 'NUDGE':
      newStatus = 'RECOVERY_NUDGE_SENT';
      note = note || 'AI recovery nudge sent to applicant to correct documentation/FOIR threshold.';
      break;
    case 'DECLINE':
      newStatus = 'REJECTED';
      note = note || 'Application does not meet institutional credit policy thresholds.';
      break;
    default:
      return res.status(400).json({ error: 'Invalid action type' });
  }

  updateRecord('applications', app.id, {
    status: newStatus,
    stage: newStage,
    adminActionHistory: [
      ...(app.adminActionHistory || []),
      {
        action,
        actor: req.user.id,
        timestamp: new Date().toISOString(),
        counterAmount,
        counterTenure,
        note
      }
    ]
  });

  addRecord('auditLogs', {
    id: uuid(),
    actor: req.user.id,
    action: `SHORTLIST_${action}`,
    entityType: 'APPLICATION',
    entityId: applicationId,
    details: { action, counterAmount, counterTenure, note },
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    applicationId,
    newStatus,
    message: `Action ${action} recorded successfully.`
  });
});

// GET /api/admin/overview
router.get('/overview', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const applications = findMany('applications');
  const documents = findMany('documents');
  const tickets = findMany('supportTickets');
  const callbacks = findMany('callbackRequests');
  const telemetry = findMany('partnerTelemetry');
  const kycSessions = findMany('kycSessions');
  const events = findMany('applicationEvents');

  const totalApps = applications.length;
  const inProgressApps = applications.filter((a: any) => a.stage !== 'STAGE_9_SUBMITTED').length;
  const submittedApps = applications.filter((a: any) => a.stage === 'STAGE_9_SUBMITTED').length;

  let highFrictionCount = 0;
  applications.forEach((a: any) => {
    const f = calculateFrictionScore(a.id, events, tickets, documents);
    if (f.priority === 'HIGH') highFrictionCount++;
  });

  const docFailures = documents.filter((d: any) => 
    d.preflightReport && !d.preflightReport.safeForOcr
  ).length;

  const preflightFailures = documents.filter((d: any) => 
    d.preflightReport?.isPasswordProtected || d.preflightReport?.isCorrupted
  ).length;

  const successfulRecoveries = applications.filter((a: any) => a.status === 'PARTNER_ACKNOWLEDGED' || a.status === 'RECOVERED').length;
  const recoverySuccessRate = totalApps > 0 ? Math.round((successfulRecoveries / totalApps) * 100) : 0;

  const pendingTickets = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const pendingCallbacks = callbacks.filter((c: any) => c.status === 'REQUESTED').length;

  const partnerFailures = telemetry.filter((t: any) => t.status === 'FAILURE' || t.status === 'TIMEOUT').length;
  const avgPartnerLatency = telemetry.length ? Math.round(telemetry.reduce((a: number, c: any) => a + c.latencyMs, 0) / telemetry.length) : 0;

  const kycCompleted = kycSessions.filter((k: any) => k.status === 'VERIFIED_DEMO').length;
  const kycRate = kycSessions.length ? Math.round((kycCompleted / kycSessions.length) * 100) : 0;

  res.json({
    kpis: {
      totalApplications: totalApps,
      applicationsInProgress: inProgressApps,
      submittedApplications: submittedApps,
      highFrictionApplications: highFrictionCount,
      documentFailures: docFailures,
      pdfPreflightFailures: preflightFailures,
      successfulRecoveries,
      recoverySuccessRate,
      averageRecoveryTimeMinutes: 24,
      pendingSupportTickets: pendingTickets,
      callbackRequests: pendingCallbacks,
      partnerApiFailures: partnerFailures,
      partnerAverageLatencyMs: avgPartnerLatency,
      kycCompletionRate: kycRate
    }
  });
});

// GET /api/admin/funnel
router.get('/funnel', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const applications = findMany('applications');
  const stageWeights: Record<string, number> = {
    'STAGE_1_REQUIREMENTS': 1,
    'STAGE_2_PERSONAL_DETAILS': 2,
    'STAGE_3_BUSINESS_DETAILS': 3,
    'STAGE_4_BANK_DETAILS': 4,
    'STAGE_5_DOCUMENTS': 5,
    'STAGE_6_OFFER_SELECTION': 6,
    'STAGE_7_KYC_VERIFICATION': 7,
    'STAGE_8_FINAL_REVIEW': 8,
    'STAGE_9_SUBMITTED': 9
  };

  const steps = [
    { name: 'Application Started', minStage: 1, count: 0 },
    { name: 'Personal Details', minStage: 2, count: 0 },
    { name: 'Business Details', minStage: 3, count: 0 },
    { name: 'Bank Details', minStage: 4, count: 0 },
    { name: 'Documents Uploaded', minStage: 5, count: 0 },
    { name: 'Offers Fetched', minStage: 6, count: 0 },
    { name: 'KYC Completed', minStage: 7, count: 0 },
    { name: 'Final Review', minStage: 8, count: 0 },
    { name: 'Submitted to Lender', minStage: 9, count: 0 }
  ];

  applications.forEach((app: any) => {
    const currentWeight = stageWeights[app.stage] || 1;
    steps.forEach((s) => {
      if (currentWeight >= s.minStage) {
        s.count++;
      }
    });
  });

  const base = Math.max(1, steps[0].count);
  const funnel = steps.map((s) => ({
    stage: s.name,
    count: s.count,
    conversionRate: Math.round((s.count / base) * 100)
  }));

  res.json({ funnel });
});

// GET /api/admin/documents
router.get('/documents', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const documents = findMany('documents');
  const totalUploads = documents.length;
  const passwordProtected = documents.filter((d: any) => d.preflightReport?.isPasswordProtected).length;
  const corrupted = documents.filter((d: any) => d.preflightReport?.isCorrupted).length;
  const lowQualityPages = documents.filter((d: any) => 
    d.validationReport?.pageReports?.some((p: any) => p.quality === 'Blurry' || p.quality === 'Low-res')
  ).length;
  const needsReplacement = documents.filter((d: any) => 
    d.validationReport?.pageReports?.some((p: any) => p.status === 'Needs replacement')
  ).length;
  const replacedDocs = documents.filter((d: any) => d.isReplaced).length;

  res.json({
    metrics: {
      totalUploads,
      passwordProtected,
      corrupted,
      lowQualityPages,
      needsReplacement,
      successfullyReplaced: replacedDocs
    },
    documents
  });
});

// GET /api/admin/friction
router.get('/friction', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const applications = findMany('applications');
  const events = findMany('applicationEvents');
  const tickets = findMany('supportTickets');
  const documents = findMany('documents');

  const frictionList = applications.map((a: any) => ({
    applicationId: a.id,
    merchantId: a.merchantId,
    requestedAmountINR: a.requestedAmountINR,
    stage: a.stage,
    status: a.status,
    ...calculateFrictionScore(a.id, events, tickets, documents)
  }));

  res.json({ frictionList });
});

// GET /api/admin/partners
router.get('/partners', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const partners = findMany('partners');
  const telemetry = findMany('partnerTelemetry');
  res.json({ partners, telemetry: telemetry.slice(-50).reverse() });
});

// GET /api/admin/repayments
router.get('/repayments', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const activeLoans = findMany('activeLoans');
  const transactions = findMany('repaymentTransactions');

  const totalLoans = activeLoans.length;
  const healthyLoans = activeLoans.filter((l: any) => l.status === 'ACTIVE_HEALTHY').length;
  const overdueLoans = activeLoans.filter((l: any) => l.status === 'ACTIVE_OVERDUE').length;
  const totalOverdueAmount = activeLoans.reduce((sum: number, l: any) => sum + (l.totalOverdueINR || 0), 0);

  res.json({
    activeLoans,
    summary: {
      totalLoans,
      healthyLoans,
      overdueLoans,
      totalOverdueAmount
    },
    recentTransactions: transactions.slice(-30).reverse()
  });
});

// GET /api/admin/support
router.get('/support', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const tickets = findMany('supportTickets');
  const callbacks = findMany('callbackRequests');
  res.json({ tickets, callbacks });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const auditLogs = findMany('auditLogs');
  res.json({ auditLogs: auditLogs.slice(-100).reverse() });
});

// GET /api/admin/experiments
router.get('/experiments', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const experiments = findMany('recoveryExperiments');
  res.json({ experiments });
});

// GET /api/admin/document-verifications — Document Verification Management List & Stats
router.get('/document-verifications', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const { status, docType } = req.query;
  const verifications = findMany('documentVerifications');
  const documents = findMany('documents');
  const applications = findMany('applications');

  // Enrich verification records with applicant and document details
  let list = verifications.map((v: any) => {
    const doc = documents.find((d: any) => d.id === v.documentId) || {};
    const app = applications.find((a: any) => a.id === v.applicationId) || {};
    return {
      ...v,
      applicantName: app.personalDetails?.fullName || 'Unknown Applicant',
      panNumber: app.personalDetails?.panNumber || '',
      category: app.applicantCategory || 'GENERAL',
      originalFilename: doc.originalFilename || 'document',
      fileSizeKB: doc.fileSizeKB || 0,
      mimeType: doc.mimeType || ''
    };
  });

  if (status && status !== 'ALL') {
    list = list.filter((v: any) => v.verificationStatus === status || v.adminReviewStatus === status);
  }

  if (docType && docType !== 'ALL') {
    list = list.filter((v: any) => v.documentType === docType);
  }

  const summary = {
    total: verifications.length,
    matched: verifications.filter((v: any) => v.verificationStatus === 'MATCH').length,
    mismatched: verifications.filter((v: any) => v.verificationStatus === 'MISMATCH').length,
    unreadable: verifications.filter((v: any) => v.verificationStatus === 'UNREADABLE').length,
    manualReview: verifications.filter((v: any) => v.verificationStatus === 'MANUAL_REVIEW' || v.adminReviewStatus === 'PENDING_REVIEW').length,
    verified: verifications.filter((v: any) => v.verificationStatus === 'VERIFIED' || v.adminReviewStatus === 'VERIFIED').length,
    reuploadRequired: verifications.filter((v: any) => v.verificationStatus === 'REUPLOAD_REQUIRED' || v.recommendedAction === 'REUPLOAD_REQUIRED').length
  };

  res.json({
    verifications: list.reverse(),
    total: list.length,
    summary
  });
});

// GET /api/admin/document-verifications/:id — Detailed Document Verification View
router.get('/document-verifications/:id', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const v = findById('documentVerifications', req.params.id);
  if (!v) return res.status(404).json({ error: 'Verification record not found' });

  const doc = findById('documents', v.documentId);
  const app = findById('applications', v.applicationId);
  const extraction = v.extractionId ? findById('documentExtractions', v.extractionId) : null;
  const crossDoc = v.applicationId
    ? findMany('crossDocumentVerifications', (c: any) => c.applicationId === v.applicationId).pop()
    : null;

  res.json({
    verification: v,
    document: doc,
    application: app,
    extraction,
    crossDocument: crossDoc
  });
});

// POST /api/admin/document-verifications/:id/review — Admin Manual Decision (VERIFIED / REJECTED)
router.post('/document-verifications/:id/review', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const { decision, reason } = req.body;
  if (!['VERIFY', 'REJECT', 'REQUEST_REUPLOAD'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision type' });
  }

  const v = findById('documentVerifications', req.params.id);
  if (!v) return res.status(404).json({ error: 'Verification record not found' });

  const newStatus = decision === 'VERIFY' ? 'VERIFIED' : decision === 'REJECT' ? 'REJECTED' : 'REUPLOAD_REQUIRED';

  const updated = updateRecord('documentVerifications', v.id, {
    verificationStatus: newStatus,
    adminReviewStatus: newStatus,
    reviewedBy: req.user.id,
    reviewedAt: new Date().toISOString(),
    adminReviewNotes: reason || ''
  });

  // Update underlying document as well
  if (v.documentId) {
    updateRecord('documents', v.documentId, {
      verificationStatus: newStatus
    });
  }

  // Audit log
  addRecord('auditLogs', {
    id: uuid(),
    actor: req.user.id,
    action: `DOCUMENT_REVIEW_${decision}`,
    entityType: 'DOCUMENT_VERIFICATION',
    entityId: v.id,
    details: { decision, reason, documentType: v.documentType, applicationId: v.applicationId },
    timestamp: new Date().toISOString()
  });

  // Application event
  if (v.applicationId) {
    addRecord('applicationEvents', {
      id: uuid(),
      applicationId: v.applicationId,
      type: decision === 'VERIFY' ? 'DOCUMENT_OFFICIALLY_VERIFIED' : 'DOCUMENT_REVIEW_REJECTED',
      description: `Admin ${req.user.id} reviewed ${v.documentType}: marked as ${newStatus}. Note: ${reason || 'N/A'}`,
      timestamp: new Date().toISOString(),
      actor: req.user.id
    });
  }

  res.json({
    success: true,
    verification: updated,
    message: `Document marked as ${newStatus}`
  });
});

// POST /api/admin/document-verifications/:id/request-reupload — Request Re-upload from Admin
router.post('/document-verifications/:id/request-reupload', authenticateToken, requireRole('admin', 'support_agent'), (req: AuthRequest, res: Response) => {
  const { reason, targetPages } = req.body;
  const v = findById('documentVerifications', req.params.id);
  if (!v) return res.status(404).json({ error: 'Verification record not found' });

  const updated = updateRecord('documentVerifications', v.id, {
    verificationStatus: 'REUPLOAD_REQUIRED',
    adminReviewStatus: 'REUPLOAD_REQUESTED',
    reviewedBy: req.user.id,
    reviewedAt: new Date().toISOString(),
    adminReviewNotes: reason || 'Re-upload requested by underwriter'
  });

  if (v.documentId) {
    updateRecord('documents', v.documentId, {
      verificationStatus: 'REUPLOAD_REQUIRED'
    });
  }

  if (v.applicationId) {
    addRecord('applicationEvents', {
      id: uuid(),
      applicationId: v.applicationId,
      type: 'REUPLOAD_REQUESTED_BY_ADMIN',
      description: `Underwriter requested re-upload for ${v.documentType}. Reason: ${reason || 'Clarity issues'}`,
      timestamp: new Date().toISOString(),
      actor: req.user.id
    });
  }

  res.json({
    success: true,
    verification: updated,
    message: 'Re-upload request sent to applicant'
  });
});

// POST /api/admin/reset-demo
router.post('/reset-demo', authenticateToken, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const fresh = createSeedData();
  resetDB(fresh);
  addRecord('auditLogs', {
    id: uuid(),
    actor: req.user.id,
    action: 'RESET_DEMO_DATA',
    entityType: 'SYSTEM',
    entityId: 'SYSTEM',
    details: { timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, message: 'All demo data has been reset to baseline scenario.' });
});

export default router;
