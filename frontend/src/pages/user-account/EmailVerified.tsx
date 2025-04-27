import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import sampleAvatar2 from "/profile-picture/default-picture.svg";
import PageTransition from "../../styles/PageTransition";
import { toast } from "react-hot-toast";
import { auth } from "../../services/firebase";
import { reload, applyActionCode } from "firebase/auth";
import useSignUpApi from "../../hooks/api.hooks/useSignUpApi";
import { useUser } from "../../contexts/UserContext";

interface LocationState {
  email?: string;
  firebase_uid?: string;
  oobCode?: string;
  token?: string;
}

const EmailVerified = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, loginAndSetUserData } = useUser();
  const { signUpApi } = useSignUpApi();
  const [isVerifying, setIsVerifying] = useState(false);
  const [okayNaTo, isOkayNaTo] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const verifyEmail = async () => {
    const state = location.state as LocationState;

    if (!state?.oobCode || !state.firebase_uid) {
      toast.error("Invalid verification link");
      return;
    }

    try {
      setIsVerifying(true);
      if (!okayNaTo) {
        await applyActionCode(auth, state.oobCode);
        console.log("applyActionCode successful");
        isOkayNaTo(true);
      }
      // 2. Reload user to get updated status
      if (!auth.currentUser) {
        throw new Error("No user is currently signed in");
      }

      await reload(auth.currentUser);
      console.log("User reloaded");

      // 3. Verify email is actually verified
      if (!auth.currentUser.emailVerified) {
        throw new Error("Email verification failed");
      }

      // 4. Update user context with verified status
      if (user) {
        const updatedUser = {
          ...user,
          email_verified: true,
        };
        setUser(updatedUser);
      }
      await reload(auth.currentUser);

      // 5. Call signup API with verified status
      const metadata = auth.currentUser.metadata;
      const isNew = metadata.creationTime === metadata.lastSignInTime;
      const email_verified = auth.currentUser.emailVerified || false;
      setIsNew(isNew);

      // Force email_verified to true since we just verified it

      console.log("Before API call:", {
        firebase_uid: state.firebase_uid,
        isNew,
        email_verified: auth.currentUser.emailVerified,
      });

      if (email_verified) {
        await signUpApi(state.firebase_uid, isNew, email_verified);

        // Get token after successful verification
        const token = await auth.currentUser.getIdToken();

        // Fetch and update user data
        await loginAndSetUserData(state.firebase_uid, token);
      }
      // 6. Clear email verification related data
      localStorage.removeItem("emailTimestamp");
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify email"
      );
      return;
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    // Prevent double verification
    if (isVerifying) {
      return;
    }
    verifyEmail();
  }, [location.state]);

  const handleContinue = () => {
    console.log("handleContinue called");
    console.log("user:", user);
    if (!user) {
      toast.error("User data not found");
      navigate("/login");
      return;
    }

    // Clear any remaining verification data
    localStorage.removeItem("emailTimestamp");

    // Navigate based on user type and status
    if (isNew && user.email_verified) {
      navigate("/dashboard/welcome");
    } else if (user.account_type === "admin" && !isNew && user.email_verified) {
      navigate("/admin/admin-dashboard");
    } else {
      navigate("/dashboard/home");
    }
  };

  return (
    <PageTransition>
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col mb-11 items-center justify-center">
          <img
            src={sampleAvatar2}
            style={{ width: "200px" }}
            alt="Profile Avatar"
          />
        </div>

        <div className="w-full max-w-md rounded-lg p-8 shadow-md">
          <p className="text-[18px] text-center text-[#9F9BAE] mb-8 max-w-[340px] mx-auto break-words">
            Congratulations! Your email has been successfully verified.
          </p>
          <button
            type="button"
            className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
            onClick={handleContinue}
          >
            Continue Onboarding
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default EmailVerified;
