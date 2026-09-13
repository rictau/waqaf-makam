import React from 'react';
import { Box, Typography, Paper, Avatar, Chip, Button } from '@mui/material';
import { Users, User, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { formatJPY } from '../../../utils/formatters';
import type { DonationRecord, PublicConfig } from '../../../types';

interface DonorListProps {
  donations: DonationRecord[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  publicConfig: PublicConfig;
}

export const DonorList: React.FC<DonorListProps> = ({ donations, hasMore, onLoadMore, publicConfig }) => {
  const theme = useTheme();

  return (
    <Box sx={{ animateIn: 'slide-in-from-right-8', duration: 300, minHeight: '100%', bgcolor: 'background.default' }}>
      <Box sx={{ pt: 6, pb: 3, px: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
          {publicConfig.donorListTitle}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 2, letterSpacing: 1, textTransform: 'uppercase' }}>
          {`(Setelah ${publicConfig.donorListSubtitleDate})`}
        </Typography>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.6 }}>
            {publicConfig.wakafHadith}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {donations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, border: '2px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper' }}>
            <Avatar sx={{ bgcolor: 'background.default', mx: 'auto', mb: 2, width: 64, height: 64, border: '1px solid', borderColor: 'divider' }}>
               <Users size={32} color={theme.palette.text.disabled} />
            </Avatar>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
              Belum ada data donasi
            </Typography>
          </Box>
        ) : (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {donations.map((donor, idx, arr) => (
                <Box 
                  key={donor.id} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    p: 2.5, 
                    borderBottom: idx !== arr.length - 1 ? '1px solid' : 'none', 
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(18, 76, 58, 0.02)' } 
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: donor.status === 'verified' ? 'rgba(18, 76, 58, 0.08)' : 'background.default', 
                        color: donor.status === 'verified' ? 'primary.main' : 'text.disabled', 
                        borderRadius: 2, 
                        width: 48, 
                        height: 48,
                        border: '1.5px solid',
                        borderColor: donor.status === 'verified' ? 'primary.light' : 'divider'
                      }}
                    >
                       <User size={24} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                        {donor.name}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 0.5 }}>
                         <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'background.default', px: 1, py: 0.25, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                           <Clock size={10} style={{ marginRight: 4, color: theme.palette.text.secondary }} />
                           <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.65rem' }}>
                             {donor.date.split(',')[0]}
                           </Typography>
                         </Box>
                         <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'background.default', px: 1, py: 0.25, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                           <MapPin size={10} style={{ marginRight: 4, color: theme.palette.text.secondary }} />
                           <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.65rem' }}>
                             {donor.loc || 'Japan'}
                           </Typography>
                         </Box>
                         <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.65rem', ml: 0.5 }}>
                           {donor.package || 'Donasi'}
                         </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', ml: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.2, mb: 0.5 }}>
                       {formatJPY(donor.amount)}
                    </Typography>
                    <Chip 
                      icon={donor.status === 'verified' ? <CheckCircle2 size={12} /> : undefined}
                      label={donor.status === 'verified' ? 'Verified' : 'Pending'} 
                      size="small"
                      sx={{ 
                        height: 20, px: 0.5, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                        bgcolor: donor.status === 'verified' ? 'primary.main' : 'warning.main',
                        color: 'white',
                        '& .MuiChip-icon': { color: 'inherit', ml: 0.5 }
                      }} 
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {hasMore && onLoadMore && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              onClick={onLoadMore}
              sx={{ 
                borderRadius: 2, 
                fontWeight: 900, 
                textTransform: 'uppercase',
                letterSpacing: 1,
                px: 5,
                py: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                bgcolor: 'background.paper',
                color: 'text.primary',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'background.default', borderColor: 'primary.main' }
              }}
            >
              Muat Lebih Banyak
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};
