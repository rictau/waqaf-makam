import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errors';
import type { CampaignDocument } from '../types';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'campaigns'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
        } as CampaignDocument));
        setCampaigns(items);
      } else {
        // Fallback default campaign if /campaigns collection has not been migrated yet
        setCampaigns([
          {
            id: 'pemakaman',
            title: 'Wakaf Pemakaman Muslim WNI di Jepang',
            shortName: 'Pemakaman Muslim',
            status: 'active',
            isFeatured: true,
            order: 1,
            totalNeed: 20000000,
            baseVerified: 2000000,
            showDonaturTab: true,
            totalVerifiedAmount: 0,
            totalPendingAmount: 0,
            lastUpdate: null,
            donationDeadline: null,
          }
        ]);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'campaigns');
      // Fallback on error
      setCampaigns([
        {
          id: 'pemakaman',
          title: 'Wakaf Pemakaman Muslim WNI di Jepang',
          shortName: 'Pemakaman Muslim',
          status: 'active',
          isFeatured: true,
          order: 1,
          totalNeed: 20000000,
          baseVerified: 2000000,
          showDonaturTab: true,
          totalVerifiedAmount: 0,
          totalPendingAmount: 0,
          lastUpdate: null,
          donationDeadline: null,
        }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');

  return { campaigns, activeCampaigns, loading };
}
