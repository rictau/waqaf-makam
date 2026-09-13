# **Project Blueprint: Masjid Koganei Tokyo Donation App**

## **Overview**
A React application built with Vite and Firebase for managing donations and wakaf (endowments) for the Masjid Koganei Tokyo project. The app allows users to choose donation packages, upload proof of transfer, and view a public list of verified donors. Admin features include verifying and managing donations.

## **Project History & Features**
- **Framework:** React 19 (Vite)
- **State Management:** React Hooks (useState, useEffect, useRef)
- **Database & Auth:** Firebase Firestore, Authentication, and Storage.
- **Styling:** Initial implementation with Tailwind CSS and Lucide-React icons.
- **Theme Transition:** Migrated to Material-UI (MUI) for a professional look and feel.
- **Key Features:**
  - Donation package selection (1m², 0.5m², Infaq).
  - Multi-bank payment support (Japan & Indonesia).
  - Proof of transfer upload with real-time status updates.
  - Public donor verification board.
  - Admin dashboard for donation verification.
  - Error Handling with custom Error Boundary.

## **Design System & Visual Language**
The application follows a "Modern Islamic Corporate" aesthetic, prioritizing professionalism, trust, and mobile-first accessibility.

### **1. Typography**
- **Primary Font:** `Poppins` (Google Fonts).
- **Weights Used:**
  - `300/400`: Body text and secondary information.
  - `500/600`: Interactive elements, labels, and subheaders.
  - `700/800`: Section headings and primary metrics.
  - `900`: Main currency displays for maximum impact.

### **2. Color Palette**
- **Primary (Emerald Green):** `#124c3a` - Represents brand identity, verified states, and primary actions.
- **Secondary (Vibrant Orange):** `#f5a623` - Used for "Pending" status, phase indicators, and urgency elements (Countdown).
- **Backgrounds:**
  - Main: `#f8fafc` (Soft Slate) for a clean look.
  - Surface: `#ffffff` (Pure White) for cards and papers.
- **Semantic Colors:**
  - `Success`: Green - for 100% completion (Lunas).
  - `Warning`: Orange - for pending transactions and time pressure.
  - `Divider`: Light grey border for clean content separation.

### **3. UI Components & Visual Style**
- **Framework:** Material-UI (MUI) with custom theme overrides.
- **Rounded Corners:** Consistent `12px` to `16px` radius across all cards, buttons, and input fields.
- **Depth & Shadows:** Uses a "Soft-Lift" approach with custom multi-layered shadows (`0 10px 30px 0 rgba(0, 0, 0, 0.05)`).
- **Iconography:** `Lucide React` - Minimalist, lightweight stroke icons.
- **Layout:** Optimized for a `max-width: 600px` (SM container), providing a native app-like experience on mobile.

## **New Feature: Phase 2 - Renovation Progress Tracking**
### **Objective**
Allow admins to selectively show or hide the "Donatur" tab globally to control when the donor verification list is publicly visible.

### **Features Implemented**
1. **Global Configuration State:** Added a `showDonaturTab` boolean flag to the `stats/global` Firestore document to control the visibility of the "Donatur" list for all users. The application listens for changes to this property in real-time.
2. **Admin Toggle Switch:** Added a convenient, integrated toggle switch to the `AdminPanel` directly within the header metrics to modify the `showDonaturTab` flag, storing the state back to Firestore seamlessly.
3. **Dynamic Navigation Control:** Adjusted `BottomNavigation` to conditionally render the "Donatur" tab based on the configuration state from `App.tsx`.
4. **Auto-Redirect Logic:** Implemented a safety redirect to automatically redirect users to the "Donasi" view if they are viewing the "Donatur" tab exactly when an admin hides it.

### **Verification & Testing**
1. **Toggle Verification:** Toggle the "Tampilkan Tab Donatur" switch in the Admin section and verify that the `stats/global` Firestore document updates.
2. **Navigation Check:** Notice that toggling the tab automatically hides/shows the "Donatur" navigation item across the entire application interface.
3. **Redirect Testing:** Verify that returning a hidden tab while on that view falls back to the homepage correctly.

## **New Feature: Donation Pagination (Load More)**
### **Objective**
Prevent performance issues while allowing users and admins to view all donation records by implementing a "Load More" pagination system.

