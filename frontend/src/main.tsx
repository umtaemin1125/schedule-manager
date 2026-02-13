import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./styles.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0a4d68" },
    secondary: { main: "#05bfdb" },
    background: {
      default: "#f7fbfc",
      paper: "#ffffff"
    }
  },
  typography: {
    fontFamily: "'IBM Plex Sans KR', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 }
  },
  shape: {
    borderRadius: 14
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
