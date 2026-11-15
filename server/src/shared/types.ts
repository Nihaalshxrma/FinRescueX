// FinRescue X - Shared Types & Interfaces
// Personal Loan Recovery & Lender Shortlisting Engine

export type UserRole = 'merchant' | 'admin' | 'support_agent' | 'normal_user';

export interface User {
  id: string;
  mobile: string;
  name: string;
  role: UserRole;
  merchantId?: string | null;
  createdAt: string;
}

export type ApplicantCategory = 'SALARIED' | 'SELF_EMPLOYED';

export type ShortlistingDecision = 
  | 'SHORTLIST_RECOMMENDED'
  | 'MANUAL_UNDERWRITING_REVIEW'
  | 'NOT_SHORTLISTED_HIGH_RISK';

export interface ChecklistItem {
  id: string;
  criterion: string;
  weight: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  observedValue: string;
  benchmarkValue: string;
  lenderNote: string;
}

export interface ShortlistingPrediction {
  applicantCategory: ApplicantCategory;
  checklistScore: number; // 0 to 100
  foirPercentage: number;
  maxEligibleLoanEstimate: number;
  decisionPrediction: ShortlistingDecision;
  checklistItems: ChecklistItem[];
  aiUnderwriterSummary: string[];
  calculatedAt: string;
}

export interface SalariedDetails {
  employerName: string;
  employerCategory: 'MNC' | 'Pvt Ltd' | 'Govt-PSU' | 'Startup' | 'Other';
  currentJobTenureMonths: number;
  totalWorkExperienceYears: number;
  netMonthlySalaryINR: number;
  existingMonthlyEmisINR: number;
  salaryMode: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
}

export interface SelfEmployedDetails {
  businessName: string;
  entityType: 'Proprietorship' | 'Partnership' | 'Private Limited' | 'Freelancer-Professional';
  businessVintageYears: number;
  annualNetProfitINR: number; // as per ITR
  avgMonthlyBankCreditsINR: number;
  existingBusinessAndPersonalEmisINR: number;
  gstRegistered: boolean;
  gstNumber?: string;
  udyamRegistered: boolean;
  udyamNumber?: string;
  recentBouncesCount: number; // cheque/NACH in last 6 months
}

export interface PersonalDetails {
  fullName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  age?: number;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';
  pennyDropStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  verificationTimestamp?: string;
  referenceId?: string;
}

export type DocumentType = 
  | 'PAN_CARD'
  | 'AADHAAR_CARD'
  | 'SALARY_SLIPS'
  | 'BANK_STATEMENT'
  | 'ITR_COMPUTATION'
  | 'BUSINESS_PROOF';

export type PreflightStatus = 
  | 'READY_FOR_VERIFICATION'
  | 'READY_WITH_WARNINGS'
  | 'PASSWORD_PROTECTED'
  | 'CORRUPTED_PDF'
  | 'UNSUPPORTED_FORMAT'
  | 'EMPTY_DOCUMENT'
  | 'INVALID_FILE'
  | 'NEEDS_RESCAN'
  | 'MANUAL_REVIEW_REQUIRED';

export interface DocumentPreflightReport {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string;
  fileSizeKB: number;
  isPdf: boolean;
  pageCount: number;
  isPasswordProtected: boolean;
  isCorrupted: boolean;
  hasEmptyPages: boolean;
  emptyPageNumbers: number[];
  rotationNeededPages: number[];
  inconsistentDimensions: boolean;
  status: PreflightStatus;
  statusMessage: string;
  reasons: string[];
  safeForOcr: boolean;
  timestamp: string;
}

export interface DocumentPageReport {
  pageNumber: number;
  textExtracted: string;
  readability: 'Readable' | 'Poor text' | 'Unreadable' | 'No text detected';
  quality: 'Good' | 'Blurry' | 'Dark / Underexposed' | 'Overexposed' | 'Low-res' | 'Skewed';
  status: 'Passed' | 'Needs replacement' | 'Manual check';
  issues: string[];
  confidence: number;
  previewUrl?: string;
}

export interface DocumentValidationReport {
  id: string;
  documentId: string;
  documentType: DocumentType;
  overallStatus: 'PASSED' | 'FAILED' | 'PARTIAL_REPLACEMENT_NEEDED' | 'MANUAL_REVIEW';
  pageReports: DocumentPageReport[];
  totalExpectedPages: number;
  validPagesCount: number;
  invalidPagesCount: number;
  timestamp: string;
}

export interface UploadedDocument {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  originalFilename: string;
  filePath: string;
  mimeType: string;
  fileSizeKB: number;
  uploadedAt: string;
  preflightReport?: DocumentPreflightReport;
  validationReport?: DocumentValidationReport;
  isRequired: boolean;
  isReplaced: boolean;
  replacedPages?: number[];
}

