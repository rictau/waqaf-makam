/**
 * Migration Script: Move PII (phone, email, proofUrl, remarks) from /donations to /donations_private
 * Run with: node scripts/migrate-pii-to-private.cjs
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'waqaf-makam'
  });
}

const db = admin.firestore();

async function migratePIIToPrivate() {
  console.log('--- Starting PII Migration to /donations_private ---');

  const donationsSnap = await db.collection('donations').get();
  console.log(`Found ${donationsSnap.size} total donation documents in /donations.`);

  let migratedCount = 0;
  let alreadyCleanCount = 0;
  let batch = db.batch();
  let opCount = 0;

  for (const docSnap of donationsSnap.docs) {
    const data = docSnap.data();
    const hasPII = 'email' in data || 'phone' in data || 'proofUrl' in data || 'remarks' in data;

    if (!hasPII) {
      alreadyCleanCount++;
      continue;
    }

    const privateRef = db.doc(`donations_private/${docSnap.id}`);
    const privateData = {};
    if (data.email) privateData.email = data.email;
    if (data.phone) privateData.phone = data.phone;
    if (data.proofUrl) privateData.proofUrl = data.proofUrl;
    if (data.remarks) privateData.remarks = data.remarks;
    if (data.campaignId) privateData.campaignId = data.campaignId;
    if (data.date) privateData.createdAt = data.date;

    // 1. Write to private collection
    batch.set(privateRef, privateData, { merge: true });
    opCount++;

    // 2. Remove PII fields from public collection
    const cleanup = {};
    if ('email' in data) cleanup.email = admin.firestore.FieldValue.delete();
    if ('phone' in data) cleanup.phone = admin.firestore.FieldValue.delete();
    if ('proofUrl' in data) cleanup.proofUrl = admin.firestore.FieldValue.delete();
    if ('remarks' in data) cleanup.remarks = admin.firestore.FieldValue.delete();

    batch.update(docSnap.ref, cleanup);
    opCount++;

    migratedCount++;

    if (opCount >= 400) {
      await batch.commit();
      console.log(`Committed batch of ${opCount} operations...`);
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${opCount} operations.`);
  }

  console.log('--- Migration Summary ---');
  console.log(`Successfully migrated: ${migratedCount} documents.`);
  console.log(`Already clean: ${alreadyCleanCount} documents.`);
  console.log('--- Migration Complete ---');
}

migratePIIToPrivate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
