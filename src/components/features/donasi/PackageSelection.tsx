import React from 'react';
import { Box, Typography, Card, Avatar, TextField, InputAdornment, Chip } from '@mui/material';
import { Check, Heart, Calendar, CheckCircle2, Award, Sparkles, HelpCircle } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();

  const getIcon = (id: string, active: boolean) => {
    const color = active ? theme.palette.primary.main : theme.palette.text.secondary;
    const size = 20;
    if (id === 'bulanan') return <Calendar size={size} color={color} />;
    if (id === 'sekali') return <CheckCircle2 size={size} color={color} />;
    if (id === '1slot') return <Award size={size} color={color} />;
    if (id === 'infaq') return <Sparkles size={size} color={color} />;
    return <Heart size={size} color={color} />;
  };
  
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1, mb: 1, ml: 1 }}>
        Pilih Nominal Wakaf
      </Typography>
      <Box sx={{ mb: 2, ml: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.4, fontWeight: 500 }}>
          {wakafHadith}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {packages.map((pkg) => {
          const isActive = selectedPackage === pkg.id;
          return (
            <Box key={pkg.id}>
              <Card 
                elevation={0}
                onClick={() => {
                  setSelectedPackage(pkg.id);
                  setFormError(null);
                }}
                sx={{ 
                  p: 2, cursor: 'pointer', border: '2px solid', borderColor: isActive ? 'primary.main' : 'divider',
                  bgcolor: isActive ? 'rgba(19, 56, 39, 0.04)' : 'background.paper', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                  '&:hover': { borderColor: 'primary.main', transform: 'translateX(4px)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                  <Avatar sx={{ bgcolor: isActive ? 'rgba(19, 56, 39, 0.1)' : 'background.default', borderRadius: 1.5, width: 42, height: 42, border: '1px solid', borderColor: isActive ? 'primary.light' : 'divider', flexShrink: 0 }}>
                    {getIcon(pkg.id, isActive)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                      <Typography variant="subtitle2" sx={{ color: isActive ? 'primary.main' : 'text.primary', fontWeight: 800 }}>
                        {pkg.label}
                      </Typography>
                      {pkg.badge && (
                        <Chip
                          label={pkg.badge}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            bgcolor: isActive ? 'secondary.main' : 'background.default',
                            color: isActive ? '#fff' : 'text.secondary',
                            border: '1px solid',
                            borderColor: isActive ? 'secondary.dark' : 'divider'
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      {pkg.priceLabel}
                    </Typography>
                    {pkg.subtext && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.85, fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
                        {pkg.subtext}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                  {isActive && (
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(19, 56, 39, 0.3)' }}>
                      <Check size={14} strokeWidth={4} />
                    </Box>
                  )}
                </Box>
              </Card>

              {isActive && pkg.id === 'kelipatan' && (
                <Box sx={{ mt: 1.5, px: 0.5 }}>
                  <TextField 
                    fullWidth type="number" label="Jumlah m²" placeholder={`Min ${pkg.min || 2}, Max ${pkg.max || 100}`} value={multiplier}
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setMultiplier(val); setFormError(null); }}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>m²</Typography></InputAdornment>,
                        sx: { borderRadius: 2, bgcolor: 'background.paper' }
                      }
                    }}
                    error={multiplier !== '' && (Number(multiplier) < (pkg.min || 2) || Number(multiplier) > (pkg.max || 100))}
                    helperText={multiplier !== '' && (Number(multiplier) < (pkg.min || 2) || Number(multiplier) > (pkg.max || 100)) ? `Maks. ${pkg.max} m² (Jika lebih, silahkan lakukan transaksi lebih dari satu kali) & Min ${pkg.min} m²` : ""}
                  />
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.main', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1, style: { backgroundColor: theme.palette.primary.main + '08' } }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      Total: <strong>{getTransferAmount()}</strong>
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {isActive && pkg.id === 'infaq' && (
                <Box sx={{ mt: 1.5, px: 0.5 }}>
                  <TextField 
                    fullWidth type="number" placeholder="Contoh: 10000" value={infaqAmount}
                    onChange={(e) => {
                      setInfaqAmount(e.target.value.replace(/[^0-9]/g, ''));
                      setFormError(null);
                    }}
                    label="Nominal Donasi (¥)"
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>¥</Typography></InputAdornment>,
                        sx: { borderRadius: 2, bgcolor: 'background.paper' }
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary', fontStyle: 'italic', px: 1, lineHeight: 1.4, fontWeight: 500 }}>
                    Silakan masukkan nominal donasi dalam kurs Yen Jepang (JPY). Estimasi konversi ke Rupiah akan otomatis terhitung.
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
