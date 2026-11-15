import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Smartphone, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [mobile, setMobile] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/demo-login', { mobile });
      if (res.data.success) {
        setOtpSentNotice(res.data.message);
        setOtp(res.data.demoOtp || '123456');
        setStep('OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send demo OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const success = await loginWithOtp(mobile, otp);
    setLoading(false);
    if (success) {
      navigate('/home');
    } else {
      setError('Invalid OTP. Use demo OTP 123456');
    }
  };

  const handleAdminQuickLogin = async () => {
    setMobile('9999999999');
    setLoading(true);
    try {
      await api.post('/auth/demo-login', { mobile: '9999999999' });
      const ok = await loginWithOtp('9999999999', '123456');
      if (ok) navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantQuickLogin = async () => {
    setMobile('9876543210');
    setLoading(true);
    try {
      await api.post('/auth/demo-login', { mobile: '9876543210' });
      const ok = await loginWithOtp('9876543210', '123456');
      if (ok) navigate('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-4 px-3 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-paytm-blue to-[#004b99] p-6 text-white text-center">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-3 backdrop-blur-sm border border-white/20">
            <Smartphone className="w-8 h-8 text-sky-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">FinRescue X</h2>
          <p className="text-xs text-sky-200 mt-1">Merchant Sign In • Demo Prototype</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {step === 'MOBILE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm font-semibold text-slate-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-paytm-sky/30 focus:border-paytm-sky transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Demo number: 9876543210 (Ankit Sharma)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-paytm-sky hover:bg-[#00a8dc] text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending Demo OTP...' : 'Get Demo OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {otpSentNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                  {otpSentNotice}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter 6-Digit Demo OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-center text-lg tracking-widest font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-paytm-sky/30 focus:border-paytm-sky transition"
                  required
                />
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                  Auto-filled simulated OTP: 123456
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-paytm-blue hover:bg-paytm-navy text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enter App'}
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </button>

              <button
                type="button"
                onClick={() => setStep('MOBILE')}
                className="w-full text-xs text-slate-500 hover:text-slate-800 text-center pt-1"
              >
                Change mobile number
              </button>
            </form>
          )}

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 text-center">
              Quick 1-Click Demo Logins
            </p>
            <button
              onClick={handleMerchantQuickLogin}
              disabled={loading}
              className="w-full bg-sky-50 hover:bg-sky-100 text-paytm-blue border border-sky-200 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <UserCheck className="w-4 h-4 text-paytm-sky" />
              Login as Ankit Sharma (Demo Merchant)
            </button>
            <button
              onClick={handleAdminQuickLogin}
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              Login as Partner Admin (/admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
