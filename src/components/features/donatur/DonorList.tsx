import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { formatJPY } from '../../../utils/formatters';
import { c, eyebrow, mono, radius, tnum } from '../../../design';
import { Eyebrow, Figure, PullQuote, StatusTag, splitQuote } from '../../common/primitives';
import type { DonationRecord, PublicConfig } from '../../../types';

interface DonorListProps {
  donations: DonationRecord[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  publicConfig: PublicConfig;
}

/**
 * The public ledger. Structured as a real record feed — numbered rows, a fixed
 * column head, hairline separators, amounts right-aligned in tabular figures —
 * instead of a stack of avatar cards.
 */
export const DonorList: React.FC<DonorListProps> = ({ donations, hasMore, onLoadMore, publicConfig }) => {
  const { quote, citation } = splitQuote(publicConfig.wakafHadith);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: c.well }}>
      <Box sx={{ pt: 4, pb: 2.5, px: 2.5, bgcolor: c.paper, borderBottom: `1px solid ${c.ruleStrong}` }}>
        <Eyebrow tone="brass" sx={{ mb: 1 }}>Catatan Publik</Eyebrow>
        <Typography variant="h1" sx={{ color: c.ink }}>
          {publicConfig.donorListTitle}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: '0.75rem', fontWeight: 600, color: c.inkMuted, ...tnum }}>
          Tercatat setelah {publicConfig.donorListSubtitleDate}
        </Typography>
        <PullQuote cite={citation} sx={{ mt: 2 }}>“{quote}”</PullQuote>
      </Box>

      <Box sx={{ p: 2 }}>
        {donations.length === 0 ? (
          <Box sx={{ px: 2, py: 5, textAlign: 'center', bgcolor: c.paper, border: `1px dashed ${c.ruleStrong}`, borderRadius: radius.lg }}>
            <Eyebrow>Belum ada data donasi</Eyebrow>
            <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: c.inkFaint }}>
              Donasi yang masuk akan tercatat di halaman ini.
            </Typography>
          </Box>
        ) : (
          <Box component="section" sx={{ bgcolor: c.paper, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.875, bgcolor: c.well, borderBottom: `1px solid ${c.ruleStrong}` }}>
              <Eyebrow sx={{ fontSize: '0.5625rem' }}>Donatur</Eyebrow>
              <Eyebrow sx={{ fontSize: '0.5625rem' }}>Nominal</Eyebrow>
            </Box>

            {donations.map((donor, idx) => (
              <Box
                key={donor.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderTop: idx === 0 ? 'none' : `1px solid ${c.rule}`,
                  transition: 'background-color 150ms ease',
                  '&:hover': { bgcolor: 'rgba(20,58,40,0.03)' },
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
                  <Typography component="span" sx={{ fontFamily: mono, fontSize: '0.6875rem', color: c.inkFaint, pt: '2px', ...tnum }}>
                    {String(idx + 1).padStart(2, '0')}
                  </Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.ink, letterSpacing: '-0.01em' }}>
                      {donor.name}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontSize: '0.6875rem', color: c.inkMuted, ...tnum }}>
                      {donor.date.split(',')[0]}
                      {' · '}{donor.loc || 'Japan'}
                    </Typography>
                    <Typography sx={{ ...eyebrow, fontSize: '0.5625rem', color: c.brass, mt: 0.375 }}>
                      {donor.package || 'Donasi'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Figure size="0.9375rem" sx={{ display: 'block' }}>{formatJPY(donor.amount)}</Figure>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusTag
                      state={donor.status === 'verified' ? 'verified' : 'pending'}
                      label={donor.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {hasMore && onLoadMore && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={onLoadMore}
              sx={{ ...eyebrow, fontSize: '0.625rem', color: c.ink, px: 3, py: 1, bgcolor: c.paper }}
            >
              Muat Lebih Banyak
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};