### **Features Implemented**
1. **Dynamic Limit State:** Added `donationLimit` state in `App.tsx` which defaults to 50 but can be incremented.
2. **HasMore Detection:** Automatically detects if more records exist by comparing the fetched count with the current limit.
3. **Load More UI:** Integrated "Muat Lebih Banyak" (Load More) buttons in both the public `DonorList` and the `AdminPanel`.
4. **Optimized Fetching:** Re-subscribes to Firestore only when the limit changes, ensuring real-time updates for the visible set.

## **New Feature: Google Sheets Automatic Sync**
### **Objective**
Automatically sync donation data to a Google Spreadsheet for bookkeeping and real-time administrative access outside of Firestore.

### **Features Implemented**
1. **`syncToSheets` Cloud Function:** A Firestore `onCreate` trigger that formats and appends new donation data (Name, Email, Amount, etc.) directly to a specified Google Sheet.
2. **Environment Secret Support:** Integrated `SPREADSHEET_ID` as a Cloud Function secret for secure spreadsheet identification.
3. **Google Sheets API Integration:** Configured the `googleapis` SDK with Application Default Credentials (ADC) for seamless authentication within the Firebase environment.

### **Manual Configuration Checklist**
1. **Enable Sheets API:** Done via Google Cloud Console.
2. **Sheet Sharing:** Share the Google Sheet with the project's service account (Editor mode).
3. **Set Secret:** Execute `firebase functions:secrets:set SPREADSHEET_ID`.
4. **Deploy:** Finalize with `firebase deploy --only functions`.
## **Update: April 18, 2026 - Building Purchase Completion Announcement**
### **Objective**
Announce that the building purchase has been fully paid (lunas) while keeping donations open for renovation needs.

### **Features Implemented**
1. **Updated StatsCard:** Added a celebratory message in the `StatsCard` component below the deficit calculation to inform donors that the primary purchase goal has been met.
2. **Layout Optimization:** Refactored the info section in the card to support multi-line text with proper icon alignment.

### **Verification**
1. **Visual Check:** Verified the text "Alhamdulillah atas izin Allah SWT dan kontribusi semua jamaah, pembelian gedung telah lunas. Donasi tetap dibuka untuk keperluan renovasi." appears clearly on the donation page.
2. **Mobile Responsiveness:** Ensured the multi-line text wraps gracefully on smaller screens.

## **New Feature: Phase 2 - Renovation Progress Tracking**
### **Objective**
Seamlessly transition the application to track "Tahap 2: Renovasi" (Phase 2: Renovation) now that the building purchase goal has been 100% met.

### **Features Implemented**
1. **Dual Progress Bar System:** Updated the `StatsCard` to display two distinct progress bars.
   - **Tahap 1 (Building Purchase):** Locked at 100% "Lunas" to celebrate the achievement.
   - **Tahap 2 (Renovation):** A new active progress bar that tracks funds collected specifically for renovation (all funds exceeding the initial building goal).
2. **Renovation-Specific Logic:** Added `renovationNeed` (5,000,000 JPY) to the global stats and implemented automatic calculations for `renovationPercentage` and `renovationShortfall` in `App.tsx`.
3. **UI Enhancements:**
   - Added a "Phase 2: Renovasi" chip indicator.
   - Updated the information box to reflect the deficit for renovation needs while maintaining the celebratory announcement for Phase 1.
   - Maintained the dual-segment (Verified vs Pending) visualization for the new renovation progress bar.

### **Verification**
1. **Progress Accuracy:** Verified that when total funds exceed 19.7M JPY, the excess is correctly mapped to the second progress bar.
2. **Status Consistency:** Confirmed that "Dana Terkumpul" and "Terverifikasi" continue to show the grand total of all donations.
3. **Responsive Design:** Ensured the stacked progress bars and updated text look professional on both mobile and desktop.

## **New Feature: Comprehensive UI Modernization & Config System**
### **Objective**
Transform the application into a template-ready, premium mobile web app with a consistent design language and a centralized configuration layer.

### **Features Implemented**
1. **Centralized Configuration (`src/config.ts`)**: 
   - Moved all hardcoded dates, goals, bank details, contact links, and UI messages into a single source of truth.
   - Implemented dynamic text injection (e.g., `{date}` placeholders).
