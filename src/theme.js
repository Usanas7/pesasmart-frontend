import { createTheme } from "@mui/material/styles";

// Warm & approachable palette — a friendly teal-green with warm neutrals
const theme = createTheme({
  palette: {
    primary: { main: "#2A9D8F", contrastText: "#ffffff" },   // warm teal
    secondary: { main: "#E76F51" },                           // warm coral (accents)
    success: { main: "#2A9D8F" },
    warning: { main: "#E9A23B" },
    error: { main: "#D6604D" },
    background: { default: "#FBF7F0", paper: "#ffffff" },      // soft warm off-white
    text: { primary: "#3D3A34", secondary: "#7A756C" },
  },
  typography: {
    fontFamily: '"Nunito", "Segoe UI", system-ui, sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },       // no shouty caps
  },
  shape: { borderRadius: 14 },                                 // soft rounded corners
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: "0 4px 20px rgba(61,58,52,0.06)", border: "1px solid #F0E9DE" },
      },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 12, paddingTop: 10, paddingBottom: 10 } },
    },
  },
});

export default theme;