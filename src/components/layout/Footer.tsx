import React from 'react';
import { Box, Typography, Paper, Divider, Avatar } from '@mui/material';
import { MessageCircle, Instagram, Mail } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import type { PublicConfig } from '../../types';

interface FooterProps {
  publicConfig: PublicConfig;
}

export const Footer: React.FC<FooterProps> = ({ publicConfig }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2, pb: 6, px: 3 }}>
      <Divider sx={{ mb: 3, opacity: 0.5 }} />

      {/* Quote Banner */}
      <Box sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', display: 'block', lineHeight: 1.5, mb: 0.5 }}>
          "{publicConfig.wakafHadith.replace(/^"|"$/g, '')}"
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.65rem' }}>
          HR. MUSLIM NO. 1631
        </Typography>
      </Box>
      
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
          Konfirmasi Donasi & Layanan Informasi
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem' }}>
          Panitia Wakaf Pemakaman Muslim Honjo:
        </Typography>
      </Box>

      {/* PIC Quick Contact Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3 }}>
        <Paper
          component="a"
          href="https://wa.me/819096845955"
          target="_blank"
          elevation={0}
          sx={{
            p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
            textDecoration: 'none', textAlign: 'center', bgcolor: 'background.paper',
            transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' }
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block' }}>
            Ibaraki / Kanto
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mt: 0.25 }}>
            Cak Anas
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
            +81 90-9684-5955
          </Typography>
        </Paper>

        <Paper
          component="a"
          href="https://wa.me/818048301988"
          target="_blank"
          elevation={0}
          sx={{
            p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
            textDecoration: 'none', textAlign: 'center', bgcolor: 'background.paper',
            transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' }
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block' }}>
            Tokyo & Sekitarnya
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mt: 0.25 }}>
            Fauzan
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
            +81 80-4830-1988
          </Typography>
        </Paper>
      </Box>

      {/* Social Links */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
        {[
          { icon: <MessageCircle size={18} />, label: 'WhatsApp', href: publicConfig.contactLinks.WHATSAPP, color: '#25D366' },
          { icon: <Instagram size={18} />, label: 'Instagram', href: publicConfig.contactLinks.INSTAGRAM, color: '#E4405F' },
          { icon: <Mail size={18} />, label: 'Email', href: publicConfig.contactLinks.EMAIL, color: theme.palette.primary.main }
        ].map((item, i) => (
          <Paper 
            key={i}
            component="a" 
            href={item.href}
            target="_blank"
            elevation={0}
            sx={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1.5, 
              borderRadius: 2.5, border: '1px solid', borderColor: 'divider', 
              textDecoration: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'rgba(19, 56, 39, 0.03)', transform: 'translateY(-3px)', borderColor: 'primary.light' } 
            }}
          >
            <Box sx={{ color: item.color, mb: 0.5, display: 'flex' }}>
              {item.icon}
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600 }}>
        {publicConfig.footerCredit}
      </Typography>
    </Box>
  );
};
