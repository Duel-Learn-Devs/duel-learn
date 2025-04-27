import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, sendEmail } from "../../services/firebase";
import { toast } from "react-hot-toast";
import sampleAvatar2 from "/images/sampleAvatar2.png";
import PageTransition from "../../styles/PageTransition";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { useAuth } from "../../contexts/AuthContext";

const VerifyEmail = () => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { user } = useUser(); // User data from UserContext
  const { currentUser, logout } = useAuth(); // Auth state from AuthContext

  // Use auth currentUser as primary, user context as fallback
  const userInfo = currentUser || {
    email: user?.email,
    emailVerified: user?.email_verified,
    uid: user?.firebase_uid,
  };

  const {
    timeRemaining,
    isButtonDisabled: isTimestampButtonDisabled,
    checkTimestamp,
  } = useEmailTimestamp(userInfo.email || "", userInfo.uid);

  const handleSendVerificationEmail = async () => {
    try {
      console.log("Email Verified:", userInfo.emailVerified);
      if (auth.currentUser) {
        const actionCodeSettings = {
          url: `${
            import.meta.env.VITE_FRONTEND_URL
          }/email-action-handler?mode=verifyEmail&firebase_uid=${
            userInfo.uid
          }&email=${userInfo.email}`,
          handleCodeInApp: true,
        };
        await sendEmail(auth.currentUser, actionCodeSettings);
        toast.success("Verification email sent.");
        setIsButtonDisabled(true);
        setIsEmailSent(true);

        // Update timestamp in Firestore
        if (userInfo.uid) {
          try {
            await updateDoc(doc(db, "temp_users", userInfo.uid), {
              emailTimestamp: serverTimestamp(),
            });
          } catch (error) {
            console.error("Error updating Firestore timestamp:", error);
            // Fallback to localStorage if Firestore update fails
            const now = new Date();
            localStorage.setItem("emailTimestamp", now.toISOString());
          }
        }

        navigate("/check-your-mail", {
          state: {
            email: userInfo.email,
            firebase_uid: userInfo.uid,
            type: "verification",
          },
        });
      } else {
        toast.error("No user is currently signed in.");
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      if (error.code === "auth/too-many-requests") {
        setErrorMessage("Too many requests. Please try again later.");
      } else {
        toast.error("Failed to send verification email. Please try again.");
      }
    }
  };

  const handleButtonClick = async () => {
    if (isButtonDisabled || isTimestampButtonDisabled) return;
    setIsButtonDisabled(true);
    await handleSendVerificationEmail();
    setIsButtonDisabled(false);
  };

  const handleLogoutClick = async () => {
    try {
      // Use AuthContext logout instead of direct Firebase signOut
      await logout();
      navigate("/login");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  useEffect(() => {
    checkTimestamp();
  }, [userInfo.email]);

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
            {errorMessage
              ? errorMessage
              : userInfo.emailVerified
              ? "🌟 A Star Twinkles — Your Email Verification is Complete! 🌟"
              : isEmailSent
              ? "Email has been sent. Please check your inbox."
              : "Please verify your email to continue."}
          </p>
          {!userInfo.emailVerified && (
            <button
              type="button"
              className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
              onClick={handleButtonClick}
              disabled={isButtonDisabled || isTimestampButtonDisabled}
            >
              {isButtonDisabled
                ? `Sending...`
                : timeRemaining
                ? `Resend in ${Math.ceil(timeRemaining / 1000)}s`
                : "Send Verification Email"}
            </button>
          )}
          <button
            type="button"
            className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
            onClick={handleLogoutClick}
          >
            Logout
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyEmail;