2. **"Soft-Lift" Design System**:
   - Standardized shadows (`0 10px 30px`), border-radius (`12px-16px`), and spacing.
   - Implemented advanced glassmorphism in navigation headers and footers.
3. **High-End Component Overhaul**:
   - **StatsCard**: Unified Phase 1/2 visualization with identical bar heights and font weights.
   - **DonorForm & ConfirmUpload**: Switched to MUI `TextFields` with floating labels and real-time validation checkmarks.
   - **Package & Payment Selection**: Added unique iconography, interactive hover states, and "Copied!" feedback loops.
   - **Header & BottomNav**: Implemented sophisticated linear gradients, spring animations, and "Active Pill" navigation states.
4. **Enhanced Admin Situational Awareness**:
   - Integrated renovation metrics directly into the admin dashboard.
   - Added real-time search and refined filter interfaces.

### **Verification**
1. **End-to-End Flow:** Confirmed a seamless donation journey from package selection to proof upload.
2. **Architectural Integrity:** Verified that changing values in `config.ts` updates the entire UI correctly.
3. **System Stability:** Passed all `npm run lint` checks after modernization.

## **New Feature: Server-Side Administrative Filtering**
### **Objective**
Enable administrators to search and filter the entire donation database without performance degradation.

### **Features Implemented**
1. **Firestore Query Integration**: Shifted Status and Payment Method filtering from client-side (local list) to server-side (`where` clauses in Firestore).
2. **Composite Indexing**: Implemented `firestore.indexes.json` to support complex query combinations (e.g., Status + Date).
3. **Optimized Data Fetching**: Reset the pagination limit (50 items) on every filter change to ensure the view remains fast and relevant.

## **New Feature: Upload Security & Compatibility**
### **Objective**
Ensure all uploaded proof-of-transfer files are accessible to administrators and prevent broken URLs.

### **Features Implemented**
1. **Filename Sanitization**: Automatically renames uploaded files to a clean format (`proof_[timestamp].[ext]`), removing spaces and special characters that often break URLs.
2. **HEIC/HEIF Blocking**: Implemented a frontend safety check to prevent iPhone-specific HEIC uploads, providing donors with instructions to use JPG/PNG for universal browser compatibility.
3. **Smarter File Reset**: Improved the "Ganti" (Change) logic to clear the internal browser file buffer, preventing re-selection glitches.

## **PWA & Mobile Installation (Roadmap)**
### **Objective**
Enable the application to be installed on donor mobile devices for a native-like experience and provide automatic installation prompts.

### **Features Implemented**
1. **Web App Manifest (`public/manifest.json`)**: Configured the application name, theme colors, and icons (`kmii-logo.png`) to support "Add to Home Screen" functionality.
2. **Standalone Display Mode**: Enabled the app to run without a browser address bar when launched from the home screen.
3. **Favicon & Apple Touch Icons**: Integrated professional branding icons in `index.html`.

### **Future Roadmap (Automatic Install Prompt)**
- **Service Worker Requirement**: To trigger automatic "Install App" banners in browsers like Chrome (Android), a Service Worker (`sw.js`) must be registered in `main.tsx`. 
- **Current Status**: Manual installation via the browser "Share" or "Properties" menu is fully supported. Automatic prompting is currently deferred to maintain frontend simplicity, but remains as a recommended future enhancement.

## **Update: April 18, 2026 - System Stability & Sync Reliability**
### **Objective**
Improve application resilience against network errors, enhance file upload security, and fix synchronization issues with Google Sheets.

### **Features Implemented**
1. **Crash-Resistant Error Handling**:
   - Refactored `handleFirestoreError` in `src/utils/errors.ts` to log errors instead of throwing exceptions. This prevents the entire React app from crashing during background Firestore sync failures (e.g., snapshot listener hiccups).
   - Added explicit user-friendly alerts to all manual operations (Donation Submit, Verify, Delete, Edit) to ensure users are informed of failures without losing app state.
2. **Enhanced File Upload Security (10MB Limit)**:
   - Upgraded the maximum file upload size from 5MB to **10MB** to better support high-resolution mobile photos.
   - Synchronized the limit across the client-side (`ConfirmUpload.tsx`) and the server-side (`storage.rules`) with a consistent "Less than or equal to" policy.
