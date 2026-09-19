import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';
import { google } from 'googleapis';
import { EMAIL_CONFIG } from './config';

admin.initializeApp();

const formatJPY = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0 }).format(amount);
};

const escapeHtml = (value: unknown, fallback = '-') => {
  const text = value === undefined || value === null || value === '' ? fallback : String(value);
  return text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] || char));
};

async function getCampaignConfig(db: admin.firestore.Firestore, campaignId?: string) {
  const targetCampaignId = campaignId || 'pemakaman';
  try {
    const campSnap = await db.doc(`campaigns/${targetCampaignId}`).get();
    if (campSnap.exists) {
      return campSnap.data();
    }
  } catch (e) {
    console.warn(`Could not read campaigns/${targetCampaignId}, falling back to stats/global`, e);
  }

  // Fallback to stats/global
  const statsSnap = await db.doc('stats/global').get();
  return statsSnap.exists ? statsSnap.data() : null;
}

export const sendVerificationEmail = functions.runWith({ secrets: ['RESEND_API_KEY'] })
  .firestore
  .document("donations/{donationId}")
  .onUpdate(async (change, context) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const before = change.before.data();
    const after = change.after.data();

    // Trigger ONLY when status changes from 'pending' to 'verified'
    if (before.status !== 'verified' && after.status === 'verified') {
      const email = after.email;

      if (!email || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'RE_PLACEHOLDER') {
        console.log('Skipping verification email: Missing email or API key.');
        return;
      }

      try {
        const db = admin.firestore();
        const campaignId = after.campaignId || 'pemakaman';
        const campaignData = await getCampaignConfig(db, campaignId);
        const pubConfig = campaignData?.publicConfig;

        const category = pubConfig?.category || campaignData?.category || 'Donasi';
        const programName = pubConfig?.campaignTitle || pubConfig?.masjidName || campaignData?.title || EMAIL_CONFIG.masjidName;
        const orgName = pubConfig?.shortName || pubConfig?.footerCredit || 'KMII Jepang';

        const emailBrandName = `${programName} · ${orgName}`;
        const verifiedSubject = `Tanda Terima ${category} - ${programName}`;
        const secretariatName = `Panitia ${programName} (${orgName})`;
        const locationDetail = pubConfig?.locationText ? `Lokasi: ${pubConfig.locationText}` : '';

        const safeCategory = escapeHtml(category);
        const safeProgramName = escapeHtml(programName);
        const safeSecretariatName = escapeHtml(secretariatName);
        const safeLocationDetail = locationDetail ? escapeHtml(locationDetail) : '';

        const verifiedDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        const donorName = after.name || 'Hamba Allah';
        const donorLoc = after.loc || '-';
        const donorPackage = after.package || '-';
        const donationAmount = after.originalCurrency === 'IDR' && after.originalAmount
          ? `${formatJPY(after.amount)} (Rp ${Number(after.originalAmount).toLocaleString('id-ID')})`
          : formatJPY(after.amount);
        const paymentMethod = after.paymentMethod || '-';

        const textBody = [
          `Bukti Verifikasi ${category} - ${programName}`,
          ``,
          `Assalamu'alaikum Warahmatullahi Wabarakatuh,`,
          ``,
          `Jazakumullah Khairan Katsiran atas donasi Anda yang sangat berharga. Kami menginformasikan bahwa donasi Anda untuk program ${programName} telah berhasil diverifikasi oleh panitia dan telah tercatat secara resmi di sistem kami.`,
          ``,
          `Rincian Donasi:`,
          `- Nama Donatur: ${donorName}`,
          `- Domisili: ${donorLoc}`,
          `- Program / Paket: ${donorPackage}`,
          `- Nominal Donasi: ${donationAmount}`,
          `- Metode Transfer: ${paymentMethod}`,
          `- Tanggal Verifikasi: ${verifiedDate}`,
          ``,
          `Semoga Allah Subhaanahu wa Ta'ala menerima amalan ini, menjadikannya sebagai amal jariyah yang pahalanya mengalir tiada henti, serta melimpahkan keberkahan bagi Anda dan keluarga. Aamiin Ya Rabbal 'Alamin.`,
          ``,
          `---`,
          `${secretariatName}`,
          locationDetail ? `${locationDetail}` : '',
        ].filter(Boolean).join('\n');

        const data = await resend.emails.send({
          from: `${emailBrandName} <${EMAIL_CONFIG.fromEmail}>`,
          to: email,
          reply_to: EMAIL_CONFIG.fromEmail,
          subject: verifiedSubject,
          text: textBody,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              <h2 style="color: #1E3A2F; text-align: center; margin-bottom: 5px; font-weight: 800;">Bukti Verifikasi ${safeCategory}</h2>
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 0; margin-bottom: 25px;">${safeProgramName}</p>
              
              <p><em>Assalamu'alaikum Warahmatullahi Wabarakatuh,</em></p>
              <p>Jazakumullah Khairan Katsiran atas donasi Anda yang sangat berharga. Kami menginformasikan bahwa donasi Anda untuk program <strong>${safeProgramName}</strong> telah <strong>berhasil diverifikasi</strong> oleh panitia dan telah tercatat secara resmi di sistem kami.</p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 25px 0; border: 1px solid #f3f4f6;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb; width: 40%;"><strong>Nama Donatur</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb; font-weight: 600;">: ${escapeHtml(after.name, 'Hamba Allah')}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Domisili</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(after.loc)}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Program / Paket</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(after.package)}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Nominal Donasi</strong></td><td style="padding: 10px 5px; color: #1E3A2F; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 16px;">: ${formatJPY(after.amount)}${after.originalCurrency === 'IDR' && after.originalAmount ? ` <span style="font-size: 13px; font-weight: normal; color: #6b7280;">(Rp ${Number(after.originalAmount).toLocaleString('id-ID')})</span>` : ''}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Metode Transfer</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(after.paymentMethod)}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563;"><strong>Tanggal Verifikasi</strong></td><td style="padding: 10px 5px; color: #111827;">: ${verifiedDate}</td></tr>
                </table>
              </div>

              <p style="line-height: 1.6;">Semoga Allah Subhaanahu wa Ta'ala menerima amalan ini, menjadikannya sebagai amal jariyah yang pahalanya mengalir tiada henti, serta melimpahkan keberkahan bagi Anda dan keluarga. Aamiin Ya Rabbal 'Alamin.</p>
              
              <hr style="border: 0; border-top: 1px dashed #d1d5db; margin: 30px 0;">
              
              <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                <strong style="color: #374151;">${safeSecretariatName}</strong><br>
                ${safeLocationDetail ? `${safeLocationDetail}<br>` : ''}
              </p>
            </div>
          `,
          headers: {
            'X-Entity-Ref-ID': context.params.donationId,
          },
        });
        console.log('Email sent successfully:', data);
      } catch (error) {
        console.error('Failed to send email via Resend:', error);
      }
    }
  });

export const sendPendingEmail = functions.runWith({ secrets: ['RESEND_API_KEY'] })
  .firestore
  .document("donations/{donationId}")
  .onCreate(async (snap, context) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = snap.data();
    const email = data.email;

    if (!email || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'RE_PLACEHOLDER') {
      console.log('Skipping pending email: Missing email or API key.');
      return;
    }

    try {
      const db = admin.firestore();
      const campaignId = data.campaignId || 'pemakaman';
      const campaignData = await getCampaignConfig(db, campaignId);
      const pubConfig = campaignData?.publicConfig;

      const category = pubConfig?.category || campaignData?.category || 'Donasi';
      const programName = pubConfig?.campaignTitle || pubConfig?.masjidName || campaignData?.title || EMAIL_CONFIG.masjidName;
      const orgName = pubConfig?.shortName || pubConfig?.footerCredit || 'KMII Jepang';

      const emailBrandName = `${programName} · ${orgName}`;
      const pendingSubject = `Menunggu Verifikasi ${category} - ${programName}`;
      const secretariatName = `Panitia ${programName} (${orgName})`;

      const safeCategory = escapeHtml(category);
      const safeProgramName = escapeHtml(programName);
      const safeSecretariatName = escapeHtml(secretariatName);

      const donorName = data.name || 'Hamba Allah';
      const donorPackage = data.package || '-';
      const donationAmount = data.originalCurrency === 'IDR' && data.originalAmount
        ? `${formatJPY(data.amount)} (Rp ${Number(data.originalAmount).toLocaleString('id-ID')})`
        : formatJPY(data.amount);
      const paymentMethod = data.paymentMethod || '-';

      const textBody = [
        `Menunggu Verifikasi Administrasi - ${programName}`,
        ``,
        `Assalamu'alaikum Warahmatullahi Wabarakatuh,`,
        ``,
        `Formulir komitmen donasi Anda untuk program ${programName} telah berhasil kami terima. Saat ini kontribusi Anda berstatus Pending (Menunggu Verifikasi) oleh panitia.`,
        ``,
        `Rincian Donasi:`,
        `- Nama Donatur: ${donorName}`,
        `- Program / Paket: ${donorPackage}`,
        `- Nominal Donasi: ${donationAmount}`,
        `- Metode Pembayaran: ${paymentMethod}`,
        ``,
        `Staf kami akan segera melakukan pengecekan mutasi bank/tanda terima. Anda akan mendapatkan email balasan otomatis (Tanda Terima) begitu dana telah dinyatakan terverifikasi.`,
        ``,
        `Jazakumullah Khairan Katsiran atas partisipasi dan antusiasme Anda.`,
        ``,
        `---`,
        `${secretariatName}`,
      ].join('\n');

      const result = await resend.emails.send({
        from: `${emailBrandName} <${EMAIL_CONFIG.fromEmail}>`,
        to: email,
        reply_to: EMAIL_CONFIG.fromEmail,
        subject: pendingSubject,
        text: textBody,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <h2 style="color: #B45309; text-align: center; margin-bottom: 5px; font-weight: 800;">Menunggu Verifikasi ${safeCategory}</h2>
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 0; margin-bottom: 25px;">${safeProgramName}</p>
            
            <p><em>Assalamu'alaikum Warahmatullahi Wabarakatuh,</em></p>
            <p>Formulir komitmen donasi Anda untuk program <strong>${safeProgramName}</strong> telah berhasil kami terima. Saat ini kontribusi Anda berstatus <strong>Pending (Menunggu Verifikasi)</strong> oleh panitia.</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 25px 0; border: 1px solid #f3f4f6;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb; width: 40%;"><strong>Nama Donatur</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb; font-weight: 600;">: ${escapeHtml(data.name, 'Hamba Allah')}</td></tr>
                <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Program / Paket</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(data.package)}</td></tr>
                <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Nominal Donasi</strong></td><td style="padding: 10px 5px; color: #B45309; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 16px;">: ${formatJPY(data.amount)}${data.originalCurrency === 'IDR' && data.originalAmount ? ` <span style="font-size: 13px; font-weight: normal; color: #6b7280;">(Rp ${Number(data.originalAmount).toLocaleString('id-ID')})</span>` : ''}</td></tr>
                <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Metode Pembayaran</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(data.paymentMethod)}</td></tr>
              </table>
            </div>

            <p style="line-height: 1.6;">Staf kami akan segera melakukan pengecekan mutasi bank/tanda terima. Anda akan mendapatkan email balasan otomatis (Tanda Terima) begitu dana telah dinyatakan terverifikasi.</p>
            <p style="line-height: 1.6;">Jazakumullah Khairan Katsiran atas partisipasi dan antusiasme Anda.</p>
            
            <hr style="border: 0; border-top: 1px dashed #d1d5db; margin: 30px 0;">
            
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
              <strong style="color: #374151;">${safeSecretariatName}</strong><br>
            </p>
          </div>
        `,
        headers: {
          'X-Entity-Ref-ID': context.params.donationId,
        },
      });
      console.log('Pending Email sent successfully:', result);
    } catch (error) {
      console.error('Failed to send pending email via Resend:', error);
    }
  });

export const updateStats = functions.firestore
  .document("donations/{donationId}")
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    // Determine which campaigns need their stats updated
    const campaignIds = new Set<string>();
    if (afterData?.campaignId) campaignIds.add(afterData.campaignId);
    if (beforeData?.campaignId) campaignIds.add(beforeData.campaignId);
    if (campaignIds.size === 0) campaignIds.add('pemakaman');

    for (const campaignId of campaignIds) {
      const donationsRef = db.collection('donations');
      const snapshot = await donationsRef.where('campaignId', '==', campaignId).get();

      let totalVerified = 0;
      let totalPending = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'verified') {
          totalVerified += (data.amount || 0);
        } else if (data.status === 'pending') {
          totalPending += (data.amount || 0);
        }
      });

      await db.doc(`campaigns/${campaignId}`).set({
        totalVerifiedAmount: totalVerified,
        totalPendingAmount: totalPending,
        lastUpdate: admin.firestore.Timestamp.now()
      }, { merge: true });

      if (campaignId === 'pemakaman') {
        await db.doc('stats/global').set({
          totalVerifiedAmount: totalVerified,
          totalPendingAmount: totalPending,
          lastUpdate: admin.firestore.Timestamp.now()
        }, { merge: true });
      }

      console.log(`Campaign ${campaignId} stats updated: Verified=${totalVerified}, Pending=${totalPending}`);
    }
  });

/**
 * Automatically syncs new donations to a Google Sheet.
 * @param snap The newly created donation document snapshot.
 * @param context Event context.
 */
export const syncToSheets = functions
  .firestore
  .document("donations/{donationId}")
  .onWrite(async (change, context) => {
    const donationId = context.params.donationId;
    const db = admin.firestore();
    const campaignId = (change.after.exists ? change.after.data()?.campaignId : change.before.data()?.campaignId) || 'pemakaman';
    const campaignData = await getCampaignConfig(db, campaignId);
    const spreadsheetId = campaignData && campaignData.spreadsheetId;
    
    if (!spreadsheetId) {
      console.log(`No spreadsheetId configured for campaign ${campaignId}. Skipping sheet sync.`);
      return;
    }

    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const authClient = await auth.getClient() as any;
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // 1. Handle DELETION
      if (!change.after.exists) {
        console.log(`Donation ${donationId} deleted. Searching for row to remove.`);
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Donations!L:L',
        });
        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === donationId);

        if (rowIndex !== -1) {
          const sheetIdResponse = await sheets.spreadsheets.get({ spreadsheetId });
          const sheet = sheetIdResponse.data.sheets?.find(s => s.properties?.title === 'Donations');
          const sheetId = sheet?.properties?.sheetId;

          if (sheetId !== undefined) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId,
              requestBody: {
                requests: [{
                  deleteDimension: {
                    range: {
                      sheetId: sheetId,
                      dimension: 'ROWS',
                      startIndex: rowIndex,
                      endIndex: rowIndex + 1
                    }
                  }
                }]
              }
            });
            console.log(`Successfully deleted row ${rowIndex + 1} for donation ${donationId}.`);
          }
        } else {
          console.log(`Donation ${donationId} not found in sheet, nothing to delete.`);
        }
        return;
      }

      // 2. Handle CREATE or UPDATE
      const data = change.after.data()!;
      const dateObj = data.date && typeof data.date.toDate === 'function' ? data.date.toDate() : new Date();
      const formattedDate = dateObj.toISOString().slice(0, 10) + ': ' + 
                           dateObj.getHours().toString().padStart(2, '0') + ':' + 
                           dateObj.getMinutes().toString().padStart(2, '0');

      const rowData = [
        formattedDate,
        data.name || 'Hamba Allah',
        data.email || '-',
        data.phone || '-',
        data.amount || 0,
        data.package || '-',
        data.loc || '-',
        data.status || 'pending',
        data.paymentMethod || '-',
        data.proofUrl || '-',
        data.remarks || '-',
        donationId // Column L
      ];

      // Read Column L to find if the donationId exists
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Donations!L:L',
      });
      
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === donationId);
      
      console.log(`Syncing donation ${donationId} (status: ${data.status}). Found in sheet at index: ${rowIndex}`);

      if (rowIndex !== -1) {
        const actualSheetRow = rowIndex + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId,
          range: `Donations!A${actualSheetRow}:L${actualSheetRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [rowData],
          },
        });
        console.log(`Successfully updated donation ${donationId} at row ${actualSheetRow}.`);
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: 'Donations!A:L',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [rowData],
          },
        });
        console.log(`Successfully appended new donation ${donationId} (status: ${data.status}).`);
      }
    } catch (error) {
      console.error(`Failed to sync donation ${donationId} to Google Sheets:`, error);
    }
  });

