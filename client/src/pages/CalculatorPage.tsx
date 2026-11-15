import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import { calculateMonthlyEmi, calculateDailyRepayment, formatINR } from '../shared/loanCalculator';
import { Calculator, Calendar, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const CalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(100000);
  const [roi, setRoi] = useState<number>(16.5);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [mode, setMode] = useState<'MONTHLY' | 'DAILY'>('MONTHLY');

  const monthlyCalc = calculateMonthlyEmi(amount, roi, tenureMonths, 2.0);
  const dailyCalc = calculateDailyRepayment(amount, roi, tenureMonths, 2.0);

  return (
    <MobileShell title="Loan Calculator" showBack onBack={() => navigate('/loans')}>
      <div className="p-4 space-y-4">
        {/* Toggle Mode */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setMode('MONTHLY')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'MONTHLY' ? 'bg-white text-paytm-blue shadow-sm' : 'text-slate-600'
            }`}
          >
            Monthly EMI Loan
          </button>
          <button
            onClick={() => setMode('DAILY')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'DAILY' ? 'bg-white text-paytm-blue shadow-sm' : 'text-slate-600'
            }`}
          >
            Daily QR Deduction
          </button>
        </div>

        {/* Sliders Input Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Loan Amount</span>
              <span className="text-paytm-navy font-bold text-sm">{formatINR(amount)}</span>
            </div>
            <input
              type="range"
              min={25000}
              max={500000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-paytm-sky cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹25,000</span>
              <span>₹5,00,000</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Annual Interest Rate (ROI)</span>
              <span className="text-paytm-navy font-bold text-sm">{roi}% p.a.</span>
            </div>
            <input
              type="range"
              min={12.0}
              max={28.0}
              step={0.5}
              value={roi}
              onChange={(e) => setRoi(Number(e.target.value))}
              className="w-full accent-paytm-sky cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>12.0%</span>
              <span>28.0%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Tenure</span>
              <span className="text-paytm-navy font-bold text-sm">{tenureMonths} Months</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 12, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setTenureMonths(m)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                    tenureMonths === m
                      ? 'border-paytm-sky bg-sky-50 text-paytm-blue'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-gradient-to-br from-paytm-blue to-paytm-navy text-white p-4 rounded-2xl shadow-md space-y-3">
          <span className="text-sky-300 text-[10px] uppercase font-bold tracking-wider block">
            {mode === 'MONTHLY' ? 'Estimated Monthly EMI' : 'Estimated Daily QR Deduction'}
          </span>
          <div className="text-3xl font-extrabold tracking-tight">
            {mode === 'MONTHLY' ? formatINR(monthlyCalc.monthlyEmiINR) : formatINR(dailyCalc.dailyInstallmentINR)}
            <span className="text-xs font-normal text-sky-200 ml-1">
              {mode === 'MONTHLY' ? '/ month' : '/ day'}
            </span>
          </div>

          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/60 block text-[10px]">Net Disbursed</span>
              <span className="font-bold text-white">
                {formatINR(mode === 'MONTHLY' ? monthlyCalc.netDisbursementINR : dailyCalc.netDisbursementINR)}
              </span>
            </div>
            <div>
              <span className="text-white/60 block text-[10px]">Total Interest</span>
              <span className="font-bold text-emerald-400">
                {formatINR(mode === 'MONTHLY' ? monthlyCalc.totalInterestINR : dailyCalc.totalInterestINR)}
              </span>
            </div>
            <div>
              <span className="text-white/60 block text-[10px]">Processing Fee (2%)</span>
              <span className="font-bold text-white">
                {formatINR(mode === 'MONTHLY' ? monthlyCalc.processingFeeINR : dailyCalc.processingFeeINR)}
              </span>
            </div>
            <div>
              <span className="text-white/60 block text-[10px]">Total Repayment</span>
              <span className="font-bold text-sky-300">
                {formatINR(mode === 'MONTHLY' ? monthlyCalc.totalRepaymentINR : dailyCalc.totalRepaymentINR)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/loans')}
          className="w-full bg-paytm-sky hover:bg-[#00a8dc] text-white font-bold py-3 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-1"
        >
          Check Pre-Approved Offers <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </MobileShell>
  );
};
