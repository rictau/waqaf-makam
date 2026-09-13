import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Container, Typography, Chip, Avatar, IconButton, Button, CircularProgress } from '@mui/material';
import { doc, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowRight, Check, Landmark, Info } from 'lucide-react';

import { db, auth, storage } from './firebase';
import { handleFirestoreError, OperationType } from './utils/errors';
import { formatIDR, formatJPY } from './utils/formatters';

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
import { useStats } from './hooks/useStats';
import { useDonations } from './hooks/useDonations';
import type { AppTab } from './types';

function DonationApp() {
  const theme = useTheme();
  const getTabFromPath = (): AppTab => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path === '/admin') return 'admin';
    if (path === '/donatur') return 'donatur';
    return 'donasi';
  };
  const [activeTab, setActiveTab] = useState<AppTab>(getTabFromPath); 
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Donation Selection
  const [selectedPackage, setSelectedPackage] = useState('bulanan');
  const [infaqAmount, setInfaqAmount] = useState('');
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
  } = useStats();

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
  } = useDonations({ isAdminMode: activeTab === 'admin' });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminRoleStatus, setAdminRoleStatus] = useState<'checking' | 'superadmin' | 'admin' | 'not-admin' | 'signed-out'>('checking');
  const [adminRoleError, setAdminRoleError] = useState<string | null>(null);

  const navigateToTab = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    const path = tab === 'donasi' ? '/' : `/${tab}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const getPackageName = () => {
    const pkg = publicConfig.packages.find(p => p.id === selectedPackage);
    if (pkg?.id === 'kelipatan') return `Wakaf ${multiplier} m²`;
    return pkg?.label || 'Donasi';
  };

  const getTransferAmount = () => {
    let jpy = 0;
    const pkg = publicConfig.packages.find(p => p.id === selectedPackage);
    
    if (pkg?.priceJPY !== undefined) {
      jpy = pkg.priceJPY;
    } else if (pkg?.id === 'kelipatan') {
      jpy = Number(multiplier) * (pkg.priceJPY || 50000);
    } else if (pkg?.id === 'infaq') {
      jpy = Number(infaqAmount);
    }

    if (isNaN(jpy)) jpy = 0;

    if (jpy === 0 && selectedPackage === 'infaq') return 'Nominal Bebas';
    if (selectedBank === 'id') return formatIDR(jpy, stats.jpyToIdrRate ?? 113);
    return formatJPY(jpy);
  };

  const resetForm = () => {
    setUploadState('idle'); setUploadFile(null); setDonorName(''); setDonorPhone('');
    setDonorCity(''); setIsAnonymous(false); setInfaqAmount(''); setDonorEmail('');
    navigateToTab('donatur');
    if(scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadSubmit = async () => {
    if (isDonationClosed && !isAdminUser) return setFormError("Mohon maaf, periode donasi telah ditutup.");
    if (selectedPackage === 'infaq') {
      const amountNum = Number(infaqAmount);
      if (!infaqAmount || isNaN(amountNum) || amountNum <= 0) return setFormError("Mohon masukkan nominal donasi yang valid.");
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
        
        const storageRef = ref(storage, `proofs/${safeName}`);
        const snapshot = await uploadBytes(storageRef, uploadFile);
        proofUrl = await getDownloadURL(snapshot.ref);
      }

      const pkg = publicConfig.packages.find(p => p.id === selectedPackage);
      let jpyAmount = 0;
      if (pkg?.priceJPY !== undefined) {
        jpyAmount = pkg.priceJPY;
      } else if (pkg?.id === 'kelipatan') {
        jpyAmount = Number(multiplier) * (pkg.priceJPY || 50000);
      } else if (pkg?.id === 'infaq') {
        jpyAmount = Number(infaqAmount);
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
        paymentMethod
      });

      setUploadState('success');
    } catch (error) {
      setUploadState('idle');
      console.error('Donation submission error:', error);
      alert('Terjadi kesalahan saat memproses donasi Anda. Silakan coba lagi nanti.');
      handleFirestoreError(error, OperationType.WRITE, 'donations');
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', bgcolor: 'background.default', py: 0 }}>
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ios-blur { backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }
      `}} />

      <Container maxWidth="sm" disableGutters sx={{ bgcolor: 'background.paper', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100dvh', boxShadow: theme.shadows[10], borderRadius: 0 }}>
        {!hasLoadedStats ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', px: 3 }}>
            <CircularProgress size={36} thickness={5} />
          </Box>
        ) : (
        <>
        
        {uploadState === 'success' && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center px-6 animate-in fade-in duration-500 text-center">
            <div style={{ backgroundColor: theme.palette.primary.light + '20', color: theme.palette.primary.main, borderColor: theme.palette.primary.light + '40' }} className="w-16 h-16 rounded-full flex items-center justify-center mb-5 border">
              <Check className="w-8 h-8" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Alhamdulillah!</h1>
            <p className="text-slate-600 mb-6 px-2 text-sm font-medium leading-relaxed">
              Bukti pembayaran {getPackageName()} Anda telah diterima dan menunggu verifikasi. Jazakumullah Khairan, {isAnonymous ? 'Hamba Allah' : donorName}.
            </p>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 3, p: 3, width: '100%', mb: 4, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 2, mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
                   <Landmark size={14} style={{ marginRight: 8 }} /> Nominal
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>{getTransferAmount()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
                   <Info size={14} style={{ marginRight: 8 }} /> Status
                </Typography>
                <Chip label="Pending" size="small" sx={{ bgcolor: 'secondary.light', color: 'secondary.main', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', height: 20 }} />
              </Box>
            </Box>
            <button onClick={resetForm} style={{ backgroundColor: theme.palette.secondary.main }} className="w-full text-slate-900 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center text-sm">
              Lihat Daftar Donatur <ArrowRight className="w-3 h-3 ml-2" />
            </button>
          </div>
        )}

        <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          {activeTab === 'donasi' && (
            <Box sx={{ animateIn: 'fade-in', duration: 300 }}>
              <Header user={user} isAdminUser={isAdminUser} onAdminClick={() => navigateToTab('admin')} publicConfig={publicConfig} />
              <Box sx={{ px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                />
                {isDonationClosed && !isAdminUser ? (
                  <Box sx={{ p: 3, borderRadius: 3, border: '1px dashed', borderColor: 'warning.main', bgcolor: 'warning.light', textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'warning.dark', mb: 0.5 }}>
                      {publicConfig.donationClosedTitle}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                      {publicConfig.donationClosedText}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {isDonationClosed && isAdminUser && (
                      <Box sx={{ p: 1.5, borderRadius: 2, border: '1px dashed', borderColor: 'warning.main', bgcolor: 'warning.light' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'warning.dark', textTransform: 'uppercase' }}>
                          Donasi ditutup (mode admin: form tetap terlihat)
                        </Typography>
                      </Box>
                    )}
                    <PackageSelection selectedPackage={selectedPackage} setSelectedPackage={setSelectedPackage} multiplier={multiplier} setMultiplier={setMultiplier} infaqAmount={infaqAmount} setInfaqAmount={setInfaqAmount} getTransferAmount={getTransferAmount} setFormError={setFormError} wakafHadith={publicConfig.wakafHadith} packages={publicConfig.packages} uniqueCode={publicConfig.uniqueCode} />
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
            />
          )}

          {activeTab === 'admin' && !isAdminUser && (
            <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>
              <Header user={user} isAdminUser={isAdminUser} onAdminClick={() => navigateToTab('admin')} publicConfig={publicConfig} />
              <Box sx={{ p: 3 }}>
                <Box sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', mb: 1 }}>
                    {adminRoleStatus === 'checking' ? 'Checking Admin Access...' : 'Admin Login Required'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.6 }}>
                    {user
                      ? <>Signed in as <strong>{user.email}</strong>, but this browser session is not currently recognized as admin.</>
                      : <>Click the user icon above and sign in with an account that has the Firestore role <strong>admin</strong>.</>}
                  </Typography>
                  {user && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', textAlign: 'left' }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary' }}>Email: {user.email || '-'}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary', wordBreak: 'break-all' }}>UID: {user.uid}</Typography>
                      {adminRoleError && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 800, color: 'error.main', wordBreak: 'break-word' }}>
                          Role check error: {adminRoleError}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {user && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => auth.signOut()}
                      sx={{ mt: 2, fontWeight: 800, borderRadius: 2 }}
                    >
                      Logout and Sign In Again
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
