import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  MenuItem
} from '@mui/material';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { c, eyebrow, radius } from '../../../design';
import { Eyebrow } from '../../common/primitives';
import type { CampaignDocument, CampaignStatus, PublicConfig } from '../../../types';

interface CampaignBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newSlug: string) => void;
  cloneFrom?: CampaignDocument | null;
  editCampaign?: CampaignDocument | null;
  basePublicConfig: PublicConfig;
  jpyToIdrRate: number;
}

export const CampaignBuilderDialog: React.FC<CampaignBuilderDialogProps> = ({
  open,
  onClose,
  onSuccess,
  cloneFrom,
  editCampaign,
  basePublicConfig,
  jpyToIdrRate
}) => {
  const mode = editCampaign ? 'edit' : cloneFrom ? 'clone' : 'create';
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [shortName, setShortName] = useState('');
  const [targetJPY, setTargetJPY] = useState('20000000');
  const [locationText, setLocationText] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('active');
  const [order, setOrder] = useState('1');
  const [isFeatured, setIsFeatured] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [hadith, setHadith] = useState(basePublicConfig.wakafHadith);
  const [useDefaultBanks, setUseDefaultBanks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (editCampaign) {
        setSlug(editCampaign.id);
        setTitle(editCampaign.title || '');
        setShortName(editCampaign.shortName || '');
        setTargetJPY(String(editCampaign.totalNeed || 20000000));
        setLocationText(editCampaign.publicConfig?.locationText || '');
        setStatus(editCampaign.status || 'active');
        setOrder(String(editCampaign.order ?? 1));
        setIsFeatured(Boolean(editCampaign.isFeatured));
        setSpreadsheetId(editCampaign.spreadsheetId || '');
        setDeadline(
          editCampaign.donationDeadline?.toDate
            ? editCampaign.donationDeadline.toDate().toISOString().slice(0, 10)
            : ''
        );
        setHadith(editCampaign.publicConfig?.wakafHadith || basePublicConfig.wakafHadith);
        setUseDefaultBanks(true);
      } else if (cloneFrom) {
        setSlug(`${cloneFrom.id}-baru`);
        setTitle(`${cloneFrom.title}`);
        setShortName(cloneFrom.shortName);
        setTargetJPY(String(cloneFrom.totalNeed || 20000000));
        setLocationText(cloneFrom.publicConfig?.locationText || '');
        setStatus('active');
        setOrder(String((cloneFrom.order ?? 1) + 1));
        setIsFeatured(false);
        setSpreadsheetId(cloneFrom.spreadsheetId || '');
        setDeadline(
          cloneFrom.donationDeadline?.toDate
            ? cloneFrom.donationDeadline.toDate().toISOString().slice(0, 10)
            : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        );
        setHadith(cloneFrom.publicConfig?.wakafHadith || basePublicConfig.wakafHadith);
        setUseDefaultBanks(true);
      } else {
        setSlug('');
        setTitle('');
        setShortName('');
        setTargetJPY('20000000');
        setLocationText('');
        setStatus('active');
        setOrder('1');
        setIsFeatured(false);
        setSpreadsheetId('');
        setDeadline(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
        setHadith(basePublicConfig.wakafHadith);
        setUseDefaultBanks(true);
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [open, cloneFrom, editCampaign, basePublicConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!cleanSlug || cleanSlug.length < 3) {
      setErrorMsg('Slug URL harus minimal 3 karakter huruf kecil/angka (misal: "masjidkoganei").');
      return;
    }

    if (mode !== 'edit' && ['admin', 'donatur', 'donasi', 'stats', 'users', 'campaigns'].includes(cleanSlug)) {
      setErrorMsg(`Slug "${cleanSlug}" adalah kata yang dipesan sistem. Gunakan slug lain.`);
      return;
    }

    const targetNum = Number(targetJPY);
    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMsg('Target dana harus berupa angka positif.');
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'campaigns', cleanSlug);
      const deadlineTimestamp = deadline ? Timestamp.fromDate(new Date(`${deadline}T23:59:59+09:00`)) : null;

      if (mode === 'edit') {
        const existingSnap = await getDoc(docRef);
        const existingData = existingSnap.exists() ? existingSnap.data() : {};
        const existingConfig = existingData.publicConfig || editCampaign?.publicConfig || basePublicConfig;

        const updatedPublicConfig: PublicConfig = {
          ...existingConfig,
          masjidName: shortName.trim() || title.trim(),
          shortName: shortName.trim() || 'KMII Jepang',
          campaignTitle: title.trim(),
          locationText: locationText.trim() || 'Jepang',
          wakafHadith: hadith.trim(),
        };

        const updatePayload = {
          title: title.trim(),
          shortName: shortName.trim(),
          status,
          isFeatured,
          order: Number(order) || 1,
          totalNeed: targetNum,
          isClosed: status === 'closed',
          spreadsheetId: spreadsheetId.trim() || null,
          publicConfig: updatedPublicConfig,
          donationDeadline: deadlineTimestamp,
          updatedAt: Timestamp.now()
        };

        await setDoc(docRef, updatePayload, { merge: true });

        if (cleanSlug === 'pemakaman') {
          await setDoc(doc(db, 'stats', 'global'), {
            totalNeed: targetNum,
            spreadsheetId: spreadsheetId.trim() || null,
            publicConfig: updatedPublicConfig,
            donationDeadline: deadlineTimestamp,
            isClosed: status === 'closed',
            lastUpdate: Timestamp.now()
          }, { merge: true });
        }

        onSuccess(cleanSlug);
        onClose();
        return;
      }

      // Check if slug already exists for create/clone
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        setErrorMsg(`Program dengan slug "${cleanSlug}" sudah ada. Gunakan slug lain.`);
        setIsSubmitting(false);
        return;
      }

      // Inherit publicConfig for new campaign
      const clonedConfig = cloneFrom?.publicConfig || basePublicConfig;
      const newPublicConfig: PublicConfig = {
        masjidName: shortName.trim() || title.trim(),
        shortName: shortName.trim() || 'KMII Jepang',
        campaignTitle: title.trim(),
        locationText: locationText.trim() || 'Jepang',
        footerCredit: clonedConfig.footerCredit || 'KMII Jepang',
        donorListTitle: clonedConfig.donorListTitle || 'Daftar Donatur',
        donorListSubtitleDate: clonedConfig.donorListSubtitleDate || '',
        wakafHadith: hadith.trim(),
        cashPaymentText: clonedConfig.cashPaymentText || basePublicConfig.cashPaymentText,
        donationClosedTitle: clonedConfig.donationClosedTitle || 'Periode Donasi Telah Ditutup',
        donationClosedText: clonedConfig.donationClosedText || 'Jazakumullah Khairan atas partisipasi Anda.',
        logos: clonedConfig.logos || basePublicConfig.logos,
        packages: clonedConfig.packages || basePublicConfig.packages,
        banks: useDefaultBanks ? basePublicConfig.banks : (cloneFrom?.publicConfig?.banks || basePublicConfig.banks),
        contactLinks: clonedConfig.contactLinks || basePublicConfig.contactLinks,
        uniqueCode: clonedConfig.uniqueCode ?? 0,
        showNarahubung: clonedConfig.showNarahubung !== false,
        narahubung: clonedConfig.narahubung || basePublicConfig.narahubung,
        phases: [
          {
            id: cleanSlug,
            label: `Tahap 1: ${title.trim()}`,
            shortLabel: shortName.trim(),
            targetJPY: targetNum,
            shortfallLabel: "Masih Dibutuhkan",
            completedLabel: "Tercapai (100%)",
            completionAnnouncement: `Alhamdulillah, target ${title.trim()} telah tercapai.`
          }
        ]
      };

      await setDoc(docRef, {
        id: cleanSlug,
        title: title.trim(),
        shortName: shortName.trim(),
        status: 'active',
        isFeatured: false,
        order: Number(order) || 99,
        totalNeed: targetNum,
        renovationNeed: 0,
        baseVerified: 0,
        showDonaturTab: true,
        isClosed: false,
        jpyToIdrRate: jpyToIdrRate || 113,
        spreadsheetId: spreadsheetId.trim() || null,
        publicConfig: newPublicConfig,
        totalVerifiedAmount: 0,
        totalPendingAmount: 0,
        donationDeadline: deadlineTimestamp,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      onSuccess(cleanSlug);
      onClose();
    } catch (err) {
      console.error('Failed to save campaign:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan program.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ borderBottom: `1px solid ${c.rule}`, pb: 1.5 }}>
          <Eyebrow tone="brass">
            {mode === 'edit' ? 'Edit Program' : mode === 'clone' ? 'Duplikasi Program' : 'Buat Program Baru'}
          </Eyebrow>
          <Typography variant="h2" sx={{ fontSize: '1.25rem', color: c.ink, mt: 0.5 }}>
            {mode === 'edit'
              ? `Pengaturan Program: ${shortName || title}`
              : mode === 'clone'
                ? `Duplikasi dari ${cloneFrom?.shortName}`
                : 'Program Penggalangan Dana Baru'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {errorMsg && (
            <Box sx={{ p: 1.5, bgcolor: c.dangerTint, borderLeft: `3px solid ${c.danger}`, borderRadius: radius.sm }}>
              <Typography sx={{ fontSize: '0.75rem', color: c.danger, fontWeight: 600 }}>
                {errorMsg}
              </Typography>
            </Box>
          )}

          <Box>
            <Eyebrow sx={{ mb: 0.5 }}>Slug URL (Tautan Halaman)</Eyebrow>
            <TextField
              fullWidth
              size="small"
              required
              disabled={mode === 'edit'}
              placeholder="cth: masjidkoganei"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">infaq.kmii.jp/</InputAdornment>
                }
              }}
              helperText={
                mode === 'edit'
                  ? 'Slug URL tidak dapat diubah agar link donasi yang sudah beredar tidak rusak.'
                  : `Halaman akan dibuka di: infaq.kmii.jp/${slug || 'nama-slug'}`
              }
            />
          </Box>

          <Box>
            <Eyebrow sx={{ mb: 0.5 }}>Judul Lengkap Program</Eyebrow>
            <TextField
              fullWidth
              size="small"
              required
              placeholder="Cth: Pembebasan & Pembangunan Masjid Koganei Tokyo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Eyebrow sx={{ mb: 0.5 }}>Nama Pendek / Tag</Eyebrow>
              <TextField
                fullWidth
                size="small"
                required
                placeholder="Cth: Masjid Koganei"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
              />
            </Box>
            <Box>
              <Eyebrow sx={{ mb: 0.5 }}>Lokasi</Eyebrow>
              <TextField
                fullWidth
                size="small"
                placeholder="Cth: Koganei, Tokyo"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Eyebrow sx={{ mb: 0.5 }}>Target Dana (JPY)</Eyebrow>
              <TextField
                fullWidth
                size="small"
                required
                type="number"
                placeholder="20000000"
                value={targetJPY}
                onChange={(e) => setTargetJPY(e.target.value)}
              />
            </Box>
            <Box>
              <Eyebrow sx={{ mb: 0.5 }}>Batas Waktu (Deadline)</Eyebrow>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Box>
          </Box>

          {mode === 'edit' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Eyebrow sx={{ mb: 0.5 }}>Status Program</Eyebrow>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                >
                  <MenuItem value="active">Aktif (Menerima Donasi)</MenuItem>
                  <MenuItem value="closed">Ditutup (Target Tercapai/Selesai)</MenuItem>
                  <MenuItem value="draft">Draf (Belum Publik)</MenuItem>
                  <MenuItem value="archived">Diarsipkan</MenuItem>
                </TextField>
              </Box>
              <Box>
                <Eyebrow sx={{ mb: 0.5 }}>Urutan Tampilan di Katalog</Eyebrow>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  helperText="Angka lebih kecil tampil lebih awal"
                />
              </Box>
            </Box>
          )}

          <Box>
            <Eyebrow sx={{ mb: 0.5 }}>Google Spreadsheet ID (Opsional)</Eyebrow>
            <TextField
              fullWidth
              size="small"
              placeholder="ID Sheet dari Google Sheets URL"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              helperText="Setiap program dapat memiliki file Google Sheet mutasi masing-masing."
            />
          </Box>

          <Box>
            <Eyebrow sx={{ mb: 0.5 }}>Hadits / Pesan Ajakan</Eyebrow>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              value={hadith}
              onChange={(e) => setHadith(e.target.value)}
            />
          </Box>

          {mode === 'create' && (
            <FormControlLabel
              control={
                <Switch
                  checked={useDefaultBanks}
                  onChange={(e) => setUseDefaultBanks(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: c.ink }}>
                    Gunakan Rekening Utama KMII Jepang
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: c.inkMuted }}>
                    Otomatis menggunakan rekening Japan Post Bank dan BSI a.n. KMII Jepang.
                  </Typography>
                </Box>
              }
            />
          )}

          {mode === 'edit' && (
            <FormControlLabel
              control={
                <Switch
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: c.ink }}>
                    Sorot di Beranda (Featured Program)
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: c.inkMuted }}>
                    Program ini akan ditampilkan di posisi teratas portal katalog donasi.
                  </Typography>
                </Box>
              }
            />
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${c.rule}` }}>
          <Button onClick={onClose} disabled={isSubmitting} sx={{ ...eyebrow, fontSize: '0.6875rem', color: c.inkMuted }}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              ...eyebrow,
              fontSize: '0.6875rem',
              bgcolor: c.forest,
              color: c.paper,
              px: 2.5,
              '&:hover': { bgcolor: c.forestDeep }
            }}
          >
            {isSubmitting
              ? 'Menyimpan...'
              : mode === 'edit'
                ? 'Simpan Perubahan'
                : mode === 'clone'
                  ? 'Duplikasi & Terbitkan'
                  : 'Buat Program'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
