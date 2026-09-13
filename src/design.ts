/**
 * Design tokens — "warm editorial ledger".
 *
 * The campaign is a public financial record, so the interface is built like a
 * printed ledger: warm stone paper, forest ink, brass accents, hairline rules
 * doing the structural work, and tabular figures for every number.
 *
 * Single source of truth for both the MUI theme (src/theme.ts) and the `sx`
 * props in components. Never introduce ad-hoc hex values in components.
 */

/* ---- Colour ---- */
export const c = {
  /** Outside the app frame — warm stone. */
  canvas: '#e5dfd0',
  /** Recessed wells, insets, table zebra ground. */
  well: '#f1ece0',
  /** Page / card surface. */
  paper: '#fbf9f4',
  /** Raised surface (rows, inputs, active segment). */
  raised: '#ffffff',

  ink: '#14201b',
  inkMuted: '#55635b',
  inkFaint: '#7f8c84',

  /** Hairline rule — visible, warm, 1px. */
  rule: '#dbd3c1',
  /** Structural rule: table heads, section breaks, nav edge. */
  ruleStrong: '#bfb59d',

  forest: '#143a28',
  forestDeep: '#0b2419',
  forestMid: '#245c40',
  /** Selected-row tint on paper. */
  forestTint: '#eaefe9',

  /** Text-safe brass (headline accents, citations). */
  brass: '#8a6a2c',
  /** Hairline / rule brass only — too light for text. */
  brassBright: '#c9a227',
  brassTint: '#f6f0e0',

  verified: '#1d5c3a',
  pending: '#8a5a12',
  pendingTint: '#f7edd8',
  danger: '#8f2a2a',
  dangerTint: '#f8e9e6',
} as const;

/* ---- Type ---- */
export const display = '"Fraunces", "Iowan Old Style", "Palatino Linotype", Georgia, serif';
export const sans = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const mono = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/* ---- Geometry ---- */
export const radius = { sm: '4px', md: '6px', lg: '8px', xl: '12px' } as const;

/** Standard interaction timing: functional, not decorative. */
export const t150 = 'border-color 150ms ease, background-color 150ms ease, color 150ms ease';

/* ---- Reusable fragments ---- */

/** Small caps label. The signature of the system — use instead of icon chrome. */
export const eyebrow = {
  fontFamily: sans,
  fontSize: '0.75rem',
  fontWeight: 700,
  lineHeight: 1.3,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: c.inkMuted,
};

/** Tabular figures — mandatory for money, counts, percentages. */
export const tnum = { fontVariantNumeric: 'tabular-nums' as const };

/** Ledger figure: serif display, tight tracking, tabular. */
export const figure = {
  fontFamily: display,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums' as const,
};

/** Flat bordered surface. No shadow, no blur, no lift. */
export const panel = {
  bgcolor: c.paper,
  border: `1px solid ${c.rule}`,
  borderRadius: radius.lg,
};

/** Recessed data well inside a panel. */
export const well = {
  bgcolor: c.well,
  border: `1px solid ${c.rule}`,
  borderRadius: radius.md,
};

/** Crisp press feedback for anything clickable. */
export const press = { '&:active': { transform: 'scale(0.99)' } };

/** Overlay elevation: tight and dark, never a diffuse glow. */
export const overlayShadow = '0 16px 32px -20px rgba(11, 36, 25, 0.45)';

/** Accent bar used to mark quotes, notes and selection. */
export const accentBar = (color: string) => ({
  borderLeft: `3px solid ${color}`,
  paddingLeft: '12px',
});
