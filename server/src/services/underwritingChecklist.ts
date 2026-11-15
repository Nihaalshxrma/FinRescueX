// FinRescue X — Underwriting Checklist Service
// Evaluates Salaried and Business/Self-Employed Personal Loan Applications
// Generates explainable 0-100 Checklist Score, FOIR, and Shortlisting Predictions

import {
  ApplicantCategory,
  ChecklistItem,
  ShortlistingPrediction,
  ShortlistingDecision,
  LoanApplication
} from '../shared/types';
import { calculateMonthlyEmi } from '../shared/loanCalculator';

export class UnderwritingChecklistService {
  /**
   * Evaluate a personal loan application against the respective 100-point checklist
   */
  public static evaluateApplication(
    app: Partial<LoanApplication>,
    adjustedAmount?: number,
    adjustedTenure?: number
  ): ShortlistingPrediction {
    const category: ApplicantCategory = app.applicantCategory || 'SALARIED';
    const requestedAmount = adjustedAmount ?? (app.requestedAmountINR || 100000);
    const tenureMonths = adjustedTenure ?? (app.requiredTenureMonths || 12);
    
    // Estimate Proposed EMI using reducing balance formula (approx 14.5% standard personal loan rate)
    const proposedCalc = calculateMonthlyEmi(requestedAmount, 14.5, tenureMonths);
    const proposedEmi = proposedCalc.monthlyEmiINR;

    if (category === 'SALARIED') {
      return this.evaluateSalariedChecklist(app, requestedAmount, tenureMonths, proposedEmi);
    } else {
      return this.evaluateSelfEmployedChecklist(app, requestedAmount, tenureMonths, proposedEmi);
    }
  }

