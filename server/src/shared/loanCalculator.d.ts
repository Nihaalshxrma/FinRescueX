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
export declare function calculateMonthlyEmi(principal: number, annualRatePercentage: number, tenureMonths: number, processingFeePercent?: number): EmiCalculationResult;
/**
 * Daily settlement repayment calculation (Paytm / Indian Fintech merchant loan style)
 * Interest is calculated for the term, and divided across working/daily settlement days.
 */
export declare function calculateDailyRepayment(principal: number, annualRatePercentage: number, tenureMonths: number, processingFeePercent?: number): DailyRepaymentResult;
export declare function formatINR(amount: number): string;
//# sourceMappingURL=loanCalculator.d.ts.map