import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Container, Typography, Button, CircularProgress } from '@mui/material';
import { doc, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowRight } from 'lucide-react';

import { db, auth, storage } from './firebase';
import { c, eyebrow, radius } from './design';
import { Eyebrow, Figure, LedgerRow, StatusTag } from './components/common/primitives';
import { handleFirestoreError, OperationType } from './utils/errors';
import { formatIDR, formatJPY, formatDirectIDR } from './utils/formatters';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { StatsCard } from './components/features/donasi/StatsCard';
import { PackageSelection } from './components/features/donasi/PackageSelection';
import { DonorForm } from './components/features/donasi/DonorForm';
import { PaymentOptions } from './components/features/donasi/PaymentOptions';
import { ConfirmUpload } from './components/features/donasi/ConfirmUpload';
import { DonorList } from './components/features/donatur/DonorList';
import { AdminPanel } from './components/features/admin/AdminPanel';
import { Footer } from './components/layout/Footer';
import { CampaignDirectory } from './components/features/directory/CampaignDirectory';
import { useStats } from './hooks/useStats';
import { useDonations } from './hooks/useDonations';
import { useCampaigns } from './hooks/useCampaigns';
import type { AppTab } from './types';

interface RouteState {
  isHub: boolean;
  campaignSlug: string;
  tab: AppTab;
}

const parseRoute = (): RouteState => {
  const segments = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  
  // 1. Root path "/"
  if (segments.length === 0) {
    return { isHub: true, campaignSlug: 'pemakaman', tab: 'donasi' };
  }

  // 2. Global paths
  if (segments[0] === 'admin') {
    return { isHub: false, campaignSlug: 'pemakaman', tab: 'admin' };
  }
  if (segments[0] === 'donatur') {
    return { isHub: false, campaignSlug: 'pemakaman', tab: 'donatur' };
  }
  if (segments[0] === 'directory' || segments[0] === 'katalog') {
    return { isHub: true, campaignSlug: 'pemakaman', tab: 'donasi' };
  }

  // 3. Campaign path: /:slug or /:slug/:sub
  const slug = segments[0];
  const sub = segments[1];
  let tab: AppTab = 'donasi';
  if (sub === 'donatur') tab = 'donatur';
  else if (sub === 'admin') tab = 'admin';

  return { isHub: false, campaignSlug: slug, tab };
};