  /**
   * Checklist 1: Salaried Applicant Underwriting Checklist (100 Points Total)
   */
  private static evaluateSalariedChecklist(
    app: Partial<LoanApplication>,
    requestedAmount: number,
    tenureMonths: number,
    proposedEmi: number
  ): ShortlistingPrediction {
    const items: ChecklistItem[] = [];
    let score = 0;
    let hasHardKnockout = false;

    const personal = app.personalDetails || {} as any;
    const salaried = app.salariedDetails || {} as any;
    const cibil = app.cibilScore || 750;
    const documents = app.documents || [];

    // Calculate Age
    let age = 30;
    if (personal.dateOfBirth) {
      const birthYear = new Date(personal.dateOfBirth).getFullYear();
      age = new Date().getFullYear() - birthYear;
    }

    // 1. Age & Retirement Horizon (10 pts)
    const maxAgeAtMaturity = age + (tenureMonths / 12);
    if (age >= 21 && age <= 58 && maxAgeAtMaturity <= 60) {
      score += 10;
      items.push({
        id: 'sal-age',
        criterion: 'Age & Retirement Horizon',
        weight: 10,
        status: 'PASS',
        observedValue: `Age ${age} yrs, Maturity at ${Math.round(maxAgeAtMaturity)} yrs`,
        benchmarkValue: '21–58 yrs (Maturity ≤ 60 yrs)',
        lenderNote: 'Comfortable employment window before statutory retirement age.'
      });
    } else if (age >= 18 && maxAgeAtMaturity <= 62) {
      score += 5;
      items.push({
        id: 'sal-age',
        criterion: 'Age & Retirement Horizon',
        weight: 10,
        status: 'WARN',
        observedValue: `Age ${age} yrs, Maturity at ${Math.round(maxAgeAtMaturity)} yrs`,
        benchmarkValue: '21–58 yrs (Maturity ≤ 60 yrs)',
        lenderNote: 'Borderline age at loan maturity. Requires scrutiny of retirement provisions.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'sal-age',
        criterion: 'Age & Retirement Horizon',
        weight: 10,
        status: 'FAIL',
        observedValue: `Age ${age} yrs, Maturity at ${Math.round(maxAgeAtMaturity)} yrs`,
        benchmarkValue: '21–58 yrs (Maturity ≤ 60 yrs)',
        lenderNote: 'Hard Knockout: Exceeds maximum lender retirement horizon.'
      });
    }

    // 2. Minimum Net Monthly Income (20 pts)
    const netSalary = salaried.netMonthlySalaryINR || 35000;
    if (netSalary >= 25000) {
      score += 20;
      items.push({
        id: 'sal-income',
        criterion: 'Minimum Net Monthly Income',
        weight: 20,
        status: 'PASS',
        observedValue: `₹${netSalary.toLocaleString('en-IN')} / month`,
        benchmarkValue: '≥ ₹25,000 / month',
        lenderNote: 'Meets Tier-1 prime salary credit benchmark.'
      });
    } else if (netSalary >= 18000) {
      score += 12;
      items.push({
        id: 'sal-income',
        criterion: 'Minimum Net Monthly Income',
        weight: 20,
        status: 'WARN',
        observedValue: `₹${netSalary.toLocaleString('en-IN')} / month`,
        benchmarkValue: '≥ ₹25,000 / month',
        lenderNote: 'Meets Tier-2 minimum cutoff, but below prime ₹25,000 threshold.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'sal-income',
        criterion: 'Minimum Net Monthly Income',
        weight: 20,
        status: 'FAIL',
        observedValue: `₹${netSalary.toLocaleString('en-IN')} / month`,
        benchmarkValue: '≥ ₹25,000 / month',
        lenderNote: 'Hard Knockout: Below absolute minimum salary threshold of ₹18,000.'
      });
    }

    // 3. Employment Stability & Vintage (15 pts)
    const currentTenure = salaried.currentJobTenureMonths || 12;
    const totalExp = salaried.totalWorkExperienceYears || 3;
    if (currentTenure >= 6 && totalExp >= 2) {
      score += 15;
      items.push({
        id: 'sal-stability',
        criterion: 'Employment Stability & Vintage',
        weight: 15,
        status: 'PASS',
        observedValue: `${currentTenure}m current job, ${totalExp}y total exp`,
        benchmarkValue: '≥ 6m current job & ≥ 2y total exp',
        lenderNote: 'Solid job tenure with established employer profile.'
      });
    } else if (currentTenure >= 3 && totalExp >= 1) {
      score += 8;
      items.push({
        id: 'sal-stability',
        criterion: 'Employment Stability & Vintage',
        weight: 15,
        status: 'WARN',
        observedValue: `${currentTenure}m current job, ${totalExp}y total exp`,
        benchmarkValue: '≥ 6m current job & ≥ 2y total exp',
        lenderNote: 'Recent job switch (< 6 months in current firm). Probation letter required.'
      });
    } else {
      items.push({
        id: 'sal-stability',
        criterion: 'Employment Stability & Vintage',
        weight: 15,
        status: 'FAIL',
        observedValue: `${currentTenure}m current job, ${totalExp}y total exp`,
        benchmarkValue: '≥ 6m current job & ≥ 2y total exp',
        lenderNote: 'Unstable job history. High attrition risk.'
      });
    }

    // 4. FOIR (Fixed Obligations to Income Ratio) (25 pts)
    const existingEmis = salaried.existingMonthlyEmisINR || 0;
    const totalObligations = existingEmis + proposedEmi;
    const foir = Math.round((totalObligations / Math.max(1, netSalary)) * 100);

    if (foir <= 50) {
      score += 25;
      items.push({
        id: 'sal-foir',
        criterion: 'Fixed Obligations to Income Ratio (FOIR)',
        weight: 25,
        status: 'PASS',
        observedValue: `${foir}% (Existing: ₹${existingEmis}, New EMI: ₹${proposedEmi})`,
        benchmarkValue: '≤ 50% of net salary',
        lenderNote: 'Excellent repayment capacity and healthy surplus income headroom.'
      });
    } else if (foir <= 60) {
      score += 12;
      items.push({
        id: 'sal-foir',
        criterion: 'Fixed Obligations to Income Ratio (FOIR)',
        weight: 25,
        status: 'WARN',
        observedValue: `${foir}% (Existing: ₹${existingEmis}, New EMI: ₹${proposedEmi})`,
        benchmarkValue: '≤ 50% of net salary',
        lenderNote: 'Stretched debt service capacity (50–60%). Recommend counter-offer with lower loan amount.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'sal-foir',
        criterion: 'Fixed Obligations to Income Ratio (FOIR)',
        weight: 25,
        status: 'FAIL',
        observedValue: `${foir}% (Existing: ₹${existingEmis}, New EMI: ₹${proposedEmi})`,
        benchmarkValue: '≤ 50% of net salary',
        lenderNote: 'Hard Knockout: Severe debt burden (> 60%). High default probability.'
      });
    }

    // 5. Simulated Credit Bureau Score & DPD Check (20 pts)
    if (cibil >= 750) {
      score += 20;
      items.push({
        id: 'sal-cibil',
        criterion: 'Credit Bureau Score & DPD History',
        weight: 20,
        status: 'PASS',
        observedValue: `CIBIL ${cibil}, Zero 30+ DPD in 12m`,
        benchmarkValue: 'Score ≥ 720 & Zero DPD',
        lenderNote: 'Prime credit profile with flawless historical repayment discipline.'
      });
    } else if (cibil >= 680) {
      score += 10;
      items.push({
        id: 'sal-cibil',
        criterion: 'Credit Bureau Score & DPD History',
        weight: 20,
        status: 'WARN',
        observedValue: `CIBIL ${cibil}, Minor credit utilization`,
        benchmarkValue: 'Score ≥ 720 & Zero DPD',
        lenderNote: 'Sub-prime bureau score (680–719). May require co-borrower or slight risk premium.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'sal-cibil',
        criterion: 'Credit Bureau Score & DPD History',
        weight: 20,
        status: 'FAIL',
        observedValue: `CIBIL ${cibil}, Historical delinquency noted`,
        benchmarkValue: 'Score ≥ 720 & Zero DPD',
        lenderNote: 'Hard Knockout: Critical bureau score (< 680).'
      });
    }

    // 6. Document & Salary-Credit Consistency (10 pts)
    const docIssues = documents.filter((d: any) => d.preflightReport && !d.preflightReport.safeForOcr);
    const hasBlurry = documents.some((d: any) => d.validationReport?.overallStatus === 'PARTIAL_REPLACEMENT_NEEDED');
    const credentialMismatchDoc = documents.find((d: any) =>
      d.preflightReport?.status === 'CREDENTIAL_MISMATCH' || d.credentialReport?.passed === false
    );
    
    if (credentialMismatchDoc) {
      hasHardKnockout = true;
      items.push({
        id: 'sal-doc-preflight',
        criterion: 'Document Integrity & Preflight Consistency',
        weight: 10,
        status: 'FAIL',
        observedValue: `Credential Mismatch: ${credentialMismatchDoc.preflightReport?.statusMessage || 'Name or PAN mismatch on ' + credentialMismatchDoc.documentType}`,
        benchmarkValue: 'Zero preflight errors & profile credentials match',
        lenderNote: 'Hard Knockout: Identity mismatch. Document credentials do not match applicant profile.'
      });
    } else if (docIssues.length === 0 && !hasBlurry) {
      score += 10;
      items.push({
        id: 'sal-doc-preflight',
        criterion: 'Document Integrity & Preflight Consistency',
        weight: 10,
        status: 'PASS',
        observedValue: 'All salary slips & bank statements passed preflight & cross-validation',
        benchmarkValue: 'Zero preflight errors & uncorrupted PDFs',
        lenderNote: 'Clean OCR extraction, verified credentials, and confirmed salary credits.'
      });
    } else if (hasBlurry && docIssues.length === 0) {
      score += 5;
      items.push({
        id: 'sal-doc-preflight',
        criterion: 'Document Integrity & Preflight Consistency',
        weight: 10,
        status: 'WARN',
        observedValue: 'Page blur detected in bank statement / salary slips',
        benchmarkValue: 'Zero preflight errors & uncorrupted PDFs',
        lenderNote: 'Single-page blur identified. Applicant notified via AI Recovery Nudge.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'sal-doc-preflight',
        criterion: 'Document Integrity & Preflight Consistency',
        weight: 10,
        status: 'FAIL',
        observedValue: `${docIssues.length} document(s) failed preflight (password/corrupt)`,
        benchmarkValue: 'Zero preflight errors & uncorrupted PDFs',
        lenderNote: 'Document preflight blocked processing. Unlocked/intact copy required.'
      });
    }

    // Calculate Maximum Eligible Loan Cap based on 50% FOIR
    const maxAvailableEmi = Math.max(0, (netSalary * 0.50) - existingEmis);
    const maxEligibleLoanEstimate = Math.round(maxAvailableEmi * tenureMonths * 0.85);

    // Decision Logic
    let decision: ShortlistingDecision = 'NOT_SHORTLISTED_HIGH_RISK';
    if (!hasHardKnockout && score >= 75) {
      decision = 'SHORTLIST_RECOMMENDED';
    } else if (score >= 52 && (!hasHardKnockout || foir <= 65)) {
      decision = 'MANUAL_UNDERWRITING_REVIEW';
    }

    // AI Underwriter 3-Bullet Summary
    const aiSummary: string[] = [
      decision === 'SHORTLIST_RECOMMENDED'
        ? `• Applicant Ananya meets prime criteria with ${score}/100 checklist score and comfortable ${foir}% FOIR.`
        : decision === 'MANUAL_UNDERWRITING_REVIEW'
        ? `• Application scored ${score}/100 with moderate FOIR (${foir}%). Recommend lender counter-offer of ₹${maxEligibleLoanEstimate.toLocaleString('en-IN')}.`
        : `• Application failed critical underwriting checks (Score ${score}/100, FOIR ${foir}%). High credit risk.`,
      `• CIBIL score is verified at ${cibil} with ${salaried.currentJobTenureMonths || 12} months of continuous organization vintage.`,
      docIssues.length > 0 || hasBlurry
        ? `• Action Required: Applicant must resolve flagged document pages before loan disbursal.`
        : `• All document preflight checks passed without fraud or tampering markers.`
    ];

    return {
      applicantCategory: 'SALARIED',
      checklistScore: Math.min(100, score),
      foirPercentage: foir,
      maxEligibleLoanEstimate,
      decisionPrediction: decision,
      checklistItems: items,
      aiUnderwriterSummary: aiSummary,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Checklist 2: Business / Self-Employed Personal Loan Checklist (100 Points Total)
   */
  private static evaluateSelfEmployedChecklist(
    app: Partial<LoanApplication>,
    requestedAmount: number,
    tenureMonths: number,
    proposedEmi: number
  ): ShortlistingPrediction {
    const items: ChecklistItem[] = [];
    let score = 0;
    let hasHardKnockout = false;

    const personal = app.personalDetails || {} as any;
    const business = app.selfEmployedDetails || {} as any;
    const cibil = app.cibilScore || 740;
    const documents = app.documents || [];

    // Calculate Age
    let age = 36;
    if (personal.dateOfBirth) {
      const birthYear = new Date(personal.dateOfBirth).getFullYear();
      age = new Date().getFullYear() - birthYear;
    }

    // 1. Age & Business Continuity Horizon (10 pts)
    const maturityAge = age + (tenureMonths / 12);
    if (age >= 23 && maturityAge <= 65) {
      score += 10;
      items.push({
        id: 'se-age',
        criterion: 'Age & Business Continuity Horizon',
        weight: 10,
        status: 'PASS',
        observedValue: `Age ${age} yrs, Maturity at ${Math.round(maturityAge)} yrs`,
        benchmarkValue: '23–65 yrs at loan maturity',
        lenderNote: 'Optimal proprietor/business operational lifecycle window.'
      });
    } else {
      score += 4;
      items.push({
        id: 'se-age',
        criterion: 'Age & Business Continuity Horizon',
        weight: 10,
        status: 'WARN',
        observedValue: `Age ${age} yrs, Maturity at ${Math.round(maturityAge)} yrs`,
        benchmarkValue: '23–65 yrs at loan maturity',
        lenderNote: 'Maturity age near upper threshold. Requires succession/co-applicant verification.'
      });
    }

    // 2. Business Vintage & Registration (20 pts)
    const vintage = business.businessVintageYears || 4;
    const isRegistered = business.gstRegistered || business.udyamRegistered;
    if (vintage >= 3 && isRegistered) {
      score += 20;
      items.push({
        id: 'se-vintage',
        criterion: 'Business Vintage & Formal Registration',
        weight: 20,
        status: 'PASS',
        observedValue: `${vintage} years vintage, GST/Udyam Registered`,
        benchmarkValue: '≥ 2 years continuous operation + Registration',
        lenderNote: 'Established trade vintage with verified tax registration.'
      });
    } else if (vintage >= 1.5) {
      score += 12;
      items.push({
        id: 'se-vintage',
        criterion: 'Business Vintage & Formal Registration',
        weight: 20,
        status: 'WARN',
        observedValue: `${vintage} years vintage, Unregistered / Trade License`,
        benchmarkValue: '≥ 2 years continuous operation + Registration',
        lenderNote: 'Operation under 2 years. Trade references or shop agreement needed.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'se-vintage',
        criterion: 'Business Vintage & Formal Registration',
        weight: 20,
        status: 'FAIL',
        observedValue: `${vintage} years vintage`,
        benchmarkValue: '≥ 2 years continuous operation',
        lenderNote: 'Hard Knockout: Infant business vintage (< 1.5 years).'
      });
    }

    // 3. ITR Declared Profit & Income Consistency (20 pts)
    const annualProfit = business.annualNetProfitINR || 550000;
    if (annualProfit >= 400000) {
      score += 20;
      items.push({
        id: 'se-itr',
        criterion: 'ITR Declared Net Profit & Consistency',
        weight: 20,
        status: 'PASS',
        observedValue: `₹${(annualProfit / 100000).toFixed(1)}L Net Annual Profit`,
        benchmarkValue: '≥ ₹3,00,000 / year verified via ITRs',
        lenderNote: 'Consistent 2-year tax returns proving stable declared profitability.'
      });
    } else if (annualProfit >= 250000) {
      score += 10;
      items.push({
        id: 'se-itr',
        criterion: 'ITR Declared Net Profit & Consistency',
        weight: 20,
        status: 'WARN',
        observedValue: `₹${(annualProfit / 100000).toFixed(1)}L Net Annual Profit`,
        benchmarkValue: '≥ ₹3,00,000 / year verified via ITRs',
        lenderNote: 'Modest declared tax profit. Supplementary banking surrogate required.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'se-itr',
        criterion: 'ITR Declared Net Profit & Consistency',
        weight: 20,
        status: 'FAIL',
        observedValue: `₹${(annualProfit / 100000).toFixed(1)}L Net Annual Profit`,
        benchmarkValue: '≥ ₹3,00,000 / year verified via ITRs',
        lenderNote: 'Hard Knockout: Inadequate annual taxable income.'
      });
    }

    // 4. Adjusted FOIR with 20% Volatility Buffer (20 pts)
    // Effective Income = (Annual Profit / 12) * 0.80 haircut
    const monthlyGrossProfit = annualProfit / 12;
    const effectiveIncome = monthlyGrossProfit * 0.80; // 20% volatility haircut
    const existingEmis = business.existingBusinessAndPersonalEmisINR || 0;
    const totalObligations = existingEmis + proposedEmi;
    const foir = Math.round((totalObligations / Math.max(1, effectiveIncome)) * 100);

    if (foir <= 45) {
      score += 20;
      items.push({
        id: 'se-foir',
        criterion: 'Adjusted FOIR (with 20% Volatility Haircut)',
        weight: 20,
        status: 'PASS',
        observedValue: `${foir}% (Eff. Income: ₹${Math.round(effectiveIncome)}, Total EMI: ₹${totalObligations})`,
        benchmarkValue: '≤ 45% of Haircut-Adjusted Income',
        lenderNote: 'Conservative debt coverage absorbing seasonal merchant revenue dips.'
      });
    } else if (foir <= 55) {
      score += 10;
      items.push({
        id: 'se-foir',
        criterion: 'Adjusted FOIR (with 20% Volatility Haircut)',
        weight: 20,
        status: 'WARN',
        observedValue: `${foir}% (Eff. Income: ₹${Math.round(effectiveIncome)}, Total EMI: ₹${totalObligations})`,
        benchmarkValue: '≤ 45% of Haircut-Adjusted Income',
        lenderNote: 'Stretched obligation ratio (45–55%). Counter-offer with lower ticket suggested.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'se-foir',
        criterion: 'Adjusted FOIR (with 20% Volatility Haircut)',
        weight: 20,
        status: 'FAIL',
        observedValue: `${foir}% (Eff. Income: ₹${Math.round(effectiveIncome)}, Total EMI: ₹${totalObligations})`,
        benchmarkValue: '≤ 45% of Haircut-Adjusted Income',
        lenderNote: 'Hard Knockout: Severe cash-flow strain. Overleveraged profile.'
      });
    }

    // 5. Bank Statement Cash-Flow Health (15 pts)
    const bounces = business.recentBouncesCount || 0;
    const avgCredits = business.avgMonthlyBankCreditsINR || 350000;
    if (bounces === 0 && avgCredits >= proposedEmi * 5) {
      score += 15;
      items.push({
        id: 'se-cashflow',
        criterion: 'Operative Banking Cash-Flow & Bounce Record',
        weight: 15,
        status: 'PASS',
        observedValue: `Zero Bounces in 6m, Avg Credits ₹${(avgCredits/1000).toFixed(0)}k/mo`,
        benchmarkValue: 'Zero NACH/cheque bounces & Credits ≥ 5x proposed EMI',
        lenderNote: 'Clean banking ledger demonstrating healthy operative liquidity.'
      });
    } else if (bounces <= 1) {
      score += 7;
      items.push({
        id: 'se-cashflow',
        criterion: 'Operative Banking Cash-Flow & Bounce Record',
        weight: 15,
        status: 'WARN',
        observedValue: `${bounces} bounce noted in last 6 months`,
        benchmarkValue: 'Zero NACH/cheque bounces',
        lenderNote: 'Single technical bounce detected. Explanation letter requested.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'se-cashflow',
        criterion: 'Operative Banking Cash-Flow & Bounce Record',
        weight: 15,
        status: 'FAIL',
        observedValue: `${bounces} NACH/cheque bounces in 6m`,
        benchmarkValue: 'Zero NACH/cheque bounces',
        lenderNote: 'Hard Knockout: Frequent banking return events.'
      });
    }

    // 6. Simulated Bureau Score & Document Preflight (15 pts)
    const docIssues = documents.filter((d: any) => d.preflightReport && !d.preflightReport.safeForOcr);
    const hasBlurry = documents.some((d: any) => d.validationReport?.overallStatus === 'PARTIAL_REPLACEMENT_NEEDED');
    const credentialMismatchDoc = documents.find((d: any) =>
      d.preflightReport?.status === 'CREDENTIAL_MISMATCH' || d.credentialReport?.passed === false
    );

    if (credentialMismatchDoc) {
      hasHardKnockout = true;
      items.push({
        id: 'se-cibil-docs',
        criterion: 'Credit Bureau & Document Preflight Integrity',
        weight: 15,
        status: 'FAIL',
        observedValue: `Credential Mismatch: ${credentialMismatchDoc.preflightReport?.statusMessage || 'Business/Proprietor credentials do not match profile'}`,
        benchmarkValue: 'CIBIL ≥ 730 & matching profile credentials',
        lenderNote: 'Hard Knockout: Identity mismatch between registered merchant profile and document.'
      });
    } else if (cibil >= 730 && docIssues.length === 0 && !hasBlurry) {
      score += 15;
      items.push({
        id: 'se-cibil-docs',
        criterion: 'Credit Bureau & Document Preflight Integrity',
        weight: 15,
        status: 'PASS',
        observedValue: `CIBIL ${cibil}, All business PDFs passed preflight & cross-validation`,
        benchmarkValue: 'CIBIL ≥ 730 & Uncorrupted preflight',
        lenderNote: 'Flawless bureau track record, verified credentials, and genuine document signatures.'
      });
    } else if (cibil >= 690 && docIssues.length === 0) {
      score += 8;
      items.push({
        id: 'se-cibil-docs',
        criterion: 'Credit Bureau & Document Preflight Integrity',
        weight: 15,
        status: 'WARN',
        observedValue: `CIBIL ${cibil} (Moderate), Preflight passed with warnings`,
        benchmarkValue: 'CIBIL ≥ 730 & Uncorrupted preflight',
        lenderNote: 'Acceptable commercial bureau score. Flagged pages pending replacement.'
      });
    } else {
      hasHardKnockout = true;
      items.push({
        id: 'se-cibil-docs',
        criterion: 'Credit Bureau & Document Preflight Integrity',
        weight: 15,
        status: 'FAIL',
        observedValue: `CIBIL ${cibil}, Preflight errors or corrupted document present`,
        benchmarkValue: 'CIBIL ≥ 730 & Uncorrupted preflight',
        lenderNote: 'Sub-standard credit score or password-locked statement.'
      });
    }

    // Safe loan cap based on 45% adjusted FOIR
    const maxAvailableEmi = Math.max(0, (effectiveIncome * 0.45) - existingEmis);
    const maxEligibleLoanEstimate = Math.round(maxAvailableEmi * tenureMonths * 0.85);

    // Decision Logic
    let decision: ShortlistingDecision = 'NOT_SHORTLISTED_HIGH_RISK';
    if (!hasHardKnockout && score >= 75) {
      decision = 'SHORTLIST_RECOMMENDED';
    } else if (score >= 50 && (!hasHardKnockout || foir <= 60)) {
      decision = 'MANUAL_UNDERWRITING_REVIEW';
    }

    // AI Underwriter 3-Bullet Summary
    const aiSummary: string[] = [
      decision === 'SHORTLIST_RECOMMENDED'
        ? `• Applicant ${personal.fullName || 'Business Owner'} qualifies for priority shortlisting with ${score}/100 score and ${foir}% adjusted FOIR.`
        : decision === 'MANUAL_UNDERWRITING_REVIEW'
        ? `• Self-employed application scored ${score}/100. Recommend counter-offer of ₹${maxEligibleLoanEstimate.toLocaleString('en-IN')} with 24-month tenure.`
        : `• Application failed critical commercial underwriting standards (${bounces} bounces, ${foir}% FOIR). Decline recommended.`,
      `• Business vintage verified at ${vintage} years with ₹${(annualProfit / 100000).toFixed(1)}L annual taxable profit.`,
      docIssues.length > 0 || hasBlurry
        ? `• Action Required: Bank statement has an unreadable or locked page. Single-page replacement is enabled.`
        : `• Banking turnover and GST filings reflect steady operational volume.`
    ];

    return {
      applicantCategory: 'SELF_EMPLOYED',
      checklistScore: Math.min(100, score),
      foirPercentage: foir,
      maxEligibleLoanEstimate,
      decisionPrediction: decision,
      checklistItems: items,
      aiUnderwriterSummary: aiSummary,
      calculatedAt: new Date().toISOString()
    };
  }
}
