import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import firebaseEmailHandler from "../../services/firebaseEmailHandler";
import LoadingScreen from "../../components/LoadingScreen";
import PageTransition from "../../styles/PageTransition";
import emailError from "/General/EmailSent.png";
import { socket } from "../../services/socket";

const EmailActionHandler: React.FC = () => {
  const location = useLocation();
  const { handleEmailAction } = firebaseEmailHandler();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasExecuted, setHasExecuted] = useState(false);

  const handleVerification = async (oobCode: string, continueUrl: string) => {
    try {
      const result = await handleEmailAction(
        "verifyEmail",
        oobCode,
        continueUrl
      );
      if (result?.success) {
        socket.emit("emailActionResult", {
          type: "success",
          mode: "verifyEmail",
          firebase_uid: result.firebase_uid,
          email: result.email,
          oobCode,
        });
        setSuccess(
          "🌟 A Star Twinkles — Your Email Verification is Complete! 🌟"
        );
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError("The spell has faded — your magic link has expired.");
    }
  };

  const handlePasswordReset = async (oobCode: string, continueUrl: string) => {
    try {
      const result = await handleEmailAction(
        "resetPassword",
        oobCode,
        continueUrl
      );
      if (result?.success) {
        socket.emit("emailActionResult", {
          type: "success",
          mode: "resetPassword",
          firebase_uid: result.firebase_uid,
          email: result.email,
          oobCode,
        });
        setSuccess(
          "✨ Your password reset spell has been cast successfully! ✨"
        );
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("The spell has faded — your magic link has expired.");
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    const oobCode = queryParams.get("oobCode");
    const continueUrl = queryParams.get("continueUrl");

    if (mode && oobCode && !hasExecuted) {
      setHasExecuted(true);

      if (mode === "verifyEmail") {
        handleVerification(oobCode, continueUrl || "");
      } else if (mode === "resetPassword") {
        handlePasswordReset(oobCode, continueUrl || "");
      } else {
        setError("Invalid mode");
      }

      setLoading(false);
    } else if (!mode || !oobCode) {
      setError("Invalid or missing parameters.");
      setLoading(false);
    }
  }, [location.search, hasExecuted]);

  const handleCloseTab = () => {
    window.close();
  };

  if (loading) {
    return (
      <PageTransition>
        <LoadingScreen text="Conjuring Email Action" />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col mb-11 items-center justify-center">
          <img
            src={emailError}
            style={{ width: "200px" }}
            alt="Profile Avatar"
          />
        </div>
        <div className="w-full max-w-md rounded-lg p-8 shadow-md">
          <p className="text-[18px] text-center text-[#9F9BAE] mb-8 max-w-[340px] mx-auto break-words">
            {error || success}
          </p>
          <button
            className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
            onClick={handleCloseTab}
          >
            Close
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default EmailActionHandler;
