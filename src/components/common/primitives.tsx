import React from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { c, display, eyebrow, mono, radius, tnum } from '../../design';

/**
 * Shared typographic primitives for the editorial ledger system.
 * These replace the icon-in-a-box chrome that used to label every section.
 */

/** Small-caps label. The system's structural voice. */
export const Eyebrow: React.FC<{ children: React.ReactNode; sx?: SxProps<Theme>; tone?: 'muted' | 'ink' | 'brass' | 'inverse' }> = ({
  children,
  sx,
  tone = 'muted',
}) => {
  const color =
    tone === 'ink' ? c.ink : tone === 'brass' ? c.brass : tone === 'inverse' ? 'rgba(251,249,244,0.72)' : c.inkMuted;
  return (
    <Typography component="span" sx={{ ...eyebrow, color, display: 'block', ...sx }}>
      {children}
    </Typography>
  );
};

/** Section header: label on the left, optional meta on the right, hairline under. */
export const SectionHeading: React.FC<{ title: string; meta?: React.ReactNode; sx?: SxProps<Theme> }> = ({ title, meta, sx }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 2,
      pb: 1,
      mb: 1.5,
      borderBottom: `1px solid ${c.ruleStrong}`,
      ...sx,
    }}
  >
    <Eyebrow tone="ink">{title}</Eyebrow>
    {meta && (
      <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: c.inkFaint, ...tnum }}>
        {meta}
      </Typography>
    )}
  </Box>
);

/** Verification state. A square dot plus a word — no pills, no gradients. */
export const StatusTag: React.FC<{ state: 'verified' | 'pending' | 'neutral'; label: string; sx?: SxProps<Theme> }> = ({
  state,
  label,
  sx,
}) => {
  const tone =
    state === 'verified'
      ? { fg: c.verified, bg: '#e9f0ea', br: '#bdd2c2' }
      : state === 'pending'
        ? { fg: c.pending, bg: c.pendingTint, br: '#e0cb9c' }
        : { fg: c.inkMuted, bg: c.well, br: c.rule };
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.625,
        px: 0.75,
        py: '2px',
        bgcolor: tone.bg,
        border: `1px solid ${tone.br}`,
        borderRadius: radius.sm,
        ...sx,
      }}
    >
      <Box component="span" sx={{ width: 5, height: 5, bgcolor: tone.fg, flexShrink: 0 }} />
      <Typography component="span" sx={{ ...eyebrow, fontSize: '0.625rem', letterSpacing: '0.1em', color: tone.fg }}>
        {label}
      </Typography>
    </Box>
  );
};

/** Money and counts: serif, tight, tabular. */
export const Figure: React.FC<{ children: React.ReactNode; size?: string; tone?: string; sx?: SxProps<Theme> }> = ({
  children,
  size = '1.25rem',
  tone = c.ink,
  sx,
}) => (
  <Typography
    component="span"
    sx={{ fontFamily: display, fontWeight: 600, letterSpacing: '-0.02em', fontSize: size, color: tone, ...tnum, ...sx }}
  >
    {children}
  </Typography>
);

/** Account numbers, phone numbers, IDs — anything meant to be read digit by digit. */
export const Mono: React.FC<{ children: React.ReactNode; sx?: SxProps<Theme> }> = ({ children, sx }) => (
  <Typography component="span" sx={{ fontFamily: mono, fontSize: '0.8125rem', letterSpacing: '0.01em', ...tnum, ...sx }}>
    {children}
  </Typography>
);

/**
 * Configured hadith strings carry their own attribution inline, e.g.
 * `"… anak saleh yang mendoakannya." (HR. Muslim No. 1631)`. Split it so the
 * quote and the citation can be typeset as separate objects.
 */
export const splitQuote = (text: string) => {
  const attribution = text.match(/\((HR\.[^)]*)\)\s*$/);
  return {
    quote: text.replace(/\s*\(HR\.[^)]*\)\s*$/, '').replace(/^["\u201c]|["\u201d]$/g, '').trim(),
    citation: attribution ? attribution[1] : undefined,
  };
};

/** Editorial pull quote with a brass rule instead of a decorative card. */
export const PullQuote: React.FC<{ children: React.ReactNode; cite?: string; sx?: SxProps<Theme> }> = ({ children, cite, sx }) => (
  <Box component="figure" sx={{ m: 0, pl: 2, borderLeft: `2px solid ${c.brassBright}`, ...sx }}>
    <Typography
      sx={{
        fontFamily: display,
        fontStyle: 'italic',
        fontSize: '0.875rem',
        lineHeight: 1.55,
        color: c.inkMuted,
        letterSpacing: '-0.005em',
      }}
    >
      {children}
    </Typography>
    {cite && (
      <Typography component="figcaption" sx={{ ...eyebrow, mt: 0.75, color: c.brass, fontSize: '0.625rem' }}>
        {cite}
      </Typography>
    )}
  </Box>
);

/** Label/value line for the ledger grids. */
export const LedgerRow: React.FC<{
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  last?: boolean;
}> = ({ label, value, note, last }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 2,
      py: 1,
      borderBottom: last ? 'none' : `1px solid ${c.rule}`,
    }}
  >
    <Eyebrow sx={{ fontSize: '0.625rem', flexShrink: 0 }}>{label}</Eyebrow>
    <Box sx={{ textAlign: 'right', minWidth: 0 }}>
      <Box>{value}</Box>
      {note && (
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: c.inkFaint, ...tnum }}>{note}</Typography>
      )}
    </Box>
  </Box>
);
