import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { formatJPY, formatIDR } from '../../../utils/formatters';
import { c, eyebrow, radius, tnum } from '../../../design';
import { Eyebrow, Figure, LedgerRow, StatusTag } from '../../common/primitives';
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
  donationDeadline?: Date | null;
}

/** Flat progress rail: verified fill, pending fill, quarter ticks. No glow, no shimmer. */
const ProgressRail: React.FC<{ verified: number; pending: number; height?: number }> = ({ verified, pending, height = 10 }) => (
  <Box
    sx={{
      position: 'relative',
      height,
      display: 'flex',
      bgcolor: c.raised,
      border: `1px solid ${c.ruleStrong}`,
      borderRadius: radius.sm,
      overflow: 'hidden',
    }}
  >
    <Box sx={{ width: `${Math.min(100, Math.max(0, verified))}%`, bgcolor: c.forest, transition: 'width 300ms ease-out' }} />
    <Box sx={{ width: `${Math.min(100, Math.max(0, pending))}%`, bgcolor: c.brassBright, transition: 'width 300ms ease-out' }} />
    {[25, 50, 75].map((tick) => (
      <Box key={tick} sx={{ position: 'absolute', top: 0, bottom: 0, left: `${tick}%`, width: '1px', bgcolor: 'rgba(20,32,27,0.18)' }} />
    ))}
  </Box>
);

