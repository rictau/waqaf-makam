import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errors';
import type { GlobalStats, PublicConfig, PhaseProgress } from '../types';

const defaultPublicConfig: PublicConfig = {
  masjidName: "Program Donasi & ZISWAF",
  shortName: "KMII Jepang",
  campaignTitle: "Program Donasi & ZISWAF KMII Jepang",
  locationText: "Jepang",
  footerCredit: "KMII Jepang",
  donorListTitle: "Daftar Donatur",
  donorListSubtitleDate: "",
  wakafHadith: '"Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti sebutir biji yang menumbuhkan tujuh tangkai, pada setiap tangkai ada seratus biji." (QS. Al-Baqarah: 261)',
  cashPaymentText: "Donasi tunai dapat diserahkan langsung atau dikonfirmasikan kepada panitia melalui direct message (DM) Instagram @kmiijepang.",
  donationClosedTitle: "Periode Donasi Telah Ditutup",
  donationClosedText: "Jazakumullah Khairan atas dukungan seluruh donatur. Untuk informasi lebih lanjut, silakan hubungi panitia.",
  programmeScopeTitle: "Sasaran Program",
  programmeScopeDescription: "Penyaluran dan pelaksanaan amanah donasi untuk kemaslahatan umat dan dakwah di Jepang.",
  logos: [
    { src: "/kmii-logo.png", alt: "KMII Jepang" }
  ],
  phases: [
    {
      id: "tahap1",
      label: "Tahap 1: Target Pendanaan Program",
      shortLabel: "Target Pendanaan",
      targetJPY: 10000000,
      shortfallLabel: "Masih Dibutuhkan",
      completedLabel: "Tercapai (100%)",
      completedDate: "",
      completionAnnouncement: "Alhamdulillah, target pendanaan telah tercapai.",
      subtext: "Penyaluran amanah donasi terverifikasi oleh panitia."
    }
  ],
  packages: [
    {
      id: 'bulanan',
      label: '¥3.000',
      priceJPY: 3000,
      priceLabel: '¥3,000 (~Rp 339,000)',
      badge: 'Paket Bersama',
      subtext: 'Partisipasi donasi gotong royong bersama umat.'
    },
    {
      id: 'sekali',
      label: '¥10.000',
      priceJPY: 10000,
      priceLabel: '¥10,000 (~Rp 1,130,000)',
      badge: 'Paket Reguler',
      subtext: 'Donasi percepatan realisasi program.'
    },
    {
      id: '1slot',
      label: '¥50.000',
      priceJPY: 50000,
      priceLabel: '¥50,000 (~Rp 5,650,000)',
      badge: 'Paket Utama',
      subtext: 'Kontribusi utama pendanaan program dakwah.'
    },
    {
      id: 'infaq',
      label: 'Nominal Bebas',
      priceLabel: 'Nominal Bebas',
      badge: 'Infaq Bebas',
      subtext: 'Masukkan nominal donasi sesuai keikhlasan Anda.'
    }
  ],
  banks: {
    JP: [
      {
        id: 'jp1',
        label: 'Japan Post Bank (ゆうちょ銀行 - Sesama Yucho)',
        account: '10130-23901591',
        name: 'a.n. Takaful KMII (タカフルエムアイアイ)',
        paymentMethod: 'Japan Post Bank'
      },
      {
        id: 'jp2',
        label: 'Transfer dari Bank Lain ke Yucho',
        account: 'Cabang 018 - No. 2390159',
        name: 'Japan Post Bank (ゆうちょ銀行)\nCabang 018 (ゼロイチハチ)\nNo. Rekening: 2390159\na.n. Takaful KMII',
        paymentMethod: 'Bank Lain ke Yucho'
      }
    ],
    ID: [
      {
        id: 'id1',
        label: 'Bank Syariah Indonesia (BSI)',
        account: '7359863227',
        name: 'a.n. KMII Jepang',
        paymentMethod: 'BSI'
      }
    ]
  },
  contactLinks: {
    WHATSAPP: "https://wa.me/819096845955",
    INSTAGRAM: "https://instagram.com/kmiijepang",
    EMAIL: "mailto:kmiijp@gmail.com"
  },
  uniqueCode: 0,
  showNarahubung: true,
  narahubung: [
    { id: '1', region: 'Ibaraki / Kanto', name: 'Cak Anas', phone: '+81 90-9684-5955', href: 'https://wa.me/819096845955' },
    { id: '2', region: 'Tokyo & Sekitarnya', name: 'Fauzan', phone: '+81 80-4830-1988', href: 'https://wa.me/818048301988' },
  ]
};

