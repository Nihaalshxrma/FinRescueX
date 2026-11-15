"use strict";
// FinRescue X - Loan & EMI Financial Calculations
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyEmi = calculateMonthlyEmi;
exports.calculateDailyRepayment = calculateDailyRepayment;
exports.formatINR = formatINR;
/**
 * Standard reducing-balance monthly EMI calculation:
 * EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
 * where P = Principal, R = Monthly interest rate (Annual % / 12 / 100), N = Number of monthly instalments
 */
function calculateMonthlyEmi(principal, annualRatePercentage, tenureMonths, processingFeePercent = 2.0) {
    const p = Math.max(1000, principal);
    const r = annualRatePercentage / 12 / 100;
    const n = Math.max(1, tenureMonths);
    let emi = 0;
    if (r === 0) {
        emi = p / n;
    }
    else {
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
    const schedule = [];
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
function calculateDailyRepayment(principal, annualRatePercentage, tenureMonths, processingFeePercent = 2.0) {
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
function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}
//# sourceMappingURL=loanCalculator.js.map