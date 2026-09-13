import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#133827", // Dignified Deep Forest Green
      light: "#1b4332",
      dark: "#0a2217",
    },
    secondary: {
      main: "#c5a059", // Warm Champagne Gold
      light: "#d4af37",
      dark: "#9a7b38",
    },
    background: {
      default: "#f8f6f0", // Warm dignified cream
      paper: "#ffffff",
    },
    text: {
      primary: "#1b2820", // Deep forest slate
      secondary: "#4a5550",
    },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
    h1: {
      fontSize: "1.75rem",
      fontWeight: 800,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: "0.8125rem",
      fontWeight: 400,
    },
    body1: {
      fontSize: "0.9375rem", // ~15px
      fontWeight: 400,
    },
    body2: {
      fontSize: "0.8125rem", // 13px
      fontWeight: 500,
    },
    caption: {
      fontSize: "0.75rem", // 12px
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          boxShadow: "0 4px 15px 0 rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px 0 rgba(18, 76, 58, 0.4)",
          },
        },
        containedPrimary: {
          "&:hover": {
            boxShadow: "0 6px 20px 0 rgba(18, 76, 58, 0.4)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 10px 30px 0 rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 10px 30px 0 rgba(0, 0, 0, 0.05)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 35px 0 rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme;
