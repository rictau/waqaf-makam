import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { ArrowRight, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { c, eyebrow, radius, tnum } from '../../../design';
import { Eyebrow, Figure } from '../../common/primitives';
import { formatJPY } from '../../../utils/formatters';
import type { CampaignDocument } from '../../../types';

interface CampaignDirectoryProps {
  campaigns: CampaignDocument[];
  onSelectCampaign: (slug: string) => void;
  onAdminClick?: () => void;
}

export const CampaignDirectory: React.FC<CampaignDirectoryProps> = ({
  campaigns,
  onSelectCampaign,
  onAdminClick
}) => {
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalVerifiedAll = campaigns.reduce(
    (sum, c) => sum + (c.baseVerified || 0) + (c.totalVerifiedAmount || 0),
    0
  );
  const totalNeedAll = campaigns.reduce((sum, c) => sum + (c.totalNeed || 0), 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: c.well }}>
      {/* Top Bar */}
      <Box sx={{ py: 1.5, px: 2.5, bgcolor: c.paper, borderBottom: `1px solid ${c.rule}` }}>
        <Box sx={{ maxWidth: 840, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <img src="/kmii-logo.png" alt="KMII Jepang" style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: c.ink, lineHeight: 1.2 }}>
                KMII Jepang
              </Typography>
              <Typography sx={{ fontSize: '0.625rem', color: c.inkMuted, fontWeight: 600 }}>
                Portal ZISWAF & Donasi
              </Typography>
            </Box>
          </Box>
          {onAdminClick && (
            <Button
              size="small"
              onClick={onAdminClick}
              sx={{ ...eyebrow, fontSize: '0.625rem', color: c.forest, border: `1px solid ${c.rule}`, px: 1.5 }}
            >
              Admin Panel
            </Button>
          )}
        </Box>
      </Box>

      {/* Hero Banner */}
      <Box sx={{ bgcolor: c.forest, color: c.paper, py: 4, px: 2.5, borderBottom: `2px solid ${c.brassBright}` }}>
        <Container maxWidth="md" disableGutters>
          <Eyebrow tone="inverse" sx={{ mb: 1, fontSize: '0.6875rem' }}>
            Portal Donasi Resmi
          </Eyebrow>
          <Typography
            variant="h1"
            sx={{
              color: c.paper,
              fontSize: { xs: '1.625rem', sm: '2.125rem' },
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: '22ch',
              mb: 2
            }}
          >
            Portal Donasi & ZISWAF KMII Jepang
          </Typography>
          <Typography sx={{ color: 'rgba(251,249,244,0.85)', fontSize: '0.875rem', maxWidth: '55ch', lineHeight: 1.6 }}>
            Salurkan zakat, infaq, sedekah, dan wakaf Anda untuk berbagai program dakwah, kepedulian sosial, dan kemaslahatan muslim di Jepang.
          </Typography>

          {/* Global summary stats */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              mt: 3,
              pt: 2.5,
              borderTop: '1px solid rgba(251,249,244,0.15)',
              flexWrap: 'wrap'
            }}
          >
            <Box>
              <Typography sx={{ ...eyebrow, fontSize: '0.5625rem', color: 'rgba(251,249,244,0.65)' }}>
                Program Aktif
              </Typography>
              <Figure size="1.5rem" tone={c.paper}>
                {activeCampaigns.length}
              </Figure>
            </Box>
            <Box>
              <Typography sx={{ ...eyebrow, fontSize: '0.5625rem', color: 'rgba(251,249,244,0.65)' }}>
                Total Dana Terkumpul
              </Typography>
              <Figure size="1.5rem" tone={c.brassBright}>
                {formatJPY(totalVerifiedAll)}
              </Figure>
            </Box>
            {totalNeedAll > 0 && (
              <Box>
                <Typography sx={{ ...eyebrow, fontSize: '0.5625rem', color: 'rgba(251,249,244,0.65)' }}>
                  Akumulasi Kebutuhan
                </Typography>
                <Figure size="1.5rem" tone="rgba(251,249,244,0.85)">
                  {formatJPY(totalNeedAll)}
                </Figure>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* Campaign List */}
      <Container maxWidth="md" sx={{ py: 4, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: 1, mb: 2, borderBottom: `1px solid ${c.ruleStrong}` }}>
          <Eyebrow tone="ink">Daftar Program</Eyebrow>
          <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint }}>
            Pilih program untuk berdonasi
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {campaigns.map((camp) => {
            const verified = (camp.baseVerified || 0) + (camp.totalVerifiedAmount || 0);
            const totalCollected = verified + (camp.totalPendingAmount || 0);
            const target = camp.totalNeed || 1;
            const pct = Math.min(100, (totalCollected / target) * 100);
            const verifiedPct = Math.min(100, (verified / target) * 100);
            const isClosed = camp.status === 'closed' || camp.isClosed;

            return (
              <Box
                key={camp.id}
                sx={{
                  bgcolor: c.paper,
                  border: `1px solid ${c.ruleStrong}`,
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                  transition: 'box-shadow 150ms ease, border-color 150ms ease',
                  '&:hover': {
                    borderColor: c.forest,
                    boxShadow: '0 4px 12px rgba(20,58,40,0.06)'
                  }
                }}
              >
                {(camp.imageUrl || camp.publicConfig?.imageUrl) && (
                  <Box
                    component="img"
                    src={camp.imageUrl || camp.publicConfig?.imageUrl}
                    alt={camp.title || camp.shortName}
                    sx={{
                      width: '100%',
                      height: { xs: 160, sm: 200 },
                      objectFit: 'cover',
                      borderBottom: `1px solid ${c.rule}`,
                      cursor: 'pointer',
                      display: 'block'
                    }}
                    onClick={() => onSelectCampaign(camp.id)}
                  />
                )}
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                    <Box>
                      <Eyebrow tone="brass" sx={{ fontSize: '0.625rem' }}>
                        {camp.category || camp.publicConfig?.category ? `${camp.category || camp.publicConfig?.category} · ` : ''}{camp.shortName || 'Program KMII'}
                      </Eyebrow>
                      <Typography
                        variant="h2"
                        sx={{
                          fontSize: { xs: '1.125rem', sm: '1.25rem' },
                          color: c.ink,
                          fontWeight: 700,
                          mt: 0.25,
                          cursor: 'pointer'
                        }}
                        onClick={() => onSelectCampaign(camp.id)}
                      >
                        {camp.title || camp.publicConfig?.campaignTitle || camp.shortName}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: radius.sm,
                        bgcolor: isClosed ? c.well : c.forestTint,
                        border: `1px solid ${isClosed ? c.rule : c.forest}`,
                        flexShrink: 0
                      }}
                    >
                      <Typography
                        sx={{
                          ...eyebrow,
                          fontSize: '0.5625rem',
                          color: isClosed ? c.inkMuted : c.forest
                        }}
                      >
                        {isClosed ? 'Ditutup' : 'Aktif'}
                      </Typography>
                    </Box>
                  </Box>

                  {camp.publicConfig?.locationText && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                      <MapPin size={12} color={c.inkMuted} />
                      <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, fontWeight: 500 }}>
                        {camp.publicConfig.locationText}
                      </Typography>
                    </Box>
                  )}

                  {/* Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: c.ink, ...tnum }}>
                          {formatJPY(totalCollected)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, ...tnum }}>
                          / {formatJPY(target)}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: c.forest, ...tnum }}>
                        {pct.toFixed(1)}%
                      </Typography>
                    </Box>

                    {/* Progress track */}
                    <Box sx={{ height: 8, bgcolor: c.well, borderRadius: radius.lg, overflow: 'hidden', display: 'flex' }}>
                      <Box sx={{ width: `${verifiedPct}%`, bgcolor: c.forest, transition: 'width 300ms ease' }} />
                      <Box sx={{ width: `${Math.max(0, pct - verifiedPct)}%`, bgcolor: c.brassBright, transition: 'width 300ms ease' }} />
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1, borderTop: `1px solid ${c.rule}` }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onSelectCampaign(`${camp.id}/donatur`)}
                      sx={{
                        ...eyebrow,
                        fontSize: '0.625rem',
                        color: c.inkMuted,
                        borderColor: c.rule,
                        '&:hover': { borderColor: c.forest, color: c.forest }
                      }}
                    >
                      Lihat Donatur
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onSelectCampaign(camp.id)}
                      endIcon={<ArrowRight size={13} />}
                      sx={{
                        ...eyebrow,
                        fontSize: '0.625rem',
                        bgcolor: c.forest,
                        color: c.paper,
                        px: 2,
                        '&:hover': { bgcolor: c.forestDeep }
                      }}
                    >
                      Donasi Sekarang
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ py: 4, px: 2, textAlign: 'center', borderTop: `1px solid ${c.ruleStrong}` }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: c.inkFaint }}>
          © KMII Jepang (Keluarga Masyarakat Islam Indonesia di Jepang)
        </Typography>
      </Box>
    </Box>
  );
};