function DonationApp() {
  const [routeState, setRouteState] = useState<RouteState>(parseRoute);
  const { campaigns, activeCampaigns, loading: loadingCampaigns } = useCampaigns();

  // Rule: jika hanya 1 campaign, maka harus otomatis redirect ke /pemakaman
  useEffect(() => {
    if (!loadingCampaigns && routeState.isHub) {
      if (activeCampaigns.length <= 1) {
        window.history.replaceState(null, '', '/pemakaman');
        setRouteState({ isHub: false, campaignSlug: 'pemakaman', tab: 'donasi' });
      }
    }
  }, [loadingCampaigns, routeState.isHub, activeCampaigns.length]);

  const activeTab = routeState.tab;
  const currentCampaignSlug = routeState.campaignSlug || 'pemakaman';

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Donation Selection
  const [selectedPackage, setSelectedPackage] = useState('bulanan');
  const [infaqAmount, setInfaqAmount] = useState('');
  const [infaqCurrency, setInfaqCurrency] = useState<'JPY' | 'IDR'>('JPY');
  const [multiplier, setMultiplier] = useState('2');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Donor Info
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorCity, setDonorCity] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedBank, setSelectedBank] = useState('jp'); 
  
  // Upload File State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState('idle'); 

  // Fetch stats and process calculations using custom hook
  const {
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
  } = useStats(currentCampaignSlug);

  // Fetch donations and pagination using custom hook
  const {
    donations,
    hasMore,
    loadMore: handleLoadMore,
    adminFilterStatus,
    setAdminFilterStatus,
    adminFilterPayment,
    setAdminFilterPayment,
    addDonation
  } = useDonations({ 
    isAdminMode: activeTab === 'admin',
    campaignId: currentCampaignSlug
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminRoleStatus, setAdminRoleStatus] = useState<'checking' | 'superadmin' | 'admin' | 'not-admin' | 'signed-out'>('checking');
  const [adminRoleError, setAdminRoleError] = useState<string | null>(null);

  const navigateToTab = useCallback((tab: AppTab) => {
    const slug = currentCampaignSlug;
    let path = `/${slug}`;
    if (tab === 'donatur') path = `/${slug}/donatur`;
    else if (tab === 'admin') path = `/${slug}/admin`;

    setRouteState(prev => ({ ...prev, isHub: false, tab }));
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentCampaignSlug]);

  useEffect(() => {
    const handlePopState = () => setRouteState(parseRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  useEffect(() => {
    const checkAdminRole = async (u: typeof auth.currentUser) => {
      setUser(u);
      setAdminRoleError(null);
      if (!u) {
        setIsAdminUser(false);
        setIsSuperAdmin(false);
        setAdminRoleStatus('signed-out');
        return;
      }

      setAdminRoleStatus('checking');
      try {
        const userDoc = await getDocFromServer(doc(db, 'users', u.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;
        const isSuper = role === 'superadmin' || u.email === 'rictau.jp@gmail.com';
        const isAdmin = isSuper || role === 'admin';
        setIsAdminUser(isAdmin);
        setIsSuperAdmin(isSuper);
        setAdminRoleStatus(isSuper ? 'superadmin' : isAdmin ? 'admin' : 'not-admin');
      } catch (error) {
        console.error("Error fetching user role:", error);
        setIsAdminUser(false);
        setIsSuperAdmin(false);
        setAdminRoleStatus('not-admin');
        setAdminRoleError(error instanceof Error ? error.message : String(error));
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      await checkAdminRole(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'stats', 'global'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Redirect to donasi if donor list visibility gets disabled by admin
  useEffect(() => {
    if (hasLoadedStats && stats.showDonaturTab === false && activeTab === 'donatur') {
      navigateToTab('donasi');
    }
  }, [stats.showDonaturTab, activeTab, hasLoadedStats, navigateToTab]);

  const handleSelectAccount = (text: string, id: string) => {
    setSelectedAccountId(id);
    navigator.clipboard.writeText(text).catch(() => console.log('Clipboard perm denied')); // Best-effort copy
  };

  const handleBankChange = (bank: string) => {
    setSelectedBank(bank);
    setSelectedAccountId(null);
    setFormError(null);
  };

  const handleInfaqCurrencyChange = (curr: 'JPY' | 'IDR') => {
    setInfaqCurrency(curr);
    if (curr === 'IDR') {
      setSelectedBank('id');
      setSelectedAccountId(null);
    } else {
      setSelectedBank('jp');
      setSelectedAccountId(null);
    }
  };

  const getPackageName = () => {
    const pkg = publicConfig.packages.find(p => p.id === selectedPackage);
    if (pkg?.id === 'kelipatan') return `Wakaf ${multiplier} m²`;
    return pkg?.label || 'Donasi';
  };

  const getTransferAmount = () => {
    const rate = stats.jpyToIdrRate ?? 113;
    const pkg = publicConfig.packages.find(p => p.id === selectedPackage);
    
    if (pkg?.id === 'infaq') {
      const raw = Number(infaqAmount);
      if (!infaqAmount || isNaN(raw) || raw <= 0) return 'Nominal Bebas';
      
      if (infaqCurrency === 'IDR') {
        if (selectedBank === 'id') {
          return formatDirectIDR(raw);
        } else {
          // If paying via Japanese bank or Cash, convert IDR to JPY
          const jpy = Math.round(raw / rate);
          return formatJPY(jpy);
        }
      } else {
        // infaqCurrency === 'JPY'
        if (selectedBank === 'id') {
          return formatIDR(raw, rate);
        } else {
          return formatJPY(raw);
        }
      }
    }

    let jpy = 0;
    if (pkg?.priceJPY !== undefined) {
      jpy = pkg.priceJPY;
    } else if (pkg?.id === 'kelipatan') {
      jpy = Number(multiplier) * (pkg.priceJPY || 50000);
    }

    if (isNaN(jpy)) jpy = 0;

    if (selectedBank === 'id') return formatIDR(jpy, rate);
    return formatJPY(jpy);
  };

  const resetForm = () => {
    setUploadState('idle'); setUploadFile(null); setDonorName(''); setDonorPhone('');
    setDonorCity(''); setIsAnonymous(false); setInfaqAmount(''); setInfaqCurrency('JPY'); setDonorEmail('');
    navigateToTab('donatur');
    if(scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadSubmit = async () => {
    if (isDonationClosed && !isAdminUser) return setFormError("Mohon maaf, periode donasi telah ditutup.");
    if (selectedPackage === 'infaq') {
      const amountNum = Number(infaqAmount);
      if (!infaqAmount || isNaN(amountNum) || amountNum <= 0) return setFormError("Mohon masukkan nominal donasi yang valid.");
      if (infaqCurrency === 'IDR' && amountNum < 10000) {
        return setFormError("Minimal donasi Rupiah adalah Rp 10.000.");
      }
      if (infaqCurrency === 'JPY' && amountNum < 100) {
        return setFormError("Minimal donasi Yen adalah ¥100.");
      }
    }
    if (selectedPackage === 'kelipatan') {
      const mulNum = Number(multiplier);
      const pkg = publicConfig.packages.find(p => p.id === 'kelipatan');
      if (!multiplier || isNaN(mulNum) || mulNum < (pkg?.min || 2) || mulNum > (pkg?.max || 100)) {
        return setFormError(`Mohon masukkan jumlah kelipatan yang valid (Min ${pkg?.min || 2}, Max ${pkg?.max || 100}).`);
      }
    }
    if (!isAnonymous && !donorName) return setFormError("Mohon masukkan nama donatur atau pilih Anonim.");
    if (!donorEmail || !donorEmail.includes('@')) return setFormError("Mohon masukkan alamat email yang valid.");
    if (!donorPhone) return setFormError("Mohon masukkan nomor WhatsApp.");
    if (!donorPhone.startsWith('81') || donorPhone.length < 10) {
      return setFormError("Nomor WhatsApp harus diawali kode negara Jepang 81 (contoh: 818012345678).");
    }
    if (!donorCity) return setFormError("Mohon masukkan domisili.");
    if (selectedBank !== 'cash' && !selectedAccountId) return setFormError("Mohon pilih rekening tujuan transfer terlebih dahulu.");
    if (!uploadFile) return setFormError("Mohon pilih bukti pembayaran (Foto/PDF).");

    setFormError(null);
    setUploadState('uploading');
    
    try {
      let proofUrl = '';
      if (uploadFile) {
        // Sanitize filename: remove special chars and spaces, keep extension
        const timestamp = Date.now();
        const extension = uploadFile.name.split('.').pop();
        const safeName = `proof_${timestamp}.${extension}`;
        
        const storageRef = ref(storage, `proofs/${currentCampaignSlug}/${safeName}`);
        const snapshot = await uploadBytes(storageRef, uploadFile);
        proofUrl = await getDownloadURL(snapshot.ref);
      }

      const rate = stats.jpyToIdrRate ?? 113;
      const pkg = publicConfig.packages.find(p => p.id === selectedPackage);
      let jpyAmount = 0;
      let originalCurrency: 'JPY' | 'IDR' = 'JPY';
      let originalAmount = 0;

      if (pkg?.priceJPY !== undefined) {
        jpyAmount = pkg.priceJPY;
        if (selectedBank === 'id') {
          originalCurrency = 'IDR';
          originalAmount = jpyAmount * rate;
        } else {
          originalCurrency = 'JPY';
          originalAmount = jpyAmount;
        }
      } else if (pkg?.id === 'kelipatan') {
        jpyAmount = Number(multiplier) * (pkg.priceJPY || 50000);
        if (selectedBank === 'id') {
          originalCurrency = 'IDR';
          originalAmount = jpyAmount * rate;
        } else {
          originalCurrency = 'JPY';
          originalAmount = jpyAmount;
        }
      } else if (pkg?.id === 'infaq') {
        const rawNum = Number(infaqAmount);
        if (infaqCurrency === 'IDR') {
          originalCurrency = 'IDR';
          originalAmount = rawNum;
          jpyAmount = Math.max(1, Math.round(rawNum / rate));
        } else {
          if (selectedBank === 'id') {
            originalCurrency = 'IDR';
            originalAmount = rawNum * rate;
            jpyAmount = rawNum;
          } else {
            originalCurrency = 'JPY';
            originalAmount = rawNum;
            jpyAmount = rawNum;
          }
        }
      }
      
      let paymentMethod = 'Tunai';
      if (selectedBank === 'jp') {
        const bank = publicConfig.banks.JP.find(b => b.id === selectedAccountId);
        paymentMethod = bank?.paymentMethod || bank?.label || 'Bank Jepang';
      } else if (selectedBank === 'id') {
        const bank = publicConfig.banks.ID.find(b => b.id === selectedAccountId);
        paymentMethod = bank?.paymentMethod || bank?.label || 'Bank Indonesia';
      }
      
      await addDonation({
        name: isAnonymous ? 'Hamba Allah' : (donorName || 'Hamba Allah'),
        email: donorEmail,
        amount: jpyAmount,
        loc: donorCity || 'Japan',
        phone: donorPhone,
        isAnonymous: isAnonymous,
        proofUrl: proofUrl,
        package: getPackageName(),
        paymentMethod,
        originalCurrency,
        originalAmount,
        campaignId: currentCampaignSlug
      });

      setUploadState('success');
    } catch (error) {
      setUploadState('idle');
      console.error('Donation submission error:', error);
      alert('Terjadi kesalahan saat memproses donasi Anda. Silakan coba lagi nanti.');
      handleFirestoreError(error, OperationType.WRITE, 'donations');
    }
  };

  if (routeState.isHub) {
    if (loadingCampaigns) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: c.canvas }}>
          <CircularProgress size={32} sx={{ color: c.forest }} />
        </Box>
      );
    }
    if (activeCampaigns.length > 1) {
      return (
        <CampaignDirectory
          campaigns={campaigns}
          onSelectCampaign={(target) => {
            const parts = target.split('/');
            const slug = parts[0];
            const tab: AppTab = parts[1] === 'donatur' ? 'donatur' : 'donasi';
            window.history.pushState(null, '', `/${target}`);
            setRouteState({ isHub: false, campaignSlug: slug, tab });
          }}
          onAdminClick={() => {
            window.history.pushState(null, '', '/admin');
            setRouteState({ isHub: false, campaignSlug: 'pemakaman', tab: 'admin' });
          }}
        />
      );
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', bgcolor: c.canvas }}>
      {/* The app reads as a printed page on a stone desk: a hard-edged column
          with warm rules on either side — no floating card, no drop shadow. */}
      <Container
        maxWidth="sm"
        disableGutters
        sx={{
          bgcolor: c.paper,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          borderRadius: 0,
          borderLeft: { sm: `1px solid ${c.ruleStrong}` },
          borderRight: { sm: `1px solid ${c.ruleStrong}` },
        }}
      >
        {!hasLoadedStats ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center', bgcolor: c.well, px: 3 }}>
            <CircularProgress size={24} thickness={4} />
            <Eyebrow>Memuat data program</Eyebrow>
          </Box>
        ) : (
        <>
        
        {/* Submission receipt — a record of what was filed, not a celebration screen. */}
        {uploadState === 'success' && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 50, bgcolor: c.paper, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 3 }}>
            <Eyebrow tone="brass">Donasi Tercatat</Eyebrow>
            <Typography variant="h1" sx={{ mt: 1, color: c.ink }}>Alhamdulillah</Typography>
            <Typography sx={{ mt: 1.25, fontSize: '0.875rem', lineHeight: 1.6, color: c.inkMuted }}>
              Bukti pembayaran {getPackageName()} Anda telah diterima dan menunggu verifikasi panitia.
              Jazakumullah Khairan, <Box component="strong" sx={{ color: c.ink }}>{isAnonymous ? 'Hamba Allah' : donorName}</Box>.
            </Typography>

            <Box sx={{ mt: 3, px: 2, py: 0.5, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, bgcolor: c.well }}>
              <LedgerRow label="Nominal" value={<Figure size="1.0625rem">{getTransferAmount()}</Figure>} />
              <LedgerRow label="Paket" value={<Typography component="span" sx={{ fontSize: '0.8125rem', fontWeight: 700, color: c.ink }}>{getPackageName()}</Typography>} />
              <LedgerRow label="Status" value={<StatusTag state="pending" label="Menunggu Verifikasi" />} last />
            </Box>

            <Button
              onClick={resetForm}
              variant="contained"
              endIcon={<ArrowRight size={14} />}
              sx={{ mt: 3, py: 1.375, ...eyebrow, fontSize: '0.75rem', color: c.paper }}
            >
              Lihat Daftar Donatur
            </Button>
          </Box>
        )}

        <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          {activeTab === 'donasi' && (
            <Box>
              <Header user={user} isAdminUser={isAdminUser} onAdminClick={() => navigateToTab('admin')} publicConfig={publicConfig} />
              <Box sx={{ px: 2, py: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <StatsCard 
                  danaTerkumpulAmount={danaTerkumpulAmount} 
                  terverifikasiAmount={terverifikasiAmount} 
                  totalPercentage={totalPercentage} 
                  shortfallAmount={shortfallAmount} 
                  daysLeft={daysLeft} 
                  lastUpdate={stats.lastUpdate}
                  phaseProgress={phaseProgress}
                  activePhase={activePhase}
                  jpyToIdrRate={stats.jpyToIdrRate ?? 113}
                  donationDeadline={deadlineDate}
                />
                {isDonationClosed && !isAdminUser ? (
                  <Box sx={{ px: 2, py: 2, bgcolor: c.pendingTint, borderLeft: `3px solid ${c.pending}`, borderRadius: `0 ${radius.md} ${radius.md} 0` }}>
                    <Eyebrow sx={{ color: c.pending }}>{publicConfig.donationClosedTitle}</Eyebrow>
                    <Typography sx={{ mt: 0.75, fontSize: '0.8125rem', lineHeight: 1.55, color: c.inkMuted }}>
                      {publicConfig.donationClosedText}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {isDonationClosed && isAdminUser && (
                      <Box sx={{ px: 1.5, py: 1.125, bgcolor: c.pendingTint, borderLeft: `3px solid ${c.pending}`, borderRadius: `0 ${radius.md} ${radius.md} 0` }}>
                        <Eyebrow sx={{ color: c.pending, fontSize: '0.5625rem' }}>
                          Donasi ditutup — mode admin: form tetap terlihat
                        </Eyebrow>
                      </Box>
                    )}
                    <PackageSelection
                      selectedPackage={selectedPackage}
                      setSelectedPackage={setSelectedPackage}
                      multiplier={multiplier}
                      setMultiplier={setMultiplier}
                      infaqAmount={infaqAmount}
                      setInfaqAmount={setInfaqAmount}
                      infaqCurrency={infaqCurrency}
                      setInfaqCurrency={handleInfaqCurrencyChange}
                      jpyToIdrRate={stats.jpyToIdrRate ?? 113}
                      getTransferAmount={getTransferAmount}
                      setFormError={setFormError}
                      wakafHadith={publicConfig.wakafHadith}
                      packages={publicConfig.packages}
                      uniqueCode={publicConfig.uniqueCode}
                    />
                    <DonorForm isAnonymous={isAnonymous} setIsAnonymous={setIsAnonymous} donorName={donorName} setDonorName={setDonorName} donorPhone={donorPhone} setDonorPhone={setDonorPhone} donorCity={donorCity} setDonorCity={setDonorCity} donorEmail={donorEmail} setDonorEmail={setDonorEmail} />
                    <PaymentOptions selectedBank={selectedBank} setSelectedBank={handleBankChange} getTransferAmount={getTransferAmount} handleSelectAccount={handleSelectAccount} selectedAccountId={selectedAccountId} publicConfig={publicConfig} />
                    <ConfirmUpload uploadFile={uploadFile} setUploadFile={setUploadFile} uploadState={uploadState} formError={formError} handleUploadSubmit={handleUploadSubmit} />
                  </>
                )}
              </Box>
            </Box>
          )}

          {activeTab === 'donatur' && <DonorList donations={donations} hasMore={hasMore} onLoadMore={handleLoadMore} publicConfig={publicConfig} />}
          
          {activeTab !== 'admin' && <Footer publicConfig={publicConfig} />}
          
          {activeTab === 'admin' && isAdminUser && (
            <AdminPanel 
              donations={donations} 
              verifiedAmount={terverifikasiAmount} 
              showDonaturTab={stats.showDonaturTab ?? true} 
              hasMore={hasMore} 
              onLoadMore={handleLoadMore}
              renovationPercentage={renovationPercentage}
              renovationShortfall={renovationShortfall}
              totalPercentage={totalPercentage}
              filterStatus={adminFilterStatus}
              setFilterStatus={setAdminFilterStatus}
              filterPayment={adminFilterPayment}
              setFilterPayment={setAdminFilterPayment}
              donationDeadline={deadlineDate}
              totalNeed={stats.totalNeed}
              renovationNeed={stats.renovationNeed}
              baseVerified={stats.baseVerified}
              publicConfig={publicConfig}
              jpyToIdrRate={stats.jpyToIdrRate ?? 113}
              spreadsheetId={stats.spreadsheetId}
              isSuperAdmin={isSuperAdmin}
              isClosed={stats.isClosed ?? false}
              currentCampaignId={currentCampaignSlug}
              campaigns={campaigns}
              onSelectCampaign={(newSlug) => {
                setRouteState(prev => ({ ...prev, isHub: false, campaignSlug: newSlug, tab: 'admin' }));
                window.history.pushState(null, '', `/${newSlug}/admin`);
              }}
            />
          )}

          {activeTab === 'admin' && !isAdminUser && (
            <Box sx={{ minHeight: '100%', bgcolor: c.well }}>
              <Header user={user} isAdminUser={isAdminUser} onAdminClick={() => navigateToTab('admin')} publicConfig={publicConfig} />
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ p: 2.25, bgcolor: c.paper, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg }}>
                  <Eyebrow tone="brass">Akses Terbatas</Eyebrow>
                  <Typography variant="h3" sx={{ mt: 0.75, color: c.ink }}>
                    {adminRoleStatus === 'checking' ? 'Memeriksa akses admin…' : 'Login admin diperlukan'}
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: '0.8125rem', lineHeight: 1.6, color: c.inkMuted }}>
                    {user
                      ? <>Masuk sebagai <strong>{user.email}</strong>, namun sesi ini belum dikenali sebagai admin.</>
                      : <>Ketuk ikon akun di atas dan masuk dengan akun yang memiliki role Firestore <strong>admin</strong>.</>}
                  </Typography>
                  {user && (
                    <Box sx={{ mt: 2, px: 1.5, py: 0.5, bgcolor: c.well, border: `1px solid ${c.rule}`, borderRadius: radius.md }}>
                      <LedgerRow label="Email" value={<Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: c.ink, wordBreak: 'break-all' }}>{user.email || '-'}</Typography>} last={!adminRoleError} />
                      <LedgerRow label="UID" value={<Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: c.ink, wordBreak: 'break-all' }}>{user.uid}</Typography>} last={!adminRoleError} />
                      {adminRoleError && (
                        <LedgerRow label="Error" value={<Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: c.danger, wordBreak: 'break-word' }}>{adminRoleError}</Typography>} last />
                      )}
                    </Box>
                  )}
                  {user && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => auth.signOut()}
                      sx={{ mt: 2, ...eyebrow, fontSize: '0.5625rem', color: c.danger, borderColor: c.danger }}
                    >
                      Logout & Masuk Ulang
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <BottomNavigation activeTab={activeTab} setActiveTab={navigateToTab} isAdminUser={isAdminUser} showDonaturTab={stats.showDonaturTab ?? true} />
        </>
        )}
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DonationApp />
    </ErrorBoundary>
  );
}
