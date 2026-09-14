import React from 'react';
import { Box, Typography } from '@mui/material';
import { MessageCircle, Instagram, Mail } from 'lucide-react';
import { c, eyebrow, radius } from '../../design';
import { Eyebrow, Mono, PullQuote, splitQuote } from '../common/primitives';
import type { PublicConfig } from '../../types';

interface FooterProps {
  publicConfig: PublicConfig;
}

const committee = [
  { region: 'Ibaraki / Kanto', name: 'Cak Anas', phone: '+81 90-9684-5955', href: 'https://wa.me/819096845955' },
  { region: 'Tokyo & Sekitarnya', name: 'Fauzan', phone: '+81 80-4830-1988', href: 'https://wa.me/818048301988' },
];

/**
 * Colophon. The committee is a contact record list and the channels are plain
 * labelled links — not a three-up grid of icon tiles over one-word captions.
 */
export const Footer: React.FC<FooterProps> = ({ publicConfig }) => {
  const channels = [
    { icon: <MessageCircle size={14} />, label: 'WhatsApp', href: publicConfig.contactLinks.WHATSAPP },
    { icon: <Instagram size={14} />, label: 'Instagram', href: publicConfig.contactLinks.INSTAGRAM },
    { icon: <Mail size={14} />, label: 'Email', href: publicConfig.contactLinks.EMAIL },
  ];

  const { quote, citation } = splitQuote(publicConfig.wakafHadith);

  return (
    <Box component="footer" sx={{ mt: 3, pt: 3, pb: 5, px: 2.5, borderTop: `1px solid ${c.ruleStrong}` }}>
      <PullQuote cite={citation} sx={{ mb: 3 }}>
        “{quote}”
      </PullQuote>

      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, pb: 1, mb: 1.5, borderBottom: `1px solid ${c.ruleStrong}` }}>
        <Eyebrow tone="ink">Narahubung</Eyebrow>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint, textAlign: 'right' }}>
          Panitia Wakaf
        </Typography>
      </Box>

      <Box sx={{ border: `1px solid ${c.rule}`, borderRadius: radius.lg, bgcolor: c.paper, overflow: 'hidden', mb: 2.5 }}>
        {committee.map((person, i) => (
          <Box
            key={person.href}
            component="a"
            href={person.href}
            target="_blank"
            rel="noreferrer"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              px: 2,
              py: 1.375,
              textDecoration: 'none',
              borderTop: i === 0 ? 'none' : `1px solid ${c.rule}`,
              borderLeft: '2px solid transparent',
              transition: 'background-color 150ms ease, border-color 150ms ease',
              '&:hover': { bgcolor: c.forestTint, borderLeftColor: c.forest },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Eyebrow sx={{ fontSize: '0.5625rem' }}>{person.region}</Eyebrow>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: c.ink, mt: 0.25 }}>
                {person.name}
              </Typography>
            </Box>
            <Mono sx={{ color: c.inkMuted, fontSize: '0.75rem', flexShrink: 0 }}>{person.phone}</Mono>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
        {channels.map((channel, i) => (
          <React.Fragment key={channel.label}>
            {i > 0 && <Box sx={{ width: '1px', height: 14, bgcolor: c.rule, mx: 1.5 }} />}
            <Box
              component="a"
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.625,
                textDecoration: 'none',
                color: c.inkMuted,
                transition: 'color 150ms ease',
                '&:hover': { color: c.forest },
              }}
            >
              {channel.icon}
              <Box component="span" sx={{ ...eyebrow, fontSize: '0.5625rem', color: 'inherit' }}>
                {channel.label}
              </Box>
            </Box>
          </React.Fragment>
        ))}
      </Box>

      <Typography sx={{ textAlign: 'center', fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint, letterSpacing: '0.02em' }}>
        {publicConfig.footerCredit}
      </Typography>
    </Box>
  );
};
