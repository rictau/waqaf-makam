import { createTheme } from "@mui/material/styles";
import type { Shadows } from "@mui/material/styles";
import { c, display, sans, mono, radius, overlayShadow } from "./design";

/**
 * MUI theme for the "warm editorial ledger" system.
 *
 * Rules this theme enforces globally:
 *  - Depth comes from 1px warm rules and background steps, never from shadows,
 *    blur or hover lifts. The only shadow is on true overlays (dialogs/popovers).
 *  - Corners stay tight (2–4px). No pill cards.
 *  - Motion is functional: 150ms colour/border transitions plus a crisp press
 *    state. No ambient animation, no bounce easings.
 */
const theme = createTheme({
  palette: {
    primary: {
      main: c.forest,
      light: c.forestMid,
      dark: c.forestDeep,
      contrastText: c.paper,
    },
    secondary: {
      main: c.brass,
      light: c.brassBright,
      dark: "#6b501d",
      contrastText: "#ffffff",
    },
    background: {
      // Recessed wells and page insets.
      default: c.well,
      // Card and row surfaces.
      paper: c.paper,
    },
    text: {
      primary: c.ink,
      secondary: c.inkMuted,
      disabled: c.inkFaint,
    },
    divider: c.rule,
    success: { main: c.verified, light: "#e6efe8", dark: "#123f27", contrastText: "#ffffff" },
    warning: { main: c.pending, light: c.pendingTint, dark: "#6b4409", contrastText: "#ffffff" },
    error: { main: c.danger, light: c.dangerTint, dark: "#6d1f1f", contrastText: "#ffffff" },
    action: {
      hover: "rgba(20, 58, 40, 0.05)",
      selected: c.forestTint,
    },
  },

  typography: {
    fontFamily: sans,
    // Display serif carries the hierarchy; size and weight replace colour tricks.
    h1: { fontFamily: display, fontSize: "1.875rem", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.025em" },
    h2: { fontFamily: display, fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em" },
    h3: { fontFamily: display, fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em" },
    h4: { fontFamily: display, fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em" },
    h5: { fontSize: "1rem", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" },
    h6: { fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.35, letterSpacing: "-0.005em" },
    subtitle1: { fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.4 },
    subtitle2: { fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.45 },
    body1: { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.55 },
    caption: { fontSize: "0.75rem", fontWeight: 500, lineHeight: 1.45 },
    button: { fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.04em" },
  },

  shape: { borderRadius: 3 },

  // Flat system: every elevation slot resolves to "none" except overlays,
  // which opt in explicitly via the Dialog/Popover overrides below.
  shadows: Array(25).fill("none") as unknown as Shadows,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: c.canvas,
          color: c.ink,
          fontFamily: sans,
        },
        strong: { fontWeight: 700 },
        code: { fontFamily: mono },
      },
    },

    MuiButtonBase: {
      // Ripple is Material chrome; crisp press states read as more deliberate.
      defaultProps: { disableRipple: true },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: radius.lg,
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          backgroundColor: c.paper,
          border: `1px solid ${c.rule}`,
          transition: "border-color 150ms ease, background-color 150ms ease",
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          textTransform: "none",
          minWidth: 0,
          fontFamily: sans,
          transition: "border-color 150ms ease, background-color 150ms ease, color 150ms ease",
          "&:active": { transform: "scale(0.99)" },
        },
        sizeLarge: {
          minHeight: 48,
          padding: "12px 24px",
        },
        sizeMedium: {
          minHeight: 40,
          padding: "8px 16px",
        },
        sizeSmall: {
          minHeight: 32,
          padding: "4px 10px",
        },
        containedPrimary: {
          backgroundColor: c.forest,
          color: c.paper,
          "&:hover": { backgroundColor: c.forestDeep },
        },
        containedError: {
          backgroundColor: c.danger,
          color: "#ffffff",
          "&:hover": { backgroundColor: "#6d1f1f" },
        },
        outlined: {
          borderColor: c.ruleStrong,
          "&:hover": { borderColor: c.forest, backgroundColor: c.forestTint },
        },
        text: {
          "&:hover": { backgroundColor: c.forestTint },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          transition: "border-color 150ms ease, background-color 150ms ease, color 150ms ease",
          "&:active": { transform: "scale(0.98)" },
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: sans,
          color: c.ink,
        },
        input: {
          fontFamily: sans,
          fontSize: "0.875rem",
          "&::placeholder": {
            fontFamily: sans,
            color: c.inkFaint,
            opacity: 1,
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: c.raised,
          minHeight: 44,
          fontFamily: sans,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: c.rule },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: c.ruleStrong },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 1.5, borderColor: c.forest },
          transition: "background-color 150ms ease",
        },
        input: { fontSize: "0.875rem", fontWeight: 500, fontFamily: sans },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: c.inkMuted,
          "&.Mui-focused": { color: c.forest },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: { fontSize: "0.6875rem", fontWeight: 500, marginLeft: 2, color: c.inkFaint },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          height: 20,
          fontSize: "0.625rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        },
        label: { paddingLeft: 6, paddingRight: 6 },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: { borderRadius: radius.sm, fontFamily: sans, fontWeight: 700 },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: c.rule } },
    },

    MuiSwitch: {
      // Squared, compact track — consistent with the Toggle primitive.
      styleOverrides: {
        root: { width: 38, height: 22, padding: 0, display: 'flex', alignItems: 'center' },
        switchBase: {
          padding: 0,
          top: 3,
          left: 3,
          "&:hover": { backgroundColor: "transparent" },
          "&.Mui-checked": {
            transform: "translateX(16px)",
            color: c.paper,
            "& + .MuiSwitch-track": { backgroundColor: c.forest, borderColor: c.forest, opacity: 1 },
          },
        },
        thumb: { width: 16, height: 16, borderRadius: radius.sm, boxShadow: "none" },
        track: {
          boxSizing: "border-box",
          borderRadius: radius.md,
          backgroundColor: c.well,
          border: `1px solid ${c.ruleStrong}`,
          opacity: 1,
          transition: "background-color 150ms ease, border-color 150ms ease",
        },
      },
    },

    MuiFormControlLabel: {
      styleOverrides: {
        label: { marginLeft: 12 },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
          border: `1px solid ${c.ruleStrong}`,
          backgroundColor: c.paper,
          boxShadow: overlayShadow,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: display, fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em" },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: c.ink,
          color: c.paper,
          borderRadius: radius.sm,
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: { border: `1px solid ${c.ruleStrong}`, boxShadow: overlayShadow, borderRadius: radius.md },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          fontWeight: 600,
          "&.Mui-selected": { backgroundColor: c.forestTint },
        },
      },
    },

    MuiCircularProgress: {
      styleOverrides: { root: { color: c.forest } },
    },
  },
});

export default theme;
