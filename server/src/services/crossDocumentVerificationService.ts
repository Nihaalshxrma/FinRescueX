// FinRescue X — Cross-Document Verification Service
// Evaluates consistency ACROSS multiple uploaded documents for an applicant.
// Generates a comprehensive discrepancy report without automatically declaring fraud.

import { compareNames, compareDates, compareAmounts, normalizePAN } from './normalizationUtils';

export interface CrossDocCheck {
  checkId: string;
  checkName: string;
  sourceDocA: string;
  sourceDocB: string;
  fieldA: string;
  fieldB: string;
  valueA: any;
  valueB: any;
  status: 'CONSISTENT' | 'DISCREPANCY' | 'MANUAL_REVIEW' | 'SKIPPED';
  confidence: number;
  explanation: string;
}

export interface CrossDocumentVerificationResult {
  applicationId: string;
  overallConsistencyStatus: 'CONSISTENT' | 'DISCREPANCIES_DETECTED' | 'MANUAL_REVIEW_REQUIRED' | 'INSUFFICIENT_DOCS';
  passedCount: number;
  discrepancyCount: number;
  reviewCount: number;
  checks: CrossDocCheck[];
  discrepancies: string[];
  summary: string;
}

export class CrossDocumentVerificationService {
  /**
   * Run cross-document consistency checks on an array of extracted document objects.
   */
  static verifyCrossDocuments(
    applicationId: string,
    documentsWithExtractions: Array<{
      documentType: string;
      extractedData: Record<string, any>;
      validationStatus?: string;
    }>,
    applicationProfile?: any
  ): CrossDocumentVerificationResult {
    const checks: CrossDocCheck[] = [];
    const discrepancies: string[] = [];

    // Index documents by type
    const docMap = new Map<string, Record<string, any>>();
    for (const d of documentsWithExtractions) {
      if (d.extractedData && Object.keys(d.extractedData).length > 0) {
        docMap.set(d.documentType, d.extractedData);
      }
    }

    const panDoc = docMap.get('PAN_CARD');
    const aadhaarDoc = docMap.get('AADHAAR_CARD');
    const bankDoc = docMap.get('BANK_STATEMENT') || docMap.get('BUSINESS_BANK_STATEMENT');
    const salaryDoc = docMap.get('SALARY_SLIP');
    const itrDoc = docMap.get('ITR') || docMap.get('BUSINESS_ITR');
    const gstDoc = docMap.get('GST_CERTIFICATE');
    const udyamDoc = docMap.get('UDYAM_CERTIFICATE');

    // ─── Check 1: PAN Name vs Aadhaar Name ──────────────────────────────────
    if (panDoc && aadhaarDoc) {
      const namePan = panDoc.full_name || panDoc.name;
      const nameAadhaar = aadhaarDoc.full_name || aadhaarDoc.name;
      if (namePan && nameAadhaar) {
        const comp = compareNames(namePan, nameAadhaar);
        const status = comp.match === 'NO_MATCH' ? 'DISCREPANCY' : comp.match === 'PARTIAL' ? 'MANUAL_REVIEW' : 'CONSISTENT';
        checks.push({
          checkId: 'PAN_VS_AADHAAR_NAME',
          checkName: 'PAN Name vs Aadhaar Name',
          sourceDocA: 'PAN_CARD',
          sourceDocB: 'AADHAAR_CARD',
          fieldA: 'full_name',
          fieldB: 'full_name',
          valueA: namePan,
          valueB: nameAadhaar,
          status,
          confidence: comp.confidence,
          explanation: comp.details
        });
        if (status === 'DISCREPANCY') discrepancies.push(`Name discrepancy between PAN Card (${namePan}) and Aadhaar (${nameAadhaar}).`);
      }
    }

    // ─── Check 2: PAN Name vs Bank Account Holder Name ──────────────────────
    if (panDoc && bankDoc) {
      const namePan = panDoc.full_name || panDoc.name;
      const nameBank = bankDoc.account_holder_name || bankDoc.name;
      if (namePan && nameBank) {
        const comp = compareNames(namePan, nameBank);
        const status = comp.match === 'NO_MATCH' ? 'DISCREPANCY' : comp.match === 'PARTIAL' ? 'MANUAL_REVIEW' : 'CONSISTENT';
        checks.push({
          checkId: 'PAN_VS_BANK_HOLDER_NAME',
          checkName: 'PAN Name vs Bank Account Holder',
          sourceDocA: 'PAN_CARD',
          sourceDocB: 'BANK_STATEMENT',
          fieldA: 'full_name',
          fieldB: 'account_holder_name',
          valueA: namePan,
          valueB: nameBank,
          status,
          confidence: comp.confidence,
          explanation: comp.details
        });
        if (status === 'DISCREPANCY') discrepancies.push(`Account holder name on bank statement (${nameBank}) does not match PAN holder (${namePan}).`);
      }
    }

    // ─── Check 3: PAN DOB vs Aadhaar DOB ────────────────────────────────────
    if (panDoc && aadhaarDoc) {
      const dobPan = panDoc.date_of_birth || panDoc.dob;
      const dobAadhaar = aadhaarDoc.date_of_birth || aadhaarDoc.dob;
      if (dobPan && dobAadhaar) {
        const comp = compareDates(dobPan, dobAadhaar);
        checks.push({
          checkId: 'PAN_VS_AADHAAR_DOB',
          checkName: 'PAN DOB vs Aadhaar DOB',
          sourceDocA: 'PAN_CARD',
          sourceDocB: 'AADHAAR_CARD',
          fieldA: 'date_of_birth',
          fieldB: 'date_of_birth',
          valueA: dobPan,
          valueB: dobAadhaar,
          status: comp.match ? 'CONSISTENT' : 'MANUAL_REVIEW',
          confidence: comp.match ? 1.0 : 0.6,
          explanation: comp.details
        });
        if (!comp.match) discrepancies.push(`Date of birth discrepancy: PAN shows ${dobPan}, Aadhaar shows ${dobAadhaar}.`);
      }
    }

    // ─── Check 4: Salary Slip Net Pay vs Bank Statement Salary Credits ─────
    if (salaryDoc && bankDoc) {
      const netPay = Number(salaryDoc.net_salary || salaryDoc.net_pay || 0);
      const bankSalary = Number(bankDoc.salary_credits || bankDoc.monthly_salary_credit || 0);
      if (netPay > 0 && bankSalary > 0) {
        const comp = compareAmounts(netPay, bankSalary, 10);
        checks.push({
          checkId: 'SALARY_SLIP_VS_BANK_CREDIT',
          checkName: 'Salary Slip Net Pay vs Bank Credit',
          sourceDocA: 'SALARY_SLIP',
          sourceDocB: 'BANK_STATEMENT',
          fieldA: 'net_salary',
          fieldB: 'salary_credits',
          valueA: `₹${netPay.toLocaleString('en-IN')}`,
          valueB: `₹${bankSalary.toLocaleString('en-IN')}`,
          status: comp.match ? 'CONSISTENT' : 'MANUAL_REVIEW',
          confidence: 0.85,
          explanation: comp.details
        });
      }
    }

    // ─── Check 5: GST Legal Name vs Business Bank Account Name ──────────────
    if (gstDoc && bankDoc) {
      const gstLegal = gstDoc.legal_name || gstDoc.trade_name;
      const bankHolder = bankDoc.account_holder_name;
      if (gstLegal && bankHolder) {
        const comp = compareNames(gstLegal, bankHolder);
        const status = comp.match === 'NO_MATCH' ? 'DISCREPANCY' : comp.match === 'PARTIAL' ? 'MANUAL_REVIEW' : 'CONSISTENT';
        checks.push({
          checkId: 'GST_VS_BANK_NAME',
          checkName: 'GST Legal Name vs Bank Account Name',
          sourceDocA: 'GST_CERTIFICATE',
          sourceDocB: 'BANK_STATEMENT',
          fieldA: 'legal_name',
          fieldB: 'account_holder_name',
          valueA: gstLegal,
          valueB: bankHolder,
          status,
          confidence: comp.confidence,
          explanation: comp.details
        });
        if (status === 'DISCREPANCY') discrepancies.push(`GST Legal Name (${gstLegal}) does not match Bank Account Holder (${bankHolder}).`);
      }
    }

    // ─── Check 6: Udyam Enterprise Name vs GST Business Name ────────────────
    if (udyamDoc && gstDoc) {
      const udyamName = udyamDoc.enterprise_name;
      const gstName = gstDoc.legal_name || gstDoc.trade_name;
      if (udyamName && gstName) {
        const comp = compareNames(udyamName, gstName);
        checks.push({
          checkId: 'UDYAM_VS_GST_NAME',
          checkName: 'Udyam Enterprise Name vs GST Trade Name',
          sourceDocA: 'UDYAM_CERTIFICATE',
          sourceDocB: 'GST_CERTIFICATE',
          fieldA: 'enterprise_name',
          fieldB: 'trade_name',
          valueA: udyamName,
          valueB: gstName,
          status: comp.match === 'NO_MATCH' ? 'DISCREPANCY' : 'CONSISTENT',
          confidence: comp.confidence,
          explanation: comp.details
        });
        if (comp.match === 'NO_MATCH') discrepancies.push(`Enterprise name mismatch between Udyam (${udyamName}) and GST (${gstName}).`);
      }
    }

    // ─── Check 7: GSTIN contains PAN ─────────────────────────────────────────
    if (panDoc && gstDoc) {
      const pan = normalizePAN(panDoc.pan_number || panDoc.pan || '');
      const gstin = (gstDoc.gstin || '').toUpperCase().trim();
      if (pan && gstin.length >= 12) {
        const panInGst = gstin.substring(2, 12);
        const match = pan === panInGst;
        checks.push({
          checkId: 'PAN_IN_GSTIN',
          checkName: 'PAN embedded in GSTIN',
          sourceDocA: 'PAN_CARD',
          sourceDocB: 'GST_CERTIFICATE',
          fieldA: 'pan_number',
          fieldB: 'gstin[2..12]',
          valueA: pan,
          valueB: panInGst,
          status: match ? 'CONSISTENT' : 'DISCREPANCY',
          confidence: 1.0,
          explanation: match ? 'PAN matches chars 3-12 of GSTIN' : `PAN (${pan}) does not match PAN in GSTIN (${panInGst})`
        });
        if (!match) discrepancies.push(`GSTIN does not incorporate the applicant's PAN.`);
      }
    }

    // ─── Summary & Status ────────────────────────────────────────────────────
    const passedCount = checks.filter(c => c.status === 'CONSISTENT').length;
    const discrepancyCount = checks.filter(c => c.status === 'DISCREPANCY').length;
    const reviewCount = checks.filter(c => c.status === 'MANUAL_REVIEW').length;

    let overallConsistencyStatus: CrossDocumentVerificationResult['overallConsistencyStatus'] = 'CONSISTENT';
    if (checks.length === 0) {
      overallConsistencyStatus = 'INSUFFICIENT_DOCS';
    } else if (discrepancyCount > 0) {
      overallConsistencyStatus = 'DISCREPANCIES_DETECTED';
    } else if (reviewCount > 0) {
      overallConsistencyStatus = 'MANUAL_REVIEW_REQUIRED';
    }

    const summary = overallConsistencyStatus === 'CONSISTENT'
      ? `Cross-document verification passed. ${passedCount} check(s) consistent across uploaded documents.`
      : overallConsistencyStatus === 'DISCREPANCIES_DETECTED'
      ? `Cross-document verification detected ${discrepancyCount} discrepancy(ies). Human review required.`
      : overallConsistencyStatus === 'MANUAL_REVIEW_REQUIRED'
      ? `Cross-document verification identified ${reviewCount} item(s) for manual underwriting review.`
      : 'Upload additional documents to enable multi-document cross-verification.';

    return {
      applicationId,
      overallConsistencyStatus,
      passedCount,
      discrepancyCount,
      reviewCount,
      checks,
      discrepancies,
      summary
    };
  }
}
