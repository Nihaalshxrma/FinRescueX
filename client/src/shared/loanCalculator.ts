// FinRescue X - Loan & EMI Financial Calculations

export interface EmiCalculationResult {
  principalAmountINR: number;
  annualRatePercentage: number;
  tenureMonths: number;
  monthlyEmiINR: number;
  totalInterestINR: number;
  totalRepaymentINR: number;
  processingFeeINR: number;
  gstOnFeeINR: number;
  netDisbursementINR: number;
  amortizationSchedule: Array<{
    month: number;
    openingBalance: number;
    emi: number;
    principalPaid: number;
    interestPaid: number;
    closingBalance: number;
  }>;
}

export interface DailyRepaymentResult {
  principalAmountINR: number;
  annualRatePercentage: number;
  tenureDays: number;
  dailyInstallmentINR: number;
  totalInterestINR: number;
  totalRepaymentINR: number;
  processingFeeINR: number;
  gstOnFeeINR: number;
  netDisbursementINR: number;
  expectedDailyDeductionINR: number;
}

/**
 * Standard reducing-balance monthly EMI calculation:
 * EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
 * where P = Principal, R = Monthly interest rate (Annual % / 12 / 100), N = Number of monthly instalments
 */
export function calculateMonthlyEmi(
  principal: number,
  annualRatePercentage: number,
  tenureMonths: number,
  processingFeePercent = 2.0
): EmiCalculationResult {
  const p = Math.max(1000, principal);
  const r = annualRatePercentage / 12 / 100;
  const n = Math.max(1, tenureMonths);

  let emi = 0;
  if (r === 0) {
    emi = p / n;
  } else {
    const factor = Math.pow(1 + r, n);
    emi = (p * r * factor) / (factor - 1);
  }

  const roundedEmi = Math.round(emi);
  const totalRepayment = roundedEmi * n;
  const totalInterest = Math.max(0, totalRepayment - p);

  const processingFee = Math.round((p * processingFeePercent) / 100);
  const gstOnFee = Math.round(processingFee * 0.18);
  const netDisbursement = p - processingFee - gstOnFee;

  // Build amortization schedule
  const schedule: EmiCalculationResult['amortizationSchedule'] = [];
  let balance = p;

  for (let month = 1; month <= n; month++) {
    const interest = Math.round(balance * r);
    const principalPaid = month === n ? balance : Math.min(balance, roundedEmi - interest);
    const closing = Math.max(0, balance - principalPaid);

    schedule.push({
      month,
      openingBalance: balance,
      emi: roundedEmi,
      principalPaid,
      interestPaid: interest,
      closingBalance: closing,
    });

    balance = closing;
  }

  return {
    principalAmountINR: p,
    annualRatePercentage,
    tenureMonths: n,
    monthlyEmiINR: roundedEmi,
    totalInterestINR: totalInterest,
    totalRepaymentINR: totalRepayment,
    processingFeeINR: processingFee,
    gstOnFeeINR: gstOnFee,
    netDisbursementINR: netDisbursement,
    amortizationSchedule: schedule,
  };
}

/**
 * Daily settlement repayment calculation (Paytm / Indian Fintech merchant loan style)
 * Interest is calculated for the term, and divided across working/daily settlement days.
 */
export function calculateDailyRepayment(
  principal: number,
  annualRatePercentage: number,
  tenureMonths: number,
  processingFeePercent = 2.0
): DailyRepaymentResult {
  const p = Math.max(1000, principal);
  const tenureDays = Math.round(tenureMonths * 30);
  const dailyRate = annualRatePercentage / 365 / 100;
  
  // Approximate total interest for merchant term:
  // Using average reducing balance factor ~ 0.55
  const estimatedInterest = Math.round(p * (annualRatePercentage / 100) * (tenureMonths / 12) * 0.55);
  const totalRepayment = p + estimatedInterest;
  const dailyInstallment = Math.round(totalRepayment / tenureDays);

  const processingFee = Math.round((p * processingFeePercent) / 100);
  const gstOnFee = Math.round(processingFee * 0.18);
  const netDisbursement = p - processingFee - gstOnFee;

  return {
    principalAmountINR: p,
    annualRatePercentage,
    tenureDays,
    dailyInstallmentINR: dailyInstallment,
    totalInterestINR: estimatedInterest,
    totalRepaymentINR: totalRepayment,
    processingFeeINR: processingFee,
    gstOnFeeINR: gstOnFee,
    netDisbursementINR: netDisbursement,
    expectedDailyDeductionINR: dailyInstallment,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
