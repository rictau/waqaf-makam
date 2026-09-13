import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Card, Avatar, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Switch, FormControlLabel, InputAdornment, Tooltip, Divider } from '@mui/material';
import { User, Phone, MapPin, Sparkles, ExternalLink, CheckCircle2, Trash2, Wallet, Download, Pencil, Filter, Search, MoreVertical, LayoutDashboard, Clock, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { updateDoc, deleteDoc, doc, setDoc, collection, getDocs, query, orderBy, Timestamp, writeBatch, getDocFromServer } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../../../firebase';
import { formatJPY } from '../../../utils/formatters';
import { handleFirestoreError, OperationType } from '../../../utils/errors';
import type { BankConfig, BankAccountConfig, DonationPackageConfig, DonationRecord, DonationStatus, EditableDonationRecord, PublicConfig } from '../../../types';

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
  isClosed
}) => {
  const theme = useTheme();

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
    donorListSubtitleDate: publicConfig.donorListSubtitleDate,
    phase1Label: publicConfig.phases[0]?.shortLabel || '',
    phase2Label: publicConfig.phases[1]?.shortLabel || '',
    package1m2Price: String(findPackage('1m2')?.priceJPY || ''),
    packageHalfPrice: String(findPackage('0.5m2')?.priceJPY || ''),
    packageMultiplePrice: String(findPackage('kelipatan')?.priceJPY || ''),
    whatsapp: publicConfig.contactLinks.WHATSAPP,
    instagram: publicConfig.contactLinks.INSTAGRAM,
    email: publicConfig.contactLinks.EMAIL,
    donationClosedTitle: publicConfig.donationClosedTitle || '',
    donationClosedText: publicConfig.donationClosedText || ''
  });
  const [banksJP, setBanksJP] = useState<BankAccountConfig[]>(publicConfig.banks?.JP || []);
  const [banksID, setBanksID] = useState<BankAccountConfig[]>(publicConfig.banks?.ID || []);
  
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
      donorListSubtitleDate: publicConfig.donorListSubtitleDate,
      phase1Label: publicConfig.phases[0]?.shortLabel || '',
      phase2Label: publicConfig.phases[1]?.shortLabel || '',
      package1m2Price: String(publicConfig.packages.find((pkg) => pkg.id === '1m2')?.priceJPY || ''),
      packageHalfPrice: String(publicConfig.packages.find((pkg) => pkg.id === '0.5m2')?.priceJPY || ''),
      packageMultiplePrice: String(publicConfig.packages.find((pkg) => pkg.id === 'kelipatan')?.priceJPY || ''),
      whatsapp: publicConfig.contactLinks.WHATSAPP,
      instagram: publicConfig.contactLinks.INSTAGRAM,
      email: publicConfig.contactLinks.EMAIL,
      donationClosedTitle: publicConfig.donationClosedTitle || '',
      donationClosedText: publicConfig.donationClosedText || ''
    });
    setBanksJP(publicConfig.banks?.JP || []);
    setBanksID(publicConfig.banks?.ID || []);
    setEnablePhase2(Boolean(publicConfig.phases.length > 1));
  }, [publicConfig]);

  const updatePublicConfigInput = (field: keyof typeof publicConfigInput, value: string) => {
    setPublicConfigInput((prev) => ({ ...prev, [field]: value }));
  };

  const yenLabel = (amount?: number) => amount ? `¥${amount.toLocaleString('en-US')}` : 'Nominal Bebas';

  const buildPackages = (): DonationPackageConfig[] => {
    const price1m2 = Number(publicConfigInput.package1m2Price);
    const priceHalf = Number(publicConfigInput.packageHalfPrice);
    const priceMultiple = Number(publicConfigInput.packageMultiplePrice);
    if (isNaN(price1m2) || price1m2 <= 0) throw new Error('Harga Wakaf 1 m2 harus angka positif.');
    if (isNaN(priceHalf) || priceHalf <= 0) throw new Error('Harga Wakaf 0.5 m2 harus angka positif.');
    if (isNaN(priceMultiple) || priceMultiple <= 0) throw new Error('Harga Wakaf kelipatan harus angka positif.');

    return publicConfig.packages.map((pkg) => {
      if (pkg.id === '1m2') return { ...pkg, priceJPY: price1m2, priceLabel: yenLabel(price1m2) };
      if (pkg.id === '0.5m2') return { ...pkg, priceJPY: priceHalf, priceLabel: yenLabel(priceHalf) };
      if (pkg.id === 'kelipatan') return { ...pkg, priceJPY: priceMultiple, priceLabel: `${yenLabel(priceMultiple)} / m2` };
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
          id: "building",
          label: "Pembelian Gedung",
          shortLabel: "Pembelian Gedung",
          targetJPY: 5000000,
          shortfallLabel: "Kekurangan dana",
          completedLabel: "Lunas (100%)",
          completedDate: "",
          completionAnnouncement: "Alhamdulillah, target tahap sebelumnya telah tercapai."
        };
        
        const secondPhaseBase = publicConfig.phases[1] || {
          id: "renovation",
          label: "Renovasi Awal",
          shortLabel: "Renovasi Awal",
          targetJPY: 5000000,
          shortfallLabel: "Kekurangan dana",
          subtext: "Donasi tahap berikutnya kini dibuka."
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
            name: bank.name.trim().replace(/ \/ /g, '\n'),
            paymentMethod: (bank.paymentMethod || bank.label).trim()
          })),
          ID: banksID.map((bank, index) => ({
            id: `id${index + 1}`,
            label: bank.label.trim(),
            account: bank.account.trim(),
            name: bank.name.trim().replace(/ \/ /g, '\n'),
            paymentMethod: (bank.paymentMethod || bank.label).trim()
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

        const settingsPayload: {
          donationDeadline: Timestamp;
          totalNeed: number;
          baseVerified: number;
          renovationNeed?: number;
          jpyToIdrRate: number;
          spreadsheetId?: string;
          publicConfig: PublicConfig;
        } = {
          donationDeadline: Timestamp.fromDate(deadlineDate),
          totalNeed: totalNeedNum,
          baseVerified: baseVerifiedNum,
          jpyToIdrRate: jpyToIdrRateNum,
          spreadsheetId: spreadsheetIdInput.trim() || undefined,
          publicConfig: {
            masjidName: publicConfigInput.masjidName,
            shortName: publicConfigInput.shortName,
            campaignTitle: `Wakaf Pembangunan ${publicConfigInput.masjidName}`,
            locationText: publicConfigInput.locationText,
            footerCredit: publicConfig.footerCredit,
            donorListTitle: publicConfig.donorListTitle,
            donorListSubtitleDate: publicConfigInput.donorListSubtitleDate.trim() || publicConfig.donorListSubtitleDate,
            wakafHadith: publicConfig.wakafHadith,
            cashPaymentText: publicConfig.cashPaymentText,
            donationClosedTitle: publicConfig.donationClosedTitle,
            donationClosedText: publicConfig.donationClosedText,
            logos: publicConfig.logos,
            uniqueCode: publicConfig.uniqueCode,
            phases,
            packages,
            banks,
            contactLinks: {
              WHATSAPP: normalizedWhatsapp,
              INSTAGRAM: normalizedInstagram,
              EMAIL: normalizedEmail
            }
          }
        };
        if (enablePhase2) {
          settingsPayload.renovationNeed = renovationNeedNum;
        } else {
          settingsPayload.renovationNeed = 0;
        }

        await setDoc(doc(db, 'stats', 'global'), settingsPayload, { merge: true });
        alert('Pengaturan berhasil diperbarui!');
      } catch (e) {
        console.error('Failed to save settings:', e);
        alert(e instanceof Error ? e.message : 'Gagal menyimpan pengaturan. Silakan coba lagi.');
        handleFirestoreError(e, OperationType.UPDATE, 'stats/global');
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

      const headers = ['Tanggal', 'Status', 'Nama', 'Nominal (JPY)', 'Metode Pembayaran', 'Program/Paket', 'No. HP/WA', 'Domisili', 'Email', 'Remarks'];
      const rows = donationsToExport.map((d) => [
        `"${d.date || ''}"`,
        `"${d.status || ''}"`,
        `"${d.name || ''}"`,
        `"${d.amount || ''}"`,
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
      const snapshot = await getDocs(collection(db, 'donations'));
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
      await setDoc(doc(db, 'stats', 'global'), {
        totalVerifiedAmount: totalVerified,
        totalPendingAmount: totalPending,
        lastUpdate: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.error('Failed to recalculate stats:', err);
    }
  };

  React.useEffect(() => {
    recalculateStats();
  }, []);

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
      await setDoc(doc(db, 'stats', 'global'), {
        showDonaturTab: newValue
      }, { merge: true });
    } catch (error) {
      console.error('Failed to toggle Donatur tab:', error);
      alert('Gagal mengubah pengaturan! Pastikan Anda terhubung ke internet dan memiliki akses admin.');
      handleFirestoreError(error, OperationType.UPDATE, 'stats/global');
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
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>
      {/* Admin Header */}
      <Box sx={{ pt: 6, pb: 0, px: 3, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1.5, display: 'flex' }}>
              <LayoutDashboard size={20} />
            </Box>
            <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: -0.5 }}>
              Admin Panel
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {spreadsheetId && spreadsheetId.trim() ? (
              <Tooltip title="Buka Google Sheet">
                <Button 
                  component="a"
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small" variant="outlined" color="primary"
                  sx={{ fontWeight: 800, textTransform: 'uppercase', borderRadius: 2, height: 36, px: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ExternalLink size={18} />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Ekspor ke CSV">
                <Button 
                  size="small" variant="outlined" color="primary" onClick={handleExportCSV}
                  disabled={isExporting}
                  sx={{ fontWeight: 800, textTransform: 'uppercase', borderRadius: 2, height: 36, px: 2 }}
                >
                  {isExporting ? '...' : <Download size={18} />}
                </Button>
              </Tooltip>
            )}
            <Button 
              size="small" variant="contained" color="error" onClick={() => auth.signOut()}
              sx={{ fontWeight: 800, textTransform: 'uppercase', borderRadius: 2, height: 36, boxShadow: 0 }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Custom Tab Switcher */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Button
            onClick={() => setAdminTab('donations')}
            sx={{
              pb: 1.5,
              px: 1.5,
              borderRadius: 0,
              borderBottom: adminTab === 'donations' ? '3px solid' : '3px solid transparent',
              borderColor: adminTab === 'donations' ? 'primary.main' : 'transparent',
              fontWeight: 800,
              fontSize: '0.8rem',
              color: adminTab === 'donations' ? 'primary.main' : 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 1,
              transition: 'all 0.2s',
              minWidth: 'auto',
              '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
            }}
          >
            Ringkasan & Donasi
          </Button>
          <Button
            onClick={() => setAdminTab('settings')}
            sx={{
              pb: 1.5,
              px: 1.5,
              borderRadius: 0,
              borderBottom: adminTab === 'settings' ? '3px solid' : '3px solid transparent',
              borderColor: adminTab === 'settings' ? 'primary.main' : 'transparent',
              fontWeight: 800,
              fontSize: '0.8rem',
              color: adminTab === 'settings' ? 'primary.main' : 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 1,
              transition: 'all 0.2s',
              minWidth: 'auto',
              '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
            }}
          >
            Pengaturan Program
          </Button>
        </Box>
      </Box>
      {adminTab === 'donations' ? (
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Dynamic Phase Dashboard for Admin */}
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'primary.light', bgcolor: 'rgba(18, 76, 58, 0.02)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                <Sparkles size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Project Progress Status
              </Typography>
              <Chip 
                label={`${activePhaseLabel || 'Program'} Aktif`} 
                size="small" 
                sx={{ fontWeight: 900, fontSize: '0.6rem', height: 20, bgcolor: 'primary.main', color: 'white' }} 
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Total Terverifikasi</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>{formatJPY(verifiedAmount)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>{activePhaseLabel || 'Progress'}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  {showSecondaryPhase ? renovationPercentage.toFixed(1) : totalPercentage.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
            {showSecondaryPhase && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                 <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                   Shortfall Tahap 2: <span style={{ color: theme.palette.error.main, fontWeight: 900 }}>{formatJPY(renovationShortfall)}</span>
                 </Typography>
              </Box>
            )}
          </Paper>

          {/* Pending Verification Counts */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', p: 2, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {donations.filter(d => d.status === 'pending').length} Menunggu Verifikasi
              </Typography>
            </Box>
          </Box>

          {/* Advanced Filters */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              fullWidth size="small" placeholder="Cari Nama, No HP, atau Lokasi..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color={theme.palette.text.disabled} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3, bgcolor: 'background.paper' }
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField 
                select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} 
                sx={{ flex: 1, minWidth: 140, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Filter size={14} /></InputAdornment> } }}
              >
                <MenuItem value="all" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Semua Status</MenuItem>
                <MenuItem value="verified" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Verified</MenuItem>
                <MenuItem value="pending" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Pending</MenuItem>
              </TextField>
              <TextField 
                select size="small" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} 
                sx={{ flex: 1, minWidth: 160, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Wallet size={14} /></InputAdornment> } }}
              >
                <MenuItem value="all" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Semua Metode</MenuItem>
                {paymentFilterOptions.map((option) => (
                  <MenuItem key={option} value={option} sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{option}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
          
          {/* Donation List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredDonations.map((donor) => (
              <Card key={donor.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                    <Avatar sx={{ bgcolor: 'background.default', color: donor.status === 'verified' ? 'primary.main' : 'warning.main', borderRadius: 2, width: 48, height: 48, border: '1px solid', borderColor: 'divider' }}>
                       <User size={24} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: 'text.primary' }}>{donor.name}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                        <Clock size={10} style={{ marginRight: 4 }} /> {donor.date}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', ml: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>{formatJPY(donor.amount)}</Typography>
                    <Chip 
                      label={donor.status === 'verified' ? 'Verified' : 'Pending'} 
                      size="small" 
                      sx={{ 
                        height: 20, px: 0.5, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', 
                        bgcolor: donor.status === 'verified' ? 'primary.main' : 'warning.main', 
                        color: 'white' 
                      }} 
                    />
                  </Box>
                </Box>
                
                <Box sx={{ px: 2, pb: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, borderRight: '1px solid', borderColor: 'divider' }}>
                      <Phone size={10} style={{ marginRight: 6, color: theme.palette.text.secondary }} /> 
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.65rem' }}>{donor.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, borderRight: '1px solid', borderColor: 'divider' }}>
                      <Sparkles size={10} style={{ marginRight: 6, color: theme.palette.text.secondary }} /> 
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.65rem' }}>{donor.package || 'Donasi'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Wallet size={10} style={{ marginRight: 6, color: theme.palette.text.secondary }} /> 
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.65rem' }}>{donor.paymentMethod || 'Tunai'}</Typography>
                    </Box>
                  </Box>
                  {donor.remarks && (
                    <Box sx={{ mt: 1.5, px: 1.5, py: 1, bgcolor: 'warning.light', opacity: 0.8, borderRadius: 2, border: '1px dashed', borderColor: 'warning.main' }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'warning.dark', textTransform: 'uppercase', fontSize: '0.55rem', mb: 0.25 }}>Catatan Admin:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.primary' }}>{donor.remarks}</Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1, display: 'flex', gap: 1, bgcolor: 'background.paper' }}>
                  <Button 
                    onClick={() => handleEditClick(donor)} 
                    variant="outlined" color="inherit" size="small" 
                    sx={{ borderRadius: 1.5, minWidth: 40, borderColor: 'divider' }}
                  >
                    <Pencil size={16} />
                  </Button>
                  
                  {donor.proofUrl && (
                    <Button 
                      component="a" href={donor.proofUrl} target="_blank" rel="noreferrer" 
                      variant="outlined" size="small" fullWidth 
                      startIcon={<ExternalLink size={14} />} 
                      sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 1.5, textTransform: 'uppercase' }}
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
                      startIcon={<CheckCircle2 size={14} />} 
                      sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 1.5, textTransform: 'uppercase', boxShadow: 0 }}
                    >
                      Verifikasi
                    </Button>
                  )}
                  
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
                    variant="outlined" color="error" size="small"
                    sx={{ borderRadius: 1.5, minWidth: 40, borderColor: 'error.light' }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined" color="primary" onClick={onLoadMore}
                sx={{ borderRadius: 2, fontWeight: 800, px: 6, py: 1.2, textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Muat Lebih Banyak
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary', fontWeight: 700 }}>
                Menampilkan {donations.length} data terbaru
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Group 1: Informasi Umum & Tanggal */}
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', mb: 2.5, letterSpacing: 0.5 }}>
              Informasi Umum & Tanggal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small" label="Nama Masjid" value={publicConfigInput.masjidName}
                  onChange={(e) => updatePublicConfigInput('masjidName', e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small" label="Nama Pendek" value={publicConfigInput.shortName}
                  onChange={(e) => updatePublicConfigInput('shortName', e.target.value)}
                  fullWidth
                  sx={{ maxWidth: { sm: 180 } }}
                />
              </Box>
              <TextField
                size="small" label="Lokasi" value={publicConfigInput.locationText}
                onChange={(e) => updatePublicConfigInput('locationText', e.target.value)}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small" label="Tanggal Mulai Program" value={publicConfigInput.donorListSubtitleDate}
                  onChange={(e) => updatePublicConfigInput('donorListSubtitleDate', e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small" label="Tanggal Akhir Program" type="datetime-local"
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
              <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', mb: 2.5, letterSpacing: 0.5 }}>
                  Pengaturan Fase & Paket Wakaf
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enablePhase2}
                        onChange={(e) => setEnablePhase2(e.target.checked)}
                        color="primary"
                        size="small"
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
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mt: 1 }}>
                    Harga Paket Donasi (JPY)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      size="small" label="Harga Wakaf 1 m² (JPY)" type="number" value={publicConfigInput.package1m2Price}
                      onChange={(e) => updatePublicConfigInput('package1m2Price', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      size="small" label="Harga Wakaf 0.5 m² (JPY)" type="number" value={publicConfigInput.packageHalfPrice}
                      onChange={(e) => updatePublicConfigInput('packageHalfPrice', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      size="small" label="Wakaf Kelipatan per m² (JPY)" type="number" value={publicConfigInput.packageMultiplePrice}
                      onChange={(e) => updatePublicConfigInput('packageMultiplePrice', e.target.value)}
                      fullWidth
                    />
                  </Box>
                </Box>
              </Card>

              {/* Group 3: Target & Kurs Konversi */}
              <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', mb: 2.5, letterSpacing: 0.5 }}>
                  Target Donasi & Keuangan
                </Typography>
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
              <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', mb: 2.5, letterSpacing: 0.5 }}>
                  Rekening Pembayaran & Kontak
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  
                  {/* Rekening Jepang */}
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Wallet size={16} /> Daftar Rekening Jepang (JP)
                  </Typography>
                  {banksJP.length === 0 ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', mb: 1 }}>
                      Belum ada rekening Jepang dikonfigurasi. Klik tombol di bawah untuk menambahkan.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {banksJP.map((bank, index) => (
                        <Card key={bank.id || index} variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderStyle: 'dashed', borderColor: 'primary.light' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', textTransform: 'uppercase' }}>
                              Rekening JP #{index + 1}
                            </Typography>
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
                    startIcon={<Wallet size={16} />}
                    onClick={() => handleAddBank('JP')}
                    sx={{ alignSelf: 'flex-start', mt: 0.5, mb: 1, borderRadius: 2, fontWeight: 700 }}
                  >
                    Tambah Rekening Jepang
                  </Button>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Rekening Indonesia */}
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Wallet size={16} /> Daftar Rekening Indonesia (ID)
                  </Typography>
                  {banksID.length === 0 ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', mb: 1 }}>
                      Belum ada rekening Indonesia dikonfigurasi. Klik tombol di bawah untuk menambahkan.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {banksID.map((bank, index) => (
                        <Card key={bank.id || index} variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderStyle: 'dashed', borderColor: 'primary.light' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', textTransform: 'uppercase' }}>
                              Rekening ID #{index + 1}
                            </Typography>
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
                    startIcon={<Wallet size={16} />}
                    onClick={() => handleAddBank('ID')}
                    sx={{ alignSelf: 'flex-start', mt: 0.5, mb: 1, borderRadius: 2, fontWeight: 700 }}
                  >
                    Tambah Rekening Indonesia
                  </Button>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Kontak Link */}
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    Kontak & Media Sosial Program
                  </Typography>
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
                </Box>
              </Card>

              {/* Group 5: Advanced & Reset Program */}
              {isSuperAdmin && (
                <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'error.light', borderRadius: 3, bgcolor: 'rgba(211, 47, 47, 0.01)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main', textTransform: 'uppercase', mb: 2.5, letterSpacing: 0.5 }}>
                    Tindakan Lanjutan (Danger Zone)
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.4 }}>
                      Mulai program baru akan menghapus semua records donasi yang ada dan mengatur total dana terkumpul kembali ke 0. User admin dan konfigurasi program akan tetap dipertahankan.
                    </Typography>
                    <Button
                      variant="outlined" color="error" size="small"
                      onClick={handleStartNewCampaign}
                      disabled={isResettingCampaign}
                      sx={{ fontWeight: 800, borderRadius: 2, whiteSpace: 'nowrap', px: 3, py: 1 }}
                    >
                      {isResettingCampaign ? 'Resetting...' : 'Reset'}
                    </Button>
                  </Box>
                </Card>
              )}

              {/* Save Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained" color="primary" size="large"
                  onClick={handleSaveSettings} disabled={isSavingSettings}
                  sx={{ fontWeight: 800, textTransform: 'uppercase', borderRadius: 2, px: 6, py: 1.5, boxShadow: '0 4px 14px 0 rgba(18, 76, 58, 0.2)' }}
                >
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </Box>
        </Box>
      )}

      {/* Edit Donation Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900, borderBottom: '1px solid', borderColor: 'divider' }}>Edit Data Donasi</DialogTitle>
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
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Batal</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary" sx={{ fontWeight: 700, px: 3 }}>Simpan Perubahan</Button>
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
        <DialogTitle sx={{ fontWeight: 900, borderBottom: '1px solid', borderColor: 'divider' }}>
          Konfirmasi Keamanan (Sudo Mode)
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
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => {
              setReauthOpen(false);
              setReauthPassword('');
              setReauthAction(null);
              setReauthError('');
            }} 
            color="inherit" 
            disabled={isVerifyingPassword}
            sx={{ fontWeight: 700 }}
          >
            Batal
          </Button>
          <Button 
            onClick={handleSudoSubmit} 
            variant="contained" 
            color="primary" 
            disabled={isVerifyingPassword}
            sx={{ fontWeight: 700, px: 3 }}
          >
            {isVerifyingPassword ? 'Memverifikasi...' : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
