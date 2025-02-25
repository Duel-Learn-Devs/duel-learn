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
import WelcomePage from "../pages/user-onboarding/WelcomePage";
import TutorialOnePage from "../pages/user-onboarding/TutorialOne";
import TutorialTwo from "../pages/user-onboarding/TutorialTwo";
import Personalization from "../pages/user-onboarding/Personalization";
import TutorialThree from "../pages/user-onboarding/TutorialThree";
import TutorialFour from "../pages/user-onboarding/TutorialFour";
import TutorialFive from "../pages/user-onboarding/TutorialFive";
import TutorialSix from "../pages/user-onboarding/TutorialSix";
import TutorialLast from "../pages/user-onboarding/TutorialLast";
import WelcomeGameMode from "../pages/dashboard/play-battleground/WelcomeGameMode";
import SetUpTimeQuestion from "../pages/dashboard/play-battleground/time-pressured/SetUptTimeQuestion";

import PVPLobby from "../pages/dashboard/play-battleground/multiplayer-mode/PVPLobby";
import { useState } from "react"; // Import useState
import VerifyEmail from "../pages/user-account/VerifyEmail";
import CheckYourMail from "../pages/user-account/CheckYourMail";
import LoadingScreen from "../pages/dashboard/play-battleground/LoadingScreen";
import MainFlashCardLayout from "../pages/dashboard/play-battleground/Peaceful-mode/MainFlashCardLayout";
import SessionReport from "../pages/dashboard/play-battleground/SessionReport";
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
      <Route element={<DashboardLayout />}>
        <Route
          path="home"
          element={<Home setSelectedIndex={setSelectedIndex} />}
        />
        <Route path="explore" element={<Explore />} />
        <Route path="my-library" element={<YourLibrary />} />
        <Route path="profile" element={<Profile />} />
        <Route path="shop" element={<Shop />} />
        <Route path="study-material/create" element={<CreateStudyMaterial />} />
        <Route
          path="study-material/preview/:studyMaterialId"
          element={<ViewStudyMaterial />}
        />
      </Route>
      <Route path ="verify-email" element={<VerifyEmail />} />
      <Route path="/check-your-mail" element={<CheckYourMail />} />

      {/* Route for buying premium account */}
      <Route path="/buy-premium-account" element={<BuyPremium />} />

      {/* Route for playing mode*/}
      <Route path="/set-up-questions" element={<SetUpQuestionType />} />
      <Route path="/welcome-game-mode" element={<WelcomeGameMode />} />
      <Route path="/setup/questions" element={<SetUpQuestionType />} />
      <Route path="/setup/timer" element={<SetUpTimeQuestion />} />
      <Route path="/pvp-lobby" element={<PVPLobby />} />
      <Route path="/loading-screen" element={<LoadingScreen />} />
      <Route path="/study/session-summary" element={<SessionReport />} />
      
      {/* Route for peaceful mode*/}
      <Route path="/study/peaceful-mode/flashcards" element={<MainFlashCardLayout />} />
    </Routes>
  );
};

export default PrivateRoutes;
