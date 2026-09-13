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

      <Box role="radiogroup" aria-label="Nominal wakaf" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {packages.map((pkg, index) => {
          const isActive = selectedPackage === pkg.id;
          const hasBadge = Boolean(pkg.badge);
          const name = hasBadge ? pkg.badge : pkg.label;
          const priceMain = hasBadge ? pkg.label : pkg.priceLabel;
          const idr = idrEstimate(pkg.priceLabel);

          return (
            <Box
              key={pkg.id}
              sx={{
                border: isActive ? `2px solid ${c.forest}` : `1.5px solid ${c.ruleStrong}`,
                borderRadius: radius.md,
                bgcolor: isActive ? c.forestTint : c.paper,
                overflow: 'hidden',
                transition: 'border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
                '&:hover': {
                  borderColor: c.forest,
                },
              }}
            >
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
                  alignItems: 'center',
                  gap: 1.75,
                  p: 2,
                  cursor: 'pointer',
                  border: 'none',
                  bgcolor: 'transparent',
                  minHeight: 58,
                }}
              >
                {/* Radio button indicator — universally recognized clickable cue */}
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${isActive ? c.forest : c.ruleStrong}`,
                    bgcolor: isActive ? c.forest : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 150ms ease',
                  }}
                >
                  {isActive && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: isActive ? c.forest : c.ink,
                      display: 'block',
                      lineHeight: 1.3,
                    }}
                  >
                    {name}
                  </Typography>
                  {pkg.subtext && (
                    <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.45, color: c.inkMuted, mt: 0.5 }}>
                      {pkg.subtext}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Figure size="1.125rem" tone={isActive ? c.forest : c.ink} sx={{ display: 'block' }}>
                    {priceMain}
                  </Figure>
                  {idr && (
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: c.inkMuted, mt: 0.25, ...tnum }}>
                      {idr}
                    </Typography>
                  )}
                </Box>
              </Box>

              {isActive && pkg.id === 'kelipatan' && (
                <Box sx={{ px: 2, pb: 2, pt: 1, bgcolor: c.well, borderTop: `1px solid ${c.rule}` }}>
                  <TextField
                    fullWidth type="number" label="Jumlah m²" placeholder={`Min ${pkg.min || 2}, Max ${pkg.max || 100}`} value={multiplier}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setMultiplier(val); setFormError(null); }}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.inkMuted }}>m²</Typography></InputAdornment>,
                      }
                    }}
                    error={multiplier !== '' && (Number(multiplier) < (pkg.min || 2) || Number(multiplier) > (pkg.max || 100))}
                    helperText={multiplier !== '' && (Number(multiplier) < (pkg.min || 2) || Number(multiplier) > (pkg.max || 100)) ? `Maks. ${pkg.max} m² & Min ${pkg.min} m²` : ""}
                    sx={{ mt: 1 }}
                  />
                  <Box sx={{ mt: 1.5, pt: 1.25, borderTop: `1px solid ${c.rule}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Eyebrow sx={{ fontSize: '0.6875rem' }}>Total Transfer</Eyebrow>
                    <Figure size="1.125rem" tone={c.forest}>{getTransferAmount()}</Figure>
                  </Box>
                </Box>
              )}

              {isActive && pkg.id === 'infaq' && (
                <Box sx={{ px: 2, pb: 2, pt: 1, bgcolor: c.well, borderTop: `1px solid ${c.rule}` }}>
                  <TextField
                    fullWidth type="number" placeholder="Contoh: 10000" value={infaqAmount}
                    onChange={(e) => {
                      setInfaqAmount(e.target.value.replace(/[^0-9]/g, ''));
                      setFormError(null);
                    }}
                    label="Nominal Donasi (¥)"
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: c.inkMuted }}>¥</Typography></InputAdornment>,
                      }
                    }}
                    sx={{ mt: 1 }}
                  />
                  <Typography sx={{ mt: 1, fontSize: '0.75rem', lineHeight: 1.5, color: c.inkMuted }}>
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
