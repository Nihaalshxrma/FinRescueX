import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ApplicantCategory } from '../shared/types';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Building,
  User,
  CreditCard,
  Layers,
  ShieldCheck,
  PhoneCall,
  Eye,
  Info,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Download,
  AlertTriangle,
  ExternalLink,
  Cpu,
  Briefcase,
  Store,
  Clock,
  FileCheck,
  DollarSign,
  Bot
} from 'lucide-react';

export const LoanWizardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userMode } = useAuth();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Track selection: Salaried vs Business / Self-Employed
  const [category, setCategory] = useState<ApplicantCategory>('SALARIED');

  // Upload modal state for "Replace All"
  const [showReplaceAllModal, setShowReplaceAllModal] = useState<string | null>(null);
  const [uploadingAll, setUploadingAll] = useState(false);
  const replaceAllInputRef = useRef<HTMLInputElement>(null);

  // STEP 2: Personal Details
  const [personal, setPersonal] = useState<any>({
    fullName: 'Ananya Deshmukh',
    mobileNumber: '9876543210',
    email: 'ananya.deshmukh@tcs.com',
    dateOfBirth: '1992-06-14',
    panNumber: 'BKRPD9823L',
    address: 'Flat 402, Rohan Viti, Baner',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411045'
  });

  // STEP 3A: Salaried Details
  const [salaried, setSalaried] = useState<any>({
    employerName: 'Tata Consultancy Services Ltd',
    employerCategory: 'MNC',
    currentJobTenureMonths: 38,
    totalWorkExperienceYears: 6.5,
    netMonthlySalaryINR: 85000,
    existingMonthlyEmisINR: 12000,
    salaryMode: 'BANK_TRANSFER'
  });

  // STEP 3B: Self-Employed Details
  const [selfEmployed, setSelfEmployed] = useState<any>({
    businessName: 'Sharma General Stores',
    entityType: 'Proprietorship',
    businessVintageYears: 4,
    annualNetProfitINR: 480000,
    avgMonthlyBankCreditsINR: 220000,
    existingBusinessAndPersonalEmisINR: 15000,
    gstRegistered: true,
    gstNumber: '27AXXPS1234C1Z5',
    udyamRegistered: true,
    udyamNumber: 'UDYAM-MH-01-0012345',
    recentBouncesCount: 0
  });

  // STEP 4: Bank Details
  const [bank, setBank] = useState<any>({
    accountHolderName: 'Ananya Deshmukh',
    bankName: 'HDFC Bank',
    accountNumber: '501004928172',
    confirmAccountNumber: '501004928172',
    ifscCode: 'HDFC0000039',
    accountType: 'SAVINGS'
  });

  const [sampleModal, setSampleModal] = useState<string | null>(null);
  const [llamaParseModal, setLlamaParseModal] = useState<any | null>(null);
  const [parsingWithLlama, setParsingWithLlama] = useState(false);

  const fetchApplication = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      const data = res.data.application;
      setApp(data);
      if (data.applicantCategory) {
        setCategory(data.applicantCategory);
      }
      if (data.personalDetails) {
        setPersonal(data.personalDetails);
      }
      if (data.salariedDetails) {
        setSalaried(data.salariedDetails);
      }
      if (data.selfEmployedDetails) {
        setSelfEmployed(data.selfEmployedDetails);
      }
      if (data.bankDetails) {
        setBank(data.bankDetails);
      }
      if (data.partnerAcknowledgement) {
        setSubmittedData(data.partnerAcknowledgement);
      }

      // Resume from saved step if valid
      const stageMap: Record<string, number> = {
        'STAGE_1_REQUIREMENTS': 1,
        'STAGE_2_PERSONAL_DETAILS': 2,
        'STAGE_3_BUSINESS_DETAILS': 3,
        'STAGE_4_BANK_DETAILS': 4,
        'STAGE_5_DOCUMENTS': 5,
        'STAGE_6_OFFER_SELECTION': 6,
        'STAGE_7_KYC_VERIFICATION': 6,
        'STAGE_8_FINAL_REVIEW': 7,
        'STAGE_9_SUBMITTED': 7
      };
      const savedStep = stageMap[data.stage] || 1;
      setCurrentStep(savedStep);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  // Step Reversal / Rollback Functionality
  const handleRollbackStep = async (targetStepNumber: number) => {
    const stageNames = [
      '',
      'STAGE_1_REQUIREMENTS',
      'STAGE_2_PERSONAL_DETAILS',
      'STAGE_3_BUSINESS_DETAILS',
      'STAGE_4_BANK_DETAILS',
      'STAGE_5_DOCUMENTS',
      'STAGE_6_OFFER_SELECTION',
      'STAGE_8_FINAL_REVIEW'
    ];
    const targetStage = stageNames[targetStepNumber] || 'STAGE_1_REQUIREMENTS';
    try {
      await api.post(`/applications/${id}/rollback`, { targetStage });
      setCurrentStep(targetStepNumber);
      fetchApplication();
    } catch (e) {
      console.error('Rollback error', e);
      setCurrentStep(targetStepNumber);
    }
  };

  const handleSelectTrack = async (selected: ApplicantCategory) => {
    setCategory(selected);
    if (selected === 'SALARIED') {
      setPersonal((prev: any) => ({
        ...prev,
        fullName: 'Ananya Deshmukh',
        email: 'ananya.deshmukh@tcs.com',
        panNumber: 'BKRPD9823L'
      }));
      setBank((prev: any) => ({
        ...prev,
        accountHolderName: 'Ananya Deshmukh',
        bankName: 'HDFC Bank',
        accountType: 'SAVINGS'
      }));
    } else {
      setPersonal((prev: any) => ({
        ...prev,
        fullName: 'Ankit Sharma',
        email: 'ankit.sharma@gmail.com',
        panNumber: 'AXXPS1234C'
      }));
      setBank((prev: any) => ({
        ...prev,
        accountHolderName: 'Ankit Sharma',
        bankName: 'State Bank of India',
        accountType: 'CURRENT'
      }));
    }
    setSaving(true);
    try {
      await api.patch(`/applications/${id}`, {
        applicantCategory: selected,
        stage: 'STAGE_2_PERSONAL_DETAILS'
      });
      setCurrentStep(2);
      fetchApplication();
    } catch (err) {
      console.error(err);
      setCurrentStep(2);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/applications/${id}`, {
        applicantCategory: category,
        personalDetails: personal,
        stage: 'STAGE_3_BUSINESS_DETAILS'
      });
      setCurrentStep(3);
      fetchApplication();
    } catch (err) {
      console.error(err);
      setCurrentStep(3);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIncomeDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        applicantCategory: category,
        stage: 'STAGE_4_BANK_DETAILS'
      };
      if (category === 'SALARIED') {
        payload.salariedDetails = salaried;
      } else {
        payload.selfEmployedDetails = selfEmployed;
      }
      await api.patch(`/applications/${id}`, payload);
      setCurrentStep(4);
      fetchApplication();
    } catch (err) {
      console.error(err);
      setCurrentStep(4);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/bank/verify-demo', {
        applicationId: id,
        ...bank
      });
      await api.patch(`/applications/${id}`, {
        bankDetails: {
          ...bank,
          maskedAccountNumber: 'XXXXXXX' + bank.accountNumber.slice(-4),
          pennyDropStatus: 'VERIFIED'
        },
        stage: 'STAGE_5_DOCUMENTS'
      });
      setCurrentStep(5);
      fetchApplication();
    } catch (err) {
      console.error(err);
      setCurrentStep(5);
    } finally {
      setSaving(false);
    }
  };

  // Trigger Deep Document Extraction via LlamaParse v2
  const handleRunLlamaParse = async () => {
    setParsingWithLlama(true);
    try {
      const res = await api.post('/documents/parse-llamaparse', {});
      if (res.data?.result) {
        setLlamaParseModal(res.data.result);
      }
    } catch (e: any) {
      alert('LlamaParse error: ' + (e.response?.data?.error || e.message));
    } finally {
      setParsingWithLlama(false);
    }
  };

  // State for Document Uploads
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<string>('BANK_STATEMENT');
  const [additionalDocType, setAdditionalDocType] = useState<string>('OTHER');
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [verificationReportModal, setVerificationReportModal] = useState<any | null>(null);
  const [expandedVerifCard, setExpandedVerifCard] = useState<string | null>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const handleExtractSarvam = async (docId: string) => {
    setExtractingDocId(docId);
    try {
      const res = await api.post(`/documents/${docId}/extract`);
      await fetchApplication();
      const status = res.data?.verification?.verificationStatus || 'EXTRACTION_COMPLETED';
      if (status === 'MATCH') {
        alert('✓ Sarvam Document Intelligence: All fields successfully extracted & matched registered profile!');
      } else if (status === 'MISMATCH') {
        alert(`⚠️ Sarvam Document Intelligence: Mismatch detected!\n${res.data?.verification?.discrepancies?.join('\n') || 'Extracted fields do not match profile.'}`);
      } else if (status === 'UNREADABLE') {
        alert('⚠️ Sarvam Document Intelligence: Your document is unclear. Please upload a clearer image or PDF.');
      } else {
        alert(`ℹ️ Sarvam Document Intelligence: Extraction completed with status: ${status}`);
      }
    } catch (err: any) {
      alert('Extraction failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExtractingDocId(null);
    }
  };

  const handleOpenReport = async (docId: string) => {
    try {
      const res = await api.get(`/documents/${docId}/report`);
      if (res?.data) {
        setVerificationReportModal(res.data);
      }
    } catch (err: any) {
      alert('Failed to load report: ' + (err.response?.data?.error || err.message));
    }
  };

  const triggerUploadForSlot = (docType: string) => {
    setActiveUploadSlot(docType);
    if (fileUploadInputRef.current) {
      fileUploadInputRef.current.value = '';
      fileUploadInputRef.current.click();
    }
  };

  const handleDocumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDocType(activeUploadSlot);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('applicationId', id || 'FNX-DEMO-1001');
      formData.append('documentType', activeUploadSlot);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchApplication();
      if (res.data?.document?.preflightReport?.status === 'CREDENTIAL_MISMATCH' || res.data?.credentialMismatch) {
        alert(`⚠️ Credential Mismatch Detected!\n\n${res.data?.document?.preflightReport?.statusMessage || 'Name or credentials on the document do not match applicant profile.'}\n\nPlease upload a document belonging to the registered applicant.`);
      } else {
        alert(`✓ AI Preflight: "${file.name}" uploaded successfully for ${activeUploadSlot} and verified!`);
      }
    } catch (err: any) {
      console.error('Document upload error:', err);
      alert('Document upload error: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingDocType(null);
    }
  };

  // Single-Page Replacement (Page 2)
  const handleReplacePage = async (docId: string, pageNum: number) => {
    try {
      const targetDocId = app?.documents?.find((d: any) => d.documentType === 'BANK_STATEMENT')?.id || docId || 'doc-002';
      await api.post(`/documents/${targetDocId}/replace-page`, { pageNumber: pageNum });
      await api.patch(`/applications/${id}`, {
        status: 'OFFERS_AVAILABLE',
        stage: 'STAGE_6_OFFER_SELECTION'
      });
      await fetchApplication();
      alert(`AI Document Engine: Page ${pageNum} replaced & validated! Valid pages 1, 3, 4 preserved.`);
    } catch (e: any) {
      alert('Replacement error: ' + (e.response?.data?.error || e.message));
    }
  };

  // Replace All Modal Handler
  const handlePerformReplaceAll = async (file?: File) => {
    setUploadingAll(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('document', file);
      }
      const targetDocId = showReplaceAllModal || app?.documents?.find((d: any) => d.documentType === 'BANK_STATEMENT')?.id || 'doc-002';
      await api.post(`/documents/${targetDocId}/replace-all`, formData, {
        headers: file ? { 'Content-Type': 'multipart/form-data' } : undefined
      });
      await api.patch(`/applications/${id}`, {
        status: 'OFFERS_AVAILABLE',
        stage: 'STAGE_6_OFFER_SELECTION'
      });
      setShowReplaceAllModal(null);
      await fetchApplication();
      alert('AI Preflight & OCR: New document uploaded and all pages verified successfully!');
    } catch (e: any) {
      alert('Replace All error: ' + (e.response?.data?.error || e.message));
    } finally {
      setUploadingAll(false);
    }
  };

  // Sample Testing Document Injection
  const handleTestSample = async (sampleType: string) => {
    try {
      const res = await api.post('/documents/test-sample', {
        applicationId: id,
        sampleType
      });
      await fetchApplication();
      if (res.data?.credentialMismatch) {
        alert(`⚠️ Credential Mismatch Detected!\n\n${res.data?.message}\n\nThe document was rejected because its Name or PAN does not match the applicant.`);
      } else {
        alert(res.data.message);
      }
    } catch (e: any) {
      alert('Sample test error: ' + e.message);
    }
  };

  if (loading) {
    return (
      <MobileShell title="Loading...">
        <div className="p-8 text-center text-xs text-slate-500">Loading your personal loan application...</div>
      </MobileShell>
    );
  }

  return (
    <MobileShell
      title={`Personal Loan • ${category === 'SALARIED' ? 'Salaried' : 'Self-Employed'}`}
      showBack
      onBack={() => navigate('/loans')}
    >
      <div className="p-4 space-y-4">
        {/* Step Progress Tracker with Persistent Step Reversal */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => handleRollbackStep(currentStep - 1)}
                  className="text-paytm-blue hover:underline flex items-center gap-0.5 font-bold"
                  title="Reverse back to previous step"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
              <span>Step {currentStep} of 7</span>
            </span>
            <span className="text-paytm-blue font-bold">
              {Math.round((currentStep / 7) * 100)}% Complete
            </span>
          </div>

          {/* Interactive Steps Bar: previous steps directly clickable */}
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleRollbackStep(s)}
                className={`h-2 rounded-full transition cursor-pointer hover:opacity-80 ${
                  s < currentStep
                    ? 'bg-emerald-500'
                    : s === currentStep
                    ? 'bg-paytm-sky ring-2 ring-paytm-sky/30'
                    : 'bg-slate-200'
                }`}
                title={`Jump to Step ${s}`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center pt-1 text-[9px] text-slate-400">
            <span>FinRescue X Journey Recovery Active</span>
            <span className="text-paytm-sky font-semibold">Step {currentStep}: {
              currentStep === 1 ? 'Track' :
              currentStep === 2 ? 'Personal' :
              currentStep === 3 ? 'Income/Work' :
              currentStep === 4 ? 'Bank' :
              currentStep === 5 ? 'Documents' :
              currentStep === 6 ? 'Offers & KYC' : 'Submission'
            }</span>
          </div>
        </div>

        {/* STEP 1: Two-Track Employment Category Selection */}
        {currentStep === 1 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-paytm-sky" />
              <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                1. Select Your Employment Track
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Personal loan underwriting rules and document checklists differ significantly. Please select your primary income category:
            </p>

            {/* Track Option A: Salaried */}
            <div
              onClick={() => handleSelectTrack('SALARIED')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition relative group ${
                category === 'SALARIED'
                  ? 'border-paytm-sky bg-sky-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-paytm-sky/60 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-paytm-blue rounded-lg">
                      <User className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-paytm-navy">Salaried Individual</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Working at MNC, Private Ltd, Govt/PSU, or Startup with monthly salary bank credit.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1 text-[9px] font-semibold text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Min ₹20k–25k/mo</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">3 Mo Salary Slips</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">FOIR ≤ 50%</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-paytm-sky shrink-0 mt-2 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Track Option B: Business / Self-Employed */}
            <div
              onClick={() => handleSelectTrack('SELF_EMPLOYED')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition relative group ${
                category === 'SELF_EMPLOYED'
                  ? 'border-paytm-sky bg-sky-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-paytm-sky/60 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Store className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-paytm-navy">Business / Self-Employed</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Proprietor, partner, professional, doctor, CA, consultant, or small business owner.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1 text-[9px] font-semibold text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">≥ 2 Yrs Vintage</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">2 Yrs ITR + Computation</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">20% Volatility Haircut</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-2 group-hover:translate-x-1 transition" />
              </div>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-paytm-sky shrink-0" />
              <span>Simulated demo underwriting checklist adjusts live based on your selected track.</span>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Details */}
        {currentStep === 2 && (
          <form onSubmit={handleSavePersonal} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-paytm-sky" />
                <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                  2. Personal Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleRollbackStep(1)}
                className="text-[10px] text-paytm-blue hover:underline flex items-center gap-0.5"
              >
                <ArrowLeft className="w-3 h-3" /> Change Track
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Legal Name (as on PAN)</label>
              <input
                type="text"
                value={personal.fullName}
                onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={personal.mobileNumber}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={personal.dateOfBirth}
                  onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">PAN Card Number</label>
                <input
                  type="text"
                  value={personal.panNumber}
                  onChange={(e) => setPersonal({ ...personal, panNumber: e.target.value.toUpperCase() })}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 tracking-wider uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={personal.email}
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Residential Address</label>
              <input
                type="text"
                value={personal.address}
                onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={personal.city}
                  onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  value={personal.state}
                  onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pincode</label>
                <input
                  type="text"
                  value={personal.pincode}
                  onChange={(e) => setPersonal({ ...personal, pincode: e.target.value })}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRollbackStep(1)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-paytm-sky hover:bg-[#00a8dc] text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
              >
                Save & Next: {category === 'SALARIED' ? 'Salary Details' : 'Business Details'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Income & Employment Details (Track Specific) */}
        {currentStep === 3 && (
          <form onSubmit={handleSaveIncomeDetails} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {category === 'SALARIED' ? <Briefcase className="w-4 h-4 text-paytm-sky" /> : <Store className="w-4 h-4 text-emerald-600" />}
                <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                  3. {category === 'SALARIED' ? 'Salaried Employment Details' : 'Business / Self-Employed Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleRollbackStep(2)}
                className="text-[10px] text-paytm-blue hover:underline flex items-center gap-0.5"
              >
                <ArrowLeft className="w-3 h-3" /> Edit Personal
              </button>
            </div>

            {category === 'SALARIED' ? (
              // Salaried Fields
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employer / Company Name</label>
                  <input
                    type="text"
                    value={salaried.employerName}
                    onChange={(e) => setSalaried({ ...salaried, employerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employer Category</label>
                    <select
                      value={salaried.employerCategory}
                      onChange={(e) => setSalaried({ ...salaried, employerCategory: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      <option value="MNC">MNC</option>
                      <option value="Pvt Ltd">Private Limited</option>
                      <option value="Govt-PSU">Govt / PSU</option>
                      <option value="Startup">Startup (Funded)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Job Tenure (Months)</label>
                    <input
                      type="number"
                      value={salaried.currentJobTenureMonths}
                      onChange={(e) => setSalaried({ ...salaried, currentJobTenureMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Net Monthly Take-Home (₹)</label>
                    <input
                      type="number"
                      value={salaried.netMonthlySalaryINR}
                      onChange={(e) => setSalaried({ ...salaried, netMonthlySalaryINR: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Existing Monthly EMIs (₹)</label>
                    <input
                      type="number"
                      value={salaried.existingMonthlyEmisINR}
                      onChange={(e) => setSalaried({ ...salaried, existingMonthlyEmisINR: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex justify-between">
                  <span>Estimated FOIR (Existing Obligations):</span>
                  <strong className="font-mono">{Math.round((salaried.existingMonthlyEmisINR / Math.max(1, salaried.netMonthlySalaryINR)) * 100)}%</strong>
                </div>
              </>
            ) : (
              // Self-Employed Fields
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Business / Firm / Profession Name</label>
                  <input
                    type="text"
                    value={selfEmployed.businessName}
                    onChange={(e) => setSelfEmployed({ ...selfEmployed, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Entity Type</label>
                    <select
                      value={selfEmployed.entityType}
                      onChange={(e) => setSelfEmployed({ ...selfEmployed, entityType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      <option value="Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Freelancer-Professional">Professional / Consultant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Business Vintage (Years)</label>
                    <input
                      type="number"
                      value={selfEmployed.businessVintageYears}
                      onChange={(e) => setSelfEmployed({ ...selfEmployed, businessVintageYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Annual Net Profit in ITR (₹)</label>
                    <input
                      type="number"
                      value={selfEmployed.annualNetProfitINR}
                      onChange={(e) => setSelfEmployed({ ...selfEmployed, annualNetProfitINR: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Avg Monthly Bank Credits (₹)</label>
                    <input
                      type="number"
                      value={selfEmployed.avgMonthlyBankCreditsINR}
                      onChange={(e) => setSelfEmployed({ ...selfEmployed, avgMonthlyBankCreditsINR: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Existing Personal+Biz EMIs (₹)</label>
                    <input
                      type="number"
                      value={selfEmployed.existingBusinessAndPersonalEmisINR}
                      onChange={(e) => setSelfEmployed({ ...selfEmployed, existingBusinessAndPersonalEmisINR: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST / Udyam Number</label>
                    <input
                      type="text"
                      value={selfEmployed.gstNumber || selfEmployed.udyamNumber || ''}
                      onChange={(e) => setSelfEmployed({ ...selfEmployed, gstNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                      placeholder="27AXXPS1234C1Z5"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleRollbackStep(2)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-paytm-sky hover:bg-[#00a8dc] text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
              >
                Save & Next: Bank Details <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Bank Details */}
        {currentStep === 4 && (
          <form onSubmit={handleVerifyBank} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-paytm-sky" />
                <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                  4. Disbursement Bank Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleRollbackStep(3)}
                className="text-[10px] text-paytm-blue hover:underline flex items-center gap-0.5"
              >
                <ArrowLeft className="w-3 h-3" /> Edit Income
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={bank.accountHolderName}
                onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
              <input
                type="text"
                value={bank.bankName}
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
                <input
                  type="password"
                  value={bank.accountNumber}
                  onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Confirm A/c</label>
                <input
                  type="text"
                  value={bank.confirmAccountNumber}
                  onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">IFSC Code</label>
              <input
                type="text"
                value={bank.ifscCode}
                onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase"
                required
              />
            </div>

            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-paytm-sky shrink-0" />
              <span>Simulated penny-drop verification will match name against applicant PAN profile.</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleRollbackStep(3)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-paytm-blue hover:bg-paytm-navy text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
              >
                Verify & Proceed to Documents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: Intelligent Document Centre */}
        {currentStep === 5 && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-paytm-sky" />
                  <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                    5. AI Document Preflight Centre
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleRollbackStep(4)}
                  className="text-[10px] text-paytm-blue hover:underline flex items-center gap-0.5"
                >
                  <ArrowLeft className="w-3 h-3" /> Edit Bank
                </button>
              </div>

              {/* Sample Testing Suite */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-paytm-sky" /> Preflight Simulation Suite
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Verify Credentials & OCR</span>
                </div>
                
                {/* 2-Row Grid for Valid vs Invalid credential testing */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    onClick={() => handleTestSample('PAN_CARD_MATCHED')}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-emerald-800 text-left transition flex items-center justify-between"
                  >
                    <span>✓ Valid PAN ({category === 'SALARIED' ? 'Ananya' : 'Ankit'})</span>
                    <span className="text-[8px] bg-emerald-200 px-1 py-0.2 rounded font-mono">MATCH</span>
                  </button>

                  <button
                    onClick={() => handleTestSample('PAN_CARD_MISMATCHED')}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-800 text-left transition flex items-center justify-between"
                  >
                    <span>✗ Wrong PAN (Vijay M.)</span>
                    <span className="text-[8px] bg-rose-200 px-1 py-0.2 rounded font-mono">MISMATCH</span>
                  </button>

                  <button
                    onClick={() => handleTestSample('BANK_STATEMENT')}
                    className="p-1.5 bg-white hover:bg-sky-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-left transition flex items-center justify-between"
                  >
                    <span>📄 Valid Statement (4-Pgs)</span>
                    <span className="text-[8px] bg-slate-100 px-1 py-0.2 rounded font-mono">PASS</span>
                  </button>

                  <button
                    onClick={() => handleTestSample('BANK_STATEMENT_MISMATCHED')}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-800 text-left transition flex items-center justify-between"
                  >
                    <span>✗ Wrong Account (Axis/9988)</span>
                    <span className="text-[8px] bg-rose-200 px-1 py-0.2 rounded font-mono">MISMATCH</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    onClick={() => handleTestSample('PASSWORD_PROTECTED')}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg font-bold text-amber-800 text-center transition"
                  >
                    🔒 Password Locked PDF
                  </button>
                  <button
                    onClick={() => handleTestSample('CORRUPTED')}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-800 text-center transition"
                  >
                    ⚠️ Corrupted Magic Bytes
                  </button>
                </div>

                {/* LlamaParse Deep Extraction Button */}
                <div className="pt-1.5 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={handleRunLlamaParse}
                    disabled={parsingWithLlama}
                    className="w-full py-1.5 px-2 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:opacity-95 transition"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    {parsingWithLlama ? 'Processing with LlamaParse v2...' : 'Run LlamaParse Deep Table & Entity Extraction'}
                  </button>
                </div>
              </div>

              {/* Bank Statement Interruption Recovery Banner */}
              {(() => {
                const bankDoc = app?.documents?.find((d: any) => d.documentType === 'BANK_STATEMENT');
                const isInterrupted = bankDoc && !bankDoc.isReplaced && (
                  bankDoc.preflightReport?.status === 'READY_WITH_WARNINGS' ||
                  bankDoc.validationReport?.pageReports?.some((p: any) => p.quality === 'Blurry' || p.status === 'Needs replacement')
                );

                if (isInterrupted) {
                  return (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-900">
                            Bank Statement: Page 2 Blurry (OCR Unreadable)
                          </h4>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Pages 1, 3, 4 are valid and safely preserved! You can replace just Page 2, or click Replace All to upload a new document.
                          </p>
                        </div>
                      </div>

                      {/* Page Quality Visual Grid */}
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
                        <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">P1: Good ✓</div>
                        <div className="p-1.5 bg-rose-100 text-rose-800 rounded animate-pulse">P2: Blurry ✗</div>
                        <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">P3: Good ✓</div>
                        <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">P4: Good ✓</div>
                      </div>

                      {/* Dual Action Buttons: Replace Page 2 Only vs Replace All */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200">
                        <button
                          type="button"
                          onClick={() => handleReplacePage(bankDoc?.id || 'doc-002', 2)}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] py-2 px-2 rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Replace Page 2 Only
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowReplaceAllModal(bankDoc?.id || 'doc-002')}
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] py-2 px-2 rounded-lg flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <Upload className="w-3.5 h-3.5" /> Replace All Pages
                        </button>
                      </div>
                    </div>
                  );
                } else if (bankDoc && bankDoc.isReplaced) {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900">
                          Bank Statement Verified & Recovered
                        </h4>
                        <p className="text-[10px] text-emerald-700">
                          All 4 pages passed AI preflight and OCR readability with 100% clarity.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Dynamic Required Documents tailored to Track */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Required Documents ({category === 'SALARIED' ? 'Salaried Track' : 'Self-Employed Track'})
                  </span>
                  <span className="text-[10px] text-paytm-sky font-semibold">
                    Upload PDF, JPG, PNG up to 10MB
                  </span>
                </div>

                {(category === 'SALARIED' ? [
                  { type: 'PAN_CARD', label: `PAN Card (${personal.fullName || 'Applicant'})`, sampleKey: 'PAN', desc: 'Government photo identity card with PAN number' },
                  { type: 'AADHAAR_CARD', label: 'Masked Aadhaar / Address Proof', sampleKey: 'PAN', desc: 'UIDAI Masked Aadhaar card or Passport / Voter ID' },
                  { type: 'SALARY_SLIP', label: 'Salary Slips (Last 3 Months)', sampleKey: 'SALARY_SLIP', desc: 'Monthly payslips showing net take-home salary & deductions' },
                  { type: 'BANK_STATEMENT', label: 'Salary Account Bank Statement (Last 6 Months)', sampleKey: 'BANK_STATEMENT', desc: '6-month statement showing monthly salary credits' }
                ] : [
                  { type: 'PAN_CARD', label: `PAN Card (${personal.fullName || 'Proprietor'})`, sampleKey: 'PAN', desc: 'Personal PAN card of proprietor or partner' },
                  { type: 'AADHAAR_CARD', label: 'Masked Aadhaar / Address Proof', sampleKey: 'PAN', desc: 'Residential & principal place of business address proof' },
                  { type: 'ITR', label: 'ITR-4 & Computation of Income (Last 2 Years)', sampleKey: 'ITR', desc: 'Filed ITR forms with profit and computation sheets' },
                  { type: 'BANK_STATEMENT', label: 'Operative Bank Statement (Last 6 Months)', sampleKey: 'BANK_STATEMENT', desc: 'Bank statement with healthy cash-flow & zero bounces' },
                  { type: 'BUSINESS_PROOF', label: 'Business Registration Proof (GST / Udyam)', sampleKey: 'ITR', desc: 'Valid GST Certificate, Udyam registration, or Trade License' }
                ]).map((slot) => {
                  const existingDoc = app?.documents?.find((d: any) => d.documentType === slot.type);
                  const isUploadingThis = uploadingDocType === slot.type;

                  return (
                    <div key={slot.type} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{slot.label}</span>
                            <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 py-0.2 rounded">Required</span>
                          </div>
                          <p className="text-[10px] text-slate-500">{slot.desc}</p>
                        </div>

                        {/* Status Badge */}
                        {existingDoc ? (
                          (() => {
                            const verifStatus = existingDoc.verificationStatus || existingDoc.verificationReport?.verificationStatus;
                            const isMismatch = verifStatus === 'MISMATCH' || verifStatus === 'REJECTED' || existingDoc.preflightReport?.status === 'CREDENTIAL_MISMATCH' || existingDoc.credentialReport?.passed === false;
                            const isUnreadable = verifStatus === 'UNREADABLE';
                            const isManualReview = verifStatus === 'MANUAL_REVIEW';
                            const isVerified = verifStatus === 'VERIFIED';
                            const isMatch = verifStatus === 'MATCH' || verifStatus === 'EXTRACTION_COMPLETED';
                            const isPassword = existingDoc.preflightReport?.isPasswordProtected;
                            const isCorrupt = existingDoc.preflightReport?.isCorrupted;
                            const isWarning = existingDoc.preflightReport?.status === 'READY_WITH_WARNINGS' && !existingDoc.isReplaced;

                            if (isMismatch) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-rose-50 text-rose-700 border border-rose-300">
                                  <AlertCircle className="w-3 h-3 text-rose-600" /> Credential Mismatch
                                </span>
                              );
                            }
                            if (isUnreadable) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-amber-50 text-amber-700 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" /> Unreadable / Blurry
                                </span>
                              );
                            }
                            if (isManualReview) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-amber-50 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" /> Underwriter Review
                                </span>
                              );
                            }
                            if (isVerified) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Officially Verified
                                </span>
                              );
                            }
                            if (isPassword) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-amber-50 text-amber-700 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" /> Password Locked
                                </span>
                              );
                            }
                            if (isCorrupt) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-rose-50 text-rose-700 border border-rose-300">
                                  <AlertCircle className="w-3 h-3 text-rose-600" /> Corrupted File
                                </span>
                              );
                            }
                            if (isWarning) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-amber-50 text-amber-700 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" /> Page 2 Blurry
                                </span>
                              );
                            }
                            if (isMatch) {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sarvam Matched
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified • Valid
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Upload
                          </span>
                        )}
                      </div>

                      {/* Unreadable Document Warning */}
                      {existingDoc && existingDoc.verificationStatus === 'UNREADABLE' && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] space-y-1">
                          <div className="font-bold text-amber-900 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Document Unclear / Blurry
                          </div>
                          <p className="text-amber-800 leading-snug">
                            Your document is unclear. Please upload a clearer image or PDF.
                          </p>
                        </div>
                      )}

                      {/* Credential Mismatch Callout */}
                      {existingDoc && (existingDoc.preflightReport?.status === 'CREDENTIAL_MISMATCH' || existingDoc.credentialReport?.passed === false || existingDoc.verificationStatus === 'MISMATCH') && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10px] space-y-1">
                          <div className="font-bold text-rose-900 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Credential Verification Failed (Rejected)
                          </div>
                          <p className="text-rose-700 leading-snug">
                            {existingDoc.preflightReport?.statusMessage || existingDoc.validationReport?.failureReason || existingDoc.verificationReport?.summary || 'Document credentials do not match this applicant.'}
                          </p>
                          {existingDoc.credentialReport?.expectedCredentials && (
                            <div className="text-[9px] text-slate-700 bg-white/80 p-1.5 rounded border border-rose-100 font-mono">
                              Registered Applicant: <strong className="text-slate-900">{existingDoc.credentialReport.expectedCredentials.name}</strong> • PAN: <strong className="text-slate-900">{existingDoc.credentialReport.expectedCredentials.pan}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Extracted Data Preview Box */}
                      {existingDoc && existingDoc.extractedData && Object.keys(existingDoc.extractedData).length > 0 && (
                        <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200/80 text-[10px] space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-semibold text-[9px] uppercase tracking-wider">
                            <span className="flex items-center gap-1 text-paytm-blue">
                              <Sparkles className="w-2.5 h-2.5 text-paytm-sky" /> Sarvam AI Extracted Fields
                            </span>
                            <span className="font-mono text-emerald-600">Deterministic Match</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                            {(existingDoc.extractedData.full_name || existingDoc.extractedData.name || existingDoc.extractedData.account_holder_name) && (
                              <div className="truncate">
                                <span className="text-slate-400">Name: </span>
                                <strong className="text-slate-800">{existingDoc.extractedData.full_name || existingDoc.extractedData.name || existingDoc.extractedData.account_holder_name}</strong>
                              </div>
                            )}
                            {existingDoc.extractedData.pan_number && (
                              <div className="truncate">
                                <span className="text-slate-400">PAN: </span>
                                <strong className="text-slate-800">{existingDoc.extractedData.pan_number}</strong>
                              </div>
                            )}
                            {existingDoc.extractedData.account_number && (
                              <div className="truncate">
                                <span className="text-slate-400">A/C: </span>
                                <strong className="text-slate-800 font-mono">...{String(existingDoc.extractedData.account_number).slice(-4)}</strong>
                              </div>
                            )}
                            {existingDoc.extractedData.date_of_birth && (
                              <div className="truncate">
                                <span className="text-slate-400">DOB: </span>
                                <strong className="text-slate-800">{existingDoc.extractedData.date_of_birth}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* File info if uploaded */}
                      {existingDoc && (
                        <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-[10px] text-slate-600 font-mono">
                          <span className="truncate max-w-[200px] text-slate-800 font-semibold">
                            📎 {existingDoc.originalFilename || 'document.pdf'}
                          </span>
                          <span className="text-slate-400">
                            {existingDoc.fileSizeKB ? `${existingDoc.fileSizeKB} KB` : 'Verified'}
                          </span>
                        </div>
                      )}

                      {/* Action Controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => triggerUploadForSlot(slot.type)}
                            disabled={isUploadingThis}
                            className="px-2.5 py-1 bg-paytm-sky hover:bg-[#00a8dc] text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs transition"
                          >
                            <Upload className="w-3 h-3" />
                            {isUploadingThis ? 'Uploading...' : existingDoc ? 'Replace File' : 'Upload File'}
                          </button>

                          {existingDoc && (
                            <button
                              type="button"
                              onClick={() => handleExtractSarvam(existingDoc.id)}
                              disabled={extractingDocId === existingDoc.id}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-lg flex items-center gap-1 transition"
                            >
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              {extractingDocId === existingDoc.id ? 'Extracting...' : 'Sarvam Extract'}
                            </button>
                          )}

                          {existingDoc && (
                            <button
                              type="button"
                              onClick={() => handleOpenReport(existingDoc.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 transition"
                            >
                              <FileCheck className="w-3 h-3 text-slate-600" />
                              Report
                            </button>
                          )}

                          {!existingDoc && (
                            <button
                              type="button"
                              onClick={() => handleTestSample(slot.type === 'BANK_STATEMENT' ? 'BANK_STATEMENT' : 'PAN_CARD')}
                              className="text-slate-500 hover:text-slate-800 underline font-semibold"
                            >
                              Use Demo Sample
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {slot.type === 'BANK_STATEMENT' && (
                            <button
                              type="button"
                              onClick={handleRunLlamaParse}
                              className="text-purple-700 hover:underline font-bold flex items-center gap-0.5"
                            >
                              <Sparkles className="w-2.5 h-2.5" /> LlamaParse OCR
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSampleModal(slot.sampleKey)}
                            className="text-paytm-blue hover:underline font-bold"
                          >
                            View Sample
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Document Uploader */}
              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-paytm-sky" /> Upload Additional Document
                  </span>
                  <select
                    value={additionalDocType}
                    onChange={(e) => setAdditionalDocType(e.target.value)}
                    className="text-[10px] bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700"
                  >
                    <option value="RENT_AGREEMENT">Rent Agreement</option>
                    <option value="UTILITY_BILL">Electricity / Utility Bill</option>
                    <option value="CANCELLED_CHEQUE">Cancelled Cheque</option>
                    <option value="FORM_16">Form 16</option>
                    <option value="OTHER">Other Supporting Doc</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => triggerUploadForSlot(additionalDocType)}
                  disabled={uploadingDocType === additionalDocType}
                  className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-paytm-sky" />
                  {uploadingDocType === additionalDocType ? 'Uploading & Analyzing...' : 'Browse & Upload Supporting Document'}
                </button>
              </div>

              {/* Hidden Global File Input for Document Slots */}
              <input
                ref={fileUploadInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleDocumentFileChange}
              />

              {/* Live Underwriting Checklist Status & Instant Alert */}
              {(() => {
                const docItem = app?.shortlistingPrediction?.checklistItems?.find((it: any) =>
                  it.id === 'sal-doc-preflight' || it.id === 'se-cibil-docs'
                );
                const hasFailedDocs = (app?.documents || []).some((d: any) =>
                  d.preflightReport?.status === 'CREDENTIAL_MISMATCH' ||
                  d.credentialReport?.passed === false ||
                  !d.preflightReport?.safeForOcr ||
                  d.validationReport?.overallStatus === 'FAILED'
                );
                const hasBlurry = (app?.documents || []).some((d: any) =>
                  d.validationReport?.overallStatus === 'PARTIAL_REPLACEMENT_NEEDED' ||
                  d.validationReport?.pageReports?.some((p: any) => p.quality === 'Blurry')
                );

                if (!docItem && !hasFailedDocs && !hasBlurry) return null;

                const isPass = docItem?.status === 'PASS' && !hasFailedDocs && !hasBlurry;
                const isWarn = docItem?.status === 'WARN' || hasBlurry;

                return (
                  <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                    isPass
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : isWarn
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-rose-50/80 border-rose-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <ShieldCheck className={`w-4 h-4 ${isPass ? 'text-emerald-600' : isWarn ? 'text-amber-600' : 'text-rose-600'}`} />
                        <span className={isPass ? 'text-emerald-950' : isWarn ? 'text-amber-950' : 'text-rose-950'}>
                          Underwriting Checklist: Document Integrity
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isPass
                          ? 'bg-emerald-200 text-emerald-900'
                          : isWarn
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}>
                        {isPass ? '✓ PASS (10 Pts)' : isWarn ? '⚠ WARN (Single Page Blur)' : '✕ FAIL (Rejected)'}
                      </span>
                    </div>

                    <p className={`text-[11px] leading-snug ${isPass ? 'text-emerald-800' : isWarn ? 'text-amber-800' : 'text-rose-800'}`}>
                      {docItem?.observedValue || (hasFailedDocs ? 'Document failed preflight or credential verification' : 'Checklist evaluated')}
                    </p>

                    {/* Instant Alert & AI Recovery Assistant Trigger */}
                    {!isPass && (
                      <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-700">
                          {isWarn ? 'Single page blur detected.' : 'Name or credential mismatch flagged.'}
                        </span>
                        <NavLink
                          to="/assistant"
                          className="px-2.5 py-1 bg-gradient-to-r from-paytm-blue to-paytm-sky text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs hover:opacity-95"
                        >
                          <Bot className="w-3 h-3 text-sky-200" />
                          AI Recovery Assistant
                        </NavLink>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleRollbackStep(4)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => setCurrentStep(6)}
                  className="flex-1 bg-paytm-sky hover:bg-[#00a8dc] text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
                >
                  Proceed to Offers & KYC <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Loan Offers & KYC Verification */}
        {currentStep === 6 && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                  6. Pre-Qualified Offers & Verification
                </h3>
                <button
                  type="button"
                  onClick={() => handleRollbackStep(5)}
                  className="text-[10px] text-paytm-blue hover:underline flex items-center gap-0.5"
                >
                  <ArrowLeft className="w-3 h-3" /> Edit Docs
                </button>
              </div>

              {/* Offer Card */}
              <div className="p-3.5 rounded-xl border-2 border-paytm-sky bg-sky-50/40 relative">
                <span className="absolute top-2 right-2 bg-paytm-blue text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Best Rate
                </span>
                <span className="text-xs font-bold text-paytm-navy block">
                  {category === 'SALARIED' ? 'Paytm Consumer Lending (Piramal Finance)' : 'Tata Capital Personal & Business'}
                </span>
                <div className="text-xl font-extrabold text-paytm-blue mt-1">
                  ₹{app.requestedAmountINR ? app.requestedAmountINR.toLocaleString('en-IN') : '1,00,000'}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    @ {category === 'SALARIED' ? '12.5%' : '15.5%'} p.a.
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-600 border-t border-sky-100 pt-2">
                  <div>EMI: <strong className="text-slate-900">₹8,920/mo</strong></div>
                  <div>Tenure: <strong className="text-slate-900">{app.requiredTenureMonths || 12} Mos</strong></div>
                  <div>Fee: <strong className="text-slate-900">₹1,770</strong></div>
                </div>
              </div>

              {/* KYC Verification Steps */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-700 block">Instant Verification Checks:</span>
                <div className="space-y-1.5">
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900">1. Instant PAN Verification</span>
                    <span className="text-emerald-700 font-bold">✓ 100% Match</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900">2. CKYC Registry Record</span>
                    <span className="text-emerald-700 font-bold">✓ CKYC-7890 Verified</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900">3. Aadhaar OTP Simulation</span>
                    <span className="text-emerald-700 font-bold">✓ UIDAI Mock Verified</span>
                  </div>
                  <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-sky-900">4. Live Selfie & Liveness</span>
                    <span className="text-sky-700 font-bold">✓ 98.4% Match</span>
                  </div>
                </div>
              </div>

              {/* Live Underwriting Checklist Status & Instant Alert */}
              {(() => {
                const docItem = app?.shortlistingPrediction?.checklistItems?.find((it: any) =>
                  it.id === 'sal-doc-preflight' || it.id === 'se-cibil-docs'
                );
                const hasFailedDocs = (app?.documents || []).some((d: any) =>
                  d.preflightReport?.status === 'CREDENTIAL_MISMATCH' ||
                  d.credentialReport?.passed === false ||
                  !d.preflightReport?.safeForOcr ||
                  d.validationReport?.overallStatus === 'FAILED'
                );
                const hasBlurry = (app?.documents || []).some((d: any) =>
                  d.validationReport?.overallStatus === 'PARTIAL_REPLACEMENT_NEEDED' ||
                  d.validationReport?.pageReports?.some((p: any) => p.quality === 'Blurry')
                );

                if (!docItem && !hasFailedDocs && !hasBlurry) return null;

                const isPass = docItem?.status === 'PASS' && !hasFailedDocs && !hasBlurry;
                const isWarn = docItem?.status === 'WARN' || hasBlurry;

                return (
                  <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                    isPass
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : isWarn
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-rose-50/80 border-rose-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <ShieldCheck className={`w-4 h-4 ${isPass ? 'text-emerald-600' : isWarn ? 'text-amber-600' : 'text-rose-600'}`} />
                        <span className={isPass ? 'text-emerald-950' : isWarn ? 'text-amber-950' : 'text-rose-950'}>
                          Underwriting Checklist: Document Integrity
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isPass
                          ? 'bg-emerald-200 text-emerald-900'
                          : isWarn
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}>
                        {isPass ? '✓ PASS (10 Pts)' : isWarn ? '⚠ WARN (Single Page Blur)' : '✕ FAIL (Rejected)'}
                      </span>
                    </div>

                    <p className={`text-[11px] leading-snug ${isPass ? 'text-emerald-800' : isWarn ? 'text-amber-800' : 'text-rose-800'}`}>
                      {docItem?.observedValue || (hasFailedDocs ? 'Document failed preflight or credential verification' : 'Checklist evaluated')}
                    </p>

                    {/* Instant Alert & AI Recovery Assistant Trigger */}
                    {!isPass && (
                      <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-700">
                          {isWarn ? 'Single page blur detected.' : 'Name or credential mismatch flagged.'}
                        </span>
                        <NavLink
                          to="/assistant"
                          className="px-2.5 py-1 bg-gradient-to-r from-paytm-blue to-paytm-sky text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs hover:opacity-95"
                        >
                          <Bot className="w-3 h-3 text-sky-200" />
                          AI Recovery Assistant
                        </NavLink>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleRollbackStep(5)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => setCurrentStep(7)}
                  className="flex-1 bg-paytm-sky hover:bg-[#00a8dc] text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
                >
                  Confirm & Final Review <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Final Review & Submission */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-paytm-navy uppercase tracking-wider">
                  7. Final Review & Partner Submission
                </h3>
                <button
                  type="button"
                  onClick={() => handleRollbackStep(6)}
                  className="text-[10px] text-paytm-blue hover:underline flex items-center gap-0.5"
                >
                  <ArrowLeft className="w-3 h-3" /> Recheck KYC
                </button>
              </div>

              {submittedData ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2.5 text-center animate-in fade-in duration-300">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-950">
                    Application Acknowledged by Simulated Lending Partner!
                  </h4>
                  <div className="p-3 bg-white/90 rounded-xl text-xs text-left space-y-1 font-mono text-slate-800 border border-emerald-200">
                    <div>Acknowledgement ID: <strong>{submittedData.ackId}</strong></div>
                    <div>Partner: <strong>{submittedData.partnerName}</strong></div>
                    <div>Reference: <strong>{submittedData.referenceNumber || 'REF-928410'}</strong></div>
                    <div>Expected SLA: <strong>{submittedData.expectedSlaHours || 24} Hours</strong></div>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    {submittedData.responseNote || 'Submitted to simulated lending partner. No real credit enquiry was initiated.'}
                  </p>
                  <button
                    onClick={() => navigate('/loans')}
                    className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase"
                  >
                    Return to Application Tracker
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applicant Category:</span>
                      <span className="font-bold text-slate-800">{category === 'SALARIED' ? 'Salaried Individual' : 'Business / Self-Employed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applicant:</span>
                      <span className="font-bold text-slate-800">{personal.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requested Amount:</span>
                      <span className="font-bold text-paytm-blue">
                        ₹{app.requestedAmountINR ? app.requestedAmountINR.toLocaleString('en-IN') : '1,00,000'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Disbursement Bank:</span>
                      <span className="font-bold text-slate-800">
                        {bank.bankName} (Ending {bank.accountNumber?.slice(-4) || '8172'})
                      </span>
                    </div>
                  </div>

                  {/* Customer Calling & Callback Option */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-paytm-blue">
                        <PhoneCall className="w-4 h-4 text-paytm-sky" />
                        <span>Have Doubts Before Confirming?</span>
                      </div>
                      <span className="text-[9px] bg-paytm-sky text-white px-2 py-0.5 rounded-full font-bold">
                        Free Support
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href="tel:1800-FIN-RESCUE"
                        className="text-center py-2 px-3 bg-white border border-sky-300 rounded-lg text-xs font-bold text-paytm-blue hover:bg-sky-50 shadow-xs transition"
                      >
                        Call Support
                      </a>
                      <button
                        onClick={() => navigate('/support?quick=true')}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1"
                      >
                        ⚡ 1-Min Callback
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRollbackStep(6)}
                      className="px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await api.post('/consents', { applicationId: id, purpose: 'PARTNER_SUBMISSION', granted: true });
                          const res = await api.post(`/applications/${id}/submit-demo`);
                          setSubmittedData(res.data.acknowledgement);
                        } catch (e: any) {
                          alert('Submission error: ' + (e.response?.data?.error || e.message));
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-md transition"
                    >
                      Submit Application <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal 1: On-Screen Sample Document Viewer */}
        {sampleModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 relative overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-xs text-paytm-navy">
                  On-Screen Sample: {sampleModal.replace('_', ' ')}
                </h4>
                <button
                  onClick={() => setSampleModal(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Render Full Graphic On-Screen Document */}
              <div className="overflow-y-auto space-y-3 p-1">
                {sampleModal === 'PAN' && (
                  <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl border border-amber-300 text-slate-800 space-y-2 font-mono text-[10px] shadow-sm">
                    <div className="flex justify-between items-center border-b border-amber-300 pb-1">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-amber-900">INCOME TAX DEPARTMENT • GOVT OF INDIA</span>
                      <span className="text-[8px] bg-amber-200 px-1 py-0.5 rounded font-bold">SAMPLE</span>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <div className="w-16 h-20 bg-slate-300 rounded border border-slate-400 flex items-center justify-center text-[8px] text-slate-600 font-bold shrink-0">
                        PHOTO
                      </div>
                      <div className="space-y-1">
                        <div>Name: <strong className="font-bold">{personal.fullName}</strong></div>
                        <div>Father's Name: <strong>O. P. Sharma</strong></div>
                        <div>DOB: <strong>{personal.dateOfBirth}</strong></div>
                        <div className="pt-1 text-xs font-bold text-paytm-blue tracking-widest">{personal.panNumber}</div>
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-500 pt-1 text-center border-t border-amber-200">
                      ✓ Validated with Simulated NSDL / Income Tax OCR API
                    </div>
                  </div>
                )}

                {sampleModal === 'SALARY_SLIP' && (
                  <div className="p-3 bg-white rounded-xl border border-slate-300 text-slate-800 space-y-2 text-[10px]">
                    <div className="text-center border-b pb-1">
                      <strong className="block font-bold text-paytm-navy">{salaried.employerName}</strong>
                      <span className="text-[9px] text-slate-500">PAYSLIP FOR OCTOBER 2026</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50 p-2 rounded">
                      <div>Employee: <strong>{personal.fullName}</strong></div>
                      <div>Tenure: <strong>{salaried.currentJobTenureMonths} Mos</strong></div>
                      <div>Gross Salary: <strong>₹96,500</strong></div>
                      <div>Deductions (PF/Tax): <strong>₹11,500</strong></div>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex justify-between font-bold text-emerald-900">
                      <span>Net In-Hand Pay:</span>
                      <span>₹{salaried.netMonthlySalaryINR.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {sampleModal === 'ITR' && (
                  <div className="p-3 bg-white rounded-xl border border-slate-300 text-slate-800 space-y-2 text-[10px]">
                    <div className="text-center border-b pb-1">
                      <strong className="block font-bold text-paytm-navy">INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT</strong>
                      <span className="text-[9px] text-slate-500">ITR-4 (SUGAM) • AY 2026-27</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50 p-2 rounded">
                      <div>PAN: <strong>{personal.panNumber}</strong></div>
                      <div>Name: <strong>{personal.fullName}</strong></div>
                      <div>Firm: <strong>{selfEmployed.businessName}</strong></div>
                      <div>Status: <strong>Verified (e-Filed)</strong></div>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex justify-between font-bold text-emerald-900">
                      <span>Net Taxable Income:</span>
                      <span>₹{selfEmployed.annualNetProfitINR.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {sampleModal === 'BANK_STATEMENT' && (
                  <div className="p-3 bg-white rounded-xl border border-slate-300 text-slate-800 space-y-2 text-[10px]">
                    <div className="text-center border-b pb-1">
                      <strong className="block font-bold text-paytm-navy">{bank.bankName} Account Statement</strong>
                      <span className="text-[9px] text-slate-500">Period: May 2026 – Oct 2026 (4 Pages)</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between p-1 bg-slate-50 rounded">
                        <span>Page 1: Opening Balances & Summary</span>
                        <strong className="text-emerald-600">✓ Verified</strong>
                      </div>
                      <div className="flex justify-between p-1 bg-rose-50 border border-rose-200 rounded">
                        <span>Page 2: Middle Ledger Lines</span>
                        <strong className="text-rose-600">✗ Blurry 45%</strong>
                      </div>
                      <div className="flex justify-between p-1 bg-slate-50 rounded">
                        <span>Page 3: Salary / Inward Credits</span>
                        <strong className="text-emerald-600">✓ Verified</strong>
                      </div>
                      <div className="flex justify-between p-1 bg-slate-50 rounded">
                        <span>Page 4: Closing Balance & Audit</span>
                        <strong className="text-emerald-600">✓ Verified</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex justify-end">
                <button
                  onClick={() => setSampleModal(null)}
                  className="px-4 py-1.5 bg-paytm-sky text-white rounded-lg text-xs font-bold"
                >
                  Close Sample
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Replace All Upload Modal */}
        {showReplaceAllModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 relative shadow-2xl">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-xs text-paytm-navy">
                  Replace Entire Document
                </h4>
                <button
                  onClick={() => setShowReplaceAllModal(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-600">
                Upload a brand new clear PDF or multi-page scan. FinRescue X AI will re-run preflight checks, magic bytes analysis, and OCR page validations.
              </p>

              <input
                ref={replaceAllInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePerformReplaceAll(e.target.files[0]);
                  }
                }}
              />

              <div
                onClick={() => replaceAllInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-paytm-sky/50 rounded-xl bg-sky-50/50 hover:bg-sky-50 text-center cursor-pointer transition space-y-2"
              >
                <Upload className="w-8 h-8 text-paytm-sky mx-auto" />
                <div className="text-xs font-bold text-paytm-navy">Click to browse new file</div>
                <div className="text-[9px] text-slate-500">PDF, JPG, PNG up to 10MB</div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplaceAllModal(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={uploadingAll}
                  onClick={() => handlePerformReplaceAll()}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                >
                  {uploadingAll ? 'Validating...' : 'Use Clean Demo PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: LlamaParse Deep Extraction Results Viewer */}
        {llamaParseModal && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 relative shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h4 className="font-bold text-xs text-paytm-navy flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-paytm-sky" />
                    LlamaParse v2 Extraction Results
                  </h4>
                  <span className="text-[9px] text-slate-500 font-mono">Job: {llamaParseModal.jobId}</span>
                </div>
                <button
                  onClick={() => setLlamaParseModal(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto space-y-2.5 p-1 text-xs">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2 bg-sky-50 rounded-lg border border-sky-100">
                    <span className="text-slate-500 block">Pages</span>
                    <strong className="text-paytm-blue font-bold text-sm">{llamaParseModal.pageCount}</strong>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Status</span>
                    <strong className="text-emerald-700 font-bold text-xs">{llamaParseModal.status}</strong>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-slate-500 block">Tables</span>
                    <strong className="text-amber-800 font-bold text-sm">{llamaParseModal.tablesDetected}</strong>
                  </div>
                </div>

                {/* Extracted Entities */}
                {llamaParseModal.extractedEntities && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase">Detected Account Metadata:</span>
                    {llamaParseModal.extractedEntities.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account No:</span>
                        <strong className="font-mono text-slate-800">{llamaParseModal.extractedEntities.accountNumber}</strong>
                      </div>
                    )}
                    {llamaParseModal.extractedEntities.panNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">PAN:</span>
                        <strong className="font-mono text-slate-800">{llamaParseModal.extractedEntities.panNumber}</strong>
                      </div>
                    )}
                    {llamaParseModal.extractedEntities.ifscCode && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">IFSC:</span>
                        <strong className="font-mono text-slate-800">{llamaParseModal.extractedEntities.ifscCode}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Per Page Breakdown */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">Parsed Pages (Markdown):</span>
                  {llamaParseModal.pages?.map((p: any) => (
                    <div key={p.pageNumber} className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>Page {p.pageNumber}</span>
                        <span className={p.success ? 'text-emerald-600' : 'text-rose-500'}>
                          {p.success ? '✓ Parsed' : 'Failed'}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate">{p.markdown}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end">
                <button
                  onClick={() => setLlamaParseModal(null)}
                  className="px-4 py-1.5 bg-paytm-sky text-white rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Report Modal */}
        {verificationReportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 max-h-[85vh] flex flex-col shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-paytm-blue" />
                  <span className="font-bold text-xs text-slate-800">
                    Verification Report: {verificationReportModal.documentType?.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setVerificationReportModal(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 text-xs pr-1">
                {/* Status & Engine Badge */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Engine</span>
                    <span className="font-bold text-paytm-blue text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" /> Sarvam Document Intelligence
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Status</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      verificationReportModal.verification?.verificationStatus === 'MATCH' || verificationReportModal.verification?.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : verificationReportModal.verification?.verificationStatus === 'MISMATCH'
                        ? 'bg-rose-100 text-rose-800'
                        : verificationReportModal.verification?.verificationStatus === 'UNREADABLE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {verificationReportModal.verification?.verificationStatus || 'VERIFIED'}
                    </span>
                  </div>
                </div>

                {/* Gemini AI Explanation */}
                {verificationReportModal.verification?.aiExplanation && (
                  <div className="p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-purple-900 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-purple-600" /> AI Natural-Language Assessment
                    </div>
                    <p className="text-[11px] text-purple-950 leading-relaxed font-sans">
                      {verificationReportModal.verification.aiExplanation}
                    </p>
                  </div>
                )}

                {/* Field-by-Field Deterministic Checks */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                    Deterministic Field Comparisons
                  </span>
                  {(!verificationReportModal.verification?.fieldChecks || verificationReportModal.verification.fieldChecks.length === 0) ? (
                    <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500 text-[11px] text-center">
                      Standard credential verification passed.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {verificationReportModal.verification.fieldChecks.map((fc: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-800">{fc.fieldLabel || fc.fieldName}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              fc.status === 'MATCH' ? 'bg-emerald-100 text-emerald-800' : fc.status === 'MISMATCH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {fc.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div>
                              <span className="text-slate-400 block text-[9px]">Extracted:</span>
                              <span className="text-slate-800 font-semibold truncate block">{String(fc.extractedValue || 'N/A')}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px]">Profile Expected:</span>
                              <span className="text-slate-800 font-semibold truncate block">{String(fc.registeredValue || 'N/A')}</span>
                            </div>
                          </div>
                          {fc.remarks && (
                            <p className="text-[9px] text-slate-500 italic">{fc.remarks}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quality / Readability Checks */}
                {verificationReportModal.verification?.qualityChecks && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[10px]">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider">Quality & Legibility</span>
                    <div className="flex justify-between text-slate-600">
                      <span>OCR Confidence:</span>
                      <strong className="font-mono text-slate-800">
                        {Math.round((verificationReportModal.verification.qualityChecks.ocrConfidence || 0.95) * 100)}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Blur Detected:</span>
                      <strong className={verificationReportModal.verification.qualityChecks.blurDetected ? 'text-rose-600' : 'text-emerald-600'}>
                        {verificationReportModal.verification.qualityChecks.blurDetected ? 'Yes' : 'No'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Cross Document Consistency */}
                {verificationReportModal.crossDocument && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-[10px]">
                    <span className="font-bold text-blue-900 block uppercase tracking-wider">Cross-Document Verification</span>
                    <p className="text-blue-950 font-sans">
                      {verificationReportModal.crossDocument.summary}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex justify-end">
                <button
                  onClick={() => setVerificationReportModal(null)}
                  className="px-4 py-1.5 bg-paytm-sky text-white rounded-lg text-xs font-bold"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
};