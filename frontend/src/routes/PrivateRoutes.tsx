import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/dashboard/home/HomePage";
import Explore from "../pages/dashboard/explore/ExplorePage";
import YourLibrary from "../pages/dashboard/my-library/MyLibrary";
import Profile from "../pages/dashboard/profile/ProfilePage";
import Shop from "../pages/dashboard/shop/ShopPage";
import BuyPremium from "../components/BuyPremium";
import CreateStudyMaterial from "../pages/dashboard/study-material/material-create/CreateStudyMaterial";
import ViewStudyMaterial from "../pages/dashboard/study-material/view-study-material/ViewStudyMaterial";
import SetUpQuestionType from "../pages/dashboard/play-battleground/SetUpQuestionType";
import WelcomeGameMode from "../pages/dashboard/play-battleground/WelcomeGameMode";
import SetUpTimeQuestion from "../pages/dashboard/play-battleground/time-pressured/SetUptTimeQuestion";

import PVPLobby from "../pages/dashboard/play-battleground/multiplayer-mode/PVPLobby";
import { useState } from "react"; // Import useState
import VerifyEmail from "../pages/user-account/VerifyEmail";
import CheckYourMail from "../pages/user-account/CheckYourMail";
import UserOnboardingRoutes from "./UserOnboardingRoutes"; // Import UserOnboardingRoutes
import DashboardRoutes from "./DashboardRoutes"; // Import DashboardRoutes

const PrivateRoutes = () => {
  const { user } = useUser();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(1); // Define state

  const token = localStorage.getItem("userToken");

  if (!user || !token) {
    return <Navigate to="/landing-page" />;
  }

  return (
    <Routes>
      {/* Onboarding and Tutorial Routes */}
      <Route path="onboarding/*" element={<UserOnboardingRoutes />} /> {/* Add UserOnboardingRoutes */}

      {/* Routes for the main dashboard after onboarding */}
      <Route path="/*" element={<DashboardRoutes setSelectedIndex={setSelectedIndex} />} /> {/* Add DashboardRoutes */}
      
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="/check-your-mail" element={<CheckYourMail />} />

      {/* Route for buying premium account */}
      <Route path="/buy-premium-account" element={<BuyPremium />} />
      <Route path="/set-up-questions" element={<SetUpQuestionType />} />
      <Route path="/welcome-game-mode" element={<WelcomeGameMode />} />
      <Route path="/setup/questions" element={<SetUpQuestionType />} />
      <Route path="/setup/timer" element={<SetUpTimeQuestion />} />
      <Route path="/pvp-lobby" element={<PVPLobby />} />
    </Routes>
  );
};

export default PrivateRoutes;
