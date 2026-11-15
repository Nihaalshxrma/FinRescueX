// FinRescue X — Complete Rich Seed Data for Salaried & Self-Employed Personal Loans
import bcryptjs from 'bcryptjs';
import { DB } from './database';
import { UnderwritingChecklistService } from './services/underwritingChecklist';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

const defaultPasswordHash = bcryptjs.hashSync('demo123', 10);
const adminPasswordHash = bcryptjs.hashSync('admin123', 10);

export function createSeedData(): DB {
  // Pre-seed 12 diverse personal loan applications across Salaried and Self-Employed categories
  const rawApplications: any[] = [
    // 1. Rahul Sharma (Self-Employed — Active Demo User FNX-DEMO-1001)
    {
      id: 'FNX-DEMO-1001',
      merchantId: 'merchant-1',
      applicantCategory: 'SELF_EMPLOYED',
      stage: 'STAGE_5_DOCUMENTS',
      status: 'DOCUMENT_ERROR',
      requestedAmountINR: 100000,
      loanPurpose: 'Business Equipment & Stock Expansion',
      requiredTenureMonths: 12,
      cibilScore: 752,
      personalDetails: {
        fullName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        email: 'rahul.sharma@email.com',
        dateOfBirth: '1988-05-15',
        panNumber: 'AXXPS1234C',
        address: '45 Market Road, Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038'
      },
      selfEmployedDetails: {
        businessName: 'Sharma General Stores',
        entityType: 'Proprietorship',
        businessVintageYears: 4,
        annualNetProfitINR: 650000,
        avgMonthlyBankCreditsINR: 320000,
        existingBusinessAndPersonalEmisINR: 4500,
        gstRegistered: true,
        gstNumber: '27AXXPS1234C1Z5',
        udyamRegistered: true,
        udyamNumber: 'UDYAM-MH-01-0012345',
        recentBouncesCount: 0
      },
      bankDetails: {
        accountHolderName: 'Rahul Sharma',
        bankName: 'State Bank of India',
        accountNumber: '38291023456',
        maskedAccountNumber: 'XXXXXXX3456',
        ifscCode: 'SBIN0005943',
        accountType: 'CURRENT',
        pennyDropStatus: 'VERIFIED',
        verificationTimestamp: daysAgo(4),
        referenceId: 'PD-SIM-1001'
      },
      documents: [
        {
          id: 'doc-001',
          applicationId: 'FNX-DEMO-1001',
          documentType: 'PAN_CARD',
          originalFilename: 'sample_pan_card.svg',
          filePath: '/samples/sample_pan_card.svg',
          mimeType: 'image/svg+xml',
          fileSizeKB: 245,
          uploadedAt: daysAgo(4),
          isRequired: true,
          isReplaced: false,
          replacedPages: [],
          preflightReport: {
            id: 'pf-001', documentId: 'doc-001', filename: 'sample_pan_card.svg', mimeType: 'image/svg+xml', fileSizeKB: 245, isPdf: false, pageCount: 1, isPasswordProtected: false, isCorrupted: false, hasEmptyPages: false, emptyPageNumbers: [], rotationNeededPages: [], inconsistentDimensions: false, status: 'READY_FOR_VERIFICATION', statusMessage: 'PAN Card verified via Preflight', reasons: [], safeForOcr: true, timestamp: daysAgo(4)
          },
          validationReport: {
            id: 'vr-001', documentId: 'doc-001', documentType: 'PAN_CARD', overallStatus: 'PASSED', pageReports: [{ pageNumber: 1, textExtracted: 'INCOME TAX DEPT... PAN: AXXPS1234C', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.98 }], totalExpectedPages: 1, validPagesCount: 1, invalidPagesCount: 0, timestamp: daysAgo(4)
          }
        },
        {
          id: 'doc-002',
          applicationId: 'FNX-DEMO-1001',
          documentType: 'BANK_STATEMENT',
          originalFilename: 'sample_bank_statement.pdf',
          filePath: '/samples/sample_bank_statement.pdf',
          mimeType: 'application/pdf',
          fileSizeKB: 1200,
          uploadedAt: daysAgo(3),
          isRequired: true,
          isReplaced: false,
          replacedPages: [],
          preflightReport: {
            id: 'pf-002', documentId: 'doc-002', filename: 'sample_bank_statement.pdf', mimeType: 'application/pdf', fileSizeKB: 1200, isPdf: true, pageCount: 4, isPasswordProtected: false, isCorrupted: false, hasEmptyPages: false, emptyPageNumbers: [], rotationNeededPages: [], inconsistentDimensions: false, status: 'READY_WITH_WARNINGS', statusMessage: 'Page 2 contains low-clarity / blurry text', reasons: ['Page 2 unreadable for automated OCR'], safeForOcr: true, timestamp: daysAgo(3)
          },
          validationReport: {
            id: 'vr-002', documentId: 'doc-002', documentType: 'BANK_STATEMENT', overallStatus: 'PARTIAL_REPLACEMENT_NEEDED', pageReports: [
              { pageNumber: 1, textExtracted: 'SBI Bank Statement Page 1', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.95 },
              { pageNumber: 2, textExtracted: '', readability: 'Poor text', quality: 'Blurry', status: 'Needs replacement', issues: ['Blur detected on line 42'], confidence: 0.22 },
              { pageNumber: 3, textExtracted: 'SBI Bank Statement Page 3', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.93 },
              { pageNumber: 4, textExtracted: 'SBI Bank Statement Page 4', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.94 }
            ], totalExpectedPages: 4, validPagesCount: 3, invalidPagesCount: 1, timestamp: daysAgo(3)
          }
        }
      ],
      createdAt: daysAgo(5),
      updatedAt: hoursAgo(2)
    },

    // 2. Ananya Deshmukh (Salaried — Shortlist Recommended 92/100)
    {
      id: 'FNX-SAL-1002',
      merchantId: 'user-ananya-1',
      applicantCategory: 'SALARIED',
      stage: 'STAGE_8_FINAL_REVIEW',
      status: 'OFFERS_AVAILABLE',
      requestedAmountINR: 300000,
      loanPurpose: 'Home Interior Renovation',
      requiredTenureMonths: 24,
      cibilScore: 782,
      personalDetails: {
        fullName: 'Ananya Deshmukh',
        mobileNumber: '9822011223',
        email: 'ananya.deshmukh@techcorp.example',
        dateOfBirth: '1993-04-12',
        panNumber: 'ADEPD4455M',
        address: 'Flat 602, Amanora Park Town, Hadapsar',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411028'
      },
      salariedDetails: {
        employerName: 'Infosys Limited',
        employerCategory: 'MNC',
        currentJobTenureMonths: 28,
        totalWorkExperienceYears: 6.5,
        netMonthlySalaryINR: 85000,
        existingMonthlyEmisINR: 9000,
        salaryMode: 'BANK_TRANSFER'
      },
      bankDetails: {
        accountHolderName: 'Ananya Deshmukh',
        bankName: 'HDFC Bank',
        accountNumber: '501004558901',
        maskedAccountNumber: 'XXXXXXX8901',
        ifscCode: 'HDFC0000052',
        accountType: 'SAVINGS',
        pennyDropStatus: 'VERIFIED',
        verificationTimestamp: daysAgo(2),
        referenceId: 'PD-SIM-1002'
      },
      documents: [],
      createdAt: daysAgo(3),
      updatedAt: hoursAgo(3)
    },

    // 3. Vikram Mehta (Salaried — Recovery + Counter-Offer Case 66/100)
    {
      id: 'FNX-SAL-1003',
      merchantId: 'user-vikram-1',
      applicantCategory: 'SALARIED',
      stage: 'STAGE_5_DOCUMENTS',
      status: 'DOCUMENT_ERROR',
      requestedAmountINR: 400000,
      loanPurpose: 'Family Medical Emergency',
      requiredTenureMonths: 18,
      cibilScore: 708,
      personalDetails: {
        fullName: 'Vikram Mehta',
        mobileNumber: '9811223344',
        email: 'vikram.mehta@saleshub.example',
        dateOfBirth: '1990-11-25',
        panNumber: 'VMXPM3322K',
        address: 'B-12, Sector 18, Vashi',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        pincode: '400703'
      },
      salariedDetails: {
        employerName: 'Apex Logistics Pvt Ltd',
        employerCategory: 'Pvt Ltd',
        currentJobTenureMonths: 8,
        totalWorkExperienceYears: 3,
        netMonthlySalaryINR: 32000,
        existingMonthlyEmisINR: 4500,
        salaryMode: 'BANK_TRANSFER'
      },
      bankDetails: {
        accountHolderName: 'Vikram Mehta',
        bankName: 'ICICI Bank',
        accountNumber: '001201569834',
        maskedAccountNumber: 'XXXXXXX9834',
        ifscCode: 'ICIC0000012',
        accountType: 'SAVINGS',
        pennyDropStatus: 'VERIFIED',
        verificationTimestamp: daysAgo(3),
        referenceId: 'PD-SIM-1003'
      },
      documents: [],
      createdAt: daysAgo(4),
      updatedAt: hoursAgo(5)
    },

    // 4. Suresh Kulkarni (Self-Employed — Not Shortlisted High Risk 38/100)
    {
      id: 'FNX-SE-1004',
      merchantId: 'user-suresh-1',
      applicantCategory: 'SELF_EMPLOYED',
      stage: 'STAGE_4_BANK_DETAILS',
      status: 'DRAFT',
      requestedAmountINR: 350000,
      loanPurpose: 'Debt Consolidation',
      requiredTenureMonths: 12,
      cibilScore: 642,
      personalDetails: {
        fullName: 'Suresh Kulkarni',
        mobileNumber: '9765432109',
        email: 'suresh.kulkarni@freelance.example',
        dateOfBirth: '1996-02-18',
        panNumber: 'SKPPK8899L',
        address: 'Shop 4, Shivaji Chowk',
        city: 'Kolhapur',
        state: 'Maharashtra',
        pincode: '416002'
      },
      selfEmployedDetails: {
        businessName: 'Kulkarni Digital Services',
        entityType: 'Freelancer-Professional',
        businessVintageYears: 0.8,
        annualNetProfitINR: 220000,
        avgMonthlyBankCreditsINR: 45000,
        existingBusinessAndPersonalEmisINR: 12000,
        gstRegistered: false,
        udyamRegistered: false,
        recentBouncesCount: 2
      },
      documents: [],
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(8)
    },

    // 5. Tanvi Joshi (Salaried — Shortlist Recommended 88/100)
    {
      id: 'FNX-SAL-1005',
      merchantId: 'user-tanvi-1',
      applicantCategory: 'SALARIED',
      stage: 'STAGE_9_SUBMITTED',
      status: 'PARTNER_ACKNOWLEDGED',
      requestedAmountINR: 250000,
      loanPurpose: 'Higher Education Course',
      requiredTenureMonths: 18,
      cibilScore: 765,
      personalDetails: {
        fullName: 'Tanvi Joshi',
        mobileNumber: '9845012345',
        email: 'tanvi.joshi@bankcorp.example',
        dateOfBirth: '1994-08-30',
        panNumber: 'TJXPT1234F',
        address: '5th Main, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038'
      },
      salariedDetails: {
        employerName: 'Standard Chartered Global',
        employerCategory: 'MNC',
        currentJobTenureMonths: 36,
        totalWorkExperienceYears: 5.5,
        netMonthlySalaryINR: 72000,
        existingMonthlyEmisINR: 6000,
        salaryMode: 'BANK_TRANSFER'
      },
      documents: [],
      partnerAcknowledgement: {
        ackId: 'ACK-PIRAMAL-9921',
        partnerName: 'Piramal Consumer Finance',
        submittedAt: daysAgo(1),
        expectedSlaHours: 12,
        status: 'UNDER_REVIEW'
      },
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1)
    },

    // 6. Rajeshwar Patel (Self-Employed — Shortlist Recommended 84/100)
    {
      id: 'FNX-SE-1006',
      merchantId: 'user-rajesh-1',
      applicantCategory: 'SELF_EMPLOYED',
      stage: 'STAGE_7_KYC_VERIFICATION',
      status: 'KYC_PENDING',
      requestedAmountINR: 500000,
      loanPurpose: 'Inventory Procurement',
      requiredTenureMonths: 24,
      cibilScore: 758,
      personalDetails: {
        fullName: 'Rajeshwar Patel',
        mobileNumber: '9825019876',
        email: 'rajesh.patel@hardware.example',
        dateOfBirth: '1984-01-14',
        panNumber: 'RPXPP5544N',
        address: '14 GIDC Estate, Vatva',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '382445'
      },
      selfEmployedDetails: {
        businessName: 'Patel Hardware & Electricals',
        entityType: 'Partnership',
        businessVintageYears: 7,
        annualNetProfitINR: 1100000,
        avgMonthlyBankCreditsINR: 850000,
        existingBusinessAndPersonalEmisINR: 16000,
        gstRegistered: true,
        gstNumber: '24RPXPP5544N1Z2',
        udyamRegistered: true,
        udyamNumber: 'UDYAM-GJ-01-0098765',
        recentBouncesCount: 0
      },
      documents: [],
      createdAt: daysAgo(6),
      updatedAt: hoursAgo(10)
    },

    // 7. Pooja Sengupta (Salaried — Manual Review 68/100 — Tier-2 Salary)
    {
      id: 'FNX-SAL-1007',
      merchantId: 'user-pooja-1',
      applicantCategory: 'SALARIED',
      stage: 'STAGE_5_DOCUMENTS',
      status: 'DOCUMENTS_PENDING',
      requestedAmountINR: 150000,
      loanPurpose: 'Wedding Expenses',
      requiredTenureMonths: 12,
      cibilScore: 722,
      personalDetails: {
        fullName: 'Pooja Sengupta',
        mobileNumber: '9830098765',
        email: 'pooja.sengupta@kolkata.example',
        dateOfBirth: '1997-07-22',
        panNumber: 'PSXPS8877P',
        address: 'Salt Lake Sector V',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091'
      },
      salariedDetails: {
        employerName: 'Eastern Tech Solutions',
        employerCategory: 'Startup',
        currentJobTenureMonths: 11,
        totalWorkExperienceYears: 2.5,
        netMonthlySalaryINR: 23000,
        existingMonthlyEmisINR: 2000,
        salaryMode: 'BANK_TRANSFER'
      },
      documents: [],
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(1)
    },

    // 8. Amit Bansal (Self-Employed — Manual Review 62/100 — High FOIR)
    {
      id: 'FNX-SE-1008',
      merchantId: 'user-amit-1',
      applicantCategory: 'SELF_EMPLOYED',
      stage: 'STAGE_6_OFFER_SELECTION',
      status: 'OFFERS_AVAILABLE',
      requestedAmountINR: 400000,
      loanPurpose: 'Office Setup',
      requiredTenureMonths: 12,
      cibilScore: 715,
      personalDetails: {
        fullName: 'Amit Bansal',
        mobileNumber: '9810012398',
        email: 'amit.bansal@ca.example',
        dateOfBirth: '1989-10-10',
        panNumber: 'ABXPB9988Q',
        address: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      selfEmployedDetails: {
        businessName: 'Bansal Financial Consulting',
        entityType: 'Proprietorship',
        businessVintageYears: 3.5,
        annualNetProfitINR: 480000,
        avgMonthlyBankCreditsINR: 190000,
        existingBusinessAndPersonalEmisINR: 11000,
        gstRegistered: true,
        gstNumber: '07ABXPB9988Q1Z1',
        udyamRegistered: true,
        udyamNumber: 'UDYAM-DL-01-0044556',
        recentBouncesCount: 0
      },
      documents: [],
      createdAt: daysAgo(4),
      updatedAt: hoursAgo(6)
    },

    // 9. Neha Sharma (Salaried — Shortlist Recommended 94/100)
    {
      id: 'FNX-SAL-1009',
      merchantId: 'user-neha-1',
      applicantCategory: 'SALARIED',
      stage: 'STAGE_8_FINAL_REVIEW',
      status: 'READY_FOR_SUBMISSION',
      requestedAmountINR: 500000,
      loanPurpose: 'Medical Procedure & Travel',
      requiredTenureMonths: 36,
      cibilScore: 795,
      personalDetails: {
        fullName: 'Neha Sharma',
        mobileNumber: '9988776655',
        email: 'neha.sharma@tcs.example',
        dateOfBirth: '1991-03-19',
        panNumber: 'NSXPS6655R',
        address: 'Hiranandani Gardens, Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400076'
      },
      salariedDetails: {
        employerName: 'Tata Consultancy Services',
        employerCategory: 'MNC',
        currentJobTenureMonths: 42,
        totalWorkExperienceYears: 8,
        netMonthlySalaryINR: 110000,
        existingMonthlyEmisINR: 12000,
        salaryMode: 'BANK_TRANSFER'
      },
      documents: [],
      createdAt: daysAgo(5),
      updatedAt: hoursAgo(2)
    },

    // 10. Deepak Verma (Self-Employed — High Risk Not Shortlisted 42/100)
    {
      id: 'FNX-SE-1010',
      merchantId: 'user-deepak-1',
      applicantCategory: 'SELF_EMPLOYED',
      stage: 'STAGE_5_DOCUMENTS',
      status: 'DOCUMENT_ERROR',
      requestedAmountINR: 600000,
      loanPurpose: 'Business Expansion',
      requiredTenureMonths: 18,
      cibilScore: 660,
      personalDetails: {
        fullName: 'Deepak Verma',
        mobileNumber: '9876549999',
        email: 'deepak.verma@trading.example',
        dateOfBirth: '1987-12-05',
        panNumber: 'DVXPV7766T',
        address: 'Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302006'
      },
      selfEmployedDetails: {
        businessName: 'Verma Textile Traders',
        entityType: 'Proprietorship',
        businessVintageYears: 2,
        annualNetProfitINR: 320000,
        avgMonthlyBankCreditsINR: 140000,
        existingBusinessAndPersonalEmisINR: 15000,
        gstRegistered: false,
        udyamRegistered: false,
        recentBouncesCount: 1
      },
      documents: [],
      createdAt: daysAgo(7),
      updatedAt: hoursAgo(12)
    },

    // 11. Karthik Raman (Salaried — Shortlist Recommended 82/100)
    {
      id: 'FNX-SAL-1011',
      merchantId: 'user-karthik-1',
      applicantCategory: 'SALARIED',
      stage: 'STAGE_7_KYC_VERIFICATION',
      status: 'KYC_PENDING',
      requestedAmountINR: 180000,
      loanPurpose: 'Home Appliances Purchase',
      requiredTenureMonths: 12,
      cibilScore: 748,
      personalDetails: {
        fullName: 'Karthik Raman',
        mobileNumber: '9840123456',
        email: 'karthik.raman@chennai.example',
        dateOfBirth: '1995-06-11',
        panNumber: 'KRXPR3344U',
        address: 'OMR Road, Thoraipakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600097'
      },
      salariedDetails: {
        employerName: 'Zoho Corporation',
        employerCategory: 'Pvt Ltd',
        currentJobTenureMonths: 18,
        totalWorkExperienceYears: 4,
        netMonthlySalaryINR: 58000,
        existingMonthlyEmisINR: 7500,
        salaryMode: 'BANK_TRANSFER'
      },
      documents: [],
      createdAt: daysAgo(3),
      updatedAt: hoursAgo(4)
    },

    // 12. Manoj Yadav (Self-Employed — Shortlist Recommended 79/100)
    {
      id: 'FNX-SE-1012',
      merchantId: 'user-manoj-1',
      applicantCategory: 'SELF_EMPLOYED',
      stage: 'STAGE_6_OFFER_SELECTION',
      status: 'OFFERS_AVAILABLE',
      requestedAmountINR: 200000,
      loanPurpose: 'Shop Renovation',
      requiredTenureMonths: 12,
      cibilScore: 742,
      personalDetails: {
        fullName: 'Manoj Yadav',
        mobileNumber: '9911223388',
        email: 'manoj.yadav@dairy.example',
        dateOfBirth: '1986-09-09',
        panNumber: 'MYXPY2211W',
        address: 'Vikas Nagar',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226022'
      },
      selfEmployedDetails: {
        businessName: 'Yadav Dairy & Agro Products',
        entityType: 'Proprietorship',
        businessVintageYears: 5,
        annualNetProfitINR: 520000,
        avgMonthlyBankCreditsINR: 280000,
        existingBusinessAndPersonalEmisINR: 4000,
        gstRegistered: true,
        gstNumber: '09MYXPY2211W1Z0',
        udyamRegistered: true,
        udyamNumber: 'UDYAM-UP-01-0088990',
        recentBouncesCount: 0
      },
      documents: [],
      createdAt: daysAgo(5),
      updatedAt: hoursAgo(7)
    }
  ];

  // Run each raw application through UnderwritingChecklistService to generate genuine checklists and shortlisting predictions
  const applications = rawApplications.map((app) => {
    const prediction = UnderwritingChecklistService.evaluateApplication(app);
    return {
      ...app,
      shortlistingPrediction: prediction
    };
  });

  return {
    users: [
      { id: 'user-merchant-1', mobile: '9876543210', name: 'Rahul Sharma', role: 'merchant', merchantId: 'merchant-1', passwordHash: defaultPasswordHash, otp: '123456', otpExpiry: new Date(Date.now() + 3600000).toISOString(), createdAt: daysAgo(90) },
      { id: 'user-ananya-1', mobile: '9822011223', name: 'Ananya Deshmukh', role: 'normal_user', merchantId: null, passwordHash: defaultPasswordHash, otp: '123456', otpExpiry: new Date(Date.now() + 3600000).toISOString(), createdAt: daysAgo(45) },
      { id: 'user-admin-1', mobile: '9999999999', name: 'Lender Credit Underwriter', role: 'admin', passwordHash: adminPasswordHash, otp: '123456', otpExpiry: new Date(Date.now() + 3600000).toISOString(), createdAt: daysAgo(180) },
      { id: 'user-support-1', mobile: '9999999998', name: 'Support Copilot Agent', role: 'support_agent', passwordHash: defaultPasswordHash, otp: '123456', otpExpiry: new Date(Date.now() + 3600000).toISOString(), createdAt: daysAgo(120) },
    ],
    merchants: [],
    applications,
    applicationEvents: [
      { id: 'evt-001', applicationId: 'FNX-DEMO-1001', type: 'APPLICATION_CREATED', description: 'Self-employed personal loan journey started', timestamp: daysAgo(5), actor: 'Rahul Sharma' },
      { id: 'evt-002', applicationId: 'FNX-DEMO-1001', type: 'DOCUMENT_VALIDATION_FAILED', description: 'Bank statement page 2 has low clarity / blurry OCR', timestamp: daysAgo(3), actor: 'system', metadata: { page: 2, issue: 'Blurry' } },
      { id: 'evt-003', applicationId: 'FNX-SAL-1002', type: 'APPLICATION_CREATED', description: 'Salaried personal loan journey started', timestamp: daysAgo(3), actor: 'Ananya Deshmukh' },
      { id: 'evt-004', applicationId: 'FNX-SAL-1002', type: 'CHECKLIST_EVALUATED', description: 'Salaried checklist evaluated: 92/100 (SHORTLIST_RECOMMENDED)', timestamp: daysAgo(2), actor: 'system' }
    ],
    documents: [
      {
        id: 'doc-001',
        applicationId: 'FNX-DEMO-1001',
        documentType: 'PAN_CARD',
        originalFilename: 'sample_pan_card.svg',
        filePath: '/samples/sample_pan_card.svg',
        mimeType: 'image/svg+xml',
        fileSizeKB: 245,
        uploadedAt: daysAgo(4),
        isRequired: true,
        isReplaced: false,
        replacedPages: [],
        preflightReport: {
          id: 'pf-001', documentId: 'doc-001', filename: 'sample_pan_card.svg', mimeType: 'image/svg+xml', fileSizeKB: 245, isPdf: false, pageCount: 1, isPasswordProtected: false, isCorrupted: false, hasEmptyPages: false, emptyPageNumbers: [], rotationNeededPages: [], inconsistentDimensions: false, status: 'READY_FOR_VERIFICATION', statusMessage: 'PAN Card verified via Preflight', reasons: [], safeForOcr: true, timestamp: daysAgo(4)
        },
        validationReport: {
          id: 'vr-001', documentId: 'doc-001', documentType: 'PAN_CARD', overallStatus: 'PASSED', pageReports: [{ pageNumber: 1, textExtracted: 'INCOME TAX DEPT... PAN: AXXPS1234C', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.98 }], totalExpectedPages: 1, validPagesCount: 1, invalidPagesCount: 0, timestamp: daysAgo(4)
        }
      },
      {
        id: 'doc-002',
        applicationId: 'FNX-DEMO-1001',
        documentType: 'BANK_STATEMENT',
        originalFilename: 'sample_bank_statement.pdf',
        filePath: '/samples/sample_bank_statement.pdf',
        mimeType: 'application/pdf',
        fileSizeKB: 1200,
        uploadedAt: daysAgo(3),
        isRequired: true,
        isReplaced: false,
        replacedPages: [],
        preflightReport: {
          id: 'pf-002', documentId: 'doc-002', filename: 'sample_bank_statement.pdf', mimeType: 'application/pdf', fileSizeKB: 1200, isPdf: true, pageCount: 4, isPasswordProtected: false, isCorrupted: false, hasEmptyPages: false, emptyPageNumbers: [], rotationNeededPages: [], inconsistentDimensions: false, status: 'READY_WITH_WARNINGS', statusMessage: 'Page 2 contains low-clarity / blurry text', reasons: ['Page 2 unreadable for automated OCR'], safeForOcr: true, timestamp: daysAgo(3)
        },
        validationReport: {
          id: 'vr-002', documentId: 'doc-002', documentType: 'BANK_STATEMENT', overallStatus: 'FAILED', pageReports: [
            { pageNumber: 1, textExtracted: 'Clean statement header, account 1234567890', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.97 },
            { pageNumber: 2, textExtracted: '??? blurred ink ??? unreadable values', readability: 'Unreadable', quality: 'Blurry', status: 'Needs replacement', issues: ['Low resolution', 'Motion blur'], confidence: 0.32 },
            { pageNumber: 3, textExtracted: 'Clean transactions list, salary credits visible', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.95 },
            { pageNumber: 4, textExtracted: 'Closing balance statement clean', readability: 'Readable', quality: 'Good', status: 'Passed', issues: [], confidence: 0.98 }
          ], totalExpectedPages: 4, validPagesCount: 3, invalidPagesCount: 1, timestamp: daysAgo(3)
        }
      }
    ],
    preflightReports: [],
    validationReports: [],
    loanOffers: [
      {
        id: 'offer-1', applicationId: 'FNX-DEMO-1001', lenderId: 'lender-a', lenderName: 'Piramal Finance (Consumer Personal Loans)',
        amountINR: 100000, annualRoiPercentage: 14.5, aprPercentage: 15.8,
        tenureMonths: 12, repaymentFrequency: 'MONTHLY',
        processingFeeINR: 1500, gstOnProcessingFeeINR: 270, insuranceChargesINR: 0,
        netDisbursalAmountINR: 98230, totalRepaymentINR: 108120, instalmentAmountINR: 9010,
        totalInstallments: 12,
        prepaymentForeclosureTerms: 'Prepayment allowed after 3 months with 0 penalty.',
        latePaymentCharges: '₹250 per bounce.',
        coolingOffDays: 3,
        grievanceRedressalOfficer: { name: 'Piramal Redressal Officer', email: 'grievance@piramal.example', phone: '1800-FIN-RESCUE' },
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString()
      },
      {
        id: 'offer-2', applicationId: 'FNX-SAL-1002', lenderId: 'lender-abfl', lenderName: 'Aditya Birla Finance Partner',
        amountINR: 300000, annualRoiPercentage: 13.0, aprPercentage: 14.2,
        tenureMonths: 24, repaymentFrequency: 'MONTHLY',
        processingFeeINR: 4500, gstOnProcessingFeeINR: 810, insuranceChargesINR: 500,
        netDisbursalAmountINR: 294190, totalRepaymentINR: 342600, instalmentAmountINR: 14275,
        totalInstallments: 24,
        prepaymentForeclosureTerms: 'Foreclosure free after 6 months.',
        latePaymentCharges: '2% per month on overdue EMI.',
        coolingOffDays: 3,
        grievanceRedressalOfficer: { name: 'Support Redressal Desk', email: 'support@abfl.example', phone: '1800-FIN-RESCUE' },
        expiresAt: new Date(Date.now() + 10 * 86400000).toISOString()
      }
    ],
    kycSessions: [
      { id: 'kyc-1001', applicationId: 'FNX-DEMO-1001', panVerified: true, panNameMatched: true, ckycFetched: true, aadhaarOtpVerified: true, selfieUploaded: true, livenessScore: 98.4, faceMatchScore: 96.2, status: 'VERIFIED_DEMO', completedAt: daysAgo(3) }
    ],
    bankVerifications: [],
    consents: [],
    activeLoans: [
      {
        id: 'FNX-LOAN-8801', merchantId: 'merchant-1', lenderName: 'Piramal Finance Personal Loan',
        originalPrincipalINR: 75000, currentOutstandingINR: 38500, totalRepaidINR: 36500,
        annualRoiPercentage: 14.0, tenureTotal: 12, remainingInstallments: 6,
        repaymentFrequency: 'MONTHLY', installmentAmountINR: 6730, nextDueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        totalOverdueINR: 0, overdueInstallmentCount: 0, status: 'ACTIVE_HEALTHY',
        disbursedAt: daysAgo(180)
      }
    ],
    repaymentTransactions: [],
    recoveryActions: [],
    rootCauseReports: [],
    supportTickets: [],
    callbackRequests: [],
    chatMessages: [],
    partners: [
      { id: 'lender-a', name: 'Piramal Consumer Finance Partner', type: 'NBFC', status: 'ACTIVE', apiEndpoint: 'https://api.piramal.example/v1', avgLatencyMs: 340, successRate: 98.8, lastChecked: hoursAgo(1) },
      { id: 'lender-abfl', name: 'Aditya Birla Finance Personal Loans', type: 'NBFC', status: 'ACTIVE', apiEndpoint: 'https://api.abfl.example/v1', avgLatencyMs: 290, successRate: 99.4, lastChecked: hoursAgo(1) },
      { id: 'lender-tata', name: 'Tata Capital Consumer Finance', type: 'NBFC', status: 'ACTIVE', apiEndpoint: 'https://api.tatacapital.example/v1', avgLatencyMs: 410, successRate: 97.9, lastChecked: hoursAgo(2) },
    ],
    partnerTelemetry: [],
    experimentAssignments: [],
    recoveryExperiments: [],
    auditLogs: [],
    documentVerifications: [],
    documentExtractions: [],
    crossDocumentVerifications: [],
  };
}
