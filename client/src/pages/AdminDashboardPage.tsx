import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../utils/api';
import { formatINR } from '../shared/loanCalculator';
import {
  ShieldAlert,
  BarChart3,
  FileCheck,
  FileX,
  Users,
  Activity,
  PhoneCall,
  Clock,
  RotateCcw,
  Sparkles,
  Server,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Store,
  Sliders,
  XCircle,
  HelpCircle,
  Check,
  Send,
  X,
  Percent,
  SlidersHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('shortlisting');
  const [kpis, setKpis] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any>(null);
  const [docVerifications, setDocVerifications] = useState<any>(null);
  const [selectedVerifDetail, setSelectedVerifDetail] = useState<any>(null);
  const [verifFilterStatus, setVerifFilterStatus] = useState<string>('ALL');
  const [frictionList, setFrictionList] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Shortlisting Triage Engine state
  const [shortlistApps, setShortlistApps] = useState<any[]>([]);
  const [shortlistSummary, setShortlistSummary] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SALARIED' | 'SELF_EMPLOYED'>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'SHORTLIST_RECOMMENDED' | 'MANUAL_UNDERWRITING_REVIEW' | 'NOT_SHORTLISTED_HIGH_RISK'>('ALL');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // What-If Simulator state
  const [simAmount, setSimAmount] = useState<number>(100000);
  const [simTenure, setSimTenure] = useState<number>(12);
  const [simulatedPrediction, setSimulatedPrediction] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [actionReason, setActionReason] = useState<string>('');

  const fetchShortlisting = async () => {
    try {
      const res = await api.get(`/admin/shortlisting?category=${categoryFilter}&decision=${decisionFilter}`);
      setShortlistApps(res.data.applications || []);
      setShortlistSummary(res.data.summary);
      if (selectedApp) {
        const refreshed = res.data.applications?.find((a: any) => a.id === selectedApp.id);
        if (refreshed) setSelectedApp(refreshed);
      }
    } catch (e) {
      console.error('Fetch shortlisting failed', e);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [resOverview, resFunnel, resDocs, resFriction, resPartners, resSupport, resExp, resLogs, resVerifs] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/funnel'),
        api.get('/admin/documents'),
        api.get('/admin/friction'),
        api.get('/admin/partners'),
        api.get('/admin/support'),
        api.get('/admin/experiments'),
        api.get('/admin/audit-logs'),
        api.get('/admin/document-verifications'),
      ]);

      setKpis(resOverview.data.kpis);
      setFunnel(resFunnel.data.funnel || []);
      setDocuments(resDocs.data);
      setFrictionList(resFriction.data.frictionList || []);
      setPartners(resPartners.data.partners || []);
      setTelemetry(resPartners.data.telemetry || []);
      setSupportTickets(resSupport.data.tickets || []);
      setCallbacks(resSupport.data.callbacks || []);
      setExperiments(resExp.data.experiments || []);
      setAuditLogs(resLogs.data.auditLogs || []);
      setDocVerifications(resVerifs.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDoc = async (verifId: string, decision: 'VERIFY' | 'REJECT' | 'REQUEST_REUPLOAD') => {
    const reason = prompt(`Enter underwriter review note for ${decision}:`, decision === 'VERIFY' ? 'Credentials verified against official registry' : 'Discrepancy detected in applicant documentation');
    if (reason === null) return;
    try {
      await api.post(`/admin/document-verifications/${verifId}/review`, { decision, reason });
      alert(`Document successfully marked as ${decision === 'VERIFY' ? 'VERIFIED' : decision === 'REJECT' ? 'REJECTED' : 'REUPLOAD_REQUIRED'}!`);
      fetchAdminData();
    } catch (err: any) {
      alert('Review action failed: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchShortlisting();
    const interval = setInterval(() => {
      fetchAdminData();
      fetchShortlisting();
    }, 8000);
    return () => clearInterval(interval);
  }, [categoryFilter, decisionFilter]);

  // When selectedApp changes, reset simulator sliders
  useEffect(() => {
    if (selectedApp) {
      setSimAmount(selectedApp.requestedAmountINR || 100000);
      setSimTenure(selectedApp.requiredTenureMonths || 12);
      setSimulatedPrediction(selectedApp.shortlistingPrediction);
      setActionReason('');
    }
  }, [selectedApp]);

  // Trigger live What-If simulation calculation
  const handleSimulate = async (newAmount: number, newTenure: number) => {
    if (!selectedApp) return;
    setSimAmount(newAmount);
    setSimTenure(newTenure);
    setSimulating(true);
    try {
      const res = await api.post('/admin/simulate-underwriting', {
        applicationId: selectedApp.id,
        adjustedAmount: newAmount,
        adjustedTenure: newTenure
      });
      setSimulatedPrediction(res.data.prediction);
    } catch (e) {
      console.error('Simulation error', e);
    } finally {
      setSimulating(false);
    }
  };

  const handleShortlistAction = async (action: 'APPROVE' | 'COUNTER_OFFER' | 'NUDGE' | 'DECLINE') => {
    if (!selectedApp) return;
    try {
      await api.post('/admin/shortlist-action', {
        applicationId: selectedApp.id,
        action,
        counterAmount: action === 'COUNTER_OFFER' ? simAmount : undefined,
        counterTenure: action === 'COUNTER_OFFER' ? simTenure : undefined,
        reason: actionReason || undefined
      });
      alert(`Underwriting decision "${action}" recorded and applicant notified!`);
      fetchShortlisting();
    } catch (e: any) {
      alert('Action error: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Reset entire prototype database back to initial seed data?')) {
      try {
        await api.post('/admin/reset-demo');
        alert('Database reset successfully!');
        fetchAdminData();
        fetchShortlisting();
      } catch (e: any) {
        alert('Reset error: ' + e.message);
      }
    }
  };

  const simulatePartnerEvent = async (status: string) => {
    try {
      await api.post('/partners/simulate-event', {
        partnerId: 'lender-a',
        eventType: '/api/submit',
        statusCode: status === 'SUCCESS' ? 200 : status === 'TIMEOUT' ? 408 : 500
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'SHORTLIST_RECOMMENDED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3 text-emerald-400" /> Shortlist Recommended
          </span>
        );
      case 'MANUAL_UNDERWRITING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Manual Review
          </span>
        );
      case 'NOT_SHORTLISTED_HIGH_RISK':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-rose-400" /> High Risk / Decline
          </span>
        );
    }
  };

  const currentPred = simulatedPrediction || selectedApp?.shortlistingPrediction;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between z-30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Paytm Partner & Lender Underwriting Intelligence
              <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-400/30">
                FinRescue X
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Personal Loan Recovery & Explainable Lender Shortlisting Triage • 100-Point Rule Engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <NavLink
            to="/home"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold flex items-center gap-1 transition"
          >
            ← Open Borrower Mobile View
          </NavLink>
          <button
            onClick={handleResetDemo}
            className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/30 font-semibold flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col p-3 space-y-1 overflow-y-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 py-1">
            Lender Decision Engine
          </span>

          {[
            { id: 'shortlisting', label: 'Lender Shortlisting Triage', icon: SlidersHorizontal, highlight: true },
            { id: 'overview', label: 'Overview KPIs', icon: BarChart3 },
            { id: 'funnel', label: 'Application Funnel', icon: TrendingUp },
            { id: 'documents', label: 'Document & Preflight', icon: FileCheck },
            { id: 'friction', label: 'Customer Friction', icon: AlertTriangle },
            { id: 'partners', label: 'Partner Telemetry', icon: Server },
            { id: 'support', label: 'Support & Callbacks', icon: PhoneCall },
            { id: 'experiments', label: 'Recovery A/B Engine', icon: Sparkles },
            { id: 'audit', label: 'Audit Logs', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                } ${tab.highlight ? 'font-bold' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.highlight && (
                  <span className="ml-auto text-[8px] bg-paytm-sky text-white px-1.5 py-0.2 rounded font-bold">
                    CORE
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-auto border-t border-slate-800 p-2 text-[11px] text-slate-500 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Simulate Live Event
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => simulatePartnerEvent('SUCCESS')}
                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold"
              >
                + Partner 200
              </button>
              <button
                onClick={() => simulatePartnerEvent('TIMEOUT')}
                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold"
              >
                + Timeout 408
              </button>
            </div>
          </div>
        </aside>

        {/* Workspace Canvas */}
        <main className="flex-1 flex overflow-hidden">
          {/* TAB: LENDER SHORTLISTING & UNDERWRITING TRIAGE (CENTERPIECE) */}
          {activeTab === 'shortlisting' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left / Center: Shortlisting Queue */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {/* Header & Metric Summary Cards */}
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Lender Shortlisting & Underwriting Triage
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          {shortlistApps.length} Applications
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Automated 100-point checklist evaluation with explainable pass/warn/fail criteria & live what-if simulation.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Track:</span>
                      <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        {(['ALL', 'SALARIED', 'SELF_EMPLOYED'] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              categoryFilter === cat
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {cat === 'ALL' ? 'All' : cat === 'SALARIED' ? 'Salaried' : 'Self-Employed'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  {shortlistSummary && (
                    <div className="grid grid-cols-5 gap-3 mt-4">
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[11px] text-slate-400">Total Applicants</span>
                        <div className="text-xl font-bold text-white mt-0.5">{shortlistApps.length}</div>
                        <span className="text-[10px] text-slate-500">
                          {shortlistSummary.salariedCount} Salaried • {shortlistSummary.selfEmployedCount} Self-Emp
                        </span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20">
                        <span className="text-[11px] text-emerald-400">Shortlist Recommended</span>
                        <div className="text-xl font-bold text-emerald-300 mt-0.5">
                          {shortlistSummary.shortlistRecommended}
                        </div>
                        <span className="text-[10px] text-emerald-500/80">Score ≥ 80 & FOIR Safe</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-500/20">
                        <span className="text-[11px] text-amber-400">Manual Review</span>
                        <div className="text-xl font-bold text-amber-300 mt-0.5">
                          {shortlistSummary.manualReview}
                        </div>
                        <span className="text-[10px] text-amber-500/80">Score 65–79 / Boundary</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-rose-500/20">
                        <span className="text-[11px] text-rose-400">High Risk / Decline</span>
                        <div className="text-xl font-bold text-rose-300 mt-0.5">
                          {shortlistSummary.highRiskDecline}
                        </div>
                        <span className="text-[10px] text-rose-500/80">Score &lt; 65 or Hard Fails</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-sky-500/20">
                        <span className="text-[11px] text-sky-400">Interactive Simulator</span>
                        <div className="text-xs font-bold text-white mt-1">What-If Counter-Offers</div>
                        <span className="text-[10px] text-sky-300/80">Select row to triage</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    Filter Decision:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Decisions' },
                    { id: 'SHORTLIST_RECOMMENDED', label: 'Recommended' },
                    { id: 'MANUAL_UNDERWRITING_REVIEW', label: 'Manual Review' },
                    { id: 'NOT_SHORTLISTED_HIGH_RISK', label: 'High Risk' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDecisionFilter(f.id as any)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        decisionFilter === f.id
                          ? 'bg-sky-500 text-white border-sky-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Applications Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                        <tr>
                          <th className="p-3">Applicant & Category</th>
                          <th className="p-3">Requested Loan</th>
                          <th className="p-3">CIBIL</th>
                          <th className="p-3">FOIR %</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Preflight</th>
                          <th className="p-3">Prediction</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {shortlistApps.map((application) => {
                          const pred = application.shortlistingPrediction;
                          const isSelected = selectedApp?.id === application.id;
                          const isSalaried = application.applicantCategory === 'SALARIED';
                          const name = application.personalDetails?.fullName || 'Applicant';
                          const foir = pred?.foirPercentage || 0;
                          const score = pred?.checklistScore ?? 0;

                          return (
                            <tr
                              key={application.id}
                              onClick={() => setSelectedApp(application)}
                              className={`cursor-pointer transition hover:bg-slate-800/50 ${
                                isSelected ? 'bg-sky-500/10 border-l-2 border-sky-400' : ''
                              }`}
                            >
                              <td className="p-3">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  {name}
                                  {application.id === 'FNX-DEMO-1001' && (
                                    <span className="text-[8px] bg-amber-500/30 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                                      DEMO
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  {isSalaried ? (
                                    <span className="text-sky-300 flex items-center gap-0.5">
                                      <Briefcase className="w-3 h-3" /> Salaried
                                    </span>
                                  ) : (
                                    <span className="text-emerald-300 flex items-center gap-0.5">
                                      <Store className="w-3 h-3" /> Self-Employed
                                    </span>
                                  )}
                                  <span>• {application.id}</span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="font-mono font-semibold text-slate-200">
                                  ₹{application.requestedAmountINR?.toLocaleString('en-IN')}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {application.requiredTenureMonths} Months
                                </div>
                              </td>

                              <td className="p-3 font-mono font-bold">
                                <span className={
                                  (application.simulatedBureauScore || 750) >= 720
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }>
                                  {application.simulatedBureauScore || 750}
                                </span>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold ${
                                    foir <= 50 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                    {foir}%
                                  </span>
                                  <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        foir <= 50 ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${Math.min(100, foir)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="font-mono font-bold text-white">
                                  {score}<span className="text-slate-500 text-[10px]">/100</span>
                                </div>
                              </td>

                              <td className="p-3">
                                {application.status === 'DOCUMENT_ERROR' ? (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                                    Page 2 Blurry
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    Passed
                                  </span>
                                )}
                              </td>

                              <td className="p-3">
                                {getDecisionBadge(pred?.decisionPrediction || 'MANUAL_UNDERWRITING_REVIEW')}
                              </td>

                              <td className="p-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApp(application);
                                  }}
                                  className="text-xs bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                                >
                                  Inspect →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Side: Underwriting Decision Inspector Drawer */}
              {selectedApp && (
                <div className="w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto animate-in slide-in-from-right-4 duration-200">
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">
                          {selectedApp.personalDetails?.fullName}
                        </h3>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                          {selectedApp.id}
                        </span>
                      </div>
                      <span className="text-xs text-sky-400 font-semibold">
                        {selectedApp.applicantCategory === 'SALARIED' ? 'Salaried Individual' : 'Business / Self-Employed'}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedApp(null)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-5">
                    {/* Decision & Score Banner */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          Underwriting Decision
                        </span>
                        {getDecisionBadge(currentPred?.decisionPrediction)}
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-3xl font-bold text-white font-mono">
                            {currentPred?.checklistScore}
                          </span>
                          <span className="text-slate-500 text-sm"> / 100 Points</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Proposed FOIR</span>
                          <span className={`text-base font-bold font-mono ${
                            (currentPred?.foirPercentage || 0) <= 50 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {currentPred?.foirPercentage}%
                          </span>
                        </div>
                      </div>

                      {/* AI Underwriter 3-Bullet Summary */}
                      {currentPred?.aiUnderwriterSummary && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-sky-400" /> AI Underwriter Insights:
                          </span>
                          {currentPred.aiUnderwriterSummary.map((bullet: string, i: number) => (
                            <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                              <span className="text-sky-400 mt-0.5">•</span>
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 6-Criterion Explainable Checklist Breakdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Policy Checklist Criteria
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">Weight (Pts)</span>
                      </div>

                      <div className="space-y-2">
                        {currentPred?.checklistItems?.map((item: any) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              item.status === 'PASS'
                                ? 'bg-emerald-950/20 border-emerald-500/20'
                                : item.status === 'WARN'
                                ? 'bg-amber-950/20 border-amber-500/20'
                                : 'bg-rose-950/20 border-rose-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200">
                                {item.criterion}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  item.status === 'PASS'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : item.status === 'WARN'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {item.status}
                                </span>
                                <span className="font-mono text-slate-400 font-bold text-[10px]">
                                  {item.weight} pts
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Observed: <strong className="text-white">{item.observedValue}</strong></span>
                              <span>Benchmark: <strong className="text-slate-300">{item.benchmarkValue}</strong></span>
                            </div>

                            <p className="text-[10px] text-slate-400 italic">
                              {item.lenderNote}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive What-If Loan Simulator */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-sky-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-sky-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            What-If Counter-Offer Simulator
                          </h4>
                        </div>
                        {simulating && (
                          <span className="text-[9px] text-sky-400 animate-pulse">Calculating...</span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Adjust loan amount or tenure to observe live FOIR recalculation and shortlisting threshold transitions:
                      </p>

                      {/* Loan Amount Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Loan Amount:</span>
                          <span className="font-mono font-bold text-sky-300">
                            ₹{simAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={25000}
                          max={500000}
                          step={5000}
                          value={simAmount}
                          onChange={(e) => handleSimulate(Number(e.target.value), simTenure)}
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                          <span>₹25,000</span>
                          <span>₹5,00,000</span>
                        </div>
                      </div>

                      {/* Tenure Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Tenure (Months):</span>
                          <span className="font-mono font-bold text-sky-300">
                            {simTenure} Months
                          </span>
                        </div>
                        <input
                          type="range"
                          min={6}
                          max={36}
                          step={3}
                          value={simTenure}
                          onChange={(e) => handleSimulate(simAmount, Number(e.target.value))}
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                          <span>6 Mos</span>
                          <span>36 Mos</span>
                        </div>
                      </div>

                      {/* Max Safe Loan Cap Estimate */}
                      <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-between text-xs border border-slate-800">
                        <span className="text-slate-400">Estimated Safe Cap (FOIR ≤ 50%):</span>
                        <strong className="text-emerald-400 font-mono">
                          ₹{currentPred?.maxEligibleLoanEstimate?.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    {/* Underwriter Note Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 block">
                        Underwriting Note / Reason for Counter-Offer:
                      </label>
                      <input
                        type="text"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="e.g. Approved under ₹1.5L cap due to FOIR threshold"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    {/* Lender Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleShortlistAction('APPROVE')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition"
                      >
                        <Check className="w-4 h-4" /> Approve for Shortlist (Push to NBFC)
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleShortlistAction('COUNTER_OFFER')}
                          className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Counter-Offer
                        </button>

                        <button
                          onClick={() => handleShortlistAction('NUDGE')}
                          className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Trigger AI Nudge
                        </button>
                      </div>

                      <button
                        onClick={() => handleShortlistAction('DECLINE')}
                        className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-3.5 h-3.5" /> Decline Application
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && kpis && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400">Total Applications</span>
                  <div className="text-2xl font-bold text-white mt-1">{kpis.totalApplications}</div>
                  <span className="text-[10px] text-sky-400">
                    {kpis.submittedApplications} Submitted to Partner
                  </span>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400">High-Friction Applications</span>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.highFrictionApplications}</div>
                  <span className="text-[10px] text-amber-500">Needs proactive intervention</span>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400">Document Preflight Failures</span>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{kpis.documentFailures}</div>
                  <span className="text-[10px] text-rose-500">
                    {kpis.pdfPreflightFailures} PDF Header/Password
                  </span>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400">Journey Recovery Rate</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.recoverySuccessRate}%</div>
                  <span className="text-[10px] text-emerald-500">Avg {kpis.averageRecoveryTimeMinutes} mins saved</span>
                </div>
              </div>

              {/* Recovery Telemetry Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Simulated Partner API Health
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Avg Latency</span>
                      <strong className="text-white text-base font-mono">{kpis.partnerAverageLatencyMs} ms</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">API Failures</span>
                      <strong className="text-rose-400 text-base font-mono">{kpis.partnerApiFailures}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">KYC Pass Rate</span>
                      <strong className="text-emerald-400 text-base font-mono">{kpis.kycCompletionRate}%</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Customer Care Support Queue
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Open Tickets</span>
                      <strong className="text-amber-400 text-base font-mono">{kpis.pendingSupportTickets}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Pending 1-Min Callbacks</span>
                      <strong className="text-sky-400 text-base font-mono">{kpis.callbackRequests}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FUNNEL */}
          {activeTab === 'funnel' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Application Drop-off & Funnel Telemetry
              </h2>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                {funnel.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{f.stageName || f.stage}</span>
                      <span className="font-mono text-sky-400 font-bold">{f.count} Applicants ({f.conversionRate || 100}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-paytm-sky h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, (f.count / (funnel[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-paytm-sky" />
                    AI KYC & Document Verification Management
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sarvam AI Document Intelligence extraction, deterministic cross-document validation & underwriter adjudication
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-purple-400 animate-pulse" />
                    Sarvam Doc AI Active
                  </span>
                  <span className="text-[10px] font-mono bg-sky-950/80 text-sky-300 border border-sky-500/30 px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    Gemini Explanations Active
                  </span>
                </div>
              </div>

              {/* KPI Metrics */}
              <div className="grid grid-cols-6 gap-3">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Total Uploads</span>
                  <div className="text-xl font-bold text-white mt-1">
                    {docVerifications?.summary?.total ?? documents?.documents?.length ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-emerald-900/40">
                  <span className="text-[11px] text-emerald-400 block">Sarvam Matched</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {docVerifications?.summary?.matched ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-rose-900/40">
                  <span className="text-[11px] text-rose-400 block">Mismatched</span>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {docVerifications?.summary?.mismatched ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-900/40">
                  <span className="text-[11px] text-amber-400 block">Unreadable / Blurry</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {docVerifications?.summary?.unreadable ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-purple-900/40">
                  <span className="text-[11px] text-purple-300 block">Underwriter Review</span>
                  <div className="text-xl font-bold text-purple-300 mt-1">
                    {docVerifications?.summary?.manualReview ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-sky-900/40">
                  <span className="text-[11px] text-sky-400 block">Officially Verified</span>
                  <div className="text-xl font-bold text-sky-400 mt-1">
                    {docVerifications?.summary?.verified ?? 0}
                  </div>
                </div>
              </div>

              {/* Document Verifications Queue */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden space-y-0">
                <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Verification Queue ({docVerifications?.verifications?.length ?? 0})
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {['ALL', 'MATCH', 'MISMATCH', 'UNREADABLE', 'MANUAL_REVIEW', 'VERIFIED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setVerifFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                          verifFilterStatus === st
                            ? 'bg-paytm-sky text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="p-3">Applicant & ID</th>
                        <th className="p-3">Doc Type</th>
                        <th className="p-3">Verification Status</th>
                        <th className="p-3">Deterministic Checks</th>
                        <th className="p-3">Admin Status</th>
                        <th className="p-3 text-right">Underwriter Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(!docVerifications?.verifications || docVerifications.verifications.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No verification records found.
                          </td>
                        </tr>
                      ) : (
                        docVerifications.verifications
                          .filter((v: any) => verifFilterStatus === 'ALL' || v.verificationStatus === verifFilterStatus || v.adminReviewStatus === verifFilterStatus)
                          .map((v: any) => (
                            <tr key={v.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-3">
                                <span className="font-bold text-white block">{v.applicantName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">App: {v.applicationId}</span>
                              </td>
                              <td className="p-3">
                                <span className="font-semibold text-paytm-sky block uppercase text-[11px]">
                                  {v.documentType?.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px] block">
                                  {v.originalFilename}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                  v.verificationStatus === 'MATCH' || v.verificationStatus === 'VERIFIED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : v.verificationStatus === 'MISMATCH' || v.verificationStatus === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : v.verificationStatus === 'UNREADABLE'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                }`}>
                                  {v.verificationStatus}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="space-y-0.5 text-[10px]">
                                  {v.fieldChecks && v.fieldChecks.length > 0 ? (
                                    v.fieldChecks.slice(0, 2).map((fc: any, i: number) => (
                                      <div key={i} className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${fc.status === 'MATCH' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        <span className="text-slate-300">{fc.fieldLabel}:</span>
                                        <span className={fc.status === 'MATCH' ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                                          {fc.status}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-slate-500">{v.summary || 'Standard checks'}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] text-slate-300 font-mono">
                                  {v.adminReviewStatus || 'PENDING'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedVerifDetail(v)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded"
                                  >
                                    Inspect
                                  </button>
                                  <button
                                    onClick={() => handleReviewDoc(v.id, 'VERIFY')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleReviewDoc(v.id, 'REJECT')}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleReviewDoc(v.id, 'REQUEST_REUPLOAD')}
                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded"
                                  >
                                    Re-upload
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Underwriter Inspection Modal */}
              {selectedVerifDetail && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-slate-900 text-slate-200 rounded-2xl max-w-xl w-full p-5 space-y-4 max-h-[85vh] flex flex-col border border-slate-700 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-paytm-sky" />
                          Document Verification Dossier
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {selectedVerifDetail.documentType} • Applicant: {selectedVerifDetail.applicantName}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedVerifDetail(null)}
                        className="text-slate-400 hover:text-white font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
                      {/* AI Natural Language Explanation */}
                      {selectedVerifDetail.aiExplanation && (
                        <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" /> Google Gemini Assessment
                          </span>
                          <p className="text-slate-200 leading-relaxed font-sans">
                            {selectedVerifDetail.aiExplanation}
                          </p>
                        </div>
                      )}

                      {/* Field-by-Field Breakdown */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                          Deterministic Field Checks
                        </span>
                        <div className="space-y-1.5">
                          {selectedVerifDetail.fieldChecks?.map((fc: any, i: number) => (
                            <div key={i} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-white">{fc.fieldLabel}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  fc.status === 'MATCH' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {fc.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                                <div>
                                  <span className="text-slate-500 block">Extracted:</span>
                                  <span className="text-white truncate block">{String(fc.extractedValue || 'N/A')}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Profile:</span>
                                  <span className="text-white truncate block">{String(fc.registeredValue || 'N/A')}</span>
                                </div>
                              </div>
                              {fc.remarks && <p className="text-[10px] text-slate-400 italic">{fc.remarks}</p>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quality Checks */}
                      {selectedVerifDetail.qualityChecks && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                          <span className="font-bold text-slate-300 uppercase tracking-wider block">Document Quality</span>
                          <div className="flex justify-between text-slate-400">
                            <span>OCR Confidence:</span>
                            <span className="text-white font-mono">{Math.round((selectedVerifDetail.qualityChecks.ocrConfidence || 0.95) * 100)}%</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Legibility Check:</span>
                            <span className={selectedVerifDetail.qualityChecks.isReadable ? 'text-emerald-400' : 'text-rose-400'}>
                              {selectedVerifDetail.qualityChecks.isReadable ? 'Clear & Legible' : 'Unclear / Low Resolution'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleReviewDoc(selectedVerifDetail.id, 'VERIFY');
                            setSelectedVerifDetail(null);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                        >
                          Officially Verify
                        </button>
                        <button
                          onClick={() => {
                            handleReviewDoc(selectedVerifDetail.id, 'REJECT');
                            setSelectedVerifDetail(null);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            handleReviewDoc(selectedVerifDetail.id, 'REQUEST_REUPLOAD');
                            setSelectedVerifDetail(null);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs"
                        >
                          Request Re-upload
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectedVerifDetail(null)}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Table: Preflight & LlamaParse Extraction Hub */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Raw File Preflight & LlamaCloud Extraction Records ({documents?.documents?.length || 0})
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Doc Type</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Preflight Status</th>
                      <th className="p-3">LlamaParse Status</th>
                      <th className="p-3">Extracted Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(!documents?.documents || documents.documents.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No documents uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      documents.documents.map((doc: any, idx: number) => (
                        <tr key={doc.id || idx} className="hover:bg-slate-800/40">
                          <td className="p-3">
                            <span className="font-bold text-white uppercase text-[11px] block">
                              {doc.type || 'DOCUMENT'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {doc.id}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 font-mono text-[11px]">
                            {doc.originalName || doc.fileName || 'document.pdf'}
                          </td>
                          <td className="p-3">
                            {doc.preflightReport?.isPasswordProtected ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                                Password Protected
                              </span>
                            ) : doc.preflightReport?.isCorrupted ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                                Corrupted / Invalid Magic Bytes
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                Magic Bytes Verified
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {doc.llamaParseResult?.status === 'SUCCESS' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 flex items-center gap-1 w-fit">
                                <Cpu className="w-2.5 h-2.5" />
                                {doc.llamaParseResult.pagesParsed} Pages Parsed
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Ready for on-demand parse
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 text-[11px]">
                            {doc.llamaParseResult?.entitiesExtracted ? (
                              <div className="space-y-0.5">
                                {doc.llamaParseResult.entitiesExtracted.accountNumber && (
                                  <div className="text-[10px]">
                                    A/C: <span className="font-mono text-emerald-400 font-bold">{doc.llamaParseResult.entitiesExtracted.accountNumber}</span>
                                  </div>
                                )}
                                {doc.llamaParseResult.entitiesExtracted.panNumber && (
                                  <div className="text-[10px]">
                                    PAN: <span className="font-mono text-sky-400 font-bold">{doc.llamaParseResult.entitiesExtracted.panNumber}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px]">Standard Preflight OCR</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: FRICTION */}
          {activeTab === 'friction' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Real-Time Friction Engine Telemetry
              </h2>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Application ID</th>
                      <th className="p-3">Friction Score</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Friction Signals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {frictionList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-white">{item.applicationId}</td>
                        <td className="p-3 font-mono font-bold text-amber-400">{item.score} / 100</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{item.reasons?.join(', ') || 'Normal progression'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PARTNERS */}
          {activeTab === 'partners' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Simulated Partner API Telemetry & Endpoints
              </h2>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Partner</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {telemetry.slice(-20).reverse().map((t, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-slate-500">{new Date(t.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-slate-300">{t.partnerId}</td>
                        <td className="p-3 text-sky-400">{t.eventType}</td>
                        <td className="p-3">
                          <span className={t.statusCode === 200 ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                            {t.statusCode} {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{t.latencyMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SUPPORT */}
          {activeTab === 'support' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Support Tickets & 1-Minute Callbacks
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase">1-Minute Callback Requests</h3>
                  <div className="space-y-2">
                    {callbacks.map((c, i) => (
                      <div key={i} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
                        <div>
                          <div className="font-bold text-white">{c.name} ({c.mobile})</div>
                          <div className="text-[10px] text-slate-500">{c.topic}</div>
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold self-center bg-amber-500/10 px-2 py-0.5 rounded">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase">Support Tickets</h3>
                  <div className="space-y-2">
                    {supportTickets.map((t, i) => (
                      <div key={i} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
                        <div>
                          <div className="font-bold text-white">{t.subject}</div>
                          <div className="text-[10px] text-slate-500">{t.category} • {t.id}</div>
                        </div>
                        <span className="text-[10px] text-sky-300 font-bold self-center bg-sky-500/10 px-2 py-0.5 rounded">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXPERIMENTS */}
          {activeTab === 'experiments' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recovery A/B Testing & Intervention Lift
              </h2>
              <div className="space-y-3">
                {experiments.map((exp, i) => (
                  <div key={i} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-white text-sm">{exp.name}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        {exp.status}
                      </span>
                    </div>
                    <p className="text-slate-400">{exp.hypothesis}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-2 bg-slate-950 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">Control Variant A:</span>
                        <strong className="text-slate-300">Standard error notification</strong>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg">
                        <span className="text-[10px] text-sky-400 block">Treatment Variant B (FinRescue X):</span>
                        <strong className="text-sky-300">Single-page replacement + AI preflight</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Institutional Audit Logs (Immutable Event Ledger)
              </h2>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.slice(-30).reverse().map((log, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-slate-300">{log.actor}</td>
                        <td className="p-3 text-sky-400 font-bold">{log.action}</td>
                        <td className="p-3 text-slate-400">{log.entityType} ({log.entityId})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};