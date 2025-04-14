import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/dashboard/home/HomePage";
import Explore from "../pages/dashboard/explore/ExplorePage";
import YourLibrary from "../pages/dashboard/my-library/MyLibrary";
import Profile from "../pages/dashboard/profile/ProfilePage";
import Shop from "../pages/dashboard/shop/ShopPage";
import BuyPremium from "../components/premium/BuyPremium";
import CreateStudyMaterial from "../pages/dashboard/study-material/material-create/CreateStudyMaterial";
import ViewStudyMaterial from "../pages/dashboard/study-material/view-study-material/ViewStudyMaterial";
import SetUpQuestionType from "../pages/dashboard/play-battleground/components/setup/SetUpQuestionType";
import WelcomePage from "../pages/user-onboarding/WelcomePage";
import TutorialOnePage from "../pages/user-onboarding/TutorialOne";
import TutorialTwo from "../pages/user-onboarding/TutorialTwo";
import Personalization from "../pages/user-onboarding/Personalization";
import TutorialThree from "../pages/user-onboarding/TutorialThree";
import TutorialFour from "../pages/user-onboarding/TutorialFour";
import TutorialFive from "../pages/user-onboarding/TutorialFive";
import TutorialSix from "../pages/user-onboarding/TutorialSix";
import TutorialLast from "../pages/user-onboarding/TutorialLast";
import WelcomeGameMode from "../pages/dashboard/play-battleground/screens/WelcomeGameMode";
import SetUpTimeQuestion from "../pages/dashboard/play-battleground/components/setup/SetUpTimeQuestion";
import PVPLobby from "../pages/dashboard/play-battleground/modes/multiplayer/PVPLobby";
import { useState, useEffect } from "react";
import LoadingScreen from "../pages/dashboard/play-battleground/screens/LoadingScreen";
import GeneralLoadingScreen from "../components/LoadingScreen";
import SessionReport from "../pages/dashboard/play-battleground/screens/SessionReport";
import PeacefulMode from "../pages/dashboard/play-battleground/modes/peaceful/PeacefulMode";
import TimePressuredMode from "../pages/dashboard/play-battleground/modes/time-pressured/TimePressuredMode";
import GameModeWrapper from "../pages/dashboard/play-battleground/components/common/GameModeWrapper";
import AccountSettings from "../pages/dashboard/settings/AccountSettings";
import HostModeSelection from "../pages/dashboard/play-battleground/modes/multiplayer/setup/HostModeSelection";
import Player2ModeSelection from "../pages/dashboard/play-battleground/modes/multiplayer/setup/Player2ModeSelection";
import PvpBattle from "../pages/dashboard/play-battleground/modes/multiplayer/battle-field/PvpBattle";
import PvpSessionReport from "../pages/dashboard/play-battleground/modes/multiplayer/battle-field/screens/PvpSessionReport";
import Checkout from "../components/premium/Checkout";
import PaymentSuccess from "../components/premium/PaymentSuccess";
import SearchPage from "../pages/dashboard/search/SearchPage";
import SocketService from "../services/socketService";
import {
  GameStatusProvider,
  useGameStatus,
} from "../contexts/GameStatusContext";
import { GameMode } from "../hooks/useLobbyStatus";
import CardSelectionTest from "../pages/dashboard/play-battleground/modes/multiplayer/battle-field/CardSelectionTest";

// Create a wrapper component that handles game status changes
const GameModeStatusWrapper = ({
  children,
  gameMode,
}: {
  children: React.ReactNode;
  gameMode: GameMode;
}) => {
  const { setInGame } = useGameStatus();

  // Set game status when component mounts
  useEffect(() => {
    // Set game status to active with the specified mode
    setInGame(true, gameMode);

    // Clean up when unmounting
    return () => {
      setInGame(false, null);
    };
  }, [gameMode, setInGame]);

  return <>{children}</>;
};

