import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  IndianRupee,
  History,
  Bot,
  HelpCircle,
  PhoneCall,
  ShieldAlert,
  LogOut,
  User,
  Store,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MerchantCareDrawer } from './MerchantCareDrawer';

interface MobileShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSupportCall?: boolean;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  title,
  showBack = false,
  onBack,
  showSupportCall = true,
}) => {
  const navigate = useNavigate();
  const { user, userMode, setUserMode, logout } = useAuth();
  const [isBotOpen, setIsBotOpen] = useState(false);

  const isMerchant = userMode === 'MERCHANT';

  return (
    <div className="min-h-screen bg-slate-900/90 py-0 sm:py-6 px-0 sm:px-4 flex flex-col items-center justify-center">
      {/* Top Banner with Mode Switcher */}
      <div className="w-full max-w-md bg-paytm-navy text-sky-200 text-[11px] py-1.5 px-3 flex items-center justify-between border-b border-sky-900/50 shadow-sm z-50">
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold tracking-wide">FinRescue X</span>
          {/* Mode Switcher Pill */}
          <div className="bg-white/10 p-0.5 rounded-md flex items-center border border-white/20">
            <button
              onClick={() => setUserMode('MERCHANT')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition ${
                isMerchant ? 'bg-paytm-sky text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Store className="w-2.5 h-2.5" /> Merchant
            </button>
            <button
              onClick={() => setUserMode('NORMAL_USER')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition ${
                !isMerchant ? 'bg-paytm-sky text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-2.5 h-2.5" /> Retail User
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[9px] text-sky-300/80 font-mono">Simulated Demo</span>
        </div>
      </div>

      {/* Mobile Device Frame */}
      <div className="w-full sm:max-w-[420px] h-screen sm:h-[880px] bg-paytm-bg flex flex-col sm:rounded-[36px] shadow-2xl overflow-hidden border-0 sm:border-[8px] sm:border-slate-800 relative">
        {/* Device Notch Simulation (Desktop only) */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-paytm-blue shrink-0">
          <div className="w-28 h-4 bg-slate-950 rounded-full flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
          </div>
        </div>

        {/* Mobile Header Bar */}
        <header className="bg-gradient-to-r from-paytm-blue to-[#004b99] text-white px-4 py-3 shrink-0 flex items-center justify-between shadow-md z-40">
          <div className="flex items-center space-x-2">
            {showBack && (
              <button
                onClick={onBack || (() => navigate(-1))}
                className="p-1 -ml-1 text-white/90 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="font-bold text-base tracking-tight leading-tight">
                {title || (isMerchant ? 'Merchant Hub' : 'Personal Finance')}
              </h1>
              <p className="text-[10px] text-sky-200 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {isMerchant ? 'Paytm Soundbox Partner Node' : 'Paytm User Secure Node'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* 1-Min Quick Callback Trigger */}
            <NavLink
              to="/support?quick=true"
              className="bg-amber-400 hover:bg-amber-500 text-paytm-navy px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm transition active:scale-95"
              title="Request a call within 1 minute"
            >
              <Clock className="w-3 h-3 text-paytm-navy animate-spin" />
              <span>1-Min Call</span>
            </NavLink>

            {/* Merchant Care Chatbot Toggle */}
            <button
              onClick={() => setIsBotOpen(!isBotOpen)}
              className="bg-sky-400/20 hover:bg-sky-400/30 text-white p-2 rounded-full border border-sky-300/30 flex items-center justify-center shadow-inner transition"
              title="Open Merchant Care Assistant"
            >
              <Bot className="w-4 h-4 text-sky-200" />
            </button>

            {user && (
              <button
                onClick={logout}
                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto mobile-scrollbar bg-paytm-bg pb-20">
          {children}

          {/* Clean minimal footer */}
          <div className="p-4 mt-6 text-center text-slate-400 text-[10px] leading-relaxed border-t border-slate-200/60 bg-white/50">
            <p className="font-semibold text-slate-600">FinRescue X • Demo Prototype</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Independent hackathon build with simulated integrations.</p>
          </div>
        </main>

        {/* Floating Merchant Care Drawer */}
        <MerchantCareDrawer isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />

        {/* Fixed Mobile Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex justify-around items-center z-40 shadow-lg">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-paytm-blue font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </NavLink>

          <NavLink
            to="/loans"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-paytm-blue font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <IndianRupee className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Loans</span>
          </NavLink>

          <NavLink
            to="/active-loans"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-paytm-blue font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Repayments</span>
          </NavLink>

          <NavLink
            to="/assistant"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-paytm-blue font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Bot className="w-5 h-5 mb-0.5 text-paytm-sky" />
            <span className="text-[10px]">AI Voice</span>
          </NavLink>

          <NavLink
            to="/support"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-paytm-blue font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <HelpCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Help</span>
          </NavLink>
        </nav>
      </div>

      {/* Desktop External Helper Bar */}
      <div className="hidden sm:flex mt-3 text-xs text-slate-400 space-x-6 items-center">
        <span>Desktop Viewport Preview</span>
        <span>•</span>
        <NavLink to="/admin" className="text-sky-400 hover:text-sky-300 font-semibold underline flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Partner Intelligence Dashboard (/admin)
        </NavLink>
      </div>
    </div>
  );
};
