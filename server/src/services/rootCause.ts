// FinRescue X — Root Cause Analysis Service
export type RootCauseCategory = 'CUSTOMER_INPUT' | 'DOCUMENT_QUALITY' | 'PLATFORM_ERROR' | 'PARTNER_DELAY' | 'VERIFICATION_DELAY' | 'UNKNOWN';

export interface RootCauseResult {
  applicationId: string;
  primaryCategory: RootCauseCategory;
  confidence: number;
  evidence: string[];
  suggestedAction: string;
  requiresHumanReview: boolean;
  explanation: string;
  createdAt: string;
}

export function analyzeRootCause(applicationId: string, events: any[], documents: any[], tickets: any[], partnerEvents: any[]): RootCauseResult {
  const appEvents = events.filter((e: any) => e.applicationId === applicationId);
  const appDocs = documents.filter((d: any) => d.applicationId === applicationId);
  const appPartnerEvents = partnerEvents.filter((p: any) => p.applicationId === applicationId);

  const evidence: string[] = [];
  const scores: Record<RootCauseCategory, number> = {
    CUSTOMER_INPUT: 0, DOCUMENT_QUALITY: 0, PLATFORM_ERROR: 0,
    PARTNER_DELAY: 0, VERIFICATION_DELAY: 0, UNKNOWN: 0
  };

  // Check document quality issues
  const docFailures = appDocs.filter((d: any) => d.preflightReport && !d.preflightReport.safeForOcr);
  const blurryPages = appDocs.filter((d: any) => d.validationReport?.pageReports?.some((p: any) => p.quality === 'Blurry'));
  const passwordProtected = appDocs.filter((d: any) => d.preflightReport?.isPasswordProtected);
  const corrupted = appDocs.filter((d: any) => d.preflightReport?.isCorrupted);

  if (blurryPages.length > 0) { scores.DOCUMENT_QUALITY += 35; evidence.push(`${blurryPages.length} document(s) have blurry pages`); }
  if (passwordProtected.length > 0) { scores.DOCUMENT_QUALITY += 25; evidence.push(`${passwordProtected.length} password-protected PDF(s)`); }
  if (corrupted.length > 0) { scores.DOCUMENT_QUALITY += 30; evidence.push(`${corrupted.length} corrupted PDF(s)`); }
  if (docFailures.length > 0) { scores.DOCUMENT_QUALITY += 20; evidence.push(`${docFailures.length} document(s) failed preflight`); }

  // Check form/input errors
  const formErrors = appEvents.filter((e: any) => e.type === 'FORM_VALIDATION_ERROR');
  const retries = appEvents.filter((e: any) => e.type === 'DOCUMENT_UPLOAD_RETRY');
  if (formErrors.length > 2) { scores.CUSTOMER_INPUT += 30; evidence.push(`${formErrors.length} form validation errors`); }
  if (retries.length > 2) { scores.CUSTOMER_INPUT += 15; evidence.push(`${retries.length} upload retries`); }

  // Check partner delays
  const partnerFailures = appPartnerEvents.filter((p: any) => p.status === 'FAILURE' || p.status === 'TIMEOUT');
  if (partnerFailures.length > 0) { scores.PARTNER_DELAY += 40; evidence.push(`${partnerFailures.length} partner API failures/timeouts`); }

  // Check verification delays
  const kycPending = appEvents.filter((e: any) => e.type === 'KYC_STAGE_ENTERED').length > 0 && !appEvents.some((e: any) => e.type === 'KYC_COMPLETED');
  if (kycPending) { scores.VERIFICATION_DELAY += 25; evidence.push('KYC verification pending'); }

  // Find highest scoring category
  let maxScore = 0;
  let primaryCategory: RootCauseCategory = 'UNKNOWN';
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) { maxScore = score; primaryCategory = cat as RootCauseCategory; }
  }

  if (maxScore === 0) { primaryCategory = 'UNKNOWN'; evidence.push('No clear root cause identified from available events'); }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const confidence = Math.min(0.95, maxScore / totalScore);

  const actionMap: Record<RootCauseCategory, string> = {
    CUSTOMER_INPUT: 'Provide guided walkthrough of the form fields with input examples',
    DOCUMENT_QUALITY: 'Guide merchant to re-scan documents with better lighting and clarity',
    PLATFORM_ERROR: 'Escalate to engineering team for platform issue investigation',
    PARTNER_DELAY: 'Monitor partner API health and consider fallback partner',
    VERIFICATION_DELAY: 'Follow up on pending verification steps',
    UNKNOWN: 'Assign to human support agent for investigation'
  };

  const explanationMap: Record<RootCauseCategory, string> = {
    CUSTOMER_INPUT: 'The primary issue appears to be related to customer input errors. The merchant may need clearer guidance on form requirements.',
    DOCUMENT_QUALITY: 'The primary issue is poor document quality. Documents uploaded do not meet the quality standards required for processing.',
    PLATFORM_ERROR: 'A platform-level error is causing the issue. This requires technical investigation.',
    PARTNER_DELAY: 'The lending partner API is experiencing delays or failures affecting application processing.',
    VERIFICATION_DELAY: 'Verification processes are taking longer than expected.',
    UNKNOWN: 'The root cause could not be determined from available data. Human review is recommended.'
  };

  return {
    applicationId, primaryCategory, confidence, evidence,
    suggestedAction: actionMap[primaryCategory],
    requiresHumanReview: primaryCategory === 'UNKNOWN' || confidence < 0.5,
    explanation: explanationMap[primaryCategory],
    createdAt: new Date().toISOString()
  };
}