export function useStats(campaignId: string = 'pemakaman') {
  const [stats, setStats] = useState<GlobalStats>({
    totalNeed: 20000000,
    renovationNeed: 0,
    baseVerified: 2000000,
    showDonaturTab: true,
    isClosed: false,
    jpyToIdrRate: 113,
    totalVerifiedAmount: 0,
    totalPendingAmount: 0,
    lastUpdate: null,
    donationDeadline: null
  });
  const [hasLoadedStats, setHasLoadedStats] = useState(false);

  useEffect(() => {
    const campRef = doc(db, 'campaigns', campaignId);
    let fallbackUnsub: (() => void) | null = null;

    const unsubscribe = onSnapshot(campRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<GlobalStats>;
        setStats(prev => ({ ...prev, ...data }));
        setHasLoadedStats(true);
      } else if (campaignId === 'pemakaman') {
        fallbackUnsub = onSnapshot(doc(db, 'stats', 'global'), (globalSnap) => {
          if (globalSnap.exists()) {
            const data = globalSnap.data() as Partial<GlobalStats>;
            setStats(prev => ({ ...prev, ...data }));
          }
          setHasLoadedStats(true);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'stats/global'));
      } else {
        setHasLoadedStats(true);
      }
    }, (error) => {
      if (campaignId === 'pemakaman') {
        fallbackUnsub = onSnapshot(doc(db, 'stats', 'global'), (globalSnap) => {
          if (globalSnap.exists()) {
            const data = globalSnap.data() as Partial<GlobalStats>;
            setStats(prev => ({ ...prev, ...data }));
          }
          setHasLoadedStats(true);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'stats/global'));
      } else {
        handleFirestoreError(error, OperationType.GET, `campaigns/${campaignId}`);
        setHasLoadedStats(true);
      }
    });

    return () => {
      unsubscribe();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [campaignId]);

  const terverifikasiAmount = stats.baseVerified + (stats.totalVerifiedAmount || 0);
  const danaTerkumpulAmount = terverifikasiAmount + (stats.totalPendingAmount || 0);

  const publicConfig: PublicConfig = useMemo(() => {
    if (!stats.publicConfig) return defaultPublicConfig;
    return {
      ...defaultPublicConfig,
      ...stats.publicConfig,
      showNarahubung: stats.publicConfig.showNarahubung !== undefined
        ? stats.publicConfig.showNarahubung
        : defaultPublicConfig.showNarahubung,
      narahubung: stats.publicConfig.narahubung !== undefined
        ? stats.publicConfig.narahubung
        : defaultPublicConfig.narahubung,
      contactLinks: {
        ...defaultPublicConfig.contactLinks,
        ...(stats.publicConfig.contactLinks || {})
      }
    };
  }, [stats.publicConfig]);

  const shortfallAmount = Math.max(0, stats.totalNeed - danaTerkumpulAmount);
  const totalPercentage = (danaTerkumpulAmount / stats.totalNeed) * 100;

  const configuredPhases = publicConfig.phases.map((phase, index) => ({
    ...phase,
    targetJPY: index === 0
      ? stats.totalNeed
      : index === 1
        ? stats.renovationNeed
        : phase.targetJPY
  }));

  const phaseProgress: PhaseProgress[] = configuredPhases.map((phase, index) => {
    const previousTarget = configuredPhases
      .slice(0, index)
      .reduce((sum, item) => sum + item.targetJPY, 0);
    const funds = Math.min(Math.max(0, danaTerkumpulAmount - previousTarget), phase.targetJPY);
    const verifiedFunds = Math.min(Math.max(0, terverifikasiAmount - previousTarget), phase.targetJPY);
    const percentage = phase.targetJPY > 0 ? Math.min(100, (funds / phase.targetJPY) * 100) : 0;
    const verifiedPercentage = phase.targetJPY > 0 ? Math.min(100, (verifiedFunds / phase.targetJPY) * 100) : 0;

    return {
      ...phase,
      index,
      previousTarget,
      funds,
      verifiedFunds,
      percentage,
      verifiedPercentage,
      pendingPercentage: Math.max(0, percentage - verifiedPercentage),
      shortfall: Math.max(0, phase.targetJPY - funds),
      isComplete: funds >= phase.targetJPY
    };
  });

  const activePhase = phaseProgress.find(phase => !phase.isComplete) || phaseProgress[phaseProgress.length - 1];

  const renovationFunds = Math.max(0, danaTerkumpulAmount - stats.totalNeed);
  const renovationPercentage = stats.renovationNeed > 0 ? Math.min(100, (renovationFunds / stats.renovationNeed) * 100) : 0;
  const renovationShortfall = Math.max(0, stats.renovationNeed - renovationFunds);

  const deadlineDate = stats.donationDeadline?.toDate
    ? stats.donationDeadline.toDate()
    : new Date("2099-12-31T23:59:59+09:00");
  const isDonationClosed = stats.isClosed === true || deadlineDate.getTime() <= Date.now();

  const calculateTimeLeft = () => {
    const targetDate = deadlineDate.getTime();
    const now = new Date().getTime();
    if (targetDate - now > 0) return Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
    return 0;
  };

  const [daysLeft, setDaysLeft] = useState(calculateTimeLeft());
  useEffect(() => {
    setDaysLeft(calculateTimeLeft());
    const timer = setInterval(() => setDaysLeft(calculateTimeLeft()), 1000 * 60 * 60);
    return () => clearInterval(timer);
  }, [deadlineDate.getTime()]);

  return {
    stats,
    hasLoadedStats,
    terverifikasiAmount,
    danaTerkumpulAmount,
    publicConfig,
    shortfallAmount,
    totalPercentage,
    phaseProgress,
    activePhase,
    renovationPercentage,
    renovationShortfall,
    deadlineDate,
    isDonationClosed,
    daysLeft
  };
}
