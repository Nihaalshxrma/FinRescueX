# FinRescue X ⚡

> **"Don't Let One Problem Destroy an Entire Financial Journey."**  
> An autonomous, AI-powered KYC verification, document intelligence, and journey recovery platform for Salaried & Self-Employed credit applicants. Built for the Paytm Hackathon.

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Sarvam AI](https://img.shields.io/badge/Document%20Intelligence-Sarvam%20AI-orange)](https://www.sarvam.ai/)
[![Google Gemini](https://img.shields.io/badge/AI%20Explanations-Google%20Gemini-4285F4)](https://deepmind.google/technologies/gemini/)
[![LlamaParse](https://img.shields.io/badge/Table%20Extraction-LlamaParse%20v2-purple)](https://cloud.llamaindex.ai/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Important Hackathon Prototype Boundaries
* **Simulated integrations:** Bureau inquiries (CIBIL), Aadhaar/CKYC verification, penny-drop bank verification, and partner underwriting queues are simulated demo integrations.
* **Non-AI-alone decisioning:** Deterministic backend rules govern identity verification; AI is used for structured extraction and natural-language explanations.
* **Prototype disclaimer:** FinRescue X is an independent hackathon prototype.

---

## 🚀 Key Features

### 1. 📄 AI Document Intelligence & Deterministic Verification
* **Sarvam AI Extract API:** Deep field extraction for PAN cards, Aadhaar, Bank Statements, Salary Slips, Form 16/ITR, GST Certificates, and Udyam Registrations.
* **Preflight Integrity Shield:** Runs local byte and header inspections via `pdf-lib` to instantly catch password-protected, corrupted, or low-resolution files before AI extraction.
* **Deterministic Matching Engine:** Field-by-field verification (Name, PAN format, Bank Account numbers, DOB, GSTIN) against the registered applicant profile.
* **Single-Page Replacement:** If only 1 page of a 4-page statement is blurry, users can replace just that single page while valid pages remain intact.
* **Underwriter Decision States:** `MATCH`, `MISMATCH`, `UNREADABLE`, `MANUAL_REVIEW`, `VERIFIED`, and `REUPLOAD_REQUIRED`.

### 2. 🔍 Cross-Document Consistency Engine
Validates consistency across multiple uploaded documents to prevent fraud without auto-rejecting legitimate variations:
1. **PAN Name vs Aadhaar Name**
2. **PAN Name vs Bank Account Holder Name**
3. **PAN DOB vs Aadhaar DOB / Registration DOB**
4. **Salary Slip Net Pay vs Bank Statement Salary Credits**
5. **GST Legal Name vs Business Bank Account Name**
6. **Udyam Enterprise Name vs GST Trade Name**
7. **PAN embedded inside GSTIN (chars 3–12)**
8. **Turnover & Cash Flow Reconciliation**

### 3. 🎙️ Multilingual Sovereign Voice Assistant ("Merchant Care")
* Powered by **Sarvam AI 105B Conversations**, **Bulbul v3 TTS**, and **Saaras v4 STT**.
* Converses natively across **8 Indic languages**: Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, and English.
* Explains reducing balance EMI vs daily settlement deductions, APR, and step-by-step document recovery.

### 4. 📱 Mobile-First Smartphone Interface
* Paytm-inspired mobile viewport (~390px) with clean card-based design and smooth step transitions.
* **Dual Loan Tracks:**
  - **Salaried Personal Loan Track:** Monthly salary slips, salary account statement, net take-home salary verification.
  - **Self-Employed / Merchant Loan Track:** Business vintage, GSTIN/Udyam proof, operative bank statements, cash-flow checks.

### 5. 🛡️ Underwriting Checklist & Instant Alert System
* 100-point underwriting score (CIBIL bureau score, FOIR/affordability, document preflight integrity, banking health).
* Instantly triggers alert events upon credential mismatches and feeds root causes into the AI Recovery Assistant.

### 6. 📊 Paytm Partner Intelligence Operations Cockpit (`/admin`)
* **Document Verification Queue:** Review extracted entities, OCR confidence scores, and cross-document discrepancy reports.
* **Underwriter Adjudication:** 1-click **Officially Verify**, **Reject**, or **Request Re-upload**.
* **What-If Loan Simulator:** Interactive tenure and principal slider recalculating approval odds in real-time.
* **Funnel & Friction Diagnostics:** Visual breakdown of applicant drop-offs, partner API SLA monitor, and audit logs.

---

## 🛠️ Architecture & Tech Stack

```
FinRescueX/
├── client/                     # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # MobileShell, MerchantCareDrawer, etc.
│   │   ├── pages/              # LoanWizardPage, AdminDashboardPage, etc.
│   │   └── shared/             # Loan calculator & shared types
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── routes/             # documents, admin, auth, agent, loans, etc.
│   │   ├── services/           # sarvamDocIntelligence, documentVerification,
│   │   │                       # crossDocumentVerification, geminiExplanation,
│   │   │                       # llamaParseService, underwritingChecklist
│   │   ├── database.ts         # In-memory JSON database with file persistence
│   │   └── seed.ts             # Rich seed dataset (12 diverse loan applicants)
```

* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Axios
* **Backend:** Node.js, Express, TypeScript, Multer, `pdf-lib`, JWT, `uuid`
* **AI & Document Intelligence:**
  - **Sarvam AI SDK (`sarvamai`):** Document Intelligence Extract, Sarvam 105B LLM, Bulbul v3 TTS, Saaras v4 STT
  - **Google Gemini SDK (`@google/genai`):** Plain-language discrepancy explanations & advisory
  - **LlamaParse v2:** Deep table extraction for complex multi-page financial statements
* **Database:** File-persisted in-memory document store (`server/data/db.json`) with zero external database dependencies.

---

## ⚡ Quick Start & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Nihaalshxrma/FinRescueX.git
cd FinRescueX
```

### 2. Install dependencies
```bash
# Install root, client, and server dependencies
npm run install:all
```

### 3. Configure Environment Variables
Create a `server/.env` file (refer to `server/.env.example`):
```env
PORT=5005
JWT_SECRET=finrescue-x-demo-secret-key-2026
SARVAM_API_KEY=your_sarvam_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
LLAMA_PARSE_API_KEY=your_llamaparse_api_key_here
```

### 4. Run the Development Servers
```bash
# Terminal 1: Start Backend (Port 5005)
cd server
npm run dev

# Terminal 2: Start Mobile Client (Port 3000)
cd client
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Accounts & Test Credentials

| Role | Mobile Number | OTP | Direct URL |
| :--- | :--- | :--- | :--- |
| **Merchant Applicant (Rahul Sharma)** | `9876543210` | `123456` | `http://localhost:3000/app` |
| **Salaried Applicant (Ananya Deshmukh)** | `9822011223` | `123456` | `http://localhost:3000/app` |
| **Credit Underwriter / Admin** | `9999999999` | `123456` | `http://localhost:3000/admin` |

---

## 🧪 Running Automated Tests
```bash
# Run the end-to-end KYC and verification test suite:
node test_kyc_system.js
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
