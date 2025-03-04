import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PrivateRoutes from "./PrivateRoutes";
import LandingPage from "../pages/landing-page/LandingPage";
import Login from "../pages/user-account/Login";
import SignUp from "../pages/user-account/SignUp";
import ForgotPassword from "../pages/user-account/ForgotPassword";
import TermsAndConditions from "../components/TermsAndConditions";
<<<<<<< HEAD
=======
import VerifyEmail from "../pages/user-account/VerifyEmail";
>>>>>>> origin/beta-branch
import PrivacyPolicy from "../components/PrivacyPolicy";
import AccountSettings from "../pages/user-account/AccountSettings";
import CheckYourMail from "../pages/user-account/CheckYourMail";
import PasswordChangedSuccessfully from "../pages/user-account/PasswordChangedSuccessfully";
import ConfirmationAccount from "../pages/user-account/ConfirmationAccount";
import NotFoundPage from "../pages/user-account/NotFoundPage";
import ResetPassword from "../pages/user-account/ResetPassword";
import SuccessReset from "../pages/user-account/SuccessReset";
import EmailActionHandler from "../pages/user-account/EmailActionHandler"; // Import EmailActionHandler
import EmailVerified from "../pages/user-account/EmailVerified"; // Import EmailVerified
import LoadingScreen from "../components/LoadingScreen";
<<<<<<< HEAD
=======
import AdminRoutes from "./AdminRoutes"; // Import AdminRoutes
import AdminSignUp from "../pages/user-account/AdminSignUp"; // Import AdminSignUp
>>>>>>> origin/beta-branch

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
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/check-your-mail" element={<CheckYourMail />} />
        <Route path="/loading-screen" element={<LoadingScreen />} />
        <Route
          path="/password-changed-successfully"
          element={<PasswordChangedSuccessfully />}
        />
        {/* User onboarding routes */}
        <Route path="/confirmation-account" element={<ConfirmationAccount />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/success-reset" element={<SuccessReset />} />
        <Route path="/email-action" element={<EmailActionHandler />} />{" "}
<<<<<<< HEAD
=======
        <Route path ="verify-email" element={<VerifyEmail />} />
        <Route path="/check-your-mail" element={<CheckYourMail />} />
>>>>>>> origin/beta-branch
        <Route path="/email-verified" element={<EmailVerified />} />{" "}
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/dashboard/*" element={<PrivateRoutes />} />
        <Route path="/admin-sign-up" element={<AdminSignUp />} /> {/* Add AdminSignUp route */}
        <Route path="/admin/*" element={<AdminRoutes />} /> {/* Add AdminRoutes */}
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
