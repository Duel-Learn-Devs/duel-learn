import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./contexts/UserContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AudioProvider } from "./contexts/AudioContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import {
  GlobalSnackbar,
  SnackbarConnector,
  AuthTokenSynchronizer,
  AudioStopper,
  BattleInvitationCenter,
} from "./components";
import theme from "./contexts/ThemeContext";
import "./index.css";
import { GameStatusProvider } from "./contexts/GameStatusContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AuthTokenSynchronizer />
        <UserProvider>
          <AudioProvider>
            <AudioStopper
              stopOnRoutes={[
                "/dashboard/home",
                "/dashboard/session-complete",
                "/dashboard/profile",
                "/dashboard/deck-gallery",
                "/dashboard/decks",
              ]}
            />
            <SnackbarProvider>
              <GameStatusProvider>
                <HelmetProvider>
                  <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <BattleInvitationCenter />
                    <AppRoutes />
                    <GlobalSnackbar />
                    <SnackbarConnector />
                  </ThemeProvider>
                </HelmetProvider>
              </GameStatusProvider>
            </SnackbarProvider>
          </AudioProvider>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