3. **Google Sheets Sync Reliability**:
   - **Bidirectional Sync**: Updated the `syncToSheets` Cloud Function to handle document **deletions**. Deleting a donation in Firestore now automatically removes the corresponding row from the Google Sheet.
   - **Robust "Pending" Sync**: Improved the synchronization logic to ensure new "Pending" donations are immediately appended to the sheet upon submission.
   - **Atomic Data Handling**: Added metadata fetching to accurately locate and modify sheet rows by unique `donationId`.
4. **Cloud Functions Security & Performance**:
   - **Secure Secrets**: Wired `RESEND_API_KEY` and `MIGRATION_KEY` using Firebase Secret Manager for all relevant functions.
   - **Protected Migration**: Secured the `migrateDonations` HTTP endpoint with a required `MIGRATION_KEY` query parameter to prevent unauthorized destructive operations.
   - **Scalable Stats**: Optimized `updateStats` to use `FieldValue.increment` for real-time tracking, eliminating the need for expensive full-collection scans as the database grows.
5. **Memory Leak Fixes**:
   - Implemented `URL.revokeObjectURL` in the Admin CSV export logic to prevent browser memory build-up during repeated data exports.
6. **Deployment Optimization**:
   - Updated `firebase.json` to include dedicated `storage` rules configuration, ensuring backend security policies are always deployed alongside the frontend.

### **Verification**
1. **Type Safety**: Passed `tsc --noEmit` checks for all modified files.
2. **Edge Case Testing**: Confirmed that a file of exactly 10,485,760 bytes (10MiB) is accepted by both the UI and the Firebase Storage rules.
3. **Sync Check**: Verified that deleting a record in the Admin Panel triggers the Cloud Function to remove the row from the connected Google Sheet.

## **Technical Debt & Future Roadmap**
### **Identified Improvements (Phase 3)**
The following items have been identified as high-priority "engineering debt" to be addressed in future maintenance cycles:

1. **Architecture (God Component)**: `App.tsx` currently handles routing, global state, and complex calculations. It should be refactored into custom hooks (e.g., `useDonations`, `useStats`) and smaller, modular components.
2. **Type Safety**: Transition from `any` types to strict TypeScript interfaces for `Donation`, `Stats`, and `Admin` objects to prevent runtime errors and improve developer experience.
3. **Automated Testing**: Implement a core testing suite using **Vitest** for business logic and **React Testing Library** for UI components to ensure long-term stability.
4. **UX Modernization**: Replace browser-level `alert()` calls with a non-blocking **MUI Snackbar/Toast** notification system for a more premium, "app-like" user experience.

### **Secrets Management Reference**
For the application to function in production, ensure the following Firebase Secrets are configured:
- `RESEND_API_KEY`: Required for automated donor emails.
- `SPREADSHEET_ID`: Required for Google Sheets synchronization.

To set or update these, use:
`firebase functions:secrets:set <SECRET_NAME>`

## **New Feature: Split Payment Accounts & Stats Cleanup**
### **Objective**
Split the bank accounts input in the Admin Panel into separate JP and ID inputs, simplifying the entry format, and clean up the `stats/global` Firestore document to remove legacy fields.

### **Features Implemented**
1. **Admin Panel Input Splitting**:
   - Replaced the single `banksText` state/prop/validation in `AdminPanel.tsx` with two separate states: `banksJPText` and `banksIDText`.
   - Removed the requirement of prefixing `JP |` or `ID |` for bank records. The new format is simply: `Nama Bank | Nomor Rekening | Nama Pemilik | Metode`.
   - Replaced the single textarea field in the Campaign Setup section with two separate multiline fields for Japanese and Indonesian bank details.
   - Refactored settings save handlers to validate and parse each region independently, constructing the combined `banks` config object.
2. **Firestore stats/global Cleanup**:
   - Executed a maintenance script using the Firebase Admin SDK (`firebase-admin`) to fetch `stats/global` and prune legacy fields, keeping only properties defined in the `GlobalStats` interface (`totalNeed`, `renovationNeed`, `baseVerified`, `showDonaturTab`, `jpyToIdrRate`, `publicConfig`, `totalVerifiedAmount`, `totalPendingAmount`, `lastUpdate`, `donationDeadline`).