const PrivateRoutes = () => {
  const {
    user,
    loading: userLoading,
    refreshUserData,
    socketConnected,
  } = useUser();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [_selectedIndex, setSelectedIndex] = useState<number | null>(1);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Reference to socket service
  const socketService = SocketService.getInstance();

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    // If still loading after 5 seconds, allow the user to proceed anyway
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Monitor and maintain socket connection throughout protected routes
  useEffect(() => {
    const checkAndReconnect = () => {
      if (user && currentUser) {
        const socket = socketService.getSocket();

        // If no socket or socket is disconnected, attempt to reconnect
        if (!socket || !socket.connected) {
          console.log(
            "Socket connection not detected or disconnected, reconnecting..."
          );
          socketService.connect(user.firebase_uid);
        }
      }
    };

    // Initial check
    checkAndReconnect();

    // Set up periodic connection check with exponential backoff
    let checkInterval = 5000; // Start with 5 seconds
    const maxInterval = 30000; // Max 30 seconds
    const intervalId = setInterval(() => {
      checkAndReconnect();
      // Increase interval up to max
      checkInterval = Math.min(checkInterval * 1.5, maxInterval);
    }, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [user, currentUser]);

  // Show loading screen if both auth and user data are still loading and timeout hasn't occurred
  if ((authLoading || userLoading) && !loadingTimeout) {
    return <GeneralLoadingScreen />;
  }

  // If not authenticated, redirect to landing page
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/landing-page" />;
  }

  // If authenticated but no user data loaded yet, try to load it
  if (!user && !loadingTimeout) {
    // Attempt to refresh user data if not loaded
    if (!userLoading) {
      refreshUserData();
    }
    return <GeneralLoadingScreen />;
  }

  // Only check email verification if we actually have user data
  if (user && !user.email_verified) {
    return <Navigate to="/verify-email" />;
  }

  return (
    <GameStatusProvider>
      <Routes>
        {/* Onboarding and Tutorial Routes */}
        <Route path="welcome" element={<WelcomePage />} />
        <Route path="tutorial/step-one" element={<TutorialOnePage />} />
        <Route path="tutorial/step-two" element={<TutorialTwo />} />
        <Route path="tutorial/step-three" element={<TutorialThree />} />
        <Route path="tutorial/step-four" element={<TutorialFour />} />
        <Route path="tutorial/step-five" element={<TutorialFive />} />
        <Route path="tutorial/step-six" element={<TutorialSix />} />
        <Route path="tutorial/last-step" element={<TutorialLast />} />
        <Route path="my-preferences" element={<Personalization />} />

        {/* Routes for the main dashboard after onboarding */}
        <Route
          element={
            <>
              <BattleInvitationCenter />
              <DashboardLayout />
            </>
          }
        >
          <Route
            path="home"
            element={<Home setSelectedIndex={setSelectedIndex} />}
          />
          <Route path="explore" element={<Explore />} />
          <Route path="my-library" element={<YourLibrary />} />
          <Route path="profile" element={<Profile />} />
          <Route path="shop" element={<Shop />} />
          <Route
            path="study-material/create"
            element={
              <GameModeStatusWrapper gameMode="creating-study-material">
                <CreateStudyMaterial />
              </GameModeStatusWrapper>
            }
          />
          <Route
            path="study-material/view/:studyMaterialId"
            element={<ViewStudyMaterial />}
          />
          <Route path="search" element={<SearchPage />} />
          <Route path="account-settings" element={<AccountSettings />} />
        </Route>

        {/* Premium Routes */}
        <Route path="buy-premium-account" element={<BuyPremium />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payment-success" element={<PaymentSuccess />} />

        {/* Game Setup Routes */}
        <Route path="welcome-game-mode" element={<WelcomeGameMode />} />
        <Route path="setup/questions" element={<SetUpQuestionType />} />
        <Route path="setup/timer" element={<SetUpTimeQuestion />} />
        <Route path="loading-screen" element={<LoadingScreen />} />

        {/* Game Mode Routes */}
        <Route
          path="/study/peaceful-mode"
          element={
            <GameModeWrapper>
              {(props) => (
                <GameModeStatusWrapper gameMode="peaceful-mode">
                  <PeacefulMode {...props} />
                </GameModeStatusWrapper>
              )}
            </GameModeWrapper>
          }
        />
        <Route
          path="/study/time-pressured-mode"
          element={
            <GameModeWrapper>
              {(props) => (
                <GameModeStatusWrapper gameMode="time-pressured-mode">
                  <TimePressuredMode {...props} />
                </GameModeStatusWrapper>
              )}
            </GameModeWrapper>
          }
        />
        <Route path="/pvp-lobby/:lobbyCode?" element={<PVPLobby />} />
        <Route path="/study/session-summary" element={<SessionReport />} />
        <Route path="/select-difficulty/pvp" element={<HostModeSelection />} />
        <Route
          path="/select-difficulty/pvp/player2"
          element={<Player2ModeSelection />}
        />
        <Route
          path="/pvp-battle/:lobbyCode?"
          element={
            <GameModeStatusWrapper gameMode="pvp-battle">
              <PvpBattle />
            </GameModeStatusWrapper>
          }
        />
        <Route
          path="/pvp-battle/session-report"
          element={<PvpSessionReport />}
        />

        {/* Test Route for Card Selection Debugging */}
        <Route
          path="/card-selection-test"
          element={<CardSelectionTest />}
        />
      </Routes>
    </GameStatusProvider>
  );
};

export default PrivateRoutes;
