import React from 'react';
import { c, radius } from '../../design';

/**
 * Squared switch. Replaces the stock iOS-pill toggle: same 44px hit area,
 * crisp 1px border, 150ms colour change, no bounce.
 */
export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    style={{
      width: 38,
      height: 22,
      padding: 2,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: checked ? 'flex-end' : 'flex-start',
      background: checked ? c.forest : c.well,
      border: `1px solid ${checked ? c.forest : c.ruleStrong}`,
      borderRadius: radius.md,
      cursor: 'pointer',
      transition: 'background-color 150ms ease, border-color 150ms ease',
    }}
  >
    <span
      style={{
        width: 14,
        height: 14,
        background: checked ? c.paper : c.raised,
        border: `1px solid ${checked ? c.forest : c.rule}`,
        borderRadius: radius.sm,
        transition: 'background-color 150ms ease',
      }}
    />
  </button>
);