## **New Feature: Optional Phase 2 & Dynamic Phase Display**
### **Objective**
Allow administrators to configure whether the campaign has a second phase (Renovation). If Phase 2 is disabled, the first phase is displayed on the main progress card without the "Tahap 1:" prefix.

### **Features Implemented**
1. **Add `enablePhase2` state**: Declared a state `enablePhase2` in `AdminPanel.tsx` initialized from `publicConfig.phases.length > 1`.
2. **Add a Toggle Switch in Campaign Setup**: Added a switch to toggle Phase 2. If toggled off, target and label fields for Phase 2 are hidden.
3. **Conditionally Construct `phases` array**: In `handleSaveSettings` in `AdminPanel.tsx`, construct `phases` array depending on `enablePhase2`.
   - If enabled: Prefix Phase 1 name with "Tahap 1: " and Phase 2 name with "Tahap 2: ". Save both phases.
   - If disabled: Use the Phase 1 name without any "Tahap 1: " prefix. Save only Phase 1.
4. **Prune/Set `renovationNeed`**: Set `renovationNeed` to `0` when Phase 2 is disabled.

## **New Feature: Admin Panel Restructuring & Layout Rearrangement**
### **Objective**
Restructure the Admin Panel into a clean, modern, tabbed interface to separate daily operations (Donation verification, search/filters, list, export) from setup configurations (Campaign setup, bank accounts, package configurations, contacts).

### **Features Implemented**
1. **Integrate Tab Switcher in Admin Panel**: Introduced a pill/line tab selector at the bottom of the Admin Header with two tabs: "Ringkasan & Donasi" and "Pengaturan Campaign".
2. **Implement Conditional View Layouts**:
   - Tab 1: Renders the live metrics box, public tab publication switch, pending counters, search/filter inputs, and scrollable donation list.
   - Tab 2: Renders the campaign settings form, split into beautifully organized sub-sections using MUI Grid/Card layouts instead of a single long list.
3. **Handle Access Control**: If a non-superadmin tries to access the Settings tab, display a clean restricted access warning message.

## **Deployment: Firebase Hosting Deployment**
### **Objective**
Build and deploy the production-ready React web application to Firebase Hosting.

### **Steps Taken**
1. **Production Build**: Successfully compiled the React assets using Vite (`npm run build`).
2. **Hosting Deployment**: Deploying the static assets to Firebase Hosting using `npx firebase deploy --only hosting`.

## **Update: June 10, 2026 - Single Phase Label Logic & Vertically Bigger Progress Bars**
### **Objective**
Improve the visual presentation of the public donation progress card when only one phase is active by hiding the phase name and making progress bars more visible.

### **Plan and Steps**
1. **Conditional Phase Label Rendering**: In `StatsCard.tsx`, check if `phaseProgress.length > 1`. If `false` (only 1 phase), do not render the label `firstPhase?.label || 'Tahap 1'`.
2. **Dynamic Label Alignment**: Modify the container `<Box>` containing the phase label and the percentage to use `justifyContent: phaseProgress.length > 1 ? 'space-between' : 'flex-end'`. This ensures the percentage is correctly aligned to the right when the label is hidden.
3. **Thicker Progress Bars**: Update the height and border-radius styles for all progress bars in `StatsCard.tsx` (Completed phases, active phase in multi-phase, and single-phase) from `8px` height / `4px` border-radius to `14px` height / `7px` border-radius.

## **Update: June 10, 2026 - Interactive Payment Accounts & Standardized Contacts Input**
### **Objective**
Make it easier and less error-prone for admins to configure bank accounts and social contact links in the Campaign Settings dashboard.

### **Plan and Steps**
1. **Interactive Bank List Editors**: Remove the multiline textareas for Japanese and Indonesian bank details. Introduce dynamic list editors where admins can add, edit, and delete individual bank account rows (specifying Bank, Account Number, Owner Name, and optionally short payment method) inside responsive sub-cards.
2. **Auto-Formatting Contact URLs**: Provide helper texts and add auto-normalization code for contact links:
   - For **WhatsApp**, accept either the full `https://wa.me/number` URL or a raw number, normalising the number to the full URL automatically on save.
   - For **Instagram**, accept either the full `https://instagram.com/username` URL or a raw username, normalising to the full URL on save.
   - For **Email**, accept either a `mailto:email@address.com` URL or a raw email address, prepending `mailto:` on save.
