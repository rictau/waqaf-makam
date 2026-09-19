import React, { useState } from 'react';
import { Box, Typography, Button, Card, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Switch, FormControlLabel, InputAdornment, Tooltip, Divider } from '@mui/material';
import { ExternalLink, CheckCircle2, Trash2, Wallet, Download, Pencil, Filter, Search, Plus } from 'lucide-react';
import { updateDoc, deleteDoc, doc, setDoc, collection, getDocs, query, orderBy, where, Timestamp, writeBatch, getDocFromServer, deleteField } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../../../firebase';
import { formatJPY } from '../../../utils/formatters';
import { c, eyebrow, mono, radius, tnum } from '../../../design';
import { Eyebrow, Figure, LedgerRow, SectionHeading, StatusTag } from '../../common/primitives';
import { handleFirestoreError, OperationType } from '../../../utils/errors';
import type { BankConfig, BankAccountConfig, CampaignDocument, ContactPersonConfig, DonationPackageConfig, DonationRecord, DonationStatus, EditableDonationRecord, PublicConfig } from '../../../types';
import { CampaignBuilderDialog } from './CampaignBuilderDialog';

interface AdminPanelProps {
  donations: DonationRecord[];
  verifiedAmount: number;
  showDonaturTab?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  renovationPercentage: number;
  renovationShortfall: number;
  totalPercentage: number;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterPayment: string;
  setFilterPayment: (val: string) => void;
  donationDeadline: Date;
  totalNeed: number;
  renovationNeed: number;
  baseVerified: number;
  publicConfig: PublicConfig;
  jpyToIdrRate: number;
  spreadsheetId?: string;
  isSuperAdmin: boolean;
  isClosed: boolean;
  currentCampaignId?: string;
  campaigns?: CampaignDocument[];
  onSelectCampaign?: (slug: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  donations, 
  verifiedAmount, 
  showDonaturTab = true, 
  hasMore, 
  onLoadMore,
  renovationPercentage,
  renovationShortfall,
  totalPercentage,
  filterStatus,
  setFilterStatus,
  filterPayment,
  setFilterPayment,
  donationDeadline,
  totalNeed,
  renovationNeed,
  baseVerified,
  publicConfig,
  jpyToIdrRate,
  spreadsheetId,
  isSuperAdmin,
  isClosed,
  currentCampaignId = 'pemakaman',
  campaigns = [],
  onSelectCampaign
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<EditableDonationRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTogglingDonatur, setIsTogglingDonatur] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [adminTab, setAdminTab] = useState<'donations' | 'settings'>('donations');
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthAction, setReauthAction] = useState<(() => Promise<void>) | null>(null);
  const [reauthError, setReauthError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Settings editors (deadline + targets)
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [deadlineInput, setDeadlineInput] = useState(toLocalInput(donationDeadline));
  const [totalNeedInput, setTotalNeedInput] = useState(String(totalNeed));
  const [renovationNeedInput, setRenovationNeedInput] = useState(String(renovationNeed));
  const [baseVerifiedInput, setBaseVerifiedInput] = useState(String(baseVerified));
  const [jpyToIdrRateInput, setJpyToIdrRateInput] = useState(String(jpyToIdrRate));
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(spreadsheetId || '');
  const [isClosedInput, setIsClosedInput] = useState(isClosed);
  const findPackage = (id: string) => publicConfig.packages.find((pkg) => pkg.id === id);
  const [publicConfigInput, setPublicConfigInput] = useState({
    masjidName: publicConfig.masjidName,
    shortName: publicConfig.shortName,
    locationText: publicConfig.locationText,
    footerCredit: publicConfig.footerCredit,
    donorListSubtitleDate: publicConfig.donorListSubtitleDate,
    phase1Label: publicConfig.phases[0]?.shortLabel || '',
    phase2Label: publicConfig.phases[1]?.shortLabel || '',
    packageBulananPrice: String(findPackage('bulanan')?.priceJPY || '3000'),
    packageSekaliPrice: String(findPackage('sekali')?.priceJPY || '10000'),
    package1SlotPrice: String(findPackage('1slot')?.priceJPY || '320000'),
    whatsapp: publicConfig.contactLinks.WHATSAPP,
    instagram: publicConfig.contactLinks.INSTAGRAM,
    email: publicConfig.contactLinks.EMAIL,
    donationClosedTitle: publicConfig.donationClosedTitle || '',
    donationClosedText: publicConfig.donationClosedText || '',
    cashPaymentText: publicConfig.cashPaymentText || 'Donasi tunai dapat diserahkan langsung atau dikonfirmasikan kepada panitia melalui direct message (DM) Instagram @kmiijepang.'
  });
  const [banksJP, setBanksJP] = useState<BankAccountConfig[]>(publicConfig.banks?.JP || []);
  const [banksID, setBanksID] = useState<BankAccountConfig[]>(publicConfig.banks?.ID || []);
  const [showNarahubung, setShowNarahubung] = useState(publicConfig.showNarahubung !== false);
  const [narahubungList, setNarahubungList] = useState<ContactPersonConfig[]>(publicConfig.narahubung || []);
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isResettingCampaign, setIsResettingCampaign] = useState(false);
  const [enablePhase2, setEnablePhase2] = useState(Boolean(publicConfig.phases.length > 1));
  const primaryPhase = publicConfig.phases[0];
  const secondaryPhase = publicConfig.phases[1];

  React.useEffect(() => { setDeadlineInput(toLocalInput(donationDeadline)); }, [donationDeadline.getTime()]);
  React.useEffect(() => { setTotalNeedInput(String(totalNeed)); }, [totalNeed]);
  React.useEffect(() => { setRenovationNeedInput(String(renovationNeed)); }, [renovationNeed]);
  React.useEffect(() => { setBaseVerifiedInput(String(baseVerified)); }, [baseVerified]);
  React.useEffect(() => { setJpyToIdrRateInput(String(jpyToIdrRate)); }, [jpyToIdrRate]);
  React.useEffect(() => { setSpreadsheetIdInput(spreadsheetId || ''); }, [spreadsheetId]);
  React.useEffect(() => { setIsClosedInput(isClosed); }, [isClosed]);
  React.useEffect(() => {
    setPublicConfigInput({
      masjidName: publicConfig.masjidName,
      shortName: publicConfig.shortName,
      locationText: publicConfig.locationText,
      footerCredit: publicConfig.footerCredit,
      donorListSubtitleDate: publicConfig.donorListSubtitleDate,
      phase1Label: publicConfig.phases[0]?.shortLabel || '',
      phase2Label: publicConfig.phases[1]?.shortLabel || '',
      packageBulananPrice: String(publicConfig.packages.find((pkg) => pkg.id === 'bulanan')?.priceJPY || '3000'),
      packageSekaliPrice: String(publicConfig.packages.find((pkg) => pkg.id === 'sekali')?.priceJPY || '10000'),
      package1SlotPrice: String(publicConfig.packages.find((pkg) => pkg.id === '1slot')?.priceJPY || '320000'),
      whatsapp: publicConfig.contactLinks.WHATSAPP,
      instagram: publicConfig.contactLinks.INSTAGRAM,
      email: publicConfig.contactLinks.EMAIL,
      donationClosedTitle: publicConfig.donationClosedTitle || '',
      donationClosedText: publicConfig.donationClosedText || '',
      cashPaymentText: publicConfig.cashPaymentText || 'Donasi tunai dapat diserahkan langsung atau dikonfirmasikan kepada panitia melalui direct message (DM) Instagram @kmiijepang.'
    });
    setBanksJP(publicConfig.banks?.JP || []);
    setBanksID(publicConfig.banks?.ID || []);
    setShowNarahubung(publicConfig.showNarahubung !== false);
    setNarahubungList(publicConfig.narahubung || []);
    setEnablePhase2(Boolean(publicConfig.phases.length > 1));
  }, [publicConfig]);

  const updatePublicConfigInput = (field: keyof typeof publicConfigInput, value: string) => {
    setPublicConfigInput((prev) => ({ ...prev, [field]: value }));
  };

  const yenLabel = (amount?: number) => amount ? `¥${amount.toLocaleString('en-US')}` : 'Nominal Bebas';

  const buildPackages = (): DonationPackageConfig[] => {
    const priceBulanan = Number(publicConfigInput.packageBulananPrice);
    const priceSekali = Number(publicConfigInput.packageSekaliPrice);
    const price1Slot = Number(publicConfigInput.package1SlotPrice);
    if (isNaN(priceBulanan) || priceBulanan <= 0) throw new Error('Harga Paket Bersama harus angka positif.');
    if (isNaN(priceSekali) || priceSekali <= 0) throw new Error('Harga Paket Reguler harus angka positif.');
    if (isNaN(price1Slot) || price1Slot <= 0) throw new Error('Harga Paket 1 Slot Makam harus angka positif.');

    const rate = Number(jpyToIdrRateInput) || 113;

    return publicConfig.packages.map((pkg) => {
      if (pkg.id === 'bulanan') {
        const idr = Math.round(priceBulanan * rate);
        return {
          ...pkg,
          label: yenLabel(priceBulanan),
          priceJPY: priceBulanan,
          priceLabel: `${yenLabel(priceBulanan)} (~Rp ${idr.toLocaleString('id-ID')})`,
          badge: 'Paket Bersama',
          subtext: 'Partisipasi gotong royong pembebasan lahan pemakaman.'
        };
      }
      if (pkg.id === 'sekali') {
        const idr = Math.round(priceSekali * rate);
        return {
          ...pkg,
          label: yenLabel(priceSekali),
          priceJPY: priceSekali,
          priceLabel: `${yenLabel(priceSekali)} (~Rp ${idr.toLocaleString('id-ID')})`,
          badge: 'Paket Reguler',
          subtext: 'Donasi percepatan pelunasan lahan pemakaman muslim.'
        };
      }
      if (pkg.id === '1slot') {
        const idr = Math.round(price1Slot * rate);
        return {
          ...pkg,
          label: yenLabel(price1Slot),
          priceJPY: price1Slot,
          priceLabel: `${yenLabel(price1Slot)} (~Rp ${idr.toLocaleString('id-ID')})`,
          subtext: 'Administrasi & perawatan termasuk. Mendapat sertifikat wakaf.'
        };
      }
      return pkg;
    });
  };

  const handleAddBank = (region: 'JP' | 'ID') => {
    const setBanks = region === 'JP' ? setBanksJP : setBanksID;
    setBanks((prev) => [
      ...prev,
      {
        id: `${region.toLowerCase()}${prev.length + 1}_${Date.now()}`,
        label: '',
        account: '',
        name: '',
        paymentMethod: ''
      }
    ]);
  };

  const handleUpdateBank = (region: 'JP' | 'ID', index: number, field: keyof BankAccountConfig, value: string) => {
    const setBanks = region === 'JP' ? setBanksJP : setBanksID;
    setBanks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveBank = (region: 'JP' | 'ID', index: number) => {
    const setBanks = region === 'JP' ? setBanksJP : setBanksID;
    setBanks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNarahubung = () => {
    setNarahubungList((prev) => [
      ...prev,
      {
        id: `contact_${prev.length + 1}_${Date.now()}`,
        name: '',
        region: '',
        phone: '',
        href: ''
      }
    ]);
  };

  const handleUpdateNarahubung = (index: number, field: keyof ContactPersonConfig, value: string) => {
    setNarahubungList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveNarahubung = (index: number) => {
    setNarahubungList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const checkAdminAuthorization = async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      return false;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDocFromServer(userDocRef);
      if (!userDoc.exists()) {
        alert('Akses Ditolak: Pengguna tidak terdaftar.');
        return false;
      }
      const role = userDoc.data().role;
      if (role !== 'admin' && role !== 'superadmin') {
        alert('Akses Ditolak: Anda tidak memiliki peran Admin.');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Authorization pre-flight check failed:', e);
      alert('Gagal memverifikasi hak akses. Pastikan Anda terhubung ke internet.');
      return false;
    }
  };

  const checkSuperAdminAuthorization = async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      return false;
    }
    if (currentUser.email === 'rictau.jp@gmail.com') {
      return true;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDocFromServer(userDocRef);
      if (!userDoc.exists()) {
        alert('Akses Ditolak: Pengguna tidak terdaftar.');
        return false;
      }
      const role = userDoc.data().role;
      if (role !== 'superadmin') {
        alert('Akses Ditolak: Tindakan ini memerlukan akses Super Admin.');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Authorization pre-flight check failed:', e);
      alert('Gagal memverifikasi hak akses. Pastikan Anda terhubung ke internet.');
      return false;
    }
  };

  const requestSudoVerification = (action: () => Promise<void>) => {
    setReauthPassword('');
    setReauthError('');
    setReauthAction(() => action);
    setReauthOpen(true);
  };

  const handleSudoSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setReauthError('Sesi Anda telah berakhir. Silakan login kembali.');
      return;
    }
    if (!reauthPassword) {
      setReauthError('Password wajib diisi.');
      return;
    }

    setIsVerifyingPassword(true);
    setReauthError('');
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, reauthPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Execute the pending action
      if (reauthAction) {
        await reauthAction();
      }
      
      // Reset state and close
      setReauthOpen(false);
      setReauthPassword('');
      setReauthAction(null);
    } catch (error: any) {
      console.error('Re-authentication failed:', error);
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setReauthError('Password yang Anda masukkan salah.');
      } else if (error?.code === 'auth/too-many-requests') {
        setReauthError('Terlalu banyak percobaan. Silakan coba lagi nanti.');
      } else {
        setReauthError(error?.message || 'Verifikasi password gagal. Silakan coba lagi.');
      }
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleSaveSettings = () => {
    const deadlineDate = new Date(deadlineInput);
    const totalNeedNum = Number(totalNeedInput);
    const renovationNeedNum = Number(renovationNeedInput);
    const baseVerifiedNum = Number(baseVerifiedInput);
    const jpyToIdrRateNum = Number(jpyToIdrRateInput);
    if (isNaN(deadlineDate.getTime())) { alert('Tanggal deadline tidak valid.'); return; }
    if (isNaN(totalNeedNum) || totalNeedNum <= 0) { alert(`Target ${primaryPhase?.shortLabel || 'fase utama'} harus angka positif.`); return; }
    if (enablePhase2 && (isNaN(renovationNeedNum) || renovationNeedNum <= 0)) { alert(`Target ${publicConfigInput.phase2Label.trim() || 'fase kedua'} harus angka positif.`); return; }
    if (isNaN(baseVerifiedNum) || baseVerifiedNum < 0) { alert('Dana awal terverifikasi harus angka 0 atau lebih.'); return; }
    if (isNaN(jpyToIdrRateNum) || jpyToIdrRateNum <= 0) { alert('Kurs konversi JPY ke IDR harus angka positif.'); return; }

    try {
      // Validate packages locally
      buildPackages();

      // Validate interactive bank list
      banksJP.forEach((bank, idx) => {
        if (!bank.label.trim() || !bank.account.trim() || !bank.name.trim()) {
          throw new Error(`Semua kolom (Bank, Rekening, Nama Pemilik) pada Rekening Jepang #${idx + 1} wajib diisi.`);
        }
      });
      banksID.forEach((bank, idx) => {
        if (!bank.label.trim() || !bank.account.trim() || !bank.name.trim()) {
          throw new Error(`Semua kolom (Bank, Rekening, Nama Pemilik) pada Rekening Indonesia #${idx + 1} wajib diisi.`);
        }
      });
      if (showNarahubung) {
        narahubungList.forEach((person, idx) => {
          if (!person.name.trim()) {
            throw new Error(`Nama pada Narahubung #${idx + 1} wajib diisi.`);
          }
          if (!person.phone.trim()) {
            throw new Error(`Nomor telepon / WhatsApp pada Narahubung #${idx + 1} wajib diisi.`);
          }
        });
      }
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan pengaturan. Silakan periksa kembali data Anda.');
      return;
    }

    if (!window.confirm('Simpan semua perubahan pengaturan program?')) return;

    requestSudoVerification(async () => {
      setIsSavingSettings(true);
      try {
        // Run pre-flight admin role check
        const isAuthorized = await checkAdminAuthorization();
        if (!isAuthorized) {
          setIsSavingSettings(false);
          return;
        }

        const firstPhaseBase = publicConfig.phases[0] || {
          id: "pemakaman",
          label: "Tahap 1: Lahan Pemakaman Muslim Honjo (10 Kapling / 120 Slot)",
          shortLabel: "Pemakaman Honjo",
          targetJPY: 20000000,
          shortfallLabel: "Masih Dibutuhkan",
          completedLabel: "Lunas (100%)",
          completedDate: "",
          completionAnnouncement: "Alhamdulillah, pembebasan lahan pemakaman telah lunas.",
          subtext: "10 kapling (~300 m² / 120 slot). Target pelunasan 31 Maret 2027."
        };
        
        const secondPhaseBase = publicConfig.phases[1] || {
          id: "tahap2",
          label: "Tahap 2: Fasilitas & Operasional Makam",
          shortLabel: "Fasilitas Makam",
          targetJPY: 5000000,
          shortfallLabel: "Masih Dibutuhkan",
          subtext: "Pengembangan sarana & prasarana pemakaman."
        };

        const phases = [];
        if (enablePhase2) {
          phases.push({
            ...firstPhaseBase,
            label: `Tahap 1: ${(publicConfigInput.phase1Label || firstPhaseBase.shortLabel).trim()}`,
            shortLabel: (publicConfigInput.phase1Label || firstPhaseBase.shortLabel).trim(),
            targetJPY: totalNeedNum
          });
          phases.push({
            ...secondPhaseBase,
            label: `Tahap 2: ${(publicConfigInput.phase2Label || secondPhaseBase.shortLabel).trim()}`,
            shortLabel: (publicConfigInput.phase2Label || secondPhaseBase.shortLabel).trim(),
            targetJPY: renovationNeedNum
          });
        } else {
          phases.push({
            ...firstPhaseBase,
            label: (publicConfigInput.phase1Label || firstPhaseBase.shortLabel).trim(),
            shortLabel: (publicConfigInput.phase1Label || firstPhaseBase.shortLabel).trim(),
            targetJPY: totalNeedNum
          });
        }

        const packages = buildPackages();

        const banks = {
          JP: banksJP.map((bank, index) => ({
            id: `jp${index + 1}`,
            label: bank.label.trim(),
            account: bank.account.trim(),
            name: bank.name.trim(),
            paymentMethod: bank.paymentMethod || 'Japan Post Bank'
          })),
          ID: banksID.map((bank, index) => ({
            id: `id${index + 1}`,
            label: bank.label.trim(),
            account: bank.account.trim(),
            name: bank.name.trim(),
            paymentMethod: bank.paymentMethod || 'BSI'
          }))
        };

        // Normalize Contact Links
        let normalizedWhatsapp = publicConfigInput.whatsapp.trim();
        if (normalizedWhatsapp) {
          if (!normalizedWhatsapp.startsWith('http://') && !normalizedWhatsapp.startsWith('https://')) {
            const cleanNumber = normalizedWhatsapp.replace(/[^0-9]/g, '');
            normalizedWhatsapp = `https://wa.me/${cleanNumber}`;
          }
        }

        let normalizedInstagram = publicConfigInput.instagram.trim();
        if (normalizedInstagram) {
          if (!normalizedInstagram.startsWith('http://') && !normalizedInstagram.startsWith('https://')) {
            const cleanUsername = normalizedInstagram.replace(/^@/, '');
            normalizedInstagram = `https://instagram.com/${cleanUsername}`;
          }
        }

        let normalizedEmail = publicConfigInput.email.trim();
        if (normalizedEmail) {
          if (!normalizedEmail.startsWith('mailto:') && normalizedEmail.includes('@')) {
            normalizedEmail = `mailto:${normalizedEmail}`;
          }
        }

        const cleanSpreadsheetId = spreadsheetIdInput.trim();

        const settingsPayload: any = {
          donationDeadline: Timestamp.fromDate(deadlineDate),
          totalNeed: totalNeedNum,
          baseVerified: baseVerifiedNum,
          jpyToIdrRate: jpyToIdrRateNum,
          renovationNeed: enablePhase2 ? renovationNeedNum : 0,
          ...(cleanSpreadsheetId ? { spreadsheetId: cleanSpreadsheetId } : { spreadsheetId: deleteField() }),
          publicConfig: {
            masjidName: publicConfigInput.masjidName || '',
            shortName: publicConfigInput.shortName || '',
            campaignTitle: `Wakaf Pembangunan ${publicConfigInput.masjidName || ''}`,
            locationText: publicConfigInput.locationText || '',
            footerCredit: publicConfigInput.footerCredit?.trim() || publicConfig.footerCredit || '',
            donorListTitle: publicConfig.donorListTitle || '',
            donorListSubtitleDate: publicConfigInput.donorListSubtitleDate?.trim() || publicConfig.donorListSubtitleDate || '',
            wakafHadith: publicConfig.wakafHadith || '',
            cashPaymentText: publicConfigInput.cashPaymentText?.trim() || 'Donasi tunai dapat diserahkan langsung atau dikonfirmasikan kepada panitia melalui direct message (DM) Instagram @kmiijepang.',
            donationClosedTitle: publicConfig.donationClosedTitle || '',
            donationClosedText: publicConfig.donationClosedText || '',
            logos: publicConfig.logos || [],
            uniqueCode: publicConfig.uniqueCode || 0,
            phases,
            packages,
            banks,
            contactLinks: {
              WHATSAPP: normalizedWhatsapp || '',
              INSTAGRAM: normalizedInstagram || '',
              EMAIL: normalizedEmail || ''
            },
            showNarahubung,
            narahubung: narahubungList.map((person, index) => {
              const cleanPhone = person.phone.trim();
              let cleanHref = person.href?.trim() || '';
              if (!cleanHref && cleanPhone) {
                const digits = cleanPhone.replace(/[^0-9]/g, '');
                if (digits) cleanHref = `https://wa.me/${digits}`;
              }
              return {
                id: person.id || `contact_${index + 1}`,
                name: person.name.trim(),
                region: person.region?.trim() || '',
                phone: cleanPhone,
                href: cleanHref
              };
            })
          }
        };

        const targetCampId = currentCampaignId || 'pemakaman';
        await setDoc(doc(db, 'campaigns', targetCampId), {
          ...settingsPayload,
          id: targetCampId,
          updatedAt: Timestamp.now()
        }, { merge: true });

        if (targetCampId === 'pemakaman') {
          await setDoc(doc(db, 'stats', 'global'), settingsPayload, { merge: true });
        }
        alert('Pengaturan berhasil diperbarui!');
      } catch (e) {
        console.error('Failed to save settings:', e);
        alert(e instanceof Error ? e.message : 'Gagal menyimpan pengaturan. Silakan coba lagi.');
        handleFirestoreError(e, OperationType.UPDATE, `campaigns/${currentCampaignId || 'pemakaman'}`);
      } finally {
        setIsSavingSettings(false);
      }
    });
  };

  // Client-side search (for Name/Phone), while Status/Payment are handled server-side
  const filteredDonations = donations.filter((d) => {
    const matchesSearch = searchQuery === '' || 
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.phone?.includes(searchQuery) ||
      d.loc?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const q = query(collection(db, 'donations'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const allDonations = querySnapshot.docs.map((docSnap): DonationRecord => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: String(data.name || 'Hamba Allah'),
          email: data.email,
          amount: Number(data.amount || 0),
          date: data.date?.toDate ? data.date.toDate().toLocaleString('id-ID') : 'Baru saja',
          status: data.status === 'verified' ? 'verified' : 'pending',
          loc: data.loc,
          phone: data.phone,
          isAnonymous: data.isAnonymous,
          proofUrl: data.proofUrl,
          package: data.package,
          paymentMethod: data.paymentMethod,
          remarks: data.remarks
        };
      });

      const donationsToExport = allDonations.filter((d) => 
        (filterStatus === 'all' || d.status === filterStatus) && 
        (filterPayment === 'all' || d.paymentMethod === filterPayment)
      );

      if (donationsToExport.length === 0) {
        alert("Tidak ada data donasi untuk diekspor dengan filter saat ini.");
        return;
      }

      const headers = ['Tanggal', 'Status', 'Nama', 'Nominal (JPY)', 'Mata Uang Asal', 'Nominal Asal', 'Metode Pembayaran', 'Program/Paket', 'No. HP/WA', 'Domisili', 'Email', 'Remarks'];
      const rows = donationsToExport.map((d) => [
        `"${d.date || ''}"`,
        `"${d.status || ''}"`,
        `"${d.name || ''}"`,
        `"${d.amount || ''}"`,
        `"${d.originalCurrency || 'JPY'}"`,
        `"${d.originalAmount || d.amount || ''}"`,
        `"${d.paymentMethod || ''}"`,
        `"${d.package || ''}"`,
        `"'${d.phone || ''}"`, 
        `"${d.loc || ''}"`,
        `"${d.email || ''}"`,
        `"${d.remarks || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Data_Donasi_${publicConfig.shortName}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Terjadi kesalahan saat mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEditClick = (donor: DonationRecord) => {
    setEditingDonation({ ...donor });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingDonation) return;
    const amountNum = Number(editingDonation.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Nominal donasi harus berupa angka yang valid.");
      return;
    }
    
    try {
      // Run pre-flight admin check
      const isAuthorized = await checkAdminAuthorization();
      if (!isAuthorized) return;

      const docRef = doc(db, 'donations', editingDonation.id);
      const updateData = {
        name: editingDonation.name,
        amount: amountNum,
        status: (editingDonation.status === 'verified' ? 'verified' : 'pending') as DonationStatus,
        phone: editingDonation.phone || '',
        loc: editingDonation.loc || '',
        package: editingDonation.package || '',
        paymentMethod: editingDonation.paymentMethod || '',
        email: editingDonation.email || '',
        remarks: editingDonation.remarks || ''
      };
      await updateDoc(docRef, updateData);
      await recalculateStats();
      setEditDialogOpen(false);
      setEditingDonation(null);
    } catch (e) {
      console.error('Failed to update donation:', e);
      alert('Gagal memperbarui data donasi. Silakan periksa koneksi Anda dan coba lagi.');
      handleFirestoreError(e, OperationType.UPDATE, `donations/${editingDonation.id}`);
    }
  };

  const recalculateStats = async () => {
    try {
      const targetCampId = currentCampaignId || 'pemakaman';
      const q = query(collection(db, 'donations'), where('campaignId', '==', targetCampId));
      const snapshot = await getDocs(q);
      let totalVerified = 0;
      let totalPending = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const amt = Number(data.amount) || 0;
        if (data.status === 'verified') {
          totalVerified += amt;
        } else if (data.status === 'pending') {
          totalPending += amt;
        }
      });
      await setDoc(doc(db, 'campaigns', targetCampId), {
        totalVerifiedAmount: totalVerified,
        totalPendingAmount: totalPending,
        lastUpdate: Timestamp.now()
      }, { merge: true });

      if (targetCampId === 'pemakaman') {
        await setDoc(doc(db, 'stats', 'global'), {
          totalVerifiedAmount: totalVerified,
          totalPendingAmount: totalPending,
          lastUpdate: Timestamp.now()
        }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to recalculate stats:', err);
    }
  };

  React.useEffect(() => {
    recalculateStats();
  }, [currentCampaignId]);

  const toggleDonaturTab = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsTogglingDonatur(true);
    try {
      // Run pre-flight admin check
      const isAuthorized = await checkAdminAuthorization();
      if (!isAuthorized) {
        setIsTogglingDonatur(false);
        return;
      }
      const targetCampId = currentCampaignId || 'pemakaman';
      await setDoc(doc(db, 'campaigns', targetCampId), {
        showDonaturTab: newValue,
        updatedAt: Timestamp.now()
      }, { merge: true });

      if (targetCampId === 'pemakaman') {
        await setDoc(doc(db, 'stats', 'global'), {
          showDonaturTab: newValue
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to toggle Donatur tab:', error);
      alert('Gagal mengubah pengaturan! Pastikan Anda terhubung ke internet dan memiliki akses admin.');
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${currentCampaignId || 'pemakaman'}`);
    } finally {
      setIsTogglingDonatur(false);
    }
  };

  const handleStartNewCampaign = () => {
    if (!window.confirm('Mulai program baru? Semua data donasi lama akan dihapus dan total dana direset ke 0. Admin user dan konfigurasi program tetap disimpan.')) return;

    requestSudoVerification(async () => {
      setIsResettingCampaign(true);
      try {
        // Run pre-flight superadmin check
        const isAuthorized = await checkSuperAdminAuthorization();
        if (!isAuthorized) {
          setIsResettingCampaign(false);
          return;
        }

        const snapshot = await getDocs(collection(db, 'donations'));
        let batch = writeBatch(db);
        let operations = 0;

        for (const donationDoc of snapshot.docs) {
          batch.delete(donationDoc.ref);
          operations += 1;
          if (operations === 450) {
            await batch.commit();
            batch = writeBatch(db);
            operations = 0;
          }
        }

        if (operations > 0) await batch.commit();

        await setDoc(doc(db, 'stats', 'global'), {
          baseVerified: 0,
          totalVerifiedAmount: 0,
          totalPendingAmount: 0,
          lastUpdate: Timestamp.now()
        }, { merge: true });
        alert('Program baru berhasil dimulai!');
      } catch (error) {
        console.error('Failed to start new campaign:', error);
        alert('Gagal memulai program baru. Silakan coba lagi.');
        handleFirestoreError(error, OperationType.DELETE, 'donations');
      } finally {
        setIsResettingCampaign(false);
      }
    });
  };

  const isPhase1Complete = totalPercentage >= 100;
  const showSecondaryPhase = Boolean(isPhase1Complete && secondaryPhase);
  const activePhaseLabel = publicConfig.phases.length > 1
    ? (showSecondaryPhase ? 'Tahap 2' : 'Tahap 1')
    : '';
  const paymentFilterOptions = Array.from(new Set([
    ...publicConfig.banks.JP.map((bank) => bank.paymentMethod || bank.label),
    ...publicConfig.banks.ID.map((bank) => bank.paymentMethod || bank.label),
    'Tunai'
  ]));

  return (
    <Box sx={{ minHeight: '100%', bgcolor: c.well }}>
      {/* Masthead */}
      <Box sx={{ pt: 4, px: 2.5, bgcolor: c.paper, borderBottom: `1px solid ${c.ruleStrong}` }}>
        {/* Campaign Switcher Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 2, borderBottom: `1px solid ${c.rule}`, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, maxWidth: 360 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Pilih Program / Campaign"
              value={currentCampaignId}
              onChange={(e) => onSelectCampaign && onSelectCampaign(e.target.value)}
              sx={{ bgcolor: c.well }}
            >
              {(campaigns.length > 0 ? campaigns : [{ id: 'pemakaman', shortName: 'Pemakaman Honjo', title: 'Wakaf Pemakaman Muslim Honjo' }]).map((camp) => (
                <MenuItem key={camp.id} value={camp.id}>
                  {camp.shortName || camp.title || camp.id}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {isSuperAdmin && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<Plus size={14} />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ ...eyebrow, fontSize: '0.625rem', bgcolor: c.forest, color: c.paper, height: 38, '&:hover': { bgcolor: c.forestDeep } }}
              >
                Program Baru
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setCloneDialogOpen(true)}
                sx={{ ...eyebrow, fontSize: '0.625rem', color: c.ink, borderColor: c.ruleStrong, height: 38 }}
              >
                Duplikasi Program
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Eyebrow tone="brass">Panel Panitia</Eyebrow>
            <Typography variant="h2" sx={{ mt: 0.5, color: c.ink }}>Administrasi Wakaf</Typography>
            <Typography sx={{ mt: 0.5, fontSize: '0.6875rem', fontWeight: 600, color: c.inkFaint, ...tnum }}>
              {donations.length} data dimuat · {donations.filter((d) => d.status === 'pending').length} menunggu verifikasi
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {spreadsheetId && spreadsheetId.trim() ? (
              <Tooltip title="Buka Google Sheet">
                <Button
                  component="a"
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small" variant="outlined"
                  sx={{ height: 32, px: 1.25, color: c.inkMuted }}
                >
                  <ExternalLink size={16} />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Ekspor ke CSV">
                <Button
                  size="small" variant="outlined" onClick={handleExportCSV}
                  disabled={isExporting}
                  sx={{ height: 32, px: 1.25, color: c.inkMuted }}
                >
                  {isExporting ? <Eyebrow sx={{ fontSize: '0.5625rem' }}>…</Eyebrow> : <Download size={16} />}
                </Button>
              </Tooltip>
            )}
            <Button
              size="small" variant="outlined" onClick={() => auth.signOut()}
              sx={{ height: 32, px: 1.5, ...eyebrow, fontSize: '0.5625rem', color: c.danger, borderColor: c.danger, '&:hover': { borderColor: c.danger, bgcolor: c.dangerTint } }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Tabs — underlined, not pills */}
        <Box sx={{ display: 'flex' }}>
          {([
            { id: 'donations' as const, label: 'Donasi' },
            { id: 'settings' as const, label: 'Pengaturan' },
          ]).map((tab) => {
            const isActive = adminTab === tab.id;
            return (
              <Box
                key={tab.id}
                component="button"
                type="button"
                aria-pressed={isActive}
                onClick={() => setAdminTab(tab.id)}
                sx={{
                  px: 0,
                  mr: 3,
                  pb: 1.25,
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  borderBottom: `2px solid ${isActive ? c.forest : 'transparent'}`,
                  color: isActive ? c.forest : c.inkMuted,
                  transition: 'color 150ms ease, border-color 150ms ease',
                  '&:hover': { color: c.forest },
                }}
              >
                <Box component="span" sx={{ ...eyebrow, fontSize: '0.625rem', color: 'inherit', whiteSpace: 'nowrap' }}>{tab.label}</Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {adminTab === 'donations' ? (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Programme status ledger */}
          <Box component="section" sx={{ bgcolor: c.paper, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2, py: 1, bgcolor: c.well, borderBottom: `1px solid ${c.ruleStrong}`, borderRadius: `${radius.lg} ${radius.lg} 0 0` }}>
              <Eyebrow tone="ink" sx={{ fontSize: '0.5625rem' }}>Status Program</Eyebrow>
              <StatusTag state="verified" label={`${activePhaseLabel || 'Program'} Aktif`} />
            </Box>
            <Box sx={{ px: 2, py: 1 }}>
              <LedgerRow
                label="Total Terverifikasi"
                value={<Figure size="1.125rem">{formatJPY(verifiedAmount)}</Figure>}
              />
              <LedgerRow
                label={activePhaseLabel || 'Progress'}
                value={<Figure size="1.125rem" tone={c.forest}>{`${(showSecondaryPhase ? renovationPercentage : totalPercentage).toFixed(1)}%`}</Figure>}
              />
              <LedgerRow
                label="Menunggu Verifikasi"
                value={
                  <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.pending, ...tnum }}>
                    {donations.filter((d) => d.status === 'pending').length} data
                  </Typography>
                }
                last={!showSecondaryPhase}
              />
              {showSecondaryPhase && (
                <LedgerRow
                  label="Shortfall Tahap 2"
                  value={<Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.danger, ...tnum }}>{formatJPY(renovationShortfall)}</Typography>}
                  last
                />
              )}
            </Box>
          </Box>

          {/* Search + filters */}
          <Box component="section">
            <SectionHeading title="Cari & Filter" meta={`${filteredDonations.length} hasil`} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <TextField
                fullWidth size="small" placeholder="Cari nama, no. HP, atau lokasi…"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} color={c.inkFaint} />
                      </InputAdornment>
                    ),
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
                <TextField
                  select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{ flex: 1, minWidth: 140 }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Filter size={13} color={c.inkFaint} /></InputAdornment> } }}
                >
                  <MenuItem value="all">Semua Status</MenuItem>
                  <MenuItem value="verified">Terverifikasi</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </TextField>
                <TextField
                  select size="small" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}
                  sx={{ flex: 1, minWidth: 160 }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Wallet size={13} color={c.inkFaint} /></InputAdornment> } }}
                >
                  <MenuItem value="all">Semua Metode</MenuItem>
                  {paymentFilterOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>

          {/* Donation records */}
          <Box component="section">
            <SectionHeading title="Catatan Donasi" meta={`${filteredDonations.length} / ${donations.length}`} />
            <Box sx={{ bgcolor: c.paper, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.875, bgcolor: c.well, borderBottom: `1px solid ${c.ruleStrong}` }}>
                <Eyebrow sx={{ fontSize: '0.5625rem' }}>Donatur</Eyebrow>
                <Eyebrow sx={{ fontSize: '0.5625rem' }}>Nominal</Eyebrow>
              </Box>

              {filteredDonations.length === 0 && (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Eyebrow>Tidak ada data yang cocok</Eyebrow>
                </Box>
              )}

              {filteredDonations.map((donor, idx) => (
                <Box key={donor.id} sx={{ borderTop: idx === 0 ? 'none' : `1px solid ${c.ruleStrong}` }}>
                  <Box sx={{ px: 2, pt: 1.5, pb: 1.25, display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
                      <Typography component="span" sx={{ fontFamily: mono, fontSize: '0.6875rem', color: c.inkFaint, pt: '2px', ...tnum }}>
                        {String(idx + 1).padStart(2, '0')}
                      </Typography>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.ink, letterSpacing: '-0.01em' }}>
                          {donor.name}
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: '0.6875rem', color: c.inkMuted, ...tnum }}>
                          {donor.date}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Figure size="0.9375rem" sx={{ display: 'block' }}>{formatJPY(donor.amount)}</Figure>
                      {donor.originalCurrency === 'IDR' && donor.originalAmount && (
                        <Typography sx={{ fontSize: '0.625rem', color: c.inkFaint, mt: 0.25, ...tnum }}>
                          ≈ Rp {Number(donor.originalAmount).toLocaleString('id-ID')}
                        </Typography>
                      )}
                      <Box sx={{ mt: 0.5 }}>
                        <StatusTag
                          state={donor.status === 'verified' ? 'verified' : 'pending'}
                          label={donor.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Record detail — plain label/value pairs, no icon chips */}
                  <Box sx={{ px: 2, pb: 1.25, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                    {[
                      { label: 'WhatsApp', value: donor.phone || '—', code: true },
                      { label: 'Paket', value: donor.package || 'Donasi' },
                      { label: 'Metode', value: donor.paymentMethod || 'Tunai' },
                      { label: 'Domisili', value: donor.loc || 'Japan' },
                    ].map((field) => (
                      <Box key={field.label} sx={{ minWidth: 0 }}>
                        <Eyebrow sx={{ fontSize: '0.5rem' }}>{field.label}</Eyebrow>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: c.ink, fontFamily: field.code ? mono : undefined, ...tnum }}>
                          {field.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {donor.remarks && (
                    <Box sx={{ mx: 2, mb: 1.25, px: 1.25, py: 0.875, bgcolor: c.pendingTint, borderLeft: `3px solid ${c.pending}`, borderRadius: `0 ${radius.md} ${radius.md} 0` }}>
                      <Eyebrow sx={{ fontSize: '0.5rem', color: c.pending }}>Catatan Admin</Eyebrow>
                      <Typography sx={{ mt: 0.25, fontSize: '0.75rem', fontWeight: 500, color: c.ink, lineHeight: 1.5 }}>
                        {donor.remarks}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ borderTop: `1px solid ${c.rule}`, px: 1, py: 0.75, display: 'flex', gap: 0.75, bgcolor: c.well }}>
                    <Tooltip title="Edit data">
                      <Button
                        onClick={() => handleEditClick(donor)}
                        variant="outlined" size="small"
                        sx={{ px: 1, minWidth: 34, color: c.inkMuted }}
                      >
                        <Pencil size={15} />
                      </Button>
                    </Tooltip>

                    {donor.proofUrl && (
                      <Button
                        component="a" href={donor.proofUrl} target="_blank" rel="noreferrer"
                        variant="outlined" size="small" fullWidth
                        startIcon={<ExternalLink size={13} />}
                        sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.inkMuted }}
                      >
                        Bukti
                      </Button>
                    )}

                    {donor.status === 'pending' && (
                      <Button
                        variant="contained" size="small" fullWidth
                        onClick={async () => {
                          try {
                            // Run pre-flight admin check
                            const isAuthorized = await checkAdminAuthorization();
                            if (!isAuthorized) return;

                            await updateDoc(doc(db, 'donations', donor.id), { status: 'verified' });
                            await recalculateStats();
                          } catch (e) {
                            console.error('Failed to verify donation:', e);
                            alert('Gagal memverifikasi donasi. Silakan coba lagi.');
                            handleFirestoreError(e, OperationType.UPDATE, `donations/${donor.id}`);
                          }
                        }}
                        startIcon={<CheckCircle2 size={13} />}
                        sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.paper }}
                      >
                        Verifikasi
                      </Button>
                    )}

                    <Tooltip title="Hapus donasi">
                      <Button
                        onClick={async () => {
                          if (window.confirm('Hapus donasi ini?')) {
                            try {
                              // Run pre-flight admin check
                              const isAuthorized = await checkAdminAuthorization();
                              if (!isAuthorized) return;

                              await deleteDoc(doc(db, 'donations', donor.id));
                              await recalculateStats();
                            } catch (e) {
                              console.error('Failed to delete donation:', e);
                              alert('Gagal menghapus donasi. Silakan coba lagi.');
                              handleFirestoreError(e, OperationType.DELETE, `donations/${donor.id}`);
                            }
                          }
                        }}
                        variant="outlined" size="small"
                        sx={{ px: 1, minWidth: 34, color: c.danger, borderColor: c.danger, '&:hover': { borderColor: c.danger, bgcolor: c.dangerTint } }}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Load more */}
          {hasMore && onLoadMore && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined" onClick={onLoadMore}
                sx={{ ...eyebrow, fontSize: '0.625rem', color: c.ink, px: 3, py: 1, bgcolor: c.paper }}
              >
                Muat Lebih Banyak
              </Button>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint, ...tnum }}>
                Menampilkan {donations.length} data terbaru
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Group 1: Informasi Umum & Tanggal */}
          <Card sx={{ p: 2.25, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, bgcolor: c.paper }}>
            <SectionHeading title="Informasi Umum & Tanggal" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small" label="Nama Program / Lembaga" value={publicConfigInput.masjidName}
                  onChange={(e) => updatePublicConfigInput('masjidName', e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small" label="Nama Pendek" value={publicConfigInput.shortName}
                  onChange={(e) => updatePublicConfigInput('shortName', e.target.value)}
                  fullWidth
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small" label="Lokasi" value={publicConfigInput.locationText}
                  onChange={(e) => updatePublicConfigInput('locationText', e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small" label="Teks Kredit Footer" value={publicConfigInput.footerCredit}
                  onChange={(e) => updatePublicConfigInput('footerCredit', e.target.value)}
                  helperText="Tampil di bagian paling bawah halaman footer"
                  fullWidth
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small" 
                  label="Subtitle Daftar Donatur" 
                  value={publicConfigInput.donorListSubtitleDate}
                  onChange={(e) => updatePublicConfigInput('donorListSubtitleDate', e.target.value)}
                  helperText="Tampil di tab Daftar Donatur (misal: 21 September 2027)"
                  fullWidth
                />
                <TextField
                  size="small" label="Target Pelunasan Program" type="datetime-local"
                  value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              </Box>
              <Divider sx={{ my: 1 }} />
              <FormControlLabel
                control={
                  <Switch 
                    checked={Boolean(showDonaturTab)} 
                    onChange={toggleDonaturTab} 
                    disabled={isTogglingDonatur}
                    color="primary" 
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      Publikasi Tab Donatur
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Aktifkan untuk menampilkan menu daftar donatur terverifikasi di halaman publik
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, opacity: isTogglingDonatur ? 0.6 : 1 }}
              />
            </Box>
          </Card>

              {/* Group 2: Fase & Paket Wakaf */}
              <Card sx={{ p: 2.25, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, bgcolor: c.paper }}>
                <SectionHeading title="Pengaturan Fase & Paket Wakaf" />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enablePhase2}
                        onChange={(e) => setEnablePhase2(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Aktifkan Tahap 2
                      </Typography>
                    }
                    sx={{ m: 0, display: 'flex', alignSelf: 'flex-start' }}
                  />
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      size="small" label={enablePhase2 ? "Nama Tahap 1" : "Nama Program"} value={publicConfigInput.phase1Label}
                      onChange={(e) => updatePublicConfigInput('phase1Label', e.target.value)}
                      fullWidth
                    />
                    {enablePhase2 && (
                      <TextField
                        size="small" label="Nama Tahap 2" value={publicConfigInput.phase2Label}
                        onChange={(e) => updatePublicConfigInput('phase2Label', e.target.value)}
                        fullWidth
                      />
                    )}
                  </Box>
                  <Eyebrow sx={{ mt: 0.5 }}>Harga Paket Donasi (JPY)</Eyebrow>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      size="small" label="Paket Bersama (JPY)" type="number" value={publicConfigInput.packageBulananPrice}
                      onChange={(e) => updatePublicConfigInput('packageBulananPrice', e.target.value)}
                      helperText="Default: ¥3,000"
                      fullWidth
                    />
                    <TextField
                      size="small" label="Paket Reguler (JPY)" type="number" value={publicConfigInput.packageSekaliPrice}
                      onChange={(e) => updatePublicConfigInput('packageSekaliPrice', e.target.value)}
                      helperText="Default: ¥10,000"
                      fullWidth
                    />
                    <TextField
                      size="small" label="Paket 1 Slot Makam (JPY)" type="number" value={publicConfigInput.package1SlotPrice}
                      onChange={(e) => updatePublicConfigInput('package1SlotPrice', e.target.value)}
                      helperText="Default: ¥320,000"
                      fullWidth
                    />
                  </Box>
                </Box>
              </Card>

              {/* Group 3: Target & Kurs Konversi */}
              <Card sx={{ p: 2.25, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, bgcolor: c.paper }}>
                <SectionHeading title="Target Donasi & Keuangan" />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      size="small" label="Target Tahap 1 (JPY)" type="number"
                      value={totalNeedInput} onChange={(e) => setTotalNeedInput(e.target.value)}
                      fullWidth
                    />
                    {enablePhase2 && (
                      <TextField
                        size="small" label="Target Tahap 2 (JPY)" type="number"
                        value={renovationNeedInput} onChange={(e) => setRenovationNeedInput(e.target.value)}
                        fullWidth
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      size="small" label="Dana Awal Terverifikasi (JPY)" type="number"
                      value={baseVerifiedInput} onChange={(e) => setBaseVerifiedInput(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      size="small" label="Kurs Konversi JPY ke IDR (1 JPY = ... IDR)" type="number"
                      value={jpyToIdrRateInput} onChange={(e) => setJpyToIdrRateInput(e.target.value)}
                      fullWidth
                    />
                  </Box>
                  <TextField
                    size="small" label="Google Spreadsheet ID (Opsional)" 
                    value={spreadsheetIdInput} onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                    helperText="Jika dikosongkan, sinkronisasi ke Google Sheet tidak akan berjalan."
                    fullWidth
                  />
                </Box>
              </Card>

              {/* Group 4: Rekening & Kontak */}
              <Card sx={{ p: 2.25, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, bgcolor: c.paper }}>
                <SectionHeading title="Rekening Pembayaran & Kontak" />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  
                  {/* Rekening Jepang */}
                  <Eyebrow tone="ink">Daftar Rekening Jepang (JP)</Eyebrow>
                  {banksJP.length === 0 ? (
                    <Typography sx={{ fontSize: '0.75rem', color: c.inkFaint, mb: 0.5 }}>
                      Belum ada rekening Jepang dikonfigurasi. Tambahkan dengan tombol di bawah.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {banksJP.map((bank, index) => (
                        <Card key={bank.id || index} sx={{ p: 1.75, bgcolor: c.well, border: `1px solid ${c.rule}`, borderRadius: radius.md }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Eyebrow tone="ink" sx={{ fontSize: '0.5625rem' }}>Rekening JP {String(index + 1).padStart(2, '0')}</Eyebrow>
                            <IconButton size="small" color="error" onClick={() => handleRemoveBank('JP', index)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                              <TextField
                                size="small"
                                label="Nama Bank / Institusi"
                                placeholder="Contoh: JP Post"
                                value={bank.label}
                                onChange={(e) => handleUpdateBank('JP', index, 'label', e.target.value)}
                                fullWidth
                                required
                              />
                              <TextField
                                size="small"
                                label="Nomor Rekening"
                                placeholder="Contoh: 12345"
                                value={bank.account}
                                onChange={(e) => handleUpdateBank('JP', index, 'account', e.target.value)}
                                fullWidth
                                required
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                              <TextField
                                size="small"
                                label="Nama Pemilik Rekening"
                                placeholder="Contoh: KOGANEI MOSQUE"
                                value={bank.name}
                                onChange={(e) => handleUpdateBank('JP', index, 'name', e.target.value)}
                                fullWidth
                                required
                              />
                              <TextField
                                size="small"
                                label="Nama Singkat Metode (Opsional)"
                                placeholder="Contoh: JP Post (Default: Nama Bank)"
                                value={bank.paymentMethod || ''}
                                onChange={(e) => handleUpdateBank('JP', index, 'paymentMethod', e.target.value)}
                                fullWidth
                              />
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={() => handleAddBank('JP')}
                    sx={{ alignSelf: 'flex-start', mt: 0.5, mb: 1, ...eyebrow, fontSize: '0.5625rem', color: c.ink }}
                  >
                    Tambah Rekening Jepang
                  </Button>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Rekening Indonesia */}
                  <Eyebrow tone="ink">Daftar Rekening Indonesia (ID)</Eyebrow>
                  {banksID.length === 0 ? (
                    <Typography sx={{ fontSize: '0.75rem', color: c.inkFaint, mb: 0.5 }}>
                      Belum ada rekening Indonesia dikonfigurasi. Tambahkan dengan tombol di bawah.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {banksID.map((bank, index) => (
                        <Card key={bank.id || index} sx={{ p: 1.75, bgcolor: c.well, border: `1px solid ${c.rule}`, borderRadius: radius.md }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Eyebrow tone="ink" sx={{ fontSize: '0.5625rem' }}>Rekening ID {String(index + 1).padStart(2, '0')}</Eyebrow>
                            <IconButton size="small" color="error" onClick={() => handleRemoveBank('ID', index)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                              <TextField
                                size="small"
                                label="Nama Bank"
                                placeholder="Contoh: Bank Muamalat"
                                value={bank.label}
                                onChange={(e) => handleUpdateBank('ID', index, 'label', e.target.value)}
                                fullWidth
                                required
                              />
                              <TextField
                                size="small"
                                label="Nomor Rekening"
                                placeholder="Contoh: 3130007650"
                                value={bank.account}
                                onChange={(e) => handleUpdateBank('ID', index, 'account', e.target.value)}
                                fullWidth
                                required
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                              <TextField
                                size="small"
                                label="Nama Pemilik Rekening"
                                placeholder="Contoh: Yakesma Jepang"
                                value={bank.name}
                                onChange={(e) => handleUpdateBank('ID', index, 'name', e.target.value)}
                                fullWidth
                                required
                              />
                              <TextField
                                size="small"
                                label="Nama Singkat Metode (Opsional)"
                                placeholder="Contoh: Muamalat (Default: Nama Bank)"
                                value={bank.paymentMethod || ''}
                                onChange={(e) => handleUpdateBank('ID', index, 'paymentMethod', e.target.value)}
                                fullWidth
                              />
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={() => handleAddBank('ID')}
                    sx={{ alignSelf: 'flex-start', mt: 0.5, mb: 1, ...eyebrow, fontSize: '0.5625rem', color: c.ink }}
                  >
                    Tambah Rekening Indonesia
                  </Button>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Instruksi Pembayaran Tunai */}
                  <Eyebrow tone="ink">Instruksi Pembayaran Tunai</Eyebrow>
                  <TextField
                    size="small"
                    label="Teks Instruksi Pembayaran Tunai"
                    placeholder="Contoh: Donasi tunai dapat diserahkan langsung atau dikonfirmasikan kepada panitia melalui..."
                    value={publicConfigInput.cashPaymentText}
                    onChange={(e) => updatePublicConfigInput('cashPaymentText', e.target.value)}
                    multiline
                    rows={2}
                    helperText="Tampil saat donatur memilih metode pembayaran Tunai di halaman donasi"
                    fullWidth
                  />

                  <Divider sx={{ my: 1.5 }} />

                  {/* Kontak Link */}
                  <Eyebrow tone="ink">Kontak & Media Sosial Program</Eyebrow>
                  <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      size="small" 
                      label="WhatsApp" 
                      placeholder="Contoh: 819063482803 atau link wa.me" 
                      value={publicConfigInput.whatsapp}
                      onChange={(e) => updatePublicConfigInput('whatsapp', e.target.value)}
                      helperText="Masukkan nomor saja (tanpa + atau -) atau link wa.me lengkap"
                      fullWidth
                    />
                    <TextField
                      size="small" 
                      label="Email" 
                      placeholder="Contoh: info@domain.com atau link mailto:" 
                      value={publicConfigInput.email}
                      onChange={(e) => updatePublicConfigInput('email', e.target.value)}
                      helperText="Masukkan alamat email atau link mailto: lengkap"
                      fullWidth
                    />
                  </Box>
                  <TextField
                    size="small" 
                    label="Instagram" 
                    placeholder="Contoh: kmiijepang atau link instagram.com" 
                    value={publicConfigInput.instagram}
                    onChange={(e) => updatePublicConfigInput('instagram', e.target.value)}
                    helperText="Masukkan username Instagram (opsional diawali @) atau link lengkap"
                    fullWidth
                  />

                  <Divider sx={{ my: 2 }} />

                  {/* Narahubung Panitia (Footer) */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                      <Eyebrow tone="ink">Narahubung Panitia (Footer)</Eyebrow>
                      <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, mt: 0.25 }}>
                        Tampilkan atau sembunyikan kontak panitia di bagian footer website publik.
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showNarahubung}
                          onChange={(e) => setShowNarahubung(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: c.ink }}>{showNarahubung ? 'Tampilkan' : 'Sembunyikan'}</Typography>}
                      labelPlacement="start"
                      sx={{ m: 0 }}
                    />
                  </Box>

                  {showNarahubung && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      {narahubungList.length === 0 ? (
                        <Typography sx={{ fontSize: '0.75rem', color: c.inkFaint }}>
                          Belum ada narahubung dikonfigurasi. Tambahkan dengan tombol di bawah.
                        </Typography>
                      ) : (
                        narahubungList.map((person, index) => (
                          <Card key={person.id || index} sx={{ p: 1.75, bgcolor: c.well, border: `1px solid ${c.rule}`, borderRadius: radius.md }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Eyebrow tone="ink" sx={{ fontSize: '0.5625rem' }}>Narahubung {String(index + 1).padStart(2, '0')}</Eyebrow>
                              <IconButton size="small" color="error" onClick={() => handleRemoveNarahubung(index)}>
                                <Trash2 size={16} />
                              </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                                  size="small"
                                  label="Nama Narahubung"
                                  placeholder="Contoh: Cak Anas"
                                  value={person.name}
                                  onChange={(e) => handleUpdateNarahubung(index, 'name', e.target.value)}
                                  fullWidth
                                  required
                                />
                                <TextField
                                  size="small"
                                  label="Wilayah / Jabatan"
                                  placeholder="Contoh: Ibaraki / Kanto"
                                  value={person.region}
                                  onChange={(e) => handleUpdateNarahubung(index, 'region', e.target.value)}
                                  fullWidth
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                                  size="small"
                                  label="Nomor Telepon / WhatsApp"
                                  placeholder="Contoh: +81 90-9684-5955"
                                  value={person.phone}
                                  onChange={(e) => handleUpdateNarahubung(index, 'phone', e.target.value)}
                                  fullWidth
                                  required
                                />
                                <TextField
                                  size="small"
                                  label="Link WhatsApp / Kontak (Opsional)"
                                  placeholder="Contoh: https://wa.me/819096845955"
                                  value={person.href || ''}
                                  onChange={(e) => handleUpdateNarahubung(index, 'href', e.target.value)}
                                  helperText="Otomatis dibuat dari nomor telepon jika dikosongkan"
                                  fullWidth
                                />
                              </Box>
                            </Box>
                          </Card>
                        ))
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Plus size={14} />}
                        onClick={handleAddNarahubung}
                        sx={{ alignSelf: 'flex-start', mt: 0.5, ...eyebrow, fontSize: '0.5625rem', color: c.ink }}
                      >
                        Tambah Narahubung
                      </Button>
                    </Box>
                  )}
                </Box>
              </Card>

              {/* Group 5: Advanced & Reset Program */}
              {isSuperAdmin && (
                <Card sx={{ p: 2.25, border: `1px solid ${c.rule}`, borderLeft: `3px solid ${c.danger}`, borderRadius: `0 ${radius.lg} ${radius.lg} 0`, bgcolor: c.paper }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, pb: 1, mb: 1.5, borderBottom: `1px solid ${c.rule}` }}>
                    <Eyebrow sx={{ color: c.danger }}>Tindakan Lanjutan</Eyebrow>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.danger }}>Tidak dapat dibatalkan</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.4 }}>
                      Mulai program baru akan menghapus semua records donasi yang ada dan mengatur total dana terkumpul kembali ke 0. User admin dan konfigurasi program akan tetap dipertahankan.
                    </Typography>
                    <Button
                      variant="outlined" size="small"
                      onClick={handleStartNewCampaign}
                      disabled={isResettingCampaign}
                      sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.danger, borderColor: c.danger, whiteSpace: 'nowrap', px: 2.5, py: 1, '&:hover': { borderColor: c.danger, bgcolor: c.dangerTint } }}
                    >
                      {isResettingCampaign ? 'Mereset…' : 'Reset Program'}
                    </Button>
                  </Box>
                </Card>
              )}

              {/* Save Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveSettings} disabled={isSavingSettings}
                  sx={{ ...eyebrow, fontSize: '0.6875rem', color: c.paper, px: 4, py: 1.375 }}
                >
                  {isSavingSettings ? 'Menyimpan…' : 'Simpan Perubahan'}
                </Button>
              </Box>
        </Box>
      )}

      {/* Edit Donation Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ borderBottom: `1px solid ${c.rule}` }}>Edit Data Donasi</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingDonation && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField label="Nama Donatur" fullWidth value={editingDonation.name} onChange={(e) => setEditingDonation({...editingDonation, name: e.target.value})} />
              <TextField label="Nominal (JPY)" type="number" fullWidth value={editingDonation.amount} onChange={(e) => setEditingDonation({...editingDonation, amount: e.target.value})} />
              <TextField select label="Status Verifikasi" fullWidth value={editingDonation.status} onChange={(e) => setEditingDonation({...editingDonation, status: e.target.value as DonationStatus})}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
              </TextField>
              <TextField label="Email" fullWidth type="email" value={editingDonation.email || ''} onChange={(e) => setEditingDonation({...editingDonation, email: e.target.value})} />
              <TextField label="No. Handphone/WA" fullWidth value={editingDonation.phone || ''} onChange={(e) => setEditingDonation({...editingDonation, phone: e.target.value})} />
              <TextField label="Domisili" fullWidth value={editingDonation.loc || ''} onChange={(e) => setEditingDonation({...editingDonation, loc: e.target.value})} />
              <TextField label="Program/Paket" fullWidth value={editingDonation.package || ''} onChange={(e) => setEditingDonation({...editingDonation, package: e.target.value})} />
              <TextField label="Metode Pembayaran" fullWidth value={editingDonation.paymentMethod || ''} onChange={(e) => setEditingDonation({...editingDonation, paymentMethod: e.target.value})} />
              <TextField label="Remarks (Catatan Khusus)" fullWidth multiline rows={3} value={editingDonation.remarks || ''} onChange={(e) => setEditingDonation({...editingDonation, remarks: e.target.value})} placeholder="Contoh: Nominal tidak sesuai bukti transfer / Nama disingkat." />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${c.rule}`, bgcolor: c.well }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.inkMuted }}>Batal</Button>
          <Button onClick={handleEditSave} variant="contained" sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.paper, px: 2.5 }}>Simpan</Button>
        </DialogActions>
      </Dialog>

      {/* Re-authentication Password Dialog (Sudo Mode) */}
      <Dialog 
        open={reauthOpen} 
        onClose={() => {
          if (!isVerifyingPassword) {
            setReauthOpen(false);
            setReauthPassword('');
            setReauthAction(null);
            setReauthError('');
          }
        }} 
        fullWidth 
        maxWidth="xs"
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${c.rule}` }}>
          Konfirmasi Keamanan
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 2, lineHeight: 1.5 }}>
            Untuk menjaga keamanan dan memastikan tindakan ini dilakukan oleh admin yang sah, silakan masukkan password akun Anda.
          </Typography>
          <TextField
            autoFocus
            label="Password Admin"
            type="password"
            fullWidth
            size="small"
            value={reauthPassword}
            onChange={(e) => setReauthPassword(e.target.value)}
            disabled={isVerifyingPassword}
            error={Boolean(reauthError)}
            helperText={reauthError}
            slotProps={{
              input: {
                sx: { borderRadius: 2 }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isVerifyingPassword) {
                handleSudoSubmit();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${c.rule}`, bgcolor: c.well }}>
          <Button 
            onClick={() => {
              setReauthOpen(false);
              setReauthPassword('');
              setReauthAction(null);
              setReauthError('');
            }} 
            disabled={isVerifyingPassword}
            sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.inkMuted }}
          >
            Batal
          </Button>
          <Button 
            onClick={handleSudoSubmit} 
            variant="contained" 
            disabled={isVerifyingPassword}
            sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.paper, px: 2.5 }}
          >
            {isVerifyingPassword ? 'Memverifikasi...' : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>

      <CampaignBuilderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={(newSlug) => {
          if (onSelectCampaign) onSelectCampaign(newSlug);
        }}
        basePublicConfig={publicConfig}
        jpyToIdrRate={jpyToIdrRate}
      />

      <CampaignBuilderDialog
        open={cloneDialogOpen}
        onClose={() => setCloneDialogOpen(false)}
        onSuccess={(newSlug) => {
          if (onSelectCampaign) onSelectCampaign(newSlug);
        }}
        cloneFrom={campaigns.find(c => c.id === currentCampaignId) || null}
        basePublicConfig={publicConfig}
        jpyToIdrRate={jpyToIdrRate}
      />
    </Box>
  );
};
