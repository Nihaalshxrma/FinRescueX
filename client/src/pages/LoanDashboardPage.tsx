import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  IndianRupee,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Calculator,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  User,
  Store
} from 'lucide-react';

export const LoanDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { userMode } = useAuth();
  const isMerchant = userMode === 'MERCHANT';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data.applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [userMode]);

  const handleStartNewApplication = async () => {
    try {
      const res = await api.post('/applications', {
        requestedAmountINR: isMerchant ? 100000 : 50000,
        loanPurpose: isMerchant ? 'Purchasing stock' : 'Emergency & Medical Expenses',
        businessCategory: isMerchant ? 'Retail Grocery / Kirana' : 'Salaried Professional',
        requiredTenureMonths: isMerchant ? 12 : 6,
        userType: isMerchant ? 'MERCHANT' : 'NORMAL_USER'
      });
      if (res.data.application) {
        navigate(`/loan/apply/${res.data.application.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <MobileShell
      title={isMerchant ? 'Merchant Business Loans' : 'Paytm User Personal Loans'}
      showBack
      onBack={() => navigate('/home')}
    >
      <div className="p-4 space-y-4">
        {/* Portal-Specific Offer Hero Banner */}
        <div className="bg-gradient-to-r from-paytm-blue to-[#0055b3] text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
          <div className="space-y-1">
            <span className="bg-emerald-400 text-paytm-navy text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
              {isMerchant ? 'Merchant Pre-Qualified' : 'User Instant Approval'}
            </span>
            <h3 className="text-xl font-bold tracking-tight">
              {isMerchant ? '₹1,00,000 – ₹5,00,000' : '₹25,000 – ₹2,50,000'}
            </h3>
            <p className="text-xs text-sky-200">
              {isMerchant
                ? 'Tailored for retail merchants with daily QR settlements.'
                : 'Instant cash transfer for salaried & self-employed users with easy monthly EMIs.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="text-[11px] text-sky-200">
              Interest from{' '}
              <span className="text-white font-bold">{isMerchant ? '14.0% p.a.' : '12.5% p.a.'}</span>
            </div>
            <button
              onClick={handleStartNewApplication}
              className="bg-paytm-sky hover:bg-[#00a8dc] text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Apply Now
            </button>
          </div>
        </div>

        {/* Loan Calculator Shortcut */}
        <div
          onClick={() => navigate('/loan/calculator')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 text-paytm-sky rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                {isMerchant ? 'EMI & Daily Deduction Calculator' : 'Personal Loan EMI Calculator'}
              </h4>
              <p className="text-[11px] text-slate-500">Calculate exact interest, APR, and fees</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Existing Applications List with Step-Persistence Labeling */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isMerchant ? 'Merchant Applications' : 'Your Personal Applications'}
            </h3>
            <span className="text-[11px] text-slate-500">{applications.length} Found</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No applications started yet</p>
              <button
                onClick={handleStartNewApplication}
                className="bg-paytm-sky text-white text-xs font-bold py-2 px-4 rounded-xl"
              >
                Start First Application
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const isError = app.status === 'DOCUMENT_ERROR';
                const isSubmitted = app.stage === 'STAGE_9_SUBMITTED';

                const stageStepMap: Record<string, number> = {
                  'STAGE_1_REQUIREMENTS': 1,
                  'STAGE_2_PERSONAL_DETAILS': 1,
                  'STAGE_3_BUSINESS_DETAILS': 2,
                  'STAGE_4_BANK_DETAILS': 3,
                  'STAGE_5_DOCUMENTS': 4,
                  'STAGE_6_OFFER_SELECTION': 5,
                  'STAGE_7_KYC_VERIFICATION': 6,
                  'STAGE_8_FINAL_REVIEW': 7,
                  'STAGE_9_SUBMITTED': 7
                };
                const stepNum = stageStepMap[app.stage] || 1;

                return (
                  <div
                    key={app.id}
                    onClick={() => navigate(`/loan/apply/${app.id}`)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-paytm-sky/50 transition cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 font-mono">
                            {app.id}
                          </span>
                          {isError && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Action Needed
                            </span>
                          )}
                          {isSubmitted && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Submitted
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-paytm-navy mt-1">
                          ₹{app.requestedAmountINR?.toLocaleString('en-IN')} • {app.loanPurpose}
                        </p>
                      </div>

                      <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Progress Bar & Saved Step Indicator */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>
                          Opens at:{' '}
                          <strong className="text-paytm-blue font-bold">
                            Step {stepNum} of 7 ({app.stage.replace('STAGE_', '').replace(/_/g, ' ')})
                          </strong>
                        </span>
                        <span>{isSubmitted ? '100%' : `${Math.round((stepNum / 7) * 100)}%`}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isError ? 'bg-amber-500' : isSubmitted ? 'bg-emerald-500' : 'bg-paytm-sky'
                          }`}
                          style={{ width: `${Math.round((stepNum / 7) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Pending Action Advice */}
                    {isError && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                        <span>Bank statement page 2 blurry. Replace single page.</span>
                        <span className="font-bold text-amber-700 underline">Resume Step 4</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
};
