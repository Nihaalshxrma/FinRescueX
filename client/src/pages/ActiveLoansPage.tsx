import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatINR } from '../shared/loanCalculator';
import {
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
  TrendingDown,
  Building,
  User,
  Store
} from 'lucide-react';

export const ActiveLoansPage: React.FC = () => {
  const navigate = useNavigate();
  const { userMode } = useAuth();
  const isMerchant = userMode === 'MERCHANT';

  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    try {
      const res = await api.get('/loans');
      const data = res.data.loans || [];
      setLoans(data);
      if (data.length > 0) {
        setSelectedLoanId(data[0].id);
        fetchRepayments(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepayments = async (loanId: string) => {
    try {
      const res = await api.get(`/loans/${loanId}/repayments`);
      setRepayments(res.data.repayments || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [userMode]);

  const activeLoan = loans.find((l) => l.id === selectedLoanId);

  return (
    <MobileShell
      title={isMerchant ? 'Merchant Repayment Tracker' : 'Personal Loan Repayments'}
      showBack
      onBack={() => navigate('/home')}
    >
      <div className="p-4 space-y-4">
        {/* Loan Account Switcher */}
        {loans.length > 1 && (
          <div className="flex bg-slate-200/80 p-1 rounded-xl">
            {loans.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setSelectedLoanId(l.id);
                  fetchRepayments(l.id);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  selectedLoanId === l.id
                    ? 'bg-white text-paytm-blue shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                {l.id} ({l.status === 'ACTIVE_OVERDUE' ? 'Overdue' : 'Healthy'})
              </button>
            ))}
          </div>
        )}

        {/* Selected Loan Ledger Card */}
        {activeLoan && (
          <div className="bg-gradient-to-br from-paytm-blue via-[#003882] to-paytm-navy text-white p-4 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-sky-200 uppercase font-semibold">
                  {activeLoan.lenderName}
                </span>
                <h3 className="text-xl font-bold tracking-tight">
                  {formatINR(activeLoan.currentOutstandingINR)}
                </h3>
                <span className="text-[10px] text-white/70 block">
                  Current Outstanding Principal
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeLoan.status === 'ACTIVE_OVERDUE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {activeLoan.status === 'ACTIVE_OVERDUE' ? 'Overdue Payments' : 'On-Time Repayments'}
                </span>
                <span className="text-[10px] text-sky-200 block mt-1">
                  Next Due: {new Date(activeLoan.nextDueDate).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-white/60 block text-[10px]">Repaid so far</span>
                <span className="font-bold text-emerald-400">
                  {formatINR(activeLoan.totalRepaidINR)}
                </span>
              </div>
              <div>
                <span className="text-white/60 block text-[10px]">Installment</span>
                <span className="font-bold text-white">
                  {formatINR(activeLoan.installmentAmountINR)}
                </span>
              </div>
              <div>
                <span className="text-white/60 block text-[10px]">Pending Tenor</span>
                <span className="font-bold text-sky-200">
                  {activeLoan.remainingInstallments} Left
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Repayment Transactions List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isMerchant ? 'QR Deduction & Repayment Ledger' : 'Monthly EMI Repayment History'}
            </h3>
            <span className="text-[10px] text-slate-500">Live Seeded Ledger</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {repayments.slice(0, 15).map((txn) => {
              const isPaid = txn.status === 'PAID_ON_TIME' || txn.status === 'PAID_LATE';
              const isOverdue = txn.status === 'OVERDUE' || txn.status === 'MISSED';

              return (
                <div
                  key={txn.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-600'
                          : isOverdue
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Installment #{txn.installmentNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Due: {new Date(txn.dueDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatINR(txn.amountINR)}
                    </span>
                    <span
                      className={`text-[9px] font-bold ${
                        isPaid
                          ? 'text-emerald-600'
                          : isOverdue
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {txn.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MobileShell>
  );
};
