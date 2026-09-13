import React, { useRef } from 'react';
import { Box, Typography, Button, Avatar, CircularProgress, Collapse } from '@mui/material';
import { Upload, FileImage, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@mui/material/styles';

interface ConfirmUploadProps {
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  uploadState: string;
  formError: string | null;
  handleUploadSubmit: () => void;
}

export const ConfirmUpload: React.FC<ConfirmUploadProps> = ({ uploadFile, setUploadFile, uploadState, formError, handleUploadSubmit }) => {
  const theme = useTheme();
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
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, ml: 1 }}>
        Konfirmasi Pembayaran
      </Typography>

      <Collapse in={!!formError}>
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'error.light', color: 'error.main', borderRadius: 2, display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'error.main', opacity: 0.9 }}>
          <AlertCircle size={16} style={{ marginRight: 10, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {formError}
          </Typography>
        </Box>
      </Collapse>

      <Box
        sx={{
          bgcolor: 'background.paper', borderRadius: 3, border: '2px dashed',
          borderColor: uploadFile ? 'success.main' : 'divider', overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { borderColor: uploadFile ? 'success.main' : 'primary.main', transform: 'translateY(-2px)' },
          boxShadow: uploadFile ? '0 8px 24px rgba(46, 125, 50, 0.08)' : 'none'
        }}
      >
        <input
          type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf"
        />
        {!uploadFile ? (
          <Button
            fullWidth onClick={() => fileInputRef.current?.click()}
            sx={{ py: 4, flexDirection: 'column', color: 'text.secondary', textTransform: 'none', '&:hover': { bgcolor: 'rgba(18, 76, 58, 0.02)' } }}
          >
            <Avatar sx={{ bgcolor: 'background.default', mb: 2, width: 48, height: 48, border: '1px solid', borderColor: 'divider' }}>
              <Upload size={22} color={theme.palette.primary.main} />
            </Avatar>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800 }}>
              Klik untuk Pilih Bukti Transfer
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', fontWeight: 500, px: 2 }}>
              Gunakan JPG, PNG, atau PDF (Maks. 10MB).<br />
              <span style={{ color: theme.palette.error.main, fontWeight: 700 }}>Penting:</span> Mohon jangan gunakan format HEIC.
            </Typography>
          </Button>
        ) : (
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ bgcolor: 'rgba(46, 125, 50, 0.05)', p: 2, borderRadius: 2.5, display: 'flex', alignItems: 'center', mb: 2.5, border: '1px solid', borderColor: 'success.light' }}>
              <Box sx={{ mr: 2, color: 'success.main', display: 'flex' }}>
                <CheckCircle2 size={24} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {uploadFile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {formatFileSize(uploadFile.size)}
                </Typography>
              </Box>
              <Button
                size="small" variant="text" onClick={handleClearFile}
                disabled={uploadState === 'uploading'}
                sx={{ ml: 1, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}
              >
                Ganti
              </Button>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleUploadSubmit}
              disabled={uploadState === 'uploading'}
              sx={{
                py: 1.5, borderRadius: 2, fontWeight: 900, fontSize: '0.9rem',
                textTransform: 'uppercase', letterSpacing: 1,
                boxShadow: '0 8px 20px rgba(18, 76, 58, 0.2)',
                '&:hover': { boxShadow: '0 12px 28px rgba(18, 76, 58, 0.3)' }
              }}
            >
              {uploadState === 'uploading' ? (
                <CircularProgress size={24} color="inherit" thickness={6} />
              ) : 'Kirim Donasi Sekarang'}
            </Button>

            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1.5, color: 'text.disabled', fontWeight: 600 }}>
              Pastikan data yang Anda masukkan sudah benar
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
