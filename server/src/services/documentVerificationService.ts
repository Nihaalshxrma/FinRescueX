// FinRescue X — Document Verification Service (Deterministic Comparison Engine)
// Compares extracted document data against registered applicant profile.
// Follows strict non-AI-alone, deterministic, multi-status verification logic.

import {
  compareNames,
  compareDates,
  compareAddresses,
  compareAmounts,
  normalizePAN,
  validatePANFormat,
  normalizeGSTIN,
  validateGSTINFormat,
  validateUdyamNumber,
  maskPAN,
  maskAccountNumber
} from './normalizationUtils';

export type VerificationStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTION_COMPLETED'
  | 'MATCH'
  | 'MISMATCH'
  | 'UNREADABLE'
  | 'INCOMPLETE'
  | 'MANUAL_REVIEW'
  | 'VERIFIED'
  | 'REUPLOAD_REQUIRED'
  | 'REJECTED';

export interface FieldCheck {
  fieldName: string;
  fieldLabel: string;
  extractedValue: any;
  registeredValue: any;
  status: 'MATCH' | 'MISMATCH' | 'PARTIAL' | 'NOT_AVAILABLE' | 'MANUAL_REVIEW';
  confidence: number;
  remarks: string;
}

export interface DocumentVerificationResult {
  documentType: string;
  verificationStatus: VerificationStatus;
  overallScore: number;
  fieldChecks: FieldCheck[];
  discrepancies: string[];
  qualityChecks: {
    isReadable: boolean;
    ocrConfidence: number;
    blurDetected: boolean;
    issues: string[];
  };
  summary: string;
  recommendedAction: 'PROCEED' | 'MANUAL_REVIEW_REQUIRED' | 'REUPLOAD_REQUIRED';
}

