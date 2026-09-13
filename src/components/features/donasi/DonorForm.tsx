import React from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { User, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { c, radius } from '../../../design';
import { Eyebrow } from '../../common/primitives';
import { Toggle } from '../../common/Toggle';

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

export const DonorForm: React.FC<DonorFormProps> = ({
  isAnonymous,
  setIsAnonymous,
  donorName,
  setDonorName,
  donorPhone,
  setDonorPhone,
  donorCity,
  setDonorCity,
  donorEmail,
  setDonorEmail,
}) => {
  const isEmailValid = (email: string) => email.includes('@') && email.includes('.');

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: 1, mb: 1.5, borderBottom: `1px solid ${c.ruleStrong}` }}>
        <Eyebrow tone="ink">Data Donatur</Eyebrow>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: c.inkFaint }}>Wajib diisi</Typography>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 2.5 }, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.md, bgcolor: c.paper, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Nama Lengkap"
          placeholder="Cth: Ahmad Abdullah"
          value={isAnonymous ? 'Hamba Allah' : donorName}
          disabled={isAnonymous}
          onChange={(e) => setDonorName(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <User size={18} color={c.inkMuted} />
                </InputAdornment>
              ),
              endAdornment: donorName.length > 2 && !isAnonymous && (
                <InputAdornment position="end">
                  <CheckCircle2 size={18} color={c.verified} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          fullWidth
          type="email"
          label="Email Aktif"
          placeholder="email@anda.com"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          helperText="Bukti konfirmasi donasi akan dikirimkan ke email ini"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={18} color={c.inkMuted} />
                </InputAdornment>
              ),
              endAdornment: isEmailValid(donorEmail) && (
                <InputAdornment position="end">
                  <CheckCircle2 size={18} color={c.verified} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            type="tel"
            label="Nomor WhatsApp"
            placeholder="08123456789 atau 080..."
            value={donorPhone}
            onChange={(e) => setDonorPhone(e.target.value.replace(/[^0-9]/g, ''))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={18} color={c.inkMuted} />
                  </InputAdornment>
                ),
                endAdornment: donorPhone.length > 7 && (
                  <InputAdornment position="end">
                    <CheckCircle2 size={18} color={c.verified} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            label="Domisili"
            placeholder="Cth: Tokyo / Saitama / Jakarta"
            value={donorCity}
            onChange={(e) => setDonorCity(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MapPin size={18} color={c.inkMuted} />
                  </InputAdornment>
                ),
                endAdornment: donorCity.length > 1 && (
                  <InputAdornment position="end">
                    <CheckCircle2 size={18} color={c.verified} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Anonim Toggle Card */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 1.75,
            bgcolor: c.well,
            border: `1px solid ${c.rule}`,
            borderRadius: radius.md,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.ink }}>
              Donasi Sebagai Hamba Allah (Anonim)
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, mt: 0.25 }}>
              Nama Anda akan disamarkan sebagai “Hamba Allah” pada daftar donatur publik
            </Typography>
          </Box>
          <Toggle checked={isAnonymous} onChange={setIsAnonymous} label="Donasi anonim" />
        </Box>
      </Box>
    </Box>
  );
};
