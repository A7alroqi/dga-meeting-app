import { createTheme } from "@mui/material/styles";
import { arSA } from "@mui/material/locale";

// Palette extracted from the DGA innovation-planning deck theme
// (theme1.xml of the source PPTX): navy #1B1651 / #2A1F6A, teal #00ABAE,
// green #1AC082, amber #FEA92B.
export const DGA = {
  navy: "#1B1651",
  navyLight: "#2A1F6A",
  teal: "#00ABAE",
  green: "#1AC082",
  amber: "#FEA92B",
  lavender: "#F0E5F7",
  iceBlue: "#BEE2FE",
} as const;

export const rtlTheme = createTheme(
  {
    direction: "rtl",
    typography: {
      fontFamily: "'Tajawal', 'Arial', sans-serif",
    },
    palette: {
      primary: { main: DGA.navy, light: DGA.navyLight },
      secondary: { main: DGA.teal },
      success: { main: DGA.green },
      warning: { main: DGA.amber },
      background: { default: "#F7F8FB" },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
    },
  },
  arSA
);
