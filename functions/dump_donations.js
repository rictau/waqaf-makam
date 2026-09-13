const admin = require('firebase-admin');
const { google } = require('googleapis');

// Default Spreadsheet ID fallback
const SPREADSHEET_ID = '1wKytcofSMkf-22bCL21qVXg1smzcKL0RwJ97s0tAPmc';
const RANGE = 'Donations!A:L';

// Initialize Firebase Admin (assuming default credentials)
admin.initializeApp();
const db = admin.firestore();

async function dumpDonations() {
  console.log('Fetching donations from Firestore...');
  const statsSnap = await db.collection('stats').doc('global').get();
  const statsData = statsSnap.exists ? statsSnap.data() : null;
  const spreadsheetId = (statsData && statsData.spreadsheetId) || SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    console.error('❌ Failed to dump: Spreadsheet ID is missing in stats/global and fallback.');
    return;
  }

  const snapshot = await db.collection('donations').get();
  
  if (snapshot.empty) {
    console.log('No donations found in database.');
    return;
  }

  const rows = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const donationId = doc.id;
    
    // Resolve date string matching syncToSheets format
    const dateObj = data.date && typeof data.date.toDate === 'function' ? data.date.toDate() : new Date();
    const formattedDate = dateObj.toISOString().slice(0, 10) + ': ' + 
                         dateObj.getHours().toString().padStart(2, '0') + ':' + 
                         dateObj.getMinutes().toString().padStart(2, '0');

    rows.push([
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
    ]);
  });

  console.log(`Found ${rows.length} donations. Uploading to Google Sheets...`);

  // Authenticate Google Sheets API
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });
    console.log('✅ Successfully dumped all historical donations to Google Sheets!');
  } catch (error) {
    console.error('❌ Failed to dump to Sheets:', error.message);
  }
}

dumpDonations();