3. **Streamline Save Validation**: Ensure validation is performed on each item in the lists before uploading to Firestore.

## **Update: June 10, 2026 - Spreadsheet ID Helper & Sheets Link Integration**
### **Objective**
Change the helper text of Google Spreadsheet ID field to clarify that empty values prevent synchronization, and dynamically replace the CSV Export button with a direct link to the Google Sheet if a spreadsheet ID is configured.

### **Plan and Steps**
1. **Helper Text Update**: Modify the Google Spreadsheet ID text field in `AdminPanel.tsx` to display: `"Jika dikosongkan, sinkronisasi ke Google Sheet tidak akan berjalan."`.
2. **Conditional Google Sheets Navigation Button**: Check if `spreadsheetId` prop is set.
   - If configured: Replace the CSV Export button (`handleExportCSV`) in the Admin Header with an anchor-based Material-UI Button that links to `https://docs.google.com/spreadsheets/d/${spreadsheetId}` opening in a new tab, styled with the `ExternalLink` icon.
   - If not configured: Fall back to rendering the original CSV Export button.

## **Update: June 10, 2026 - Settings Access & Toggle Relocation**
### **Objective**
Move the "Publikasi Tab Donatur" toggle to the campaign settings panel, allow regular admins to access the campaign configuration, and restrict only the campaign reset danger zone to superadmins.

### **Plan and Steps**
1. **Move Publikasi Tab Donatur Switch**: Remove the switch from Tab 1 (Ringkasan & Donasi) of the `AdminPanel` and insert it at the bottom of the "Informasi Umum & Tanggal" card in Tab 2 (Pengaturan Campaign).
2. **Access Extension to Regular Admins**:
   - Update `firestore.rules` to allow regular admins (`isAdmin()`) to update campaign properties (i.e. `/stats/{statId}` path write permissions).
   - In `AdminPanel.tsx`, remove the top-level `isSuperAdmin` access check from Tab 2 so all admins can configure settings.
3. **Reset Restricted to Superadmins**: Wrap the Danger Zone campaign reset card in Tab 2 with `{isSuperAdmin && ( ... )}` so that only superadmins can view or execute a campaign reset.

## **Update: June 10, 2026 - Simplified Phase Labels in Admin Progress Dashboard**
### **Objective**
Do not show full phase names (e.g. "Pembelian Gedung") on the admin panel's Project Progress dashboard. Use generic fallback labels like "Program" or "Progress" when only a single phase is configured, and "Tahap 1" / "Tahap 2" for multi-phase campaigns.

### **Plan and Steps**
1. **Redefine `activePhaseLabel`**: Update the `activePhaseLabel` definition in `AdminPanel.tsx` to return an empty string `''` when only 1 phase is configured (`publicConfig.phases.length > 1` is false).
2. **Dynamic Fallback in UI**:
   - The status chip label will fall back to `"Program Aktif"` when the label is empty.
   - The progress metric card label will fall back to `"Progress"` when the label is empty.

## **Update: June 10, 2026 - Terminology Update: Campaign to Program**
### **Objective**
Replace all user-facing occurrences of the English word "Campaign" with the more appropriate Indonesian word "Program" inside the Admin Panel UI and meta headers.

### **Plan and Steps**
1. **Admin Panel UI Text Replacements**:
   - Replace "Pengaturan Campaign" tab with "Pengaturan Program".
   - Replace the active campaign chip label fallback with "Program Aktif".
   - Replace date input labels ("Tanggal Mulai Campaign" / "Tanggal Akhir Campaign") with "Tanggal Mulai Program" and "Tanggal Akhir Program".
   - Replace phase name text field fallback label with "Nama Program".
   - Replace contact link card header with "Kontak & Media Sosial Program".
   - Replace user-facing alert/confirm texts in the Reset Campaign action ("Mulai campaign baru", "Gagal memulai campaign baru", "konfigurasi campaign") with "Mulai program baru", "Gagal memulai program baru", and "konfigurasi program" inside `AdminPanel.tsx`.
