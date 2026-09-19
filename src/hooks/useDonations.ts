import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, limit, where, Timestamp, type QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errors';
import type { DonationRecord, DonationStatus } from '../types';

interface UseDonationsProps {
  isAdminMode: boolean;
  campaignId?: string;
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

    const q = query(collection(db, 'donations'), ...constraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((docSnap): DonationRecord => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          campaignId: data.campaignId,
          name: String(data.name || 'Hamba Allah'),
          email: data.email,
          amount: Number(data.amount || 0),
          date: data.date?.toDate ? data.date.toDate().toLocaleString('id-ID') : 'Baru saja',
          status: (data.status === 'verified' ? 'verified' : 'pending') as DonationStatus,
          loc: data.loc,
          phone: data.phone,
          isAnonymous: data.isAnonymous,
          proofUrl: data.proofUrl,
          package: data.package,
          paymentMethod: data.paymentMethod,
          remarks: data.remarks,
          originalCurrency: data.originalCurrency,
          originalAmount: data.originalAmount ? Number(data.originalAmount) : undefined,
        };
      });
      setDonations(docs);
      setHasMore(docs.length === donationLimit);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'donations'));
    
    return () => unsubscribe();
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
      return await addDoc(collection(db, 'donations'), {
        ...donationData,
        campaignId: donationData.campaignId || campaignId || 'pemakaman',
        date: Timestamp.now(),
        status: 'pending'
      });
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
