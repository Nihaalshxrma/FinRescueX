// FinRescue X — Friction Engine Service
export interface FrictionScore {
  applicationId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  failedUploadCount: number;
  timeSpentMinutes: number;
  inactivityHours: number;
  formErrorCount: number;
  supportTicketCount: number;
  recoveryAttemptCount: number;
  reasons: string[];
  calculatedAt: string;
}

export function calculateFrictionScore(
  applicationId: string,
  events: any[],
  tickets: any[],
  documents: any[]
): FrictionScore {
  const appEvents = events.filter((e: any) => e.applicationId === applicationId);
  const appTickets = tickets.filter((t: any) => t.applicationId === applicationId);

  // Count failures
  const failedUploadCount = appEvents.filter((e: any) =>
    e.type === 'DOCUMENT_UPLOAD_RETRY' || e.type === 'DOCUMENT_VALIDATION_FAILED'
  ).length;

  // Calculate time spent
  const timestamps = appEvents.map((e: any) => new Date(e.timestamp).getTime());
  const timeSpentMinutes = timestamps.length > 1
    ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60000)
    : 0;

  // Calculate inactivity
  const latestEvent = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
  const inactivityHours = Math.round((Date.now() - latestEvent) / 3600000);

  // Count form errors
  const formErrorCount = appEvents.filter((e: any) => e.type === 'FORM_VALIDATION_ERROR').length;

  // Recovery attempts
  const recoveryAttemptCount = appEvents.filter((e: any) =>
    e.type === 'AI_RECOVERY_SUGGESTED' || e.type === 'DOCUMENT_UPLOAD_RETRY'
  ).length;

  // Calculate score (0 to 100)
  let score = 0;
  const reasons: string[] = [];

  if (failedUploadCount >= 3) { score += 30; reasons.push(`${failedUploadCount} failed document uploads`); }
  else if (failedUploadCount >= 1) { score += 15; reasons.push(`${failedUploadCount} failed document upload(s)`); }

  if (inactivityHours >= 48) { score += 25; reasons.push(`${inactivityHours} hours of inactivity`); }
  else if (inactivityHours >= 24) { score += 15; reasons.push(`${inactivityHours} hours of inactivity`); }

  if (appTickets.length >= 2) { score += 20; reasons.push(`${appTickets.length} support tickets created`); }
  else if (appTickets.length >= 1) { score += 10; reasons.push('Support ticket created'); }

  // Document quality issues
  const docIssues = documents.filter((d: any) =>
    d.applicationId === applicationId &&
    d.preflightReport &&
    !d.preflightReport.safeForOcr
  ).length;
  if (docIssues > 0) { score += 15; reasons.push(`${docIssues} document(s) with quality issues`); }

  if (recoveryAttemptCount >= 2) { score += 10; reasons.push(`${recoveryAttemptCount} recovery attempts`); }

  score = Math.min(100, score);

  let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score >= 60) priority = 'HIGH';
  else if (score >= 30) priority = 'MEDIUM';

  return {
    applicationId, priority, score,
    failedUploadCount, timeSpentMinutes, inactivityHours,
    formErrorCount, supportTicketCount: appTickets.length,
    recoveryAttemptCount, reasons,
    calculatedAt: new Date().toISOString()
  };
}
