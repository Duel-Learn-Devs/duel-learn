import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import EmailSent from "/General/EmailSent.png"; // Importing the big star image
import PageTransition from "../../styles/PageTransition"; // Importing the PageTransition component
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, sendResetEmail, sendEmail } from "../../services/firebase";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";
import { socket } from "../../services/socket";
import { useUser } from "../../contexts/UserContext";
import { db } from "../../services/firebase";

export default function CheckYourMail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState("");
  const [buttonText, setButtonText] = useState("Send Email");

  // Use location state with fallback to user context
  const currentUser = {
    email: location.state?.email || user?.email,
    firebase_uid: location.state?.firebase_uid || user?.firebase_uid,
    type: location.state?.type || "verification",
  };

  const { timeRemaining, isButtonDisabled } = useEmailTimestamp(
    currentUser.email || "",
    currentUser.firebase_uid
  );

  useEffect(() => {
    // Check if user is already verified
    if (
      auth.currentUser?.emailVerified &&
      currentUser.type === "verification"
    ) {
      navigate("/email-verified", {
        state: {
          email: currentUser.email,
          firebase_uid: currentUser.firebase_uid,
        },
      });
    }
  }, [auth.currentUser?.emailVerified]);

  useEffect(() => {
    // Socket event handlers
    const handleEmailActionResult = (result: any) => {
      const { mode, firebase_uid, email, oobCode } = result;
      if (mode === "verifyEmail") {
        navigate("/email-verified", {
          state: { email, firebase_uid, oobCode },
        });
      } else if (mode === "resetPassword") {
        navigate(
          `/reset-password?oobCode=${oobCode}&firebase_uid=${firebase_uid}`
        );
      }
    };

    const handleSuccess = (type: "password" | "email") => {
      localStorage.removeItem("emailTimestamp");
      navigate(
        type === "password"
          ? "/password-changed-successfully"
          : "/email-verified"
      );
    };

    socket.on("emailActionResult", handleEmailActionResult);
    socket.on("passwordResetSuccess", () => handleSuccess("password"));
    socket.on("emailVerifiedSuccess", () => handleSuccess("email"));

    return () => {
      socket.off("emailActionResult", handleEmailActionResult);
      socket.off("passwordResetSuccess");
      socket.off("emailVerifiedSuccess");
    };
  }, [navigate]);

  const handleSendEmail = async () => {
    if (!currentUser.email || !currentUser.firebase_uid) return;

    setButtonLoading(true);
    try {
      const actionCodeSettings = {
        url: `${import.meta.env.VITE_FRONTEND_URL}/email-action-handler?mode=${
          currentUser.type === "verification" ? "verifyEmail" : "resetPassword"
        }&firebase_uid=${currentUser.firebase_uid}&email=${currentUser.email}`,
        handleCodeInApp: true,
      };

      if (currentUser.type === "verification") {
        await sendEmail(auth.currentUser!, actionCodeSettings);
      } else {
        await sendResetEmail(auth, currentUser.email, actionCodeSettings);
      }

      // Update timestamp in Firestore
      try {
        await setDoc(
          doc(db, "temp_users", currentUser.firebase_uid),
          {
            emailTimestamp: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error updating Firestore timestamp:", error);
        // Fallback to localStorage
        localStorage.setItem("emailTimestamp", new Date().toISOString());
      }

      setButtonText("Resend Email");
    } catch (err) {
      setError(`Failed to send ${currentUser.type} email`);
    } finally {
      setButtonLoading(false);
    }
  };

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      setButtonText(`Resend Email (${Math.ceil(timeRemaining / 1000)}s)`);
    } else {
      setButtonText("Send Email");
    }
  }, [timeRemaining]);

  return (
    <PageTransition>
      <main
        className="flex overflow-hidden flex-col items-center justify-center min-h-screen px-10 pt-12 pb-48 max-md:px-2 max-md:pb-12"
        style={{ backgroundColor: "#080511" }}
        // Main container with flexbox layout, padding, and background color
      >
        <div className="flex flex-col max-w-full w-[573px]">
          {/* Simple Header */}
          <header className="absolute top-20 left-20 flex items-center">
            <Link to="/" className="flex items-center space-x-4">
              <img
                src="/duel-learn-logo.svg"
                className="w-10 h-10"
                alt="icon"
              />
              <p className="text-white text-xl font-semibold">Duel Learn</p>
            </Link>
          </header>

          <section className="flex flex-col items-center mt-14 ml-40 max-w-full text-center w-[213px] max-md:mt-5 max-md:ml-5">
            {/* Section container with flexbox layout, margin, and text alignment */}
            {error && (
              <div className="bg-red-700 text-white text-center py-2 mb-4 rounded w-[400px]">
                {error}
              </div>
            )}
            <img
              loading="lazy"
              src={EmailSent}
              className="object-contain self-center max-w-full aspect-[1.08] w-[78px]"
              alt="Email sent"
              // Importing email sent illustration in SVG format
            />
            <div className="flex flex-col items-center mt-3 max-md:mt-4 max-md:max-w-full w-[400px]">
              {/* Container for the text content with flexbox layout and margin */}
              <h2
                className="text-4xl font-bold text-slate-200 max-md:max-w-full max-md:text-3xl mb-2"
                style={{ fontFamily: "Nunito" }}
              >
                {/* Heading with specific font size and color */}
                Check your mailbox!
              </h2>
              <p
                className="mt-2 text-m text-zinc-400 max-md:max-w-full mb-2"
                style={{ fontFamily: "Nunito" }}
              >
                {/* Paragraph with margin, font size, and color */}
                {currentUser.type === "verification"
                  ? "We sent you a link for your email verification. Check your spam folder if you do not hear from us after awhile."
                  : "We sent you a link for your password recovery. Check your spam folder if you do not hear from us after awhile."}
              </p>
            </div>

            <div className="mt-6 text-m font-bold text-slate-200 max-md:mt-5 max-md:mr-1 max-md:max-w-full">
              {/* Container for the button with margin and text styling */}
              <div className="flex flex-col justify-center w-full max-md:max-w-full">
                {/* Container for the button with flexbox layout */}
                <button
                  className="w-[400px] px-5 py-2 bg-violet-700 rounded-xl max-md:px-2 max-md:max-w-full hover:bg-violet-600 transition-colors text-base"
                  onClick={handleSendEmail}
                  disabled={buttonLoading || isButtonDisabled}
                  style={{ fontFamily: "Nunito" }}
                >
                  {buttonLoading ? (
                    <div className="relative">
                      <div className="loader w-6 h-6 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                      <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-transparent border-t-[#D1C4E9] animate-pulse"></div>
                    </div>
                  ) : (
                    buttonText
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
}
