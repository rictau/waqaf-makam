import React from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { Check } from 'lucide-react';
import { c, eyebrow, mono, radius, tnum } from '../../../design';
import { Eyebrow, Figure, PullQuote, splitQuote } from '../../common/primitives';
import type { DonationPackageConfig } from '../../../types';

interface PackageSelectionProps {
  selectedPackage: string;
  setSelectedPackage: (pkg: string) => void;
  multiplier: string;
  setMultiplier: (val: string) => void;
  infaqAmount: string;
  setInfaqAmount: (val: string) => void;
  getTransferAmount: () => string;
  setFormError: (err: string | null) => void;
  wakafHadith: string;
  packages: DonationPackageConfig[];
  uniqueCode: number;
}

/** Pull the rupiah estimate out of the configured price label, if present. */
const idrEstimate = (priceLabel: string) => {
  const match = priceLabel.match(/Rp\s?[\d.,]+/);
  return match ? `≈ ${match[0]}` : null;
};

/**
 * Wakaf amounts as a priced list — the kind of row a donor actually reads:
 * ordinal, name, context on the left; the amount right-aligned in tabular
 * figures. No icon tiles, no per-card borders competing with each other.
 */
export const PackageSelection: React.FC<PackageSelectionProps> = ({
  selectedPackage,
  setSelectedPackage,
  multiplier,
  setMultiplier,
  infaqAmount,
  setInfaqAmount,
  getTransferAmount,
  setFormError,
  wakafHadith,
  packages
}) => {
  const { quote, citation } = splitQuote(wakafHadith);

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: 1, mb: 1.5, borderBottom: `1px solid ${c.ruleStrong}` }}>
        <Eyebrow tone="ink">Pilih Nominal Wakaf</Eyebrow>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint }}>
          {packages.length} pilihan
        </Typography>
      </Box>

      <PullQuote cite={citation} sx={{ mb: 2 }}>“{quote}”</PullQuote>

      <Box role="radiogroup" aria-label="Nominal wakaf" sx={{ border: `1px solid ${c.rule}`, borderRadius: radius.lg, bgcolor: c.paper, overflow: 'hidden' }}>
        {packages.map((pkg, index) => {
          const isActive = selectedPackage === pkg.id;
          const hasBadge = Boolean(pkg.badge);
          const name = hasBadge ? pkg.badge : pkg.label;
          const priceMain = hasBadge ? pkg.label : pkg.priceLabel;
          const idr = idrEstimate(pkg.priceLabel);

          return (
            <Box key={pkg.id} sx={{ borderTop: index === 0 ? 'none' : `1px solid ${c.rule}` }}>
              <Box
                component="button"
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  setSelectedPackage(pkg.id);
                  setFormError(null);
                }}
                sx={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  px: 2,
                  py: 1.75,
                  cursor: 'pointer',
                  border: 'none',
                  borderLeft: `3px solid ${isActive ? c.forest : 'transparent'}`,
                  bgcolor: isActive ? c.forestTint : 'transparent',
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                  '&:hover': { bgcolor: isActive ? c.forestTint : 'rgba(20,58,40,0.035)' },
                  '&:active': { transform: 'scale(0.995)' },
                }}
              >
                <Typography component="span" sx={{ fontFamily: mono, fontSize: '0.6875rem', color: isActive ? c.forest : c.inkFaint, pt: '3px', ...tnum }}>
                  {String(index + 1).padStart(2, '0')}
                </Typography>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography component="span" sx={{ ...eyebrow, fontSize: '0.6875rem', color: isActive ? c.forest : c.ink, display: 'block' }}>
                    {name}
                  </Typography>
                  {pkg.subtext && (
                    <Typography sx={{ fontSize: '0.6875rem', lineHeight: 1.45, color: c.inkMuted, mt: 0.5 }}>
                      {pkg.subtext}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box>
                    <Figure size="1rem" tone={isActive ? c.forest : c.ink} sx={{ display: 'block' }}>
                      {priceMain}
                    </Figure>
                    {idr && (
                      <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: c.inkFaint, mt: 0.25, ...tnum }}>
                        {idr}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ width: 16, pt: '2px', color: c.forest, visibility: isActive ? 'visible' : 'hidden' }}>
                    <Check size={16} strokeWidth={3} />
                  </Box>
                </Box>
              </Box>

              {isActive && pkg.id === 'kelipatan' && (
                <Box sx={{ px: 2, pb: 2, pt: 0.5, bgcolor: c.forestTint, borderTop: `1px solid ${c.rule}` }}>
                  <TextField
                    fullWidth size="small" type="number" label="Jumlah m²" placeholder={`Min ${pkg.min || 2}, Max ${pkg.max || 100}`} value={multiplier}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setMultiplier(val); setFormError(null); }}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: c.inkMuted }}>m²</Typography></InputAdornment>,
                      }
                    }}
                    error={multiplier !== '' && (Number(multiplier) < (pkg.min || 2) || Number(multiplier) > (pkg.max || 100))}
                    helperText={multiplier !== '' && (Number(multiplier) < (pkg.min || 2) || Number(multiplier) > (pkg.max || 100)) ? `Maks. ${pkg.max} m² (Jika lebih, silahkan lakukan transaksi lebih dari satu kali) & Min ${pkg.min} m²` : ""}
                    sx={{ mt: 1 }}
                  />
                  <Box sx={{ mt: 1.5, pt: 1.25, borderTop: `1px solid ${c.rule}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Eyebrow sx={{ fontSize: '0.5625rem' }}>Total Transfer</Eyebrow>
                    <Figure size="1rem" tone={c.forest}>{getTransferAmount()}</Figure>
                  </Box>
                </Box>
              )}

              {isActive && pkg.id === 'infaq' && (
                <Box sx={{ px: 2, pb: 2, pt: 0.5, bgcolor: c.forestTint, borderTop: `1px solid ${c.rule}` }}>
                  <TextField
                    fullWidth size="small" type="number" placeholder="Contoh: 10000" value={infaqAmount}
                    onChange={(e) => {
                      setInfaqAmount(e.target.value.replace(/[^0-9]/g, ''));
                      setFormError(null);
                    }}
                    label="Nominal Donasi (¥)"
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: c.inkMuted }}>¥</Typography></InputAdornment>,
                      }
                    }}
                    sx={{ mt: 1 }}
                  />
                  <Typography sx={{ mt: 1, fontSize: '0.6875rem', lineHeight: 1.5, color: c.inkMuted }}>
                    Masukkan nominal dalam Yen Jepang (JPY). Estimasi konversi ke Rupiah dihitung otomatis.
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