let cachedBaseHtml: string | null = null;

function getBaseHtml(): string {
  if (cachedBaseHtml) return cachedBaseHtml;
  const possiblePaths = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, '../src/index.html'),
    path.join(__dirname, '../../dist/index.html'),
    path.join(process.cwd(), 'dist/index.html'),
    path.join(process.cwd(), 'index.html')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        cachedBaseHtml = fs.readFileSync(p, 'utf8');
        return cachedBaseHtml;
      } catch (err) {
        console.warn(`Could not read ${p}:`, err);
      }
    }
  }
  return '';
}

function replaceMeta(html: string, pattern: RegExp, newTag: string): string {
  if (pattern.test(html)) {
    return html.replace(pattern, newTag);
  }
  return html.replace('</head>', `  ${newTag}\n</head>`);
}

/**
 * Cloud Function to dynamically render OpenGraph & Twitter preview meta tags
 * for specific donation programs (e.g. /pemakaman, /masjid-koganei)
 * and portal catalog (/ or /katalog), cached at the edge CDN.
 */
export const ssrApp = functions.https.onRequest(async (req, res) => {
  const baseHtml = getBaseHtml();
  if (!baseHtml) {
    res.status(500).send('Base HTML template missing');
    return;
  }

  // Parse campaign slug from path (e.g. /pemakaman or /masjid-koganei)
  const rawPath = req.path.replace(/^\/+|\/+$/g, '');
  const segments = rawPath.split('/').filter(Boolean);
  const slug = segments[0] || '';

  // Default Portal metadata
  let title = 'KMII Jepang - Portal ZISWAF & Donasi';
  let desc = 'Salurkan zakat, infaq, sedekah, dan wakaf Anda untuk berbagai program dakwah dan kemaslahatan muslim di Jepang.';
  let img = 'https://ziswaf.kmii.jp/og-preview.png';
  let url = 'https://ziswaf.kmii.jp/';

  if (slug && !['directory', 'katalog', 'admin', 'donatur', 'assets'].includes(slug)) {
    try {
      const db = admin.firestore();
      const campData = await getCampaignConfig(db, slug);
      if (campData) {
        // Only take nama program, remove nama pendek, remove detail
        title = campData.publicConfig?.campaignTitle || campData.title || campData.publicConfig?.masjidName || 'Program Donasi';
        desc = '';
        if (campData.publicConfig?.imageUrl) {
          img = campData.publicConfig.imageUrl;
        } else if (campData.imageUrl) {
          img = campData.imageUrl;
        }
        url = `https://ziswaf.kmii.jp/${slug}`;
      }
    } catch (e) {
      console.warn(`Error fetching campaign config for SSR [${slug}]:`, e);
    }
  }

  let html = baseHtml;
  html = replaceMeta(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  if (desc) {
    html = replaceMeta(html, /<meta[^>]*?name=["']description["'][^>]*?>/i, `<meta name="description" content="${escapeHtml(desc)}" />`);
    html = replaceMeta(html, /<meta[^>]*?property=["']og:description["'][^>]*?>/i, `<meta property="og:description" content="${escapeHtml(desc)}" />`);
    html = replaceMeta(html, /<meta[^>]*?name=["']twitter:description["'][^>]*?>/i, `<meta name="twitter:description" content="${escapeHtml(desc)}" />`);
  } else {
    html = html.replace(/<meta[^>]*?name=["']description["'][^>]*?>\s*/gi, '');
    html = html.replace(/<meta[^>]*?property=["']og:description["'][^>]*?>\s*/gi, '');
    html = html.replace(/<meta[^>]*?name=["']twitter:description["'][^>]*?>\s*/gi, '');
  }
  html = replaceMeta(html, /<meta[^>]*?property=["']og:title["'][^>]*?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = replaceMeta(html, /<meta[^>]*?property=["']og:image["'][^>]*?>/i, `<meta property="og:image" content="${escapeHtml(img)}" />`);
  html = replaceMeta(html, /<meta[^>]*?property=["']og:url["'][^>]*?>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = replaceMeta(html, /<meta[^>]*?name=["']twitter:title["'][^>]*?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = replaceMeta(html, /<meta[^>]*?name=["']twitter:image["'][^>]*?>/i, `<meta name="twitter:image" content="${escapeHtml(img)}" />`);

  // Cache at CDN edge for 1 hour (s-maxage=3600), browser for 5 minutes (max-age=300)
  res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.status(200).send(html);
});
