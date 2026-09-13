import React from 'react';
import { Box, InputBase, Typography } from '@mui/material';
import { CheckCircle2 } from 'lucide-react';
import { c, eyebrow, radius } from '../../../design';
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

/**
 * Form rows, not floating cards: a fixed label column, a borderless field, and
 * a hairline between records. The focused row gets a forest edge and a white
 * ground — immediate feedback without any animation.
 */
const FieldRow: React.FC<{
  id: string;
  label: string;
  last?: boolean;
  valid?: boolean;
  children: React.ReactNode;
}> = ({ id, label, last, valid, children }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 2,
      py: 1.125,
      borderBottom: last ? 'none' : `1px solid ${c.rule}`,
      borderLeft: '2px solid transparent',
      transition: 'background-color 150ms ease, border-color 150ms ease',
      '&:focus-within': { bgcolor: c.raised, borderLeftColor: c.forest },
    }}
  >
    <Box component="label" htmlFor={id} sx={{ ...eyebrow, fontSize: '0.5625rem', width: 82, flexShrink: 0, cursor: 'pointer' }}>
      {label}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
      {children}
      <Box sx={{ width: 15, flexShrink: 0, color: c.verified, display: 'flex', visibility: valid ? 'visible' : 'hidden' }}>
        <CheckCircle2 size={15} />
      </Box>
    </Box>
  </Box>
);

const fieldSx = {
  flex: 1,
  minWidth: 0,
  '& .MuiInputBase-input': {
    p: 0,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: c.ink,
    '&::placeholder': { color: c.inkFaint, opacity: 1, fontWeight: 500 },
    '&.Mui-disabled': { color: c.inkMuted, WebkitTextFillColor: c.inkMuted },
  },
};

export const DonorForm: React.FC<DonorFormProps> = ({ isAnonymous, setIsAnonymous, donorName, setDonorName, donorPhone, setDonorPhone, donorCity, setDonorCity, donorEmail, setDonorEmail }) => {
  const isEmailValid = (email: string) => email.includes('@') && email.includes('.');

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: 1, mb: 1.5, borderBottom: `1px solid ${c.ruleStrong}` }}>
        <Eyebrow tone="ink">Data Donatur</Eyebrow>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint }}>Wajib diisi</Typography>
      </Box>

      <Box sx={{ border: `1px solid ${c.rule}`, borderRadius: radius.lg, bgcolor: c.paper, overflow: 'hidden' }}>
        <FieldRow id="donor-name" label="Nama" valid={donorName.length > 2 && !isAnonymous}>
          <InputBase
            id="donor-name" fullWidth placeholder="Cth: Ahmad Abdullah" sx={fieldSx}
            value={isAnonymous ? 'Hamba Allah' : donorName}
            disabled={isAnonymous}
            onChange={(e) => setDonorName(e.target.value)}
          />
        </FieldRow>

        <FieldRow id="donor-email" label="Email" valid={isEmailValid(donorEmail)}>
          <InputBase
            id="donor-email" fullWidth type="email" placeholder="email@anda.com" sx={fieldSx}
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
          />
        </FieldRow>

        <FieldRow id="donor-phone" label="WhatsApp" valid={donorPhone.length > 7}>
          <InputBase
            id="donor-phone" fullWidth type="tel" inputMode="numeric" placeholder="0812…" sx={fieldSx}
            value={donorPhone}
            onChange={(e) => setDonorPhone(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </FieldRow>

        <FieldRow id="donor-city" label="Domisili" valid={donorCity.length > 1}>
          <InputBase
            id="donor-city" fullWidth placeholder="Tokyo" sx={fieldSx}
            value={donorCity}
            onChange={(e) => setDonorCity(e.target.value)}
          />
        </FieldRow>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2, py: 1.25, bgcolor: c.well, borderTop: `1px solid ${c.rule}` }}>
          <Box>
            <Eyebrow tone="ink" sx={{ fontSize: '0.5625rem' }}>Donasi Anonim</Eyebrow>
            <Typography sx={{ fontSize: '0.6875rem', color: c.inkMuted, mt: 0.25 }}>
              Nama diganti “Hamba Allah” pada daftar publik
            </Typography>
          </Box>
          <Toggle checked={isAnonymous} onChange={setIsAnonymous} label="Donasi anonim" />
        </Box>
      </Box>
    </Box>
  );
};
