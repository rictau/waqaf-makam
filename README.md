# Wakaf Tanah Makam Muslim untuk WNI di Jepang

Platform donasi dan verifikasi wakaf transparan berbasis **React 19** dan **Firebase** untuk pembebasan lahan **Pemakaman Muslim Honjo**, diselenggarakan bersama oleh **KMII Jepang (Keluarga Masyarakat Islam Indonesia)** dan **Indonesian Volunteer Community (IVC)**.

*Live Application:* [waqaf-makam.web.app](https://waqaf-makam.web.app) / [waqaf-makam.firebaseapp.com](https://waqaf-makam.firebaseapp.com)

---

## Ringkasan Program Wakaf
- **Objektif**: Hak penggunaan lahan di Pemakaman Muslim Honjo agar WNI Muslim di Jepang memiliki akses pemakaman layak dan sesuai syariat.
- **Tahap 1**: 10 Kapling pemakaman (total ~300 m² = 120 slot pemakaman).
- **Manfaat Berkelanjutan**: Setelah masa pakai 10 tahun, kapling dapat digunakan kembali untuk jenazah berikutnya, melayani keluarga Indonesia puluhan tahun ke depan.
- **Target Dana**: **¥20.000.000**
- **Sudah Terbayar (DP 22 Agustus 2026)**: **¥2.000.000** (10% terkumpul)
- **Sisa Kebutuhan**: **¥18.000.000**
- **Target Pelunasan**: **31 Maret 2027**

---

## Paket Donasi
1. **Paket Bersama**: `¥3.000` (Partisipasi gotong royong pembebasan lahan)
2. **Paket Reguler**: `¥10.000` (Donasi percepatan pelunasan lahan makam)
3. **Wakaf 1 Slot**: `¥320.000` (Administrasi & perawatan termasuk. Mendapat sertifikat wakaf.)
4. **Amal Jariyah**: Nominal Bebas (Sedikit atau banyak, insya Allah berpahala amal jariyah)
- **Interactive Payment Selection**: Donors select transfer destinations (e.g., *JP Post*, or *Bank Muamalat*). Includes copy-to-clipboard functionality for account numbers.
- **Secure File Handling**: Automatic upload of transfer receipts (Images & PDF) securely piped to Firebase Storage. Supports files up to **10MB**.
- **Privacy-First Public Ledger**: Recent donor list safely masks phone numbers and offers anonymous ("Hamba Allah") options.

### Backend & Admin Capabilities
- **Exclusive Administrative Dashboard**: Secure portal for committee members to review, verify, edit, and delete donation entries in real time.
- **Role-Based Security Tiers**:
  - **Superadmin**: Access to read/write all data, modify campaign settings (targets, banking, spreadsheet configs), and reset the campaign. Automatically assigned to `rictau.jp@gmail.com` or users with `role: "superadmin"`.
  - **Admin**: Access to view metrics, list, search, filter, verify, and edit/delete donation logs. Cannot see or modify global campaign configurations.
- **Dynamic Config Management**: Settings (Mosque Name, Location, Goals, JPY to IDR rate, and Google Spreadsheet ID) can be managed directly by the Superadmin inside the Admin Panel.
- **Split Bank Configurations**: JP and ID bank accounts are configured in separate, clean textareas in the Admin settings panel (no region prefixes required).
- **Data Export & Filtering**: One-click CSV export engine that respects active filters (Status, Payment Method).
- **Automated Notification System (Cloud Functions)**: 
  - **Trigger 1 (onCreate)**: Acknowledgment email for pending transactions.
  - **Trigger 2 (onUpdate)**: Official "Verified Receipt" email upon administrator verification.
- **Reliable Google Sheets Mirror**: Dynamically mirrors Firestore data into a Google Spreadsheet. Supports **bi-directional record management** (deletions in Firestore automatically remove corresponding rows in the sheet).

---

## Technology Stack & Architecture

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Material-UI (MUI)](https://mui.com/) with a custom "warm editorial ledger" theme — warm stone surfaces, deep forest ink, brass accents, hairline 1px rules and flat surfaces (no shadows, blur or hover lifts). Design tokens live in [`src/design.ts`](src/design.ts) and are applied globally in [`src/theme.ts`](src/theme.ts); shared typographic primitives (eyebrow labels, ledger rows, figures, status tags, pull quotes) live in [`src/components/common/primitives.tsx`](src/components/common/primitives.tsx).
- **Typography**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (display serif for headlines and money figures) paired with [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (UI/body), plus a system monospace for account numbers. All amounts use tabular figures.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Cloud Storage
- **Serverless**: Firebase Cloud Functions (Node 20)
- **Email Delivery**: [Resend API](https://resend.com/)

---

## Custom Hooks Architecture

The codebase has a clean separation of concerns:
- **`useStats` ([useStats.ts](file:///Users/ricki/Documents/github/mosque-dev/src/hooks/useStats.ts))**: Subscribes to `/stats/global` in Firestore to fetch campaign metrics and fallback parameters. Handles initial branding defaults locally.
- **`useDonations` ([useDonations.ts](file:///Users/ricki/Documents/github/mosque-dev/src/hooks/useDonations.ts))**: Controls donation document loading, pagination limits, filter states, and handles writing new donation entries to Firestore.

---

## Setup & Installation (Local Development)

1. **Clone & Install:**
   ```bash
   git clone <repo-url>
   cd waqaf-makam
   npm install
   ```

2. **Environment Setup:**
   Create a `.env.local` file at the root with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY="your_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="waqaf-makam.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="waqaf-makam"
   VITE_FIREBASE_STORAGE_BUCKET="waqaf-makam.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   VITE_FIREBASE_APP_ID="your_app_id"
   ```

3. **Configure Backend Email Branding:**
   Edit `functions/src/config.ts` to set the email sender name, sender address, subjects, masjid name, secretariat name, and location used by Cloud Functions.

4. **Configure Backend Secrets:**
   The platform requires two main secrets for the Cloud Functions:
   - **`RESEND_API_KEY`**: For the automated email system ([Get it here](https://resend.com/)).
   - **`SPREADSHEET_ID`**: For the Google Sheets real-time sync (The ID in your sheet's URL).

   Set them up via the Firebase CLI:
   ```bash
   npx firebase functions:secrets:set RESEND_API_KEY
   npx firebase functions:secrets:set SPREADSHEET_ID
   ```
   *Note: Ensure you have the Firebase CLI installed and are logged into your project.*

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## Deployment

### Automatic (recommended)

Every push to `main` builds and deploys via GitHub Actions
(`.github/workflows/firebase-deploy.yml`) — Hosting, Firestore rules and
indexes, Storage rules, and Functions.

Authentication uses **Workload Identity Federation**, so no service account
key is ever created or stored in the repository. GitHub mints a short-lived
OIDC token per run and exchanges it for scoped Google credentials.

One-time setup, run from a machine with `gcloud` and Owner on the project:

```bash
gcloud auth login
./scripts/setup-github-deploy.sh
```

The script prints the GitHub secrets and variables to configure. It is
idempotent — safe to re-run.

You can also trigger a deploy manually from the **Actions** tab
("Deploy to Firebase" → *Run workflow*) and choose which targets to deploy,
which is useful for rules-only changes:

```
hosting            # frontend only
firestore,storage  # security rules only
functions          # backend only
```

### Manual

```bash
npm run build
npx firebase deploy
```

*Note: Outbound networking in Cloud Functions requires the Firebase **Blaze Plan** (Pay-as-you-go).*

*The `RESEND_API_KEY` used by `sendVerificationEmail` is a Google Secret
Manager secret bound by name at deploy time, so neither CI nor this repository
ever handles its value.*