export type ApplicationStage = 
  | 'STAGE_1_TRACK_SELECTION'
  | 'STAGE_2_PERSONAL_DETAILS'
  | 'STAGE_3_EMPLOYMENT_OR_BUSINESS'
  | 'STAGE_4_BANK_DETAILS'
  | 'STAGE_5_DOCUMENTS'
  | 'STAGE_6_OFFER_SELECTION'
  | 'STAGE_7_KYC_VERIFICATION'
  | 'STAGE_8_FINAL_REVIEW'
  | 'STAGE_9_SUBMITTED';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'DOCUMENTS_PENDING'
  | 'DOCUMENT_ERROR'
  | 'OFFERS_AVAILABLE'
  | 'KYC_PENDING'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED_TO_PARTNER'
  | 'PARTNER_ACKNOWLEDGED'
  | 'RECOVERED';

export interface LoanOffer {
  id: string;
  lenderId: string;
  lenderName: string;
  lenderLogoUrl?: string;
  amountINR: number;
  annualRoiPercentage: number;
  aprPercentage: number;
  tenureMonths: number;
  repaymentFrequency: 'MONTHLY' | 'DAILY';
  processingFeeINR: number;
  gstOnProcessingFeeINR: number;
  insuranceChargesINR: number;
  netDisbursalAmountINR: number;
  totalRepaymentINR: number;
  instalmentAmountINR: number;
  totalInstallments: number;
  prepaymentForeclosureTerms: string;
  latePaymentCharges: string;
  coolingOffDays: number;
  grievanceRedressalOfficer: {
    name: string;
    email: string;
    phone: string;
  };
  expiresAt: string;
}

export interface LoanApplication {
  id: string; // e.g. FNX-DEMO-1001 or FNX-SAL-1001
  merchantId: string; // borrower user ID or merchant ID
  userType?: 'MERCHANT' | 'NORMAL_USER';
  applicantCategory: ApplicantCategory; // 'SALARIED' | 'SELF_EMPLOYED'
  stage: ApplicationStage;
  status: ApplicationStatus;
  requestedAmountINR: number;
  loanPurpose: string;
  requiredTenureMonths: number;
  proposedEmiINR?: number;
  cibilScore?: number;
  
  personalDetails?: PersonalDetails;
  salariedDetails?: SalariedDetails;
  selfEmployedDetails?: SelfEmployedDetails;
  bankDetails?: BankDetails;
  
  documents: UploadedDocument[];
  selectedOfferId?: string;
  selectedOffer?: LoanOffer;
  
  shortlistingPrediction?: ShortlistingPrediction;
  
  partnerAcknowledgement?: {
    ackId: string;
    partnerName: string;
    submittedAt: string;
    expectedSlaHours: number;
    status: 'SUBMITTED' | 'UNDER_REVIEW' | 'IN_VERIFICATION';
    referenceNumber?: string;
    responseNote?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface RepaymentTransaction {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  paidDate?: string | null;
  amountINR: number;
  status: 'PAID_ON_TIME' | 'PAID_LATE' | 'DUE' | 'UPCOMING' | 'MISSED' | 'OVERDUE';
  penaltyFeeINR: number;
  settlementMethod: 'UPI_AUTOPAY' | 'DAILY_QR_DEDUCTION' | 'NETBANKING' | 'NACH';
  utrOrReference?: string | null;
}

export interface ActiveLoan {
  id: string;
  merchantId: string;
  applicantCategory?: ApplicantCategory;
  lenderName: string;
  originalPrincipalINR: number;
  currentOutstandingINR: number;
  totalRepaidINR: number;
  annualRoiPercentage: number;
  tenureTotal: number;
  remainingInstallments: number;
  repaymentFrequency: 'MONTHLY' | 'DAILY';
  installmentAmountINR: number;
  nextDueDate: string;
  totalOverdueINR: number;
  overdueInstallmentCount: number;
  status: 'ACTIVE_HEALTHY' | 'ACTIVE_OVERDUE' | 'CLOSED';
  disbursedAt: string;
  transactions?: RepaymentTransaction[];
}

export interface SupportTicket {
  id: string;
  applicationId?: string | null;
  merchantId: string;
  merchantName: string;
  merchantPhone: string;
  subject: string;
  category: 'DOCUMENT_ISSUE' | 'LOAN_TERMS' | 'BANK_VERIFICATION' | 'CALLBACK_REQUEST' | 'CHECKLIST_FAILED' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED';
  assignedTo?: string | null;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CallbackRequest {
  id: string;
  applicationId?: string | null;
  merchantId: string;
  merchantName: string;
  phone: string;
  preferredTime: 'WITHIN_1_MINUTE' | 'WITHIN_1_HOUR' | 'MORNING_10_TO_1' | 'EVENING_3_TO_7';
  isUrgent1Min?: boolean;
  reason: string;
  consentGranted: boolean;
  status: 'REQUESTED' | 'ASSIGNED' | 'CALLED_COMPLETED' | 'UNREACHABLE' | 'CANCELLED';
  countdownSeconds?: number;
  requestedAt: string;
}
