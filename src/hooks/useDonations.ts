import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  writeBatch, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where, 
  Timestamp, 
  type QueryConstraint 
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errors';
import type { DonationRecord, DonationStatus } from '../types';

interface UseDonationsProps {
  isAdminMode: boolean;
  campaignId?: string;
}

interface PrivateDonationData {
  email?: string;
  phone?: string;
  proofUrl?: string;
  remarks?: string;
}

export function useDonations({ isAdminMode, campaignId }: UseDonationsProps) {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donationLimit, setDonationLimit] = useState(50);
  const [hasMore, setHasMore] = useState(true);

  // Admin Filter States (Server-side)
  const [adminFilterStatus, setAdminFilterStatus] = useState('pending');
  const [adminFilterPayment, setAdminFilterPayment] = useState('all');

  useEffect(() => {
    const constraints: QueryConstraint[] = [orderBy('date', 'desc'), limit(donationLimit)];
    
    // Add campaign filter if specified
    if (campaignId && campaignId !== 'all') {
      constraints.unshift(where('campaignId', '==', campaignId));
    }

    // Add server-side filters if in Admin mode and filters are active
    if (isAdminMode) {
      if (adminFilterStatus !== 'all') {
        constraints.unshift(where('status', '==', adminFilterStatus));
      }
      if (adminFilterPayment !== 'all') {
        constraints.unshift(where('paymentMethod', '==', adminFilterPayment));
      }
    }

    let privateMap = new Map<string, PrivateDonationData>();
    let latestPublicDocs: any[] = [];

    const mergeAndSetDonations = () => {
      const records = latestPublicDocs.map((docSnap): DonationRecord => {
        const data = docSnap.data();
        const priv = privateMap.get(docSnap.id);
        return {
          id: docSnap.id,
          campaignId: data.campaignId,
          name: String(data.name || 'Hamba Allah'),
          email: priv?.email ?? data.email,
          amount: Number(data.amount || 0),
          date: data.date?.toDate ? data.date.toDate().toLocaleString('id-ID') : 'Baru saja',
          status: (data.status === 'verified' ? 'verified' : 'pending') as DonationStatus,
          loc: data.loc,
          phone: priv?.phone ?? data.phone,
          isAnonymous: data.isAnonymous,
          proofUrl: priv?.proofUrl ?? data.proofUrl,
          package: data.package,
          paymentMethod: data.paymentMethod,
          remarks: priv?.remarks ?? data.remarks,
          originalCurrency: data.originalCurrency,
          originalAmount: data.originalAmount ? Number(data.originalAmount) : undefined,
        };
      });
      setDonations(records);
      setHasMore(records.length === donationLimit);
    };

    const q = query(collection(db, 'donations'), ...constraints);
    const unsubscribePublic = onSnapshot(q, (snapshot) => {
      latestPublicDocs = snapshot.docs;
      mergeAndSetDonations();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'donations'));

    // In admin mode, also listen to donations_private to merge sensitive PII
    let unsubscribePrivate: (() => void) | undefined;
    if (isAdminMode) {
      unsubscribePrivate = onSnapshot(collection(db, 'donations_private'), (snapshot) => {
        const nextMap = new Map<string, PrivateDonationData>();
        snapshot.docs.forEach((d) => {
          nextMap.set(d.id, d.data() as PrivateDonationData);
        });
        privateMap = nextMap;
        mergeAndSetDonations();
      }, (error) => {
        // Silently handle or log if admin session is still verifying
        console.warn('Unable to subscribe to donations_private:', error);
      });
    }
    
    return () => {
      unsubscribePublic();
      if (unsubscribePrivate) unsubscribePrivate();
    };
  }, [donationLimit, isAdminMode, campaignId, adminFilterStatus, adminFilterPayment]);

  const loadMore = () => {
    setDonationLimit(prev => prev + 50);
  };

  const addDonation = async (donationData: {
    name: string;
    email: string;
    amount: number;
    loc: string;
    phone: string;
    isAnonymous: boolean;
    proofUrl: string;
    package: string;
    paymentMethod: string;
    originalCurrency?: 'JPY' | 'IDR';
    originalAmount?: number;
    campaignId?: string;
  }) => {
    try {
      const batch = writeBatch(db);
      const donationRef = doc(collection(db, 'donations'));
      const privateRef = doc(db, 'donations_private', donationRef.id);
      const targetCampaignId = donationData.campaignId || campaignId || 'pemakaman';
      const now = Timestamp.now();

      // 1. Write public record (Strictly non-PII)
      batch.set(donationRef, {
        name: donationData.name,
        amount: donationData.amount,
        loc: donationData.loc || '',
        package: donationData.package || '',
        paymentMethod: donationData.paymentMethod || '',
        isAnonymous: Boolean(donationData.isAnonymous),
        campaignId: targetCampaignId,
        date: now,
        status: 'pending',
        ...(donationData.originalCurrency ? { originalCurrency: donationData.originalCurrency } : {}),
        ...(donationData.originalAmount !== undefined && donationData.originalAmount !== null
          ? { originalAmount: Number(donationData.originalAmount) }
          : {})
      });

      // 2. Write private record (PII only accessible by authenticated admin)
      batch.set(privateRef, {
        email: donationData.email || '',
        phone: donationData.phone || '',
        proofUrl: donationData.proofUrl || '',
        campaignId: targetCampaignId,
        createdAt: now
      });

      await batch.commit();
      return donationRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'donations');
      throw error;
    }
  };

  return {
    donations,
    hasMore,
    donationLimit,
    loadMore,
    setDonationLimit,
    adminFilterStatus,
    setAdminFilterStatus,
    adminFilterPayment,
    setAdminFilterPayment,
    addDonation
  };
}
