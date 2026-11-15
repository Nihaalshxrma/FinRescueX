// FinRescue X — Intelligence Routes
import { Router, Response } from 'express';
import { findMany, findById } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculateFrictionScore } from '../services/frictionEngine';
import { analyzeRootCause } from '../services/rootCause';

const router = Router();

// GET /api/intelligence/friction/:applicationId
router.get('/friction/:applicationId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const events = findMany('applicationEvents');
  const tickets = findMany('supportTickets');
  const documents = findMany('documents');

  const frictionScore = calculateFrictionScore(applicationId, events, tickets, documents);
  res.json({
    frictionScore,
    disclaimer: 'Customer assistance-priority indicator. Not a credit score or loan default prediction.'
  });
});

// GET /api/intelligence/root-cause/:applicationId
router.get('/root-cause/:applicationId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const events = findMany('applicationEvents');
  const documents = findMany('documents');
  const tickets = findMany('supportTickets');
  const partnerEvents = findMany('partnerTelemetry');

  const rootCause = analyzeRootCause(applicationId, events, documents, tickets, partnerEvents);
  res.json({ rootCause });
});

// GET /api/intelligence/next-action/:applicationId
router.get('/next-action/:applicationId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const app = findById('applications', applicationId);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const events = findMany('applicationEvents');
  const documents = findMany('documents');
  const tickets = findMany('supportTickets');
  const partnerEvents = findMany('partnerTelemetry');

  const friction = calculateFrictionScore(applicationId, events, tickets, documents);
  const rootCause = analyzeRootCause(applicationId, events, documents, tickets, partnerEvents);

  let recommendation = {
    actionType: 'CONTINUE_APPLICATION',
    title: 'Continue Loan Journey',
    description: 'Proceed to next step in your loan journey.',
    ctaText: 'Continue',
    ctaLink: `/loan/apply/${applicationId}`,
    requiresConfirmation: false
  };

  const blurryDoc = documents.find((d: any) => 
    d.applicationId === applicationId && 
    d.validationReport?.pageReports?.some((p: any) => p.status === 'Needs replacement')
  );

  const passwordDoc = documents.find((d: any) =>
    d.applicationId === applicationId &&
    d.preflightReport?.isPasswordProtected
  );

  if (passwordDoc) {
    recommendation = {
      actionType: 'UNLOCK_OR_REUPLOAD_PDF',
      title: 'Unlocked Document Required',
      description: `${passwordDoc.documentType} is password protected. Please upload an unlocked PDF.`,
      ctaText: 'Re-upload Document',
      ctaLink: `/loan/documents/${applicationId}`,
      requiresConfirmation: false
    };
  } else if (blurryDoc) {
    recommendation = {
      actionType: 'REPLACE_SINGLE_PAGE',
      title: 'Single Page Replacement Available',
      description: `${blurryDoc.documentType} has an unreadable page. You only need to replace the blurry page — valid pages are preserved!`,
      ctaText: 'Replace Page',
      ctaLink: `/loan/documents/${applicationId}`,
      requiresConfirmation: false
    };
  } else if (app.stage === 'STAGE_6_OFFER_SELECTION' || app.status === 'OFFERS_AVAILABLE') {
    recommendation = {
      actionType: 'COMPARE_OFFERS',
      title: 'Review & Compare Loan Offers',
      description: 'Lender offers are ready for your review. Check Key Fact Statements before confirming.',
      ctaText: 'View Offers',
      ctaLink: `/loan/offers/${applicationId}`,
      requiresConfirmation: false
    };
  }

  res.json({
    applicationId,
    recommendation,
    frictionPriority: friction.priority,
    rootCauseCategory: rootCause.primaryCategory,
    reasons: friction.reasons
  });
});

export default router;