2. **Metadata Description Update**:
   - Change "donation and wakaf campaign" to "donation and wakaf program" in `useStats.ts`.

## **Update: June 10, 2026 - Additional Client-Side Security & Confirmation Checks**
### **Objective**
Introduce pre-flight authorization checks and confirmation dialogs in the Admin Panel to prevent unauthorized mutations (e.g. from expired sessions or revoked roles) and accidental updates.

### **Plan and Steps**
1. **Import `getDocFromServer`**:
   - In `AdminPanel.tsx`, import `getDocFromServer` from `firebase/firestore`.
2. **Implement Authorization Helpers**:
   - Create a reusable `checkAdminAuthorization` helper function inside `AdminPanel.tsx` that checks `auth.currentUser`, fetches the `/users/{uid}` document directly from the server, and ensures the user's role is either `admin` or `superadmin`.
   - Create a `checkSuperAdminAuthorization` helper function for superadmin-only actions (like program resets).
4. **Sudo-Mode Password Re-authentication**:
   - Introduce a verification Dialog (`ReauthDialog`) asking the admin to input their password before applying global settings changes or resetting the program.
   - When the user submits their password, attempt to re-authenticate the current Firebase User using `reauthenticateWithCredential` from `firebase/auth`.
   - Proceed with the mutation ONLY if the password check succeeds, verifying that the actual account holder is the one executing the change.
3. **Inject Checks and Confirmations into Mutations**:
   - **Save Settings (`handleSaveSettings`)**: Add `window.confirm` confirmation dialog and call `checkAdminAuthorization()` before applying changes.
   - **Reset Program (`handleStartNewCampaign`)**: Call `checkSuperAdminAuthorization()` to verify permissions.
   - **Save Edit Donation (`handleEditSave`)**: Call `checkAdminAuthorization()`.
   - **Toggle Donatur Publication (`toggleDonaturTab`)**: Call `checkAdminAuthorization()`.
   - **Verify Donation (onClick)**: Call `checkAdminAuthorization()`.
   - **Delete Donation (onClick)**: Call `checkAdminAuthorization()`.

## **Update: June 10, 2026 - Manual Program Open/Close Option**
### **Objective**
Allow administrators to manually open or close the donation program at any time with a simple toggle switch in the admin panel settings, bypassing the dates if necessary, with enforcement at both the client application level and the database rules level.

### **Plan and Steps**
1. **Update Types (`types.ts`)**:
   - Add optional field `isClosed?: boolean;` to the `GlobalStats` interface.
2. **Update Firestore Security Rules (`firestore.rules`)**:
   - Update `donationsOpen()` helper to check if `isClosed` is `true`. Reject creates if `stats.isClosed == true`.
3. **Update Stats Hook (`useStats.ts`)**:
   - Initialize `isClosed: false` in the default state.
   - Combine `stats.isClosed === true` and deadline checks to calculate the final `isDonationClosed` boolean.
4. **Update App Component (`App.tsx`)**:
   - Pass `isClosed={stats.isClosed ?? false}` to the `<AdminPanel />` component.
5. **Update Admin Panel Component (`AdminPanel.tsx`)**:
   - Add `isClosed` to `AdminPanelProps`.
   - Add local state `isClosedInput` (boolean) initialized from `isClosed` prop.
   - In Tab 2, Group 1 settings, render a new switch/control for "Status Program (Buka / Tutup)".
   - In `handleSaveSettings()`, save `isClosed: isClosedInput` inside the Firestore stats document payload.

## **Update: June 10, 2026 - Custom Public Closed Message Fields**
### **Objective**
Allow administrators to customize the title and subtext displayed on the public page when the donation program is closed (either manually or after the deadline passes).

### **Plan and Steps**
1. **Extend Settings State (`AdminPanel.tsx`)**:
   - In the `publicConfigInput` state, add `donationClosedTitle` and `donationClosedText` initialized from the `publicConfig` values.
2. **Add Input Fields in UI**:
   - In Tab 2, Card 1 (Informasi Umum & Tanggal), render two text fields for "Judul Pengumuman Tutup Donasi" and "Pesan Pengumuman Tutup Donasi" under the manual open/close switch.
3. **Database Save**:
   - Save the trimmed custom values in `settingsPayload.publicConfig` when saving settings.