export class DocumentVerificationService {
  /**
   * Deterministically verify extracted data against application profile.
   */
  static verifyDocument(
    documentType: string,
    extractedData: Record<string, any> = {},
    application: any = {},
    qualityInfo: { ocrConfidence?: number; blurDetected?: boolean; issues?: string[] } = {}
  ): DocumentVerificationResult {
    const fieldChecks: FieldCheck[] = [];
    const discrepancies: string[] = [];

    const ocrConfidence = qualityInfo.ocrConfidence ?? 0.85;
    const blurDetected = qualityInfo.blurDetected ?? false;
    const issues = [...(qualityInfo.issues || [])];

    // Check readability first
    const isReadable = !blurDetected && ocrConfidence >= 0.4 && Object.keys(extractedData).length > 0;

    if (!isReadable) {
      if (blurDetected || ocrConfidence < 0.4) {
        issues.push('Your document is unclear. Please upload a clearer image or PDF.');
      }
      return {
        documentType,
        verificationStatus: 'UNREADABLE',
        overallScore: 0,
        fieldChecks: [],
        discrepancies: ['Document unreadable or illegible.'],
        qualityChecks: {
          isReadable: false,
          ocrConfidence,
          blurDetected,
          issues
        },
        summary: 'Your document is unclear. Please upload a clearer image or PDF.',
        recommendedAction: 'REUPLOAD_REQUIRED'
      };
    }

    const personal = application.personalDetails || {};
    const bank = application.bankDetails || {};
    const selfEmp = application.selfEmployedDetails || {};
    const salaried = application.salariedDetails || {};

    // ─── 1. PAN CARD ──────────────────────────────────────────────────────────
    if (documentType === 'PAN_CARD') {
      // PAN Number Check
      const extPan = extractedData.pan_number || extractedData.pan;
      const regPan = personal.panNumber;
      if (extPan) {
        const formatCheck = validatePANFormat(extPan);
        if (!formatCheck.valid) {
          discrepancies.push(`Extracted PAN (${extPan}) fails standard format check.`);
          fieldChecks.push({
            fieldName: 'pan_number',
            fieldLabel: 'PAN Number Format',
            extractedValue: extPan,
            registeredValue: regPan ? maskPAN(regPan) : 'N/A',
            status: 'MISMATCH',
            confidence: 0.95,
            remarks: formatCheck.details
          });
        } else if (regPan) {
          const match = normalizePAN(extPan) === normalizePAN(regPan);
          fieldChecks.push({
            fieldName: 'pan_number',
            fieldLabel: 'PAN Number Match',
            extractedValue: maskPAN(extPan),
            registeredValue: maskPAN(regPan),
            status: match ? 'MATCH' : 'MISMATCH',
            confidence: 1.0,
            remarks: match ? 'PAN number matches registration' : `PAN mismatch (Document: ${maskPAN(extPan)} vs Profile: ${maskPAN(regPan)})`
          });
          if (!match) discrepancies.push(`PAN number mismatch.`);
        }
      } else {
        fieldChecks.push({
          fieldName: 'pan_number',
          fieldLabel: 'PAN Number',
          extractedValue: null,
          registeredValue: regPan ? maskPAN(regPan) : 'N/A',
          status: 'NOT_AVAILABLE',
          confidence: 0,
          remarks: 'PAN number could not be extracted from document'
        });
      }

      // Name Check
      const extName = extractedData.full_name || extractedData.name;
      const regName = personal.fullName;
      if (extName && regName) {
        const nameComp = compareNames(extName, regName);
        let status: FieldCheck['status'] = 'MATCH';
        if (nameComp.match === 'NO_MATCH') status = 'MISMATCH';
        else if (nameComp.match === 'PARTIAL') status = 'MANUAL_REVIEW';
        else if (nameComp.match === 'FUZZY') status = 'MATCH';

        fieldChecks.push({
          fieldName: 'full_name',
          fieldLabel: 'Name on PAN',
          extractedValue: extName,
          registeredValue: regName,
          status,
          confidence: nameComp.confidence,
          remarks: nameComp.details
        });
        if (status === 'MISMATCH') discrepancies.push(`Name on PAN does not match registered applicant (${extName} vs ${regName}).`);
      }

      // DOB Check
      const extDob = extractedData.date_of_birth || extractedData.dob;
      const regDob = personal.dateOfBirth;
      if (extDob && regDob) {
        const dobComp = compareDates(extDob, regDob);
        fieldChecks.push({
          fieldName: 'date_of_birth',
          fieldLabel: 'Date of Birth',
          extractedValue: extDob,
          registeredValue: regDob,
          status: dobComp.match ? 'MATCH' : 'MANUAL_REVIEW',
          confidence: dobComp.match ? 1.0 : 0.5,
          remarks: dobComp.details
        });
        if (!dobComp.match) discrepancies.push(`DOB on PAN differs from registered DOB.`);
      }
    }

    // ─── 2. AADHAAR CARD ──────────────────────────────────────────────────────
    else if (documentType === 'AADHAAR_CARD') {
      const extName = extractedData.full_name || extractedData.name;
      const regName = personal.fullName;
      if (extName && regName) {
        const nameComp = compareNames(extName, regName);
        fieldChecks.push({
          fieldName: 'full_name',
          fieldLabel: 'Name on Aadhaar',
          extractedValue: extName,
          registeredValue: regName,
          status: nameComp.match === 'NO_MATCH' ? 'MISMATCH' : nameComp.match === 'PARTIAL' ? 'MANUAL_REVIEW' : 'MATCH',
          confidence: nameComp.confidence,
          remarks: nameComp.details
        });
        if (nameComp.match === 'NO_MATCH') discrepancies.push(`Name on Aadhaar does not match registered applicant.`);
      }

      // Address check
      const extAddr = extractedData.address;
      const regAddr = `${personal.address || ''} ${personal.city || ''} ${personal.state || ''} ${personal.pincode || ''}`.trim();
      if (extAddr && regAddr) {
        const addrComp = compareAddresses(extAddr, regAddr);
        fieldChecks.push({
          fieldName: 'address',
          fieldLabel: 'Residential Address',
          extractedValue: extAddr,
          registeredValue: regAddr,
          status: addrComp.match ? 'MATCH' : addrComp.confidence >= 0.4 ? 'MANUAL_REVIEW' : 'MISMATCH',
          confidence: addrComp.confidence,
          remarks: addrComp.details
        });
      }
    }

    // ─── 3. BANK STATEMENT ────────────────────────────────────────────────────
    else if (documentType === 'BANK_STATEMENT' || documentType === 'BUSINESS_BANK_STATEMENT') {
      const extHolder = extractedData.account_holder_name || extractedData.name;
      const regHolder = bank.accountHolderName || personal.fullName || selfEmp.businessName;
      if (extHolder && regHolder) {
        const nameComp = compareNames(extHolder, regHolder);
        fieldChecks.push({
          fieldName: 'account_holder_name',
          fieldLabel: 'Account Holder Name',
          extractedValue: extHolder,
          registeredValue: regHolder,
          status: nameComp.match === 'NO_MATCH' ? 'MISMATCH' : nameComp.match === 'PARTIAL' ? 'MANUAL_REVIEW' : 'MATCH',
          confidence: nameComp.confidence,
          remarks: nameComp.details
        });
        if (nameComp.match === 'NO_MATCH') discrepancies.push(`Account holder on statement does not match applicant.`);
      }

      const extAcc = extractedData.account_number;
      const regAcc = bank.accountNumber;
      if (extAcc && regAcc) {
        const match = extAcc === regAcc || regAcc.endsWith(String(extAcc).slice(-4));
        fieldChecks.push({
          fieldName: 'account_number',
          fieldLabel: 'Account Number',
          extractedValue: maskAccountNumber(String(extAcc)),
          registeredValue: maskAccountNumber(String(regAcc)),
          status: match ? 'MATCH' : 'MISMATCH',
          confidence: 1.0,
          remarks: match ? 'Account number verified' : 'Account number mismatch'
        });
        if (!match) discrepancies.push(`Bank account number does not match registered account.`);
      }

      // Bank credits vs declared turnover/salary
      const extCredits = extractedData.total_credits;
      const declaredTurnover = selfEmp.avgMonthlyBankCreditsINR || salaried.monthlyInHandSalaryINR;
      if (extCredits && declaredTurnover) {
        const amtComp = compareAmounts(Number(extCredits), Number(declaredTurnover) * 6, 25);
        fieldChecks.push({
          fieldName: 'total_credits',
          fieldLabel: 'Total Turnover / Credits',
          extractedValue: `₹${Number(extCredits).toLocaleString('en-IN')}`,
          registeredValue: `₹${(Number(declaredTurnover) * 6).toLocaleString('en-IN')}`,
          status: amtComp.match ? 'MATCH' : 'MANUAL_REVIEW',
          confidence: 0.8,
          remarks: amtComp.details
        });
      }
    }

    // ─── 4. SALARY SLIP ───────────────────────────────────────────────────────
    else if (documentType === 'SALARY_SLIP') {
      const extEmp = extractedData.employee_name;
      const regName = personal.fullName;
      if (extEmp && regName) {
        const comp = compareNames(extEmp, regName);
        fieldChecks.push({
          fieldName: 'employee_name',
          fieldLabel: 'Employee Name',
          extractedValue: extEmp,
          registeredValue: regName,
          status: comp.match === 'NO_MATCH' ? 'MISMATCH' : 'MATCH',
          confidence: comp.confidence,
          remarks: comp.details
        });
        if (comp.match === 'NO_MATCH') discrepancies.push(`Employee name on salary slip does not match applicant.`);
      }

      const extEmployer = extractedData.employer_name;
      const regEmployer = salaried.employerName;
      if (extEmployer && regEmployer) {
        const comp = compareNames(extEmployer, regEmployer);
        fieldChecks.push({
          fieldName: 'employer_name',
          fieldLabel: 'Employer Name',
          extractedValue: extEmployer,
          registeredValue: regEmployer,
          status: comp.match === 'NO_MATCH' ? 'MISMATCH' : 'MATCH',
          confidence: comp.confidence,
          remarks: comp.details
        });
      }
    }

    // ─── 5. GST CERTIFICATE ───────────────────────────────────────────────────
    else if (documentType === 'GST_CERTIFICATE') {
      const extGstin = extractedData.gstin;
      const regGstin = selfEmp.gstNumber;
      if (extGstin) {
        const fmt = validateGSTINFormat(extGstin);
        if (!fmt.valid) {
          discrepancies.push(`Extracted GSTIN fails format validation.`);
        } else if (regGstin) {
          const match = normalizeGSTIN(extGstin) === normalizeGSTIN(regGstin);
          fieldChecks.push({
            fieldName: 'gstin',
            fieldLabel: 'GSTIN',
            extractedValue: extGstin,
            registeredValue: regGstin,
            status: match ? 'MATCH' : 'MISMATCH',
            confidence: 1.0,
            remarks: match ? 'GSTIN matches registered profile' : 'GSTIN does not match profile'
          });
          if (!match) discrepancies.push(`GSTIN mismatch (${extGstin} vs ${regGstin}).`);
        }
      }

      const extBiz = extractedData.legal_name || extractedData.trade_name;
      const regBiz = selfEmp.businessName;
      if (extBiz && regBiz) {
        const comp = compareNames(extBiz, regBiz);
        fieldChecks.push({
          fieldName: 'business_name',
          fieldLabel: 'Business Legal/Trade Name',
          extractedValue: extBiz,
          registeredValue: regBiz,
          status: comp.match === 'NO_MATCH' ? 'MISMATCH' : 'MATCH',
          confidence: comp.confidence,
          remarks: comp.details
        });
      }
    }

    // ─── 6. UDYAM CERTIFICATE ─────────────────────────────────────────────────
    else if (documentType === 'UDYAM_CERTIFICATE') {
      const extUdyam = extractedData.udyam_number;
      const regUdyam = selfEmp.udyamNumber;
      if (extUdyam) {
        const fmt = validateUdyamNumber(extUdyam);
        if (!fmt.valid) discrepancies.push('Invalid Udyam number format.');
        if (regUdyam) {
          const match = extUdyam.toUpperCase() === regUdyam.toUpperCase();
          fieldChecks.push({
            fieldName: 'udyam_number',
            fieldLabel: 'Udyam Registration Number',
            extractedValue: extUdyam,
            registeredValue: regUdyam,
            status: match ? 'MATCH' : 'MISMATCH',
            confidence: 1.0,
            remarks: match ? 'Udyam number matches profile' : 'Udyam number mismatch'
          });
        }
      }
    }

    // ─── 7. ITR / FORM 16 / BUSINESS ITR ──────────────────────────────────────
    else if (documentType === 'ITR' || documentType === 'BUSINESS_ITR') {
      const extPan = extractedData.pan_number;
      const regPan = personal.panNumber;
      if (extPan && regPan) {
        const match = normalizePAN(extPan) === normalizePAN(regPan);
        fieldChecks.push({
          fieldName: 'pan_number',
          fieldLabel: 'PAN Number on ITR',
          extractedValue: maskPAN(extPan),
          registeredValue: maskPAN(regPan),
          status: match ? 'MATCH' : 'MISMATCH',
          confidence: 1.0,
          remarks: match ? 'PAN on ITR matches registration' : 'PAN on ITR does not match registration'
        });
        if (!match) discrepancies.push('ITR PAN does not match registered applicant PAN.');
      }
    }

    // ─── Determine Overall Verification Status ───────────────────────────────
    // Rules:
    // - Any definitive critical MISMATCH (PAN number, Account number, full name completely different) -> MISMATCH
    // - Any uncertain/fuzzy or manual review field -> MANUAL_REVIEW
    // - If missing required critical fields -> INCOMPLETE
    // - If all evaluated critical fields match -> MATCH (Ready for underwriter sign-off / VERIFIED)
    let verificationStatus: VerificationStatus = 'MATCH';
    let recommendedAction: DocumentVerificationResult['recommendedAction'] = 'PROCEED';

    const hasCriticalMismatch = fieldChecks.some(f => f.status === 'MISMATCH');
    const hasManualReview = fieldChecks.some(f => f.status === 'MANUAL_REVIEW');
    const hasNotAvailable = fieldChecks.some(f => f.status === 'NOT_AVAILABLE');

    if (hasCriticalMismatch) {
      verificationStatus = 'MISMATCH';
      recommendedAction = 'REUPLOAD_REQUIRED';
    } else if (hasManualReview) {
      verificationStatus = 'MANUAL_REVIEW';
      recommendedAction = 'MANUAL_REVIEW_REQUIRED';
    } else if (hasNotAvailable && fieldChecks.length <= 1) {
      verificationStatus = 'INCOMPLETE';
      recommendedAction = 'MANUAL_REVIEW_REQUIRED';
    } else if (fieldChecks.length === 0) {
      verificationStatus = 'EXTRACTION_COMPLETED';
      recommendedAction = 'MANUAL_REVIEW_REQUIRED';
    } else {
      verificationStatus = 'MATCH';
      recommendedAction = 'PROCEED';
    }

    // Compute score (0 - 100)
    let overallScore = 100;
    if (verificationStatus === 'MISMATCH') overallScore = 20;
    else if (verificationStatus === 'MANUAL_REVIEW') overallScore = 65;
    else if (verificationStatus === 'INCOMPLETE') overallScore = 50;

    const summary = verificationStatus === 'MATCH'
      ? `All key fields on ${documentType} deterministically match applicant registration profile.`
      : verificationStatus === 'MISMATCH'
      ? `Credential discrepancy detected: ${discrepancies.join('; ')}`
      : verificationStatus === 'MANUAL_REVIEW'
      ? `Partial or fuzzy match detected on ${documentType}. Routed for manual underwriting review.`
      : `Document extracted with status ${verificationStatus}.`;

    return {
      documentType,
      verificationStatus,
      overallScore,
      fieldChecks,
      discrepancies,
      qualityChecks: {
        isReadable,
        ocrConfidence,
        blurDetected,
        issues
      },
      summary,
      recommendedAction
    };
  }
}
