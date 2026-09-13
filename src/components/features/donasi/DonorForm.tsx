import React from 'react';
import { Box, Typography, Paper, TextField, InputAdornment } from '@mui/material';
import { User, Phone, MapPin, Mail, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { IOSToggle } from '../../common/IOSToggle';

interface DonorFormProps {
  isAnonymous: boolean;
  setIsAnonymous: (val: boolean) => void;
  donorName: string;
  setDonorName: (val: string) => void;
  donorPhone: string;
  setDonorPhone: (val: string) => void;
  donorCity: string;
  setDonorCity: (val: string) => void;
  donorEmail: string;
  setDonorEmail: (val: string) => void;
}

export const DonorForm: React.FC<DonorFormProps> = ({ isAnonymous, setIsAnonymous, donorName, setDonorName, donorPhone, setDonorPhone, donorCity, setDonorCity, donorEmail, setDonorEmail }) => {
  const theme = useTheme();

  const isEmailValid = (email: string) => email.includes('@') && email.includes('.');

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, ml: 1 }}>
        Data Donatur
      </Typography>
      
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden', borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth label="Nama Lengkap" variant="outlined" placeholder="Cth: Ahmad Abdullah"
          value={isAnonymous ? 'Hamba Allah' : donorName}
          disabled={isAnonymous}
          onChange={(e) => setDonorName(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <User size={18} color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
              endAdornment: donorName.length > 2 && !isAnonymous && (
                <InputAdornment position="end">
                  <CheckCircle2 size={16} color={theme.palette.success.main} />
                </InputAdornment>
              )
            }
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        <TextField
          fullWidth label="Email Aktif" variant="outlined" type="email" placeholder="email@anda.com"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={18} color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
              endAdornment: isEmailValid(donorEmail) && (
                <InputAdornment position="end">
                  <CheckCircle2 size={16} color={theme.palette.success.main} />
                </InputAdornment>
              )
            }
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth label="WhatsApp" variant="outlined" type="tel" placeholder="0812..."
            value={donorPhone}
            onChange={(e) => setDonorPhone(e.target.value.replace(/[^0-9]/g, ''))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={18} color={theme.palette.text.secondary} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            fullWidth label="Domisili" variant="outlined" placeholder="Tokyo"
            value={donorCity}
            onChange={(e) => setDonorCity(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MapPin size={18} color={theme.palette.text.secondary} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>
      </Paper>
      
      <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, pl: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>Donasi Anonim</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Sembunyikan nama dari daftar publik</Typography>
        </Box>
        <IOSToggle checked={isAnonymous} onChange={setIsAnonymous} />
      </Paper>
    </Box>
  );
};
