# AGENTS.md — Agent Workflow & Software Engineering Guidelines

Welcome to the **Wakaf Pemakaman Muslim Honjo** codebase. This document outlines the architectural standards, code style rules, business invariants, and verification protocols that all AI agents and human engineers must adhere to when working on this repository.

---

## 1. Project Overview & Architecture

- **Domain**: Transparent donation and verification platform for the Honjo Muslim Cemetery land acquisition in Japan, organized jointly by **KMII Jepang** and **Indonesian Volunteer Community (IVC)**.
- **Production URLs**:
  - Primary: [waqaf-makam.web.app](https://waqaf-makam.web.app)
  - Mirror: [waqaf-makam.firebaseapp.com](https://waqaf-makam.firebaseapp.com)
  - Custom Domain: [honjo.kmii.jp](https://honjo.kmii.jp)
- **Repository**: `rictau/waqaf-makam`

### Technology Stack
- **Frontend**: React 19, TypeScript (strict mode), Vite, Material-UI (MUI v6)
- **Backend**: Firebase Firestore, Firebase Authentication, Cloud Storage, Cloud Functions (Node 20, TypeScript)
- **Email Delivery**: Resend API (via Google Secret Manager secret `RESEND_API_KEY`)
- **Google Sheets Sync**: Real-time bi-directional mirror between Firestore and Google Sheets (secret `SPREADSHEET_ID`)
- **CI/CD**: Keyless GitHub Actions via Google Cloud Workload Identity Federation (WIF)

---

## 2. Design System & Frontend Constraints

The UI uses a **"Warm Editorial Ledger"** design philosophy defined in `src/design.ts` and `src/theme.ts`:

- **Surfaces & Palette**:
  - Warm stone background: `#FBF9F5` / `#F5EFEB`
  - Primary Ink: Deep forest green `#1E3A2F` / `#233831`
  - Accents: Warm brass `#B58900` / `#9C6D37`
  - Dividers: Subtle 1px hairline rules `#E5DFD7`
- **Typography**:
  - Display & Headlines: **Fraunces** (editorial serif)
  - Body & UI: **Plus Jakarta Sans**
  - Account / Bank Numbers: System Monospace
  - All currency and numerical figures MUST use tabular figures (`fontVariantNumeric: 'tabular-nums'`).
- **Styling Rules**:
  - **NO** heavy box-shadows, blur/frosted glassmorphism, or high-saturation neon gradients.
  - Rely on clean 1px hairline borders, flat surfaces, and clear typography hierarchy.
  - Use shared primitives from `src/components/common/primitives.tsx` (`EyebrowLabel`, `LedgerRow`, `Figure`, `StatusTag`, `PullQuote`).
- **Step Progression**:
  The donation form strictly follows a 4-step sequence:
  - `Langkah 1`: Pilih Nominal (Preset packages or custom amount)
  - `Langkah 2`: Data Donatur (Name, Email, Phone, Anonymous option)
  - `Langkah 3`: Pembayaran (Split Japan Post / Indonesian bank tabs with copy-to-clipboard)
  - `Langkah 4`: Konfirmasi Pembayaran (Receipt upload up to 10MB)

---

## 3. Business Logic & Database Invariants

### Dual Currency (JPY & IDR)
- **Base Reporting Currency**: All aggregated statistics in `/stats/global` (`totalAmount`, target progress) are calculated and stored in **Japanese Yen (JPY)**.
- **Donor Currency Capture**: Donors can donate in either JPY or IDR.
- When an IDR donation is submitted:
  - Fetch live exchange rate from `/stats/global`.
  - Store the converted JPY equivalent in `amount`.
  - Store `originalCurrency: 'IDR'`, `originalAmount: <idr_value>`, and `exchangeRate: <rate>` on the donation document.
- Admin views and CSV exports must display both the base JPY amount and the original currency amount when applicable.

### Firestore Rules & Best Practices
- **Never pass `undefined` to Firestore**: Firestore throws an exception if any field in an update/set payload is `undefined`. Always use `deleteField()` from `firebase/firestore` when removing or resetting optional fields (e.g. `spreadsheetId`).
- **Role-Based Access**:
  - `superadmin`: `rictau.jp@gmail.com` or users with `role: "superadmin"` in `/users/{uid}`. Full access including campaign reset, exchange rate configuration, and spreadsheet settings.
  - `admin`: Verification, editing, searching, and deleting donations. Cannot modify global campaign settings.

### Cloud Functions & Notification System
- Notification functions live in `functions/src/`:
  - `onDonationCreated`: Sends pending acknowledgment email.
  - `onDonationUpdated`: Sends official verified receipt email upon admin verification.
- Email configuration and templates are managed in `functions/src/config.ts`.
- Secrets are bound at runtime via Google Secret Manager (`RESEND_API_KEY`). Never hardcode secrets in code.

---

## 4. Agent Engineering Cycle (Standard Workflow)

Every agent working on this repository must follow this sequence:

```
1. Discover & Inspect  -->  2. Plan & Implement  -->  3. Verify (Pre-flight)  -->  4. Commit & Push
```

### Phase 1: Discover & Inspect
- Check git branch and working tree (`git status`).
- Check active configuration files (`.env.local`, `firebase.json`, `package.json`).
- Ensure understanding of the existing data structures before modifying any schema.

### Phase 2: Plan & Implement
- Keep changes minimal, surgical, and scoped directly to the task.
- Follow existing patterns in `src/hooks/` (`useStats.ts`, `useDonations.ts`).
- Respect the TypeScript strictness—never introduce `any` types unless interfacing with un-typed third-party payloads.

### Phase 3: Mandatory Pre-flight Verification
Before staging, committing, or proposing changes, **YOU MUST RUN AND PASS ALL THREE**:
```bash
# 1. Typecheck frontend
npm run lint

# 2. Build frontend production bundle
npm run build

# 3. Compile backend Cloud Functions
npm run build --prefix functions
```
If any of these commands fail, fix the errors before proceeding.

### Phase 4: Git & Deployment Protocol
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- **Automated Deployment**:
  - Pushing to branch `main` automatically triggers `.github/workflows/firebase-deploy.yml`.
  - CI workflow (`.github/workflows/ci.yml`) runs on PRs and pushes to `main`.
  - Deployment uses Google Cloud Workload Identity Federation (WIF). No static service account keys exist in the repository.
- **NEVER** commit `.env.local`, API secret keys, or service account JSON files.

---

## 5. Directory Reference

```
├── .github/workflows/
│   ├── ci.yml                 # PR & push typecheck and build validation
│   └── firebase-deploy.yml    # Keyless automated deployment to Firebase via WIF
├── functions/
│   ├── src/
│   │   ├── config.ts          # Email sender, subjects, and organization branding
│   │   └── index.ts           # Cloud Functions triggers (emails & Google Sheets)
│   └── package.json           # Cloud Functions dependencies (Node 20)
├── public/
│   ├── og-preview.png         # OpenGraph social preview banner (1200x630)
│   ├── qr-code.png            # Branded QR code with KMII badge
│   ├── qr-standee.png         # Printable flyer/standee card (1000x1400)
│   └── logo-kmii.png          # Official KMII emblem
├── scripts/
│   └── setup-github-deploy.sh # Idempotent GCP WIF & IAM setup script
├── src/
│   ├── components/
│   │   ├── admin/             # Administrative dashboard, settings, and donor lists
│   │   ├── common/            # Design primitives and shared UI components
│   │   └── donation/          # Donation stepper, payment options, and receipt upload
│   ├── hooks/                 # Firestore hooks (useStats, useDonations)
│   ├── design.ts              # Design tokens (colors, typography, spacing)
│   ├── theme.ts               # MUI global theme setup
│   └── App.tsx                # Main single-page application entry point
├── AGENTS.md                  # This guideline
└── README.md                  # Public project documentation & setup instructions
```

---

*Adhere strictly to these guidelines to ensure reliability, security, and visual consistency.*
