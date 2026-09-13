import React from 'react';
import { Box } from '@mui/material';
import { c, eyebrow, radius } from '../../design';

export interface SegmentedControlOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Flat segmented control: one shared 1px frame, dividers between segments,
 * the active segment lifted by surface colour rather than a shadow.
 */
export const SegmentedControl = ({
  options,
  active,
  onChange,
  ariaLabel,
}: {
  options: SegmentedControlOption[];
  active: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
}) => (
  <Box
    role="group"
    aria-label={ariaLabel}
    sx={{
      display: 'flex',
      width: '100%',
      bgcolor: c.well,
      border: `1px solid ${c.ruleStrong}`,
      borderRadius: radius.md,
      overflow: 'hidden',
    }}
  >
    {options.map((opt, i) => {
      const isActive = active === opt.id;
      return (
        <Box
          key={opt.id}
          component="button"
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(opt.id)}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            py: 1,
            px: 1,
            cursor: 'pointer',
            border: 'none',
            borderLeft: i === 0 ? 'none' : `1px solid ${isActive ? c.forest : c.rule}`,
            bgcolor: isActive ? c.forest : 'transparent',
            color: isActive ? c.paper : c.inkMuted,
            transition: 'background-color 150ms ease, color 150ms ease',
            '&:hover': { color: isActive ? c.paper : c.ink, bgcolor: isActive ? c.forestDeep : 'rgba(20,58,40,0.04)' },
            '&:active': { transform: 'scale(0.99)' },
          }}
        >
          {opt.icon}
          <Box component="span" sx={{ ...eyebrow, color: 'inherit', fontSize: '0.5625rem', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            {opt.label}
          </Box>
        </Box>
      );
    })}
  </Box>
);
