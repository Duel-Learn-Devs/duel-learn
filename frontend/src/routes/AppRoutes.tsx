import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PrivateRoutes from "./PrivateRoutes";
import LandingPage from "../pages/landing-page/LandingPage";
import Login from "../pages/user-account/Login";
import SignUp from "../pages/user-account/SignUp";
import ForgotPassword from "../pages/user-account/ForgotPassword";
import TermsAndConditions from "../components/TermsAndConditions";
import CheckYourMail from "../pages/user-account/CheckYourMail";
import PasswordChangedSuccessfully from "../pages/user-account/PasswordChangedSuccessfully";
import LoadingScreen from "../components/LoadingScreen";
import ConfirmationAccount from "../pages/user-account/ConfirmationAccount";
import NotFoundPage from "../pages/user-account/NotFoundPage";
import ResetPassword from "../pages/user-account/ResetPassword";
import SuccessReset from "../pages/user-account/SuccessReset";
import SecurityCode from "../pages/user-account/SecurityCode";
import Personalization from "../pages/user-onboarding/Personalization";
import TutorialLast from "../pages/user-onboarding/TutorialLast";
import TutorialSix from "../pages/user-onboarding/TutorialSix";
import TutorialFive from "../pages/user-onboarding/TutorialFive";
import TutorialThree from "../pages/user-onboarding/TutorialThree";
import TutorialFour from "../pages/user-onboarding/TutorialFour";
import TutorialTwo from "../pages/user-onboarding/TutorialTwo";
import TutorialOnePage from "../pages/user-onboarding/TutorialOne";
import WelcomePage from "../pages/user-onboarding/WelcomePage";

const AppRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/check-your-mail" element={<CheckYourMail />} />
        <Route path="/loading-screen" element={<LoadingScreen />} />
        <Route path="/password-changed-successfully" element={<PasswordChangedSuccessfully />} />

        {/* User onboarding routes */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/tutorial/step-one" element={<TutorialOnePage />} />
        <Route path="/tutorial/step-two" element={<TutorialTwo />} />
        <Route path="/tutorial/step-three" element={<TutorialThree />} />
        <Route path="/tutorial/step-four" element={<TutorialFour />} />
        <Route path="/tutorial/step-five" element={<TutorialFive />} />
        <Route path="/tutorial/step-six" element={<TutorialSix />} />
        <Route path="/tutorial/step-seven" element={<TutorialLast />} />
        <Route path="/my-preferences" element={<Personalization />} />

        <Route path="/confirmation-account" element={<ConfirmationAccount />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/success-reset" element={<SuccessReset />} />
        <Route path="/security-code" element={<SecurityCode />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/dashboard/*" element={<PrivateRoutes />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;