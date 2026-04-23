import { createTheme } from "@mui/material/styles";

export const dashboardTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00D4AA",
      light: "#33E0BF",
      dark: "#00A885",
      contrastText: "#000000",
    },
    secondary: {
      main: "#FF9F43",
      light: "#FFB56B",
      dark: "#CC7F36",
    },
    background: {
      default: "#000000",
      paper: "#0D0D0F",
    },
    text: {
      primary: "#F5F5F7",
      secondary: "#8A8A8E",
    },
    error: {
      main: "#FF5757",
      light: "#FF7A7A",
      dark: "#CC4646",
    },
    warning: {
      main: "#FF9F43",
    },
    success: {
      main: "#00D4AA",
    },
    info: {
      main: "#33A1FF",
    },
  },
  typography: {
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
      fontSize: "1.75rem",
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
      fontSize: "1.4rem",
      lineHeight: 1.25,
    },
    h5: {
      fontWeight: 700,
      fontSize: "1.15rem",
      lineHeight: 1.3,
    },
    h6: {
      fontWeight: 700,
      fontSize: "1rem",
      lineHeight: 1.3,
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: "0.875rem",
      lineHeight: 1.3,
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: "0.8rem",
      letterSpacing: "0.04em",
      lineHeight: 1.3,
    },
    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.4,
      fontWeight: 400,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.4,
      fontWeight: 400,
    },
    caption: {
      fontSize: "0.6875rem",
      lineHeight: 1.3,
      fontWeight: 500,
      letterSpacing: "0.03em",
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          overscrollBehavior: "none",
          WebkitTapHighlightColor: "transparent",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: "none",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "#0D0D0F",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 0,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 0,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: "0px !important",
          background: "#0D0D0F",
          border: "1px solid rgba(255,255,255,0.06)",
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          minHeight: 48,
          padding: "0 16px",
          "&.Mui-expanded": {
            minHeight: 48,
          },
        },
        content: {
          margin: "12px 0",
          "&.Mui-expanded": {
            margin: "12px 0",
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: "0 16px 16px",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          height: 6,
          backgroundColor: "rgba(255,255,255,0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 0,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          padding: "8px 0 8px",
          minWidth: 0,
          "&.Mui-selected": {
            paddingTop: 6,
          },
        },
        label: {
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          "&.Mui-selected": {
            fontSize: "0.65rem",
          },
        },
      },
    },
  },
});
