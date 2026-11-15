import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import { useAuth } from '../context/AuthContext';
import {
  IndianRupee,
  QrCode,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Smartphone,
  Store,
  CreditCard,
  Receipt,
  RotateCw,
  User,
  ShoppingBag,
  Sparkles,
  PhoneCall
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, merchant, userMode } = useAuth();
  const isMerchant = userMode === 'MERCHANT';

  return (
    <MobileShell title={isMerchant ? 'Merchant Hub' : 'Paytm User Dashboard'}>
      <div className="p-4 space-y-4">
        {/* Profile Greeting Card (Dynamic Merchant vs Normal User) */}
        <div className="bg-gradient-to-br from-paytm-blue via-[#003882] to-paytm-navy text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-sky-400/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-sky-200 text-xs font-medium">
                {isMerchant ? (
                  <>
                    <Store className="w-3.5 h-3.5 text-sky-400" />
                    <span>{merchant?.businessName || 'Sharma General Stores'}</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Personal Account • Individual</span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold mt-0.5">
                Namaste, {user?.name?.split(' ')[0] || (isMerchant ? 'Rahul' : 'Customer')}!
              </h2>
              <p className="text-[11px] text-sky-200/90">
                {isMerchant ? 'Pune, Maharashtra • Soundbox Active' : 'Pune • UPI Linked • KYC Ready'}
              </p>
            </div>
            <div className="w-11 h-11 bg-white/10 rounded-full border border-white/20 flex items-center justify-center font-bold text-sky-300 shadow-inner">
              {user?.name?.charAt(0) || (isMerchant ? 'R' : 'U')}
            </div>
          </div>

          {/* Account Snapshot */}
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-white/60 block text-[10px]">
                {isMerchant ? "Today's UPI Collection" : "Wallet Balance"}
              </span>
              <span className="text-base font-bold text-white tracking-tight">
                {isMerchant ? "₹4,850" : "₹12,450"}
              </span>
              <span className="text-[10px] text-emerald-400 block">
                {isMerchant ? "▲ 14 QR payments" : "✓ Active & Protected"}
              </span>
            </div>
            <div>
              <span className="text-white/60 block text-[10px]">
                {isMerchant ? "Daily Auto-Settlement" : "Monthly Spending"}
              </span>
              <span className="text-base font-bold text-sky-300 tracking-tight">
                {isMerchant ? "₹18,420" : "₹6,800"}
              </span>
              <span className="text-[10px] text-sky-200 block">
                {isMerchant ? "✓ Settled to SBI A/c" : "3 Cashback Rewards"}
              </span>
            </div>
          </div>
        </div>

        {/* Loan Feature Hero Banner (Clickable!) */}
        <div
          onClick={() => navigate('/loans')}
          className="bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-paytm-sky/30 hover:border-paytm-sky p-4 rounded-2xl shadow-sm cursor-pointer transition active:scale-[0.99] relative group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 bg-paytm-sky text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isMerchant ? 'Merchant Business Loan' : 'Pre-Approved Personal Loan'}
              </span>
              <h3 className="text-base font-bold text-paytm-navy">
                {isMerchant ? 'Grow Your Business Capital' : 'Instant Personal Cash Loan'}
              </h3>
              <p className="text-xs text-slate-600 leading-tight">
                {isMerchant
                  ? 'Up to ₹5,00,000 with daily deduction from QR settlements.'
                  : 'Up to ₹2,50,000 for emergency, medical, or shopping needs with flexible EMIs.'}
              </p>
            </div>
            <div className="p-2.5 bg-paytm-sky text-white rounded-xl shadow-md group-hover:scale-105 transition">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-paytm-blue pt-2 border-t border-sky-100">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Digital • Zero Branch Visit
            </span>
            <span className="flex items-center gap-0.5 text-paytm-sky group-hover:translate-x-1 transition">
              Explore Loans <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Service Tiles Grid — ONLY BUSINESS/USER LOAN IS CLICKABLE */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isMerchant ? 'Business Services' : 'Everyday Payments & Tools'}
            </h3>
            <span className="text-[10px] text-slate-400">
              Only Loans tile is active in demo
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {/* Tile 1 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center opacity-45 cursor-not-allowed">
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 block leading-tight">Scan & Pay</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Demo Off</span>
            </div>

            {/* Tile 2 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center opacity-45 cursor-not-allowed">
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 block leading-tight">UPI Send</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Demo Off</span>
            </div>

            {/* Tile 3 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center opacity-45 cursor-not-allowed">
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 block leading-tight">Balance</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Demo Off</span>
            </div>

            {/* Tile 4 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center opacity-45 cursor-not-allowed">
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 block leading-tight">Passbook</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Demo Off</span>
            </div>

            {/* Tile 5 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center opacity-45 cursor-not-allowed">
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                {isMerchant ? <QrCode className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              </div>
              <span className="text-[10px] font-medium text-slate-500 block leading-tight">
                {isMerchant ? 'Shop QR' : 'Recharge'}
              </span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Demo Off</span>
            </div>

            {/* Tile 6 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center opacity-45 cursor-not-allowed">
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <RotateCw className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 block leading-tight">
                {isMerchant ? 'Settlements' : 'Bills'}
              </span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Demo Off</span>
            </div>

            {/* Tile 7 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center opacity-45 cursor-not-allowed">
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 block leading-tight">Cards</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">Demo Off</span>
            </div>

            {/* Tile 8 — LOANS (ACTIVE & CLICKABLE) */}
            <div
              onClick={() => navigate('/loans')}
              className="bg-gradient-to-b from-sky-50 to-white p-2.5 rounded-xl border-2 border-paytm-sky shadow-sm text-center cursor-pointer active:scale-95 transition relative ring-2 ring-paytm-sky/20"
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-paytm-blue text-[7px] text-white px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                Active
              </span>
              <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-paytm-sky text-white flex items-center justify-center shadow-sm">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-paytm-blue block leading-tight">
                {isMerchant ? 'Business Loan' : 'Instant Loan'}
              </span>
              <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5">
                Open Demo
              </span>
            </div>
          </div>
        </div>

        {/* Existing Application Interruption Recovery Alert */}
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900">
                Action Required: Loan Application Incomplete
              </h4>
              <p className="text-[11px] text-amber-800 leading-snug">
                Bank statement page 2 was blurry. Replace single page (or replace all) to complete application.
              </p>
              <button
                onClick={() => navigate('/loan/apply/FNX-DEMO-1001')}
                className="mt-1 inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition"
              >
                Resume & Recover <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Assistance Actions */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <h4 className="text-xs font-bold text-slate-800">Assistance & Support</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => navigate('/assistant')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left font-medium text-slate-700 flex items-center gap-2"
            >
              <span className="p-1.5 bg-sky-100 rounded-lg text-paytm-sky">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>Regional Voice AI</span>
            </button>
            <button
              onClick={() => navigate('/support?quick=true')}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left font-bold text-amber-900 flex items-center gap-2"
            >
              <span className="p-1.5 bg-amber-200 rounded-lg text-amber-800">
                <PhoneCall className="w-3.5 h-3.5" />
              </span>
              <span>1-Min Callback</span>
            </button>
          </div>
        </div>
      </div>
    </MobileShell>
  );
};
