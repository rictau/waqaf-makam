import React, { useRef } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Upload, AlertCircle, FileCheck2 } from 'lucide-react';
import { c, eyebrow, radius, tnum } from '../../../design';
import { Eyebrow } from '../../common/primitives';

interface ConfirmUploadProps {
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  uploadState: string;
  formError: string | null;
  handleUploadSubmit: () => void;
}

/**
 * Proof of transfer + submit. The drop target is a grounded, high-contrast
 * surface with a single dashed edge to signal "put a file here" — no floating
 * circle icon, no lift, no glow.
 */
export const ConfirmUpload: React.FC<ConfirmUploadProps> = ({ uploadFile, setUploadFile, uploadState, formError, handleUploadSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'heic' || ext === 'heif') {
        alert("Ups! Format foto iPhone (HEIC) tidak didukung. Mohon screenshot bukti transfer Anda atau simpan sebagai JPG agar bisa kami proses. 🙏");
        e.target.value = ''; // Reset input
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Maksimal 10MB. Silakan kompres atau gunakan file lain. 🙏");
        e.target.value = ''; // Reset input
        return;
      }

      setUploadFile(file);
    }
  };

  const handleClearFile = () => {
    setUploadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: 1, mb: 1.5, borderBottom: `1px solid ${c.ruleStrong}` }}>
        <Eyebrow tone="ink">Konfirmasi Pembayaran</Eyebrow>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint }}>Langkah 4</Typography>
      </Box>

      {formError && (
        <Box
          role="alert"
          sx={{ mb: 1.5, px: 1.5, py: 1.25, bgcolor: c.dangerTint, borderLeft: `3px solid ${c.danger}`, borderRadius: `0 ${radius.md} ${radius.md} 0`, display: 'flex', gap: 1 }}
        >
          <Box sx={{ color: c.danger, display: 'flex', pt: '1px', flexShrink: 0 }}>
            <AlertCircle size={15} />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: c.danger, lineHeight: 1.45 }}>
            {formError}
          </Typography>
        </Box>
      )}

      <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" />

      {!uploadFile ? (
        <Box
          component="button"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          sx={{
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 2,
            cursor: 'pointer',
            bgcolor: c.paper,
            border: `1px dashed ${c.ruleStrong}`,
            borderRadius: radius.lg,
            transition: 'border-color 150ms ease, background-color 150ms ease',
            '&:hover': { borderColor: c.forest, bgcolor: c.forestTint },
            '&:active': { transform: 'scale(0.995)' },
          }}
        >
          <Box sx={{ color: c.forest, display: 'flex', flexShrink: 0 }}>
            <Upload size={20} strokeWidth={2} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.ink }}>
              Pilih bukti transfer
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: c.inkMuted, mt: 0.25, lineHeight: 1.45 }}>
              JPG, PNG atau PDF · maks. 10 MB · <Box component="span" sx={{ color: c.danger, fontWeight: 700 }}>bukan HEIC</Box>
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ bgcolor: c.paper, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: `1px solid ${c.rule}` }}>
            <Box sx={{ color: c.verified, display: 'flex', flexShrink: 0 }}>
              <FileCheck2 size={18} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: '0.8125rem', fontWeight: 700, color: c.ink }}>
                {uploadFile.name}
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: c.inkMuted, ...tnum }}>
                {formatFileSize(uploadFile.size)}
              </Typography>
            </Box>
            <Button
              size="small" variant="text" onClick={handleClearFile}
              disabled={uploadState === 'uploading'}
              sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.inkMuted, px: 1, flexShrink: 0 }}
            >
              Ganti
            </Button>
          </Box>

          <Box sx={{ p: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleUploadSubmit}
              disabled={uploadState === 'uploading'}
              sx={{ py: 1.375, ...eyebrow, fontSize: '0.75rem', color: c.paper }}
            >
              {uploadState === 'uploading' ? (
                <CircularProgress size={18} color="inherit" thickness={5} />
              ) : 'Kirim Donasi Sekarang'}
            </Button>
            <Typography sx={{ mt: 1, textAlign: 'center', fontSize: '0.6875rem', color: c.inkFaint }}>
              Pastikan data yang Anda masukkan sudah benar
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};
