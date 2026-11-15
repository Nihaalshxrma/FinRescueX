import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import api from '../utils/api';
import {
  PhoneCall,
  Clock,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Zap,
  PhoneForwarded,
  Timer
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isQuickLaunch = queryParams.get('quick') === 'true';

  const [preferredTime, setPreferredTime] = useState(isQuickLaunch ? 'WITHIN_1_MINUTE' : 'WITHIN_1_MINUTE');
  const [reason, setReason] = useState('Document upload issue (Bank statement)');
  const [phone, setPhone] = useState('9876543210');
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (submitted && (preferredTime === 'WITHIN_1_MINUTE' || preferredTime === 'IMMEDIATE')) {
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [submitted, preferredTime]);

  const handleSubmitCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/support/callbacks', {
        applicationId: 'FNX-DEMO-1001',
        preferredTime,
        reason,
        phone
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell title="Support & Callbacks" showBack onBack={() => navigate('/home')}>
      <div className="p-4 space-y-4">
        {/* Direct Helpline */}
        <div className="bg-gradient-to-br from-paytm-blue to-paytm-navy text-white p-4 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold tracking-tight">Direct Merchant Helpline</h3>
          </div>
          <p className="text-xs text-sky-200">
            Dedicated assistance for loan journey recovery, document errors & EMI clarification.
          </p>
          <a
            href="tel:1800-FIN-RESCUE"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <PhoneCall className="w-4 h-4" />
            Call Now: 1800-FIN-RESCUE (Demo)
          </a>
        </div>

        {/* 1-Minute Priority Callback Request Feature */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                Priority 1-Minute Callback
              </h3>
            </div>
            <span className="bg-amber-100 text-amber-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              ⚡ Instant SLA
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Stuck on document blur or loan selection? A resolution specialist will call your phone within 60 seconds.
          </p>

          {submitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
                <PhoneForwarded className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  {countdown > 0 ? 'Officer Dispatching Your Call!' : 'Connected / Ringing Now!'}
                </h4>
                <p className="text-[11px] text-emerald-800 mt-1">
                  We are dialing <strong className="font-mono">{phone}</strong>. Please keep your phone unlocked.
                </p>
              </div>

              {/* 60s Live Countdown Timer */}
              {countdown > 0 && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-800 shadow-xs">
                  <Timer className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Representative connecting in: 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                </div>
              )}

              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bold text-paytm-blue hover:underline block mx-auto"
              >
                Request another callback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitCallback} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Your Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reason for Urgent Callback
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Bank statement page 2 blurry issue">Bank statement page 2 blurry issue</option>
                  <option value="Need urgent clarification on ROI & EMI">Need urgent clarification on ROI & EMI</option>
                  <option value="Bank account penny drop failed">Bank account penny drop failed</option>
                  <option value="Selfie or KYC liveness verification stuck">Selfie or KYC liveness verification stuck</option>
                  <option value="General application help">General application help</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Callback SLA Window
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'WITHIN_1_MINUTE', label: '⚡ Within 1 Minute (Urgent)', highlight: true },
                    { id: 'WITHIN_1_HOUR', label: 'Within 1 Hour' },
                    { id: 'MORNING_10_TO_1', label: 'Morning (10AM - 1PM)' },
                    { id: 'EVENING_3_TO_7', label: 'Evening (3PM - 7PM)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreferredTime(t.id)}
                      className={`p-2 rounded-xl border text-left font-bold transition ${
                        preferredTime === t.id
                          ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 accent-paytm-sky"
                    required
                  />
                  <span>I consent to an immediate representative phone call on my mobile number.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !consent}
                className="w-full bg-amber-500 hover:bg-amber-600 text-paytm-navy font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-paytm-navy" />
                {loading ? 'Dispatching...' : 'Request Instant 1-Min Callback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </MobileShell>
  );
};
