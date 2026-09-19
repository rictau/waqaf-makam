/**
 * Migration Script: Migrate from single-tenant /stats/global to multi-campaign /campaigns/pemakaman
 * Run with: node scripts/migrate-to-multi-campaign.js
 */

const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function runMigration() {
  console.log('--- Starting Multi-Campaign Migration ---');

  // 1. Migrate /stats/global to /campaigns/pemakaman
  const statsDocRef = db.doc('stats/global');
  const statsSnap = await statsDocRef.get();
  
  if (!statsSnap.exists) {
    console.warn('⚠️ stats/global document does not exist.');
  } else {
    const statsData = statsSnap.data() || {};
    const campaignDocRef = db.doc('campaigns/pemakaman');
    const campaignSnap = await campaignDocRef.get();

    if (!campaignSnap.exists) {
      console.log('Creating /campaigns/pemakaman from /stats/global...');
      await campaignDocRef.set({
        id: 'pemakaman',
        title: statsData.publicConfig?.campaignTitle || 'Wakaf Tanah Makam Muslim untuk WNI di Jepang',
        shortName: statsData.publicConfig?.shortName || 'Pemakaman Honjo',
        status: 'active',
        isFeatured: true,
        order: 1,
        totalNeed: statsData.totalNeed || 20000000,
        renovationNeed: statsData.renovationNeed || 0,
        baseVerified: statsData.baseVerified || 2000000,
        showDonaturTab: statsData.showDonaturTab !== false,
        isClosed: statsData.isClosed || false,
        jpyToIdrRate: statsData.jpyToIdrRate || 113,
        spreadsheetId: statsData.spreadsheetId || null,
        publicConfig: statsData.publicConfig || {},
        totalVerifiedAmount: statsData.totalVerifiedAmount || 0,
        totalPendingAmount: statsData.totalPendingAmount || 0,
        donationDeadline: statsData.donationDeadline || null,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });
      console.log('✅ /campaigns/pemakaman created successfully.');
    } else {
      console.log('ℹ️ /campaigns/pemakaman already exists, keeping current data.');
    }
  }

  // 2. Backfill campaignId: 'pemakaman' for all existing donations missing campaignId
  console.log('Scanning donations collection for missing campaignId...');
  const donationsSnap = await db.collection('donations').get();
  let updatedCount = 0;
  let skippedCount = 0;

  const batchSize = 400;
  let currentBatch = db.batch();
  let opsInBatch = 0;

  for (const doc of donationsSnap.docs) {
    const data = doc.data();
    if (!data.campaignId) {
      currentBatch.update(doc.ref, { campaignId: 'pemakaman' });
      updatedCount++;
      opsInBatch++;

      if (opsInBatch >= batchSize) {
        await currentBatch.commit();
        currentBatch = db.batch();
        opsInBatch = 0;
        console.log(`Committed batch of ${batchSize} donation updates...`);
      }
    } else {
      skippedCount++;
    }
  }

  if (opsInBatch > 0) {
    await currentBatch.commit();
  }

  console.log(`✅ Donation scan complete. Updated: ${updatedCount}, Already had campaignId: ${skippedCount}`);
  console.log('--- Migration Finished Successfully ---');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
