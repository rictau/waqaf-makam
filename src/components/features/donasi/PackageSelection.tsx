import React from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { c, eyebrow, mono, radius, tnum } from '../../../design';
import { Eyebrow, Figure, PullQuote, splitQuote } from '../../common/primitives';
import { SegmentedControl } from '../../common/SegmentedControl';
import type { DonationPackageConfig } from '../../../types';

interface PackageSelectionProps {
  selectedPackage: string;
  setSelectedPackage: (pkg: string) => void;
  multiplier: string;
  setMultiplier: (val: string) => void;
  infaqAmount: string;
  setInfaqAmount: (val: string) => void;
  infaqCurrency: 'JPY' | 'IDR';
  setInfaqCurrency: (curr: 'JPY' | 'IDR') => void;
  jpyToIdrRate: number;
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
  infaqCurrency,
  setInfaqCurrency,
  jpyToIdrRate,
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
                {/* Radio indicator for clear clickability */}
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `1.5px solid ${isActive ? c.forest : c.ruleStrong}`,
                    bgcolor: isActive ? c.forest : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: '2px',
                    transition: 'all 150ms ease',
                  }}
                >
                  {isActive && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.paper }} />}
                </Box>

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

                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Figure size="1rem" tone={isActive ? c.forest : c.ink} sx={{ display: 'block' }}>
                    {priceMain}
                  </Figure>
                  {idr && (
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: c.inkFaint, mt: 0.25, ...tnum }}>
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
                <Box sx={{ px: 2, pb: 2, pt: 1.5, bgcolor: c.well, borderTop: `1px solid ${c.rule}` }}>
                  <Box sx={{ mb: 1.5 }}>
                    <SegmentedControl
                      ariaLabel="Mata uang donasi"
                      options={[
                        { id: 'JPY', label: '🇯🇵 Yen Jepang (¥)' },
                        { id: 'IDR', label: '🇮🇩 Rupiah (Rp)' }
                      ]}
                      active={infaqCurrency}
                      onChange={(curr) => {
                        setInfaqCurrency(curr as 'JPY' | 'IDR');
                        setInfaqAmount('');
                        setFormError(null);
                      }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    type="number"
                    placeholder={infaqCurrency === 'JPY' ? 'Contoh: 10000' : 'Contoh: 500000'}
                    value={infaqAmount}
                    onChange={(e) => {
                      setInfaqAmount(e.target.value.replace(/[^0-9]/g, ''));
                      setFormError(null);
                    }}
                    label={infaqCurrency === 'JPY' ? 'Nominal Donasi (¥)' : 'Nominal Donasi (Rp)'}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: c.inkMuted }}>
                              {infaqCurrency === 'JPY' ? '¥' : 'Rp'}
                            </Typography>
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={{ mt: 0.5 }}
                  />

                  {infaqAmount && Number(infaqAmount) > 0 ? (
                    <Box
                      sx={{
                        mt: 1.25,
                        p: 1.25,
                        bgcolor: c.paper,
                        borderRadius: radius.sm,
                        border: `1px solid ${c.rule}`,
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Eyebrow sx={{ fontSize: '0.5625rem' }}>
                          {infaqCurrency === 'JPY' ? 'Estimasi Rupiah' : 'Estimasi Yen'}
                        </Eyebrow>
                        <Typography sx={{ fontSize: '0.625rem', color: c.inkFaint, mt: 0.25, ...tnum }}>
                          Kurs 1 JPY ≈ Rp {jpyToIdrRate.toLocaleString('id-ID')}
                        </Typography>
                      </Box>
                      <Figure size="1rem" tone={c.forest}>
                        {infaqCurrency === 'JPY'
                          ? `≈ ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(infaqAmount) * jpyToIdrRate)}`
                          : `≈ ¥${Math.round(Number(infaqAmount) / jpyToIdrRate).toLocaleString('ja-JP')}`
                        }
                      </Figure>
                    </Box>
                  ) : (
                    <Typography sx={{ mt: 1, fontSize: '0.75rem', lineHeight: 1.5, color: c.inkMuted }}>
                      {infaqCurrency === 'JPY'
                        ? `Masukkan nominal dalam Yen Jepang (JPY). Estimasi kurs: 1 JPY ≈ Rp ${jpyToIdrRate.toLocaleString('id-ID')}.`
                        : `Masukkan nominal dalam Rupiah (IDR). Estimasi kurs: 1 JPY ≈ Rp ${jpyToIdrRate.toLocaleString('id-ID')}.`
                      }
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
