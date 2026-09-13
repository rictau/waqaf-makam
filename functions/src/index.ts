import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
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
        const statsSnap = await db.doc('stats/global').get();
        const statsData = statsSnap.exists ? statsSnap.data() : null;
        const pubConfig = statsData?.publicConfig;

        const masjidName = pubConfig?.masjidName || EMAIL_CONFIG.masjidName;
        const emailBrandName = pubConfig?.masjidName ? `Wakaf ${pubConfig.masjidName}` : EMAIL_CONFIG.emailBrandName;
        const verifiedSubject = pubConfig?.masjidName ? `Tanda Terima Wakaf ${pubConfig.masjidName}` : EMAIL_CONFIG.verifiedSubject;
        const secretariatName = pubConfig?.masjidName ? `Sekretariat Panitia Pembangunan ${pubConfig.masjidName}` : EMAIL_CONFIG.secretariatName;
        const locationDetail = pubConfig?.locationText ? `Berjarak sekitar 5 Menit jalan kaki dari Stasiun ${pubConfig.locationText}.` : EMAIL_CONFIG.locationDetail;
        const safeMasjidName = escapeHtml(masjidName);
        const safeSecretariatName = escapeHtml(secretariatName);
        const safeLocationDetail = escapeHtml(locationDetail);

        const data = await resend.emails.send({
          from: `${emailBrandName} <${EMAIL_CONFIG.fromEmail}>`,
          to: email,    
          subject: verifiedSubject,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              <h2 style="color: #4F46E5; text-align: center; margin-bottom: 5px; font-weight: 800;">Bukti Verifikasi Donasi</h2>
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 0; margin-bottom: 25px;">${safeMasjidName}</p>
              
              <p><em>Assalamu'alaikum Warahmatullahi Wabarakatuh,</em></p>
              <p>Jazakumullah Khairan Katsiran atas donasi Anda yang sangat berharga. Kami menginformasikan bahwa donasi Anda telah <strong>berhasil diverifikasi</strong> oleh panitia dan telah tercatat secara resmi di sistem kami.</p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 25px 0; border: 1px solid #f3f4f6;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb; width: 40%;"><strong>Nama Donatur</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb; font-weight: 600;">: ${escapeHtml(after.name, 'Hamba Allah')}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Domisili</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(after.loc)}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Program / Paket</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(after.package)}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Nominal Donasi</strong></td><td style="padding: 10px 5px; color: #4F46E5; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 16px;">: ${formatJPY(after.amount)}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Metode Transfer</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(after.paymentMethod)}</td></tr>
                  <tr><td style="padding: 10px 5px; color: #4b5563;"><strong>Tanggal Verifikasi</strong></td><td style="padding: 10px 5px; color: #111827;">: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                </table>
              </div>

              <p style="line-height: 1.6;">Semoga Allah Subhaanahu wa Ta'ala menerima amalan ini, menjadikannya sebagai sedekah jariyah yang pahalanya mengalir tiada henti, serta melimpahkan keberkahan bagi Anda dan keluarga. Aamiin Ya Rabbal 'Alamin.</p>
              
              <hr style="border: 0; border-top: 1px dashed #d1d5db; margin: 30px 0;">
              
              <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                <strong style="color: #374151;">${safeSecretariatName}</strong><br>
                Lokasi Masjid: ${safeLocationDetail}<br><br>
              </p>
            </div>
          `
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
      const statsSnap = await db.doc('stats/global').get();
      const statsData = statsSnap.exists ? statsSnap.data() : null;
      const pubConfig = statsData?.publicConfig;

      const masjidName = pubConfig?.masjidName || EMAIL_CONFIG.masjidName;
      const emailBrandName = pubConfig?.masjidName ? `Wakaf ${pubConfig.masjidName}` : EMAIL_CONFIG.emailBrandName;
      const pendingSubject = pubConfig?.masjidName ? `Menunggu Verifikasi Wakaf ${pubConfig.masjidName}` : EMAIL_CONFIG.pendingSubject;
      const secretariatName = pubConfig?.masjidName ? `Sekretariat Panitia Pembangunan ${pubConfig.masjidName}` : EMAIL_CONFIG.secretariatName;
      const safeMasjidName = escapeHtml(masjidName);
      const safeSecretariatName = escapeHtml(secretariatName);

      const result = await resend.emails.send({
        from: `${emailBrandName} <${EMAIL_CONFIG.fromEmail}>`,
        to: email,    
        subject: pendingSubject,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <h2 style="color: #F59E0B; text-align: center; margin-bottom: 5px; font-weight: 800;">Menunggu Verifikasi Administrasi</h2>
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 0; margin-bottom: 25px;">${safeMasjidName}</p>
            
            <p><em>Assalamu'alaikum Warahmatullahi Wabarakatuh,</em></p>
            <p>Formulir komitmen donasi Anda telah berhasil kami terima. Saat ini kontribusi Anda berstatus <strong>Pending (Menunggu Verifikasi)</strong> oleh panitia pembangunan.</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 25px 0; border: 1px solid #f3f4f6;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb; width: 40%;"><strong>Nama Donatur</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb; font-weight: 600;">: ${escapeHtml(data.name, 'Hamba Allah')}</td></tr>
                <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Program / Paket</strong></td><td style="padding: 10px 5px; color: #111827; border-bottom: 1px solid #e5e7eb;">: ${escapeHtml(data.package)}</td></tr>
                <tr><td style="padding: 10px 5px; color: #4b5563; border-bottom: 1px solid #e5e7eb;"><strong>Nominal Donasi</strong></td><td style="padding: 10px 5px; color: #F59E0B; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 16px;">: ${formatJPY(data.amount)}</td></tr>
                <tr><td style="padding: 10px 5px; color: #4b5563;"><strong>Metode Pembayaran</strong></td><td style="padding: 10px 5px; color: #111827;">: ${escapeHtml(data.paymentMethod)}</td></tr>
              </table>
            </div>

            <p style="line-height: 1.6;">Staf kami akan segera melakukan pengecekan mutasi bank/tanda terima. Anda akan mendapatkan email balasan otomatis (Tanda Terima) begitu dana telah dinyatakan terverifikasi.</p>
            <p style="line-height: 1.6;">Jazakumullah Khairan Katsiran atas partisipasi dan antusiasme Anda.</p>
            
            <hr style="border: 0; border-top: 1px dashed #d1d5db; margin: 30px 0;">
            
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
              <strong style="color: #374151;">${safeSecretariatName}</strong><br>
            </p>
          </div>
        `
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
    const donationsRef = db.collection('donations');
    
    // FETCH ALL to ensure 100% accurate, idempotent totals.
    // This handles at-least-once retries safely.
    const snapshot = await donationsRef.get();
    
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

    await db.doc('stats/global').set({
      totalVerifiedAmount: totalVerified,
      totalPendingAmount: totalPending,
      lastUpdate: admin.firestore.Timestamp.now()
    }, { merge: true });
    
    console.log(`Stats updated (Idempotent): Verified=${totalVerified}, Pending=${totalPending}`);
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
    const statsSnap = await db.doc('stats/global').get();
    const statsData = statsSnap.exists ? statsSnap.data() : null;
    const spreadsheetId = statsData && statsData.spreadsheetId;
    
    if (!spreadsheetId) {
      console.error('Missing spreadsheetId in stats/global.');
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
