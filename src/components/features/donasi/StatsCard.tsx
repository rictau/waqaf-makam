import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Chip, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Info, Clock } from 'lucide-react';
import { formatJPY, formatIDR } from '../../../utils/formatters';
import type { PhaseProgress } from '../../../types';

interface StatsCardProps {
  danaTerkumpulAmount: number;
  terverifikasiAmount: number;
  totalPercentage: number;
  shortfallAmount: number;
  daysLeft: number;
  lastUpdate?: { toDate?: () => Date } | null;
  phaseProgress: PhaseProgress[];
  activePhase?: PhaseProgress;
  jpyToIdrRate: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  danaTerkumpulAmount, 
  terverifikasiAmount, 
  totalPercentage, 
  shortfallAmount, 
  daysLeft, 
  lastUpdate,
  phaseProgress,
  activePhase,
  jpyToIdrRate
}) => {
  const theme = useTheme();
  const verifiedPercentage = danaTerkumpulAmount > 0 ? (terverifikasiAmount / danaTerkumpulAmount) * totalPercentage : 0;
  const pendingPercentage = Math.max(0, totalPercentage - verifiedPercentage);

  const [currentJST, setCurrentJST] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const date = lastUpdate?.toDate ? lastUpdate.toDate() : new Date();
      const timeString = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
      setCurrentJST(`Pembaruan: ${timeString} JST`);
    };
    updateTime();
  }, [lastUpdate]);

  const firstPhase = phaseProgress[0];
  const isMultiPhaseActive = Boolean(activePhase && activePhase.index > 0);
  const activePercentage = activePhase?.percentage ?? totalPercentage;
  const completedPhaseNames = activePhase
    ? phaseProgress
      .slice(0, activePhase.index)
      .map((phase) => phase.shortLabel || phase.label)
      .filter(Boolean)
    : [];
  const phaseStatusMessage = activePhase && completedPhaseNames.length > 0
    ? `Alhamdulillah, target ${completedPhaseNames.join(', ')} telah tercapai. Donasi ${activePhase.shortLabel || activePhase.label} kini dibuka.`
    : activePhase?.subtext || '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card
        elevation={0}
        sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'primary.light', bgcolor: 'background.paper', boxShadow: '0 10px 30px 0 rgba(0, 0, 0, 0.05)' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1.5, mb: 0.5, display: 'flex', flexDirection: 'column' }}>
              <span>Dana Terkumpul</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 0, textTransform: 'none', opacity: 0.8, marginTop: '2px' }}>{currentJST}</span>
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: -0.5, lineHeight: 1.1 }}>
              {formatJPY(danaTerkumpulAmount)}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
              (~ {formatIDR(danaTerkumpulAmount, jpyToIdrRate)})
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {isMultiPhaseActive && activePhase && (
              <Chip 
                label={activePhase.shortLabel || activePhase.label} 
                size="small" 
                sx={{ bgcolor: 'secondary.main', color: 'text.primary', fontWeight: 900, height: 20, borderRadius: 1, fontSize: '0.65rem', mb: 1, textTransform: 'uppercase' }} 
              />
            )}
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
              {`${activePercentage.toFixed(1)}%`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2.5, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1 }}>
            Terverifikasi
          </Typography>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
            {formatJPY(terverifikasiAmount)} <span style={{ opacity: 0.7, fontWeight: 600 }}>({formatIDR(terverifikasiAmount, jpyToIdrRate)})</span>
          </Typography>
        </Box>

        {isMultiPhaseActive ? (
          <>
            {phaseProgress.slice(0, activePhase?.index || 0).map((phase) => (
              <Box sx={{ mb: 2 }} key={phase.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    {phase.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    {phase.completedLabel || 'Selesai (100%)'}
                  </Typography>
                </Box>
                <Box sx={{ height: 14, borderRadius: 7, bgcolor: 'success.light', opacity: 0.3, width: '100%', overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', borderRadius: 7, bgcolor: 'success.main', width: '100%' }} />
                </Box>
              </Box>
            ))}

            {activePhase && (
            <Box sx={{ mb: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(18, 76, 58, 0.05)', border: '1px solid', borderColor: 'primary.light' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  {activePhase.label}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.7rem' }}>
                  {activePhase.percentage.toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ height: 14, borderRadius: 7, bgcolor: 'background.paper', display: 'flex', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: `${activePhase.verifiedPercentage}%`, bgcolor: 'primary.main', transition: 'width 0.5s ease-in-out' }} />
                <Box sx={{ width: `${activePhase.pendingPercentage}%`, bgcolor: 'warning.main', transition: 'width 0.5s ease-in-out' }} />
              </Box>
            </Box>
            )}
          </>
        ) : (
          /* Standard Phase 1 Progress Bar */
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: phaseProgress.length > 1 ? 'space-between' : 'flex-end', mb: 0.5 }}>
              {phaseProgress.length > 1 && (
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  {firstPhase?.label || 'Tahap 1'}
                </Typography>
              )}
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {totalPercentage.toFixed(1)}%
              </Typography>
            </Box>
            <Box sx={{ height: 14, borderRadius: 7, mb: 1, bgcolor: 'background.default', display: 'flex', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: `${verifiedPercentage}%`, bgcolor: 'primary.main', transition: 'width 0.5s ease-in-out' }} />
              <Box sx={{ width: `${pendingPercentage}%`, bgcolor: 'warning.main', transition: 'width 0.5s ease-in-out' }} />
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mr: 0.5 }} /> Terverifikasi
          </Typography>
          <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main', mr: 0.5 }} /> Pending
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', color: 'primary.main', p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
          <Info size={16} style={{ marginRight: 8, flexShrink: 0, marginTop: 2 }} />
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.4, fontSize: '0.85rem', mb: 0.5 }}>
              {firstPhase?.shortfallLabel || 'Masih Dibutuhkan'}: {formatJPY(shortfallAmount)} <span style={{ opacity: 0.75, fontWeight: 600 }}>(~ {formatIDR(shortfallAmount, jpyToIdrRate)})</span>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4, fontSize: '0.72rem' }}>
              Target: <strong>¥20.000.000</strong> (Sudah DP: <strong>¥2.000.000</strong>). Batas pelunasan <strong>31 Maret 2027</strong> (~ ± ¥530.000/bulan).
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(19, 56, 39, 0.04)', border: '1px solid', borderColor: 'primary.light' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25, fontSize: '0.65rem' }}>
            Tahap 1: 10 Kapling (~300 m² / 120 Slot)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4, fontSize: '0.7rem' }}>
            Setelah masa pakai 10 tahun, kapling digunakan kembali untuk jenazah berikutnya sehingga melayani keluarga WNI di Jepang selama puluhan tahun ke depan.
          </Typography>
        </Box>
      </Card>

      <Paper
        elevation={0}
        sx={{ p: 2.5, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 10px 30px 0 rgba(0, 0, 0, 0.03)' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'secondary.main', mr: 1.5 }}>
            <Clock size={28} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1 }}>
              Sisa Waktu
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Batas: 31 Maret 2027
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Typography variant="h2" sx={{ fontWeight: 900, color: 'secondary.main', mr: 0.5 }}>
            {daysLeft}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', textTransform: 'uppercase' }}>
            Hari
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
