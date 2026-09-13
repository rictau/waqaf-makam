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
- **Batas Pelunasan**: **31 Maret 2027** (Estimasi kebutuhan: ± ¥530.000 / bulan)

---

## Paket Donasi
1. **Target Bersama**: `¥3.000 / Bulan` (Target 1.000 jamaah × ¥3.000/bulan s/d Maret 2027)
2. **Donasi Sekali Bayar**: `¥10.000` (Target 1.800 jamaah × ¥10.000 = Tanah Lunas)
3. **Wakaf 1 Slot**: `¥320.000` (Administrasi & perawatan termasuk. Mendapat sertifikat wakaf.)
4. **Seikhlasnya**: Nominal Bebas (Amal Jariyah)
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
- **Styling**: [Material-UI (MUI)](https://mui.com/) - Professional design system with custom theming.
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
   cd mosque-dev
   npm install
   ```

2. **Environment Setup:**
   Create a `.env.local` file at the root with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY="your_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="mosque-dev.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="mosque-dev"
   VITE_FIREBASE_STORAGE_BUCKET="mosque-dev.firebasestorage.app"
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

Deploy both frontend and backend logic to Firebase:

```bash
# Build the application
npm run build

# Deploy to Firebase
npx firebase deploy
```

*Note: Outbound networking in Cloud Functions requires the Firebase **Blaze Plan** (Pay-as-you-go).*
