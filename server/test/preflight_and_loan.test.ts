import { describe, it, expect } from 'vitest';
import { runPreflight } from '../src/services/documentPreflight';
import { calculateMonthlyEmi, calculateDailyRepayment } from '../../shared/loanCalculator';
import fs from 'fs';
import path from 'path';

describe('Loan Calculations', () => {
  it('correctly calculates monthly reducing balance EMI', () => {
    const result = calculateMonthlyEmi(100000, 16.5, 12, 2.0);
    expect(result.monthlyEmiINR).toBeGreaterThan(9000);
    expect(result.monthlyEmiINR).toBeLessThan(9300);
    expect(result.processingFeeINR).toBe(2000);
    expect(result.gstOnFeeINR).toBe(360);
    expect(result.netDisbursementINR).toBe(97640);
    expect(result.amortizationSchedule.length).toBe(12);
  });

  it('correctly calculates daily repayment values', () => {
    const result = calculateDailyRepayment(100000, 18.0, 12, 1.5);
    expect(result.dailyInstallmentINR).toBeGreaterThan(250);
    expect(result.tenureDays).toBe(360);
    expect(result.processingFeeINR).toBe(1500);
  });
});

describe('DocumentPreflightService', () => {
  const tmpDir = path.join(__dirname, 'tmp_test_docs');

  it('rejects unsupported mime types', async () => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const testFile = path.join(tmpDir, 'test.exe');
    fs.writeFileSync(testFile, 'dummy binary');

    const res = await runPreflight(testFile, 'test.exe', 'application/x-msdownload', 'doc-test-1');
    expect(res.status).toBe('UNSUPPORTED_FORMAT');
    expect(res.safeForOcr).toBe(false);

    fs.unlinkSync(testFile);
  });

  it('detects corrupted or invalid PDF header', async () => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const badPdf = path.join(tmpDir, 'corrupt.pdf');
    fs.writeFileSync(badPdf, 'NOT A REAL PDF FILE CONTENT');

    const res = await runPreflight(badPdf, 'corrupt.pdf', 'application/pdf', 'doc-test-2');
    expect(res.status).toBe('CORRUPTED_PDF');
    expect(res.safeForOcr).toBe(false);

    fs.unlinkSync(badPdf);
  });

  it('detects password protected PDF flag', async () => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const pwdPdf = path.join(tmpDir, 'protected.pdf');
    fs.writeFileSync(pwdPdf, '%PDF-1.4\n1 0 obj\n<< /Encrypt 2 0 R /Filter /Standard >>\nendobj\n%%EOF');

    const res = await runPreflight(pwdPdf, 'protected.pdf', 'application/pdf', 'doc-test-3');
    expect(res.status).toBe('PASSWORD_PROTECTED');
    expect(res.safeForOcr).toBe(false);

    fs.unlinkSync(pwdPdf);
  });
});