/**
 * The campaign ledger — the product surface of this page.
 *
 * Replaces the old ornamental stat card: one bordered record with an
 * asymmetric headline figure, a flat progress rail, and a dense label/value
 * ledger with real amounts in tabular figures.
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  danaTerkumpulAmount,
  terverifikasiAmount,
  totalPercentage,
  shortfallAmount,
  daysLeft,
  lastUpdate,
  phaseProgress,
  activePhase,
  jpyToIdrRate,
  donationDeadline,
}) => {
  const verifiedPercentage = danaTerkumpulAmount > 0 ? (terverifikasiAmount / danaTerkumpulAmount) * totalPercentage : 0;
  const pendingPercentage = Math.max(0, totalPercentage - verifiedPercentage);
  const pendingAmount = Math.max(0, danaTerkumpulAmount - terverifikasiAmount);
  const formattedDeadline = donationDeadline && !isNaN(donationDeadline.getTime())
    ? donationDeadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '31 Maret 2027';

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
  const completedPhases = activePhase ? phaseProgress.slice(0, activePhase.index) : [];
  const completedPhaseNames = completedPhases.map((phase) => phase.shortLabel || phase.label).filter(Boolean);
  const phaseStatusMessage = activePhase && completedPhaseNames.length > 0
    ? `Alhamdulillah, target ${completedPhaseNames.join(', ')} telah tercapai. Donasi ${activePhase.shortLabel || activePhase.label} kini dibuka.`
    : activePhase?.subtext || '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Ledger */}
      <Box component="section" sx={{ bgcolor: c.paper, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg }}>
        {/* Headline figure — asymmetric split, amount left, share of target right */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, p: 2.25, pb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Eyebrow tone="ink">Dana Terkumpul</Eyebrow>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: c.inkFaint, mt: 0.25, ...tnum }}>
              {currentJST}
            </Typography>
            <Figure size="2.125rem" sx={{ display: 'block', mt: 1 }}>
              {formatJPY(danaTerkumpulAmount)}
            </Figure>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: c.inkMuted, mt: 0.25, ...tnum }}>
              ≈ {formatIDR(danaTerkumpulAmount, jpyToIdrRate)}
            </Typography>
          </Box>

          <Box
            sx={{
              textAlign: 'right',
              flexShrink: 0,
              pl: 2,
              borderLeft: `1px solid ${c.rule}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.5,
            }}
          >
            {isMultiPhaseActive && activePhase && (
              <StatusTag state="neutral" label={activePhase.shortLabel || activePhase.label} />
            )}
            <Figure size="1.5rem" tone={c.forest}>{`${activePercentage.toFixed(1)}%`}</Figure>
            <Eyebrow sx={{ fontSize: '0.5625rem' }}>Dari Target</Eyebrow>
          </Box>
        </Box>

        {/* Progress */}
        <Box sx={{ px: 2.25, pb: 2, borderBottom: `1px solid ${c.rule}` }}>
          {phaseProgress.length > 1 && !isMultiPhaseActive && (
            <Eyebrow sx={{ mb: 0.75, fontSize: '0.5625rem' }}>{firstPhase?.label || 'Tahap 1'}</Eyebrow>
          )}
          <ProgressRail verified={verifiedPercentage} pending={pendingPercentage} />
          {/* Legend only — the amounts themselves live in the ledger below. */}
          <Box sx={{ display: 'flex', gap: 2, mt: 0.875 }}>
            {[
              { swatch: c.forest, label: 'Terverifikasi' },
              { swatch: c.brassBright, label: 'Menunggu Verifikasi' },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                <Box sx={{ width: 7, height: 7, bgcolor: item.swatch, flexShrink: 0 }} />
                <Eyebrow sx={{ fontSize: '0.5rem' }}>{item.label}</Eyebrow>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Completed phases + active phase detail */}
        {isMultiPhaseActive && (
          <Box sx={{ px: 2.25, py: 1.5, borderBottom: `1px solid ${c.rule}` }}>
            {completedPhases.map((phase) => (
              <Box key={phase.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
                <Eyebrow sx={{ fontSize: '0.5625rem' }}>{phase.label}</Eyebrow>
                <StatusTag state="verified" label={phase.completedLabel || 'Lunas 100%'} />
              </Box>
            ))}
            {activePhase && (
              <Box sx={{ mt: 1, pt: 1.25, borderTop: `1px solid ${c.rule}` }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 0.75 }}>
                  <Eyebrow tone="ink" sx={{ fontSize: '0.5625rem' }}>{activePhase.label}</Eyebrow>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: c.forest, ...tnum }}>
                    {activePhase.percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <ProgressRail verified={activePhase.verifiedPercentage} pending={activePhase.pendingPercentage} height={8} />
                {phaseStatusMessage && (
                  <Typography sx={{ mt: 1, fontSize: '0.75rem', lineHeight: 1.5, color: c.inkMuted }}>
                    {phaseStatusMessage}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Ledger rows */}
        <Box sx={{ px: 2.25, py: 1 }}>
          <LedgerRow
            label="Terverifikasi"
            value={<Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.verified, ...tnum }}>{formatJPY(terverifikasiAmount)}</Typography>}
            note={formatIDR(terverifikasiAmount, jpyToIdrRate)}
          />
          <LedgerRow
            label="Menunggu Verifikasi"
            value={<Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.pending, ...tnum }}>{formatJPY(pendingAmount)}</Typography>}
            note={formatIDR(pendingAmount, jpyToIdrRate)}
          />
          <LedgerRow
            label={firstPhase?.shortfallLabel || 'Masih Dibutuhkan'}
            value={<Figure size="1.0625rem">{formatJPY(shortfallAmount)}</Figure>}
            note={`≈ ${formatIDR(shortfallAmount, jpyToIdrRate)}`}
            last
          />
        </Box>

        {/* Programme note */}
        <Box sx={{ mx: 2.25, mb: 2.25, pl: 1.5, borderLeft: `2px solid ${c.brassBright}` }}>
          <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.55, color: c.inkMuted }}>
            Target <strong style={{ color: c.ink }}>¥20.000.000</strong> · sudah DP <strong style={{ color: c.ink }}>¥2.000.000</strong> ·
            target pelunasan <strong style={{ color: c.ink }}>{formattedDeadline}</strong>.
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.55, color: c.inkMuted, mt: 0.75 }}>
            <Box component="span" sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.brass, display: 'block', mb: 0.25 }}>
              Tahap 1: 10 Kapling · ~300 m² · 120 Slot
            </Box>
            Setelah masa pakai 10 tahun, kapling digunakan kembali untuk jenazah berikutnya sehingga melayani keluarga WNI di Jepang selama puluhan tahun ke depan.
          </Typography>
        </Box>
      </Box>

      {/* Deadline strip */}
      <Box
        component="section"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2.25,
          py: 1.75,
          bgcolor: c.paper,
          border: `1px solid ${c.rule}`,
          borderRadius: radius.lg,
        }}
      >
        <Box>
          <Eyebrow>Target Pelunasan</Eyebrow>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.ink, mt: 0.25, ...tnum }}>
            {formattedDeadline}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, pl: 2, borderLeft: `1px solid ${c.rule}` }}>
          <Figure size="1.75rem" tone={c.brass}>{daysLeft}</Figure>
          <Eyebrow sx={{ color: c.brass, fontSize: '0.5625rem' }}>Hari<br />Tersisa</Eyebrow>
        </Box>
      </Box>
    </Box>
  );
};
