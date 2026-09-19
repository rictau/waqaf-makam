import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errors';
import { updateDocumentMetadata } from '../utils/metadata';
import type { GlobalStats, PublicConfig, PhaseProgress } from '../types';

const defaultPublicConfig: PublicConfig = {
  masjidName: "Pemakaman Muslim Honjo",
  shortName: "KMII Jepang",
  campaignTitle: "Wakaf Tanah Makam Muslim untuk WNI di Jepang",
  locationText: "Pemakaman Muslim Honjo, Saitama, Jepang",
  footerCredit: "KMII Jepang",
  donorListTitle: "Daftar Donatur",
  donorListSubtitleDate: "21 September 2026",
  wakafHadith: '"Apabila seorang manusia meninggal dunia, maka terputuslah semua amalnya kecuali tiga perkara: sedekah jariyah, ilmu yang bermanfaat, dan anak saleh yang mendoakannya." (HR. Muslim No. 1631)',
  cashPaymentText: "Donasi tunai dapat diserahkan langsung atau dikonfirmasikan kepada panitia melalui direct message (DM) Instagram @kmiijepang.",
  donationClosedTitle: "Periode Donasi Telah Ditutup",
  donationClosedText: "Jazakumullah Khairan atas dukungan seluruh donatur. Untuk informasi lebih lanjut, silakan hubungi panitia.",
  programmeScopeTitle: "Tahap 1: 10 Kapling · ~300 m² · 120 Slot",
  programmeScopeDescription: "Setelah masa pakai 10 tahun, kapling digunakan kembali untuk jenazah berikutnya sehingga melayani keluarga WNI di Jepang selama puluhan tahun ke depan.",
  logos: [
    { src: "/kmii-logo.png", alt: "KMII Jepang" },
    { src: "/ivc-logo.png", alt: "Indonesian Volunteer Community" }
  ],
  phases: [
    {
      id: "pemakaman",
      label: "Tahap 1: Lahan Pemakaman Muslim Honjo (10 Kapling / 120 Slot)",
      shortLabel: "Pemakaman Honjo",
      targetJPY: 20000000,
      shortfallLabel: "Masih Dibutuhkan",
      completedLabel: "Lunas (100%)",
      completedDate: "",
      completionAnnouncement: "Alhamdulillah, pembebasan lahan pemakaman telah lunas.",
      subtext: "10 kapling (~300 m² / 120 slot). Target pelunasan 31 Maret 2027."
    }
  ],
  packages: [
    {
      id: 'bulanan',
      label: '¥3.000',
      priceJPY: 3000,
      priceLabel: '¥3,000 (~Rp 339,000)',
      badge: 'Paket Bersama',
      subtext: 'Partisipasi gotong royong pembebasan lahan pemakaman.'
    },
    {
      id: 'sekali',
      label: '¥10.000',
      priceJPY: 10000,
      priceLabel: '¥10,000 (~Rp 1,130,000)',
      badge: 'Paket Reguler',
      subtext: 'Donasi percepatan pelunasan lahan pemakaman muslim.'
    },
    {
      id: '1slot',
      label: '¥320.000',
      priceJPY: 320000,
      priceLabel: '¥320,000 (~Rp 36,160,000)',
      badge: 'Wakaf 1 Slot',
      subtext: 'Administrasi & perawatan termasuk. Mendapat sertifikat wakaf.'
    },
    {
      id: 'infaq',
      label: 'Seikhlasnya',
      priceLabel: 'Nominal Bebas',
      badge: 'Amal Jariyah',
      subtext: 'Sedikit atau banyak, insya Allah berpahala amal jariyah'
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

  useEffect(() => {
    if (!hasLoadedStats) return;
    updateDocumentMetadata({
      title: `Wakaf Tanah Makam Muslim - ${publicConfig.shortName || 'KMII Jepang'}`,
      description: 'Bersama Wujudkan Pemakaman Muslim untuk WNI di Jepang',
      url: window.location.origin
    });
  }, [hasLoadedStats, publicConfig]);

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
