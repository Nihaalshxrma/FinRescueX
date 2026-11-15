# FinRescue X
> **"Don't Let One Problem Destroy an Entire Financial Journey."**

AI-Powered Merchant Loan Application, Recovery & Partner Intelligence Platform built for the Paytm Hackathon.

---

## 📌 Important Hackathon Prototype Boundaries
* **FinRescue X is not a lender.** It does not approve, reject, or underwrite credit.
* **Simulated integrations:** Lending partner handoffs, bureau enquiries, Aadhaar/CKYC verification, penny-drop bank verification, and daily collection settlement deductions are synthetic simulations for demonstration.
* **Prototype disclaimer:** FinRescue X is an independent hackathon prototype, not an official Paytm application.

---

## 🚀 Key Features

1. **Mobile-First Smartphone Shell**
   - Centered ~390px mobile viewport on desktop with device framing, fixed headers and bottom navigation.
   - Paytm-inspired Indian fintech theme (deep blue `#002E6E`, sky blue `#00BAF2`, dark navy text, clean white cards).

2. **Merchant Home Screen (Controlled Interaction Pattern)**
   - Only the **Business Loans** service tile is clickable among home services.
   - Other tiles (Scan & Pay, UPI, Balance, Passbook, QR, Settlements) are visible with demo disabled styling.

3. **Multi-Step Merchant Business-Loan Application**
   - **Stage 1:** Loan Requirement & Purpose selector (stock, expansion, working capital).
   - **Stage 2:** Personal Details with PAN masking and sensitive data explanations.
   - **Stage 3:** Business Details (vintage, turnover, GSTIN, Udyam).
   - **Stage 4:** Disbursement Bank Account with simulated penny-drop verification.
   - **Stage 5:** Intelligent Document Centre with single-page replacement and sample previews.
   - **Stage 6:** Offer Discovery & Key Fact Statement (KFS) comparison (Monthly vs Daily QR settlement deductions).
   - **Stage 7:** Simulated KYC (PAN, CKYC, Aadhaar OTP, 98.4% liveness selfie check).
   - **Stage 8:** Final Review & explicit partner submission handoff.

4. **Intelligent Document Assistant & Mandatory PDF Preflight**
   - Operates **BEFORE** OCR.
   - Checks file signatures/magic bytes, PDF header corruption, password encryption, empty pages, and low resolution.
   - Rejects corrupted/locked documents before expensive processing.
   - **Single-Page Replacement:** When page 2 of a 4-page statement is blurry, only replace page 2 without discarding valid pages 1, 3, and 4!

5. **Customer Calling & Callback Option**
   - Click-to-call link (`tel:1800-FIN-RESCUE`).
   - Callback request form with preferred time slots and consent. Exposes tickets to Admin.

6. **Active Loans & Repayment Tracker**
   - Synthetic repayment ledger with on-time loans and overdue loans.
   - Tracks daily QR settlement deductions and monthly EMIs.

7. **Multilingual AI Voice Assistant**
   - Supports 8 Indian languages (Hindi, English, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada).
   - Web Speech API integration (Speech-to-Text & Text-to-Speech).
   - Gemini API integration with automatic fallback for zero-config offline runs.

8. **Paytm Partner Intelligence Dashboard (`/admin`)**
   - Full desktop operations cockpit: overview KPIs, journey funnel, preflight telemetry, friction priority scores, partner API SLA monitor, recovery A/B engine, audit logs, and 1-click demo data reset.

---

## 🛠️ Tech Stack
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router
* **Backend:** Node.js, Express, TypeScript, Multer, Sharp, Vitest, JWT, bcryptjs
* **Persistence:** File-backed JSON document store (`server/data/db.json`) with zero external database prerequisites. Supports MongoDB Atlas via `MONGODB_URI`.
* **AI:** Google GenAI SDK (Gemini) with graceful offline demo fallback.

---

## ⚡ Quick Start & Run

### Prerequisites
* Node.js v18+ & npm

### Installation & Run

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start Backend Server:**
   ```bash
   cd server
   npm run dev
   # Server runs on http://localhost:5005
   ```

3. **Start Client Application (in another terminal):**
   ```bash
   cd client
   npm run dev
   # Client runs on http://localhost:3000
   ```

4. **Run Unit Tests:**
   ```bash
   npm test
   ```

---

## 🔑 Demo Credentials
* **Demo Merchant (Rahul Sharma):**
  - Mobile: `9876543210`
  - Demo OTP: `123456`
* **Demo Partner Admin:**
  - Direct URL: `http://localhost:3000/admin`
  - Mobile: `9999999999`
  - Demo OTP: `123456`
