import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import EmailSent from "../../assets/General/EmailSent.png"; // Importing the big star image
import PageTransition from "../../styles/PageTransition"; // Importing the PageTransition component
<<<<<<< HEAD
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, sendResetEmail } from "../../services/firebase";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";
=======
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, sendResetEmail, sendEmail } from "../../services/firebase";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";
import firebaseEmailHandler from "../../services/firebaseEmailHandler";
import { socket } from "../../services/socket";
>>>>>>> origin/beta-branch

export default function CheckYourMail() {
  const navigate = useNavigate();
  const location = useLocation();
<<<<<<< HEAD
  const { email, firebase_uid } = location.state || {};
=======
  const [email, setEmail] = useState("");
  const [firebase_uid, setFirebaseUid] = useState("");
  const [type, setType] = useState("");
>>>>>>> origin/beta-branch
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState("");
  const [buttonText, setButtonText] = useState("Send Email");
  const { timeRemaining, isButtonDisabled, checkTimestamp } = useEmailTimestamp(email);
<<<<<<< HEAD
  const handleSendPasswordResetEmail = async () => {
    try {
      const actionCodeSettings = {
        url: `http://localhost:5173/Reset-Password?mode=resetPassword&firebase_uid=${firebase_uid}`,
=======
  const { handleEmailAction } = firebaseEmailHandler();

  useEffect(() => {
    const fetchUserData = async () => {
      const locationState = location.state || JSON.parse(localStorage.getItem("userData") || "{}");
      setEmail(locationState.email || "");
      setFirebaseUid(locationState.firebase_uid || "");
      setType(locationState.type || "");

      if (locationState.firebase_uid) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", locationState.firebase_uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.email_verified && locationState.type === "verification") {
            navigate("/email-verified", { 
              state: { 
                email: locationState.email, 
                firebase_uid: locationState.firebase_uid 
              } 
            });
          }
        }
      }
    };

    fetchUserData();
  }, [location.state, navigate]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    const oobCode = queryParams.get("oobCode");
    const continueUrl = queryParams.get("continueUrl");

    if (mode && oobCode && continueUrl) {
      handleEmailAction(mode, oobCode, continueUrl)
        .then(() => {
          if (mode === "verifyEmail") {
            navigate("/email-verified", { state: { email, firebase_uid } });
          }
        })
        .catch((err) => {
          console.error("Error handling email action:", err);
          setError("The spell has faded — your magic link has expired.");
        });
    }
  }, [location.search]);

  useEffect(() => {
    // Listen for email action results
    const handleEmailActionResult = (result: any) => {
      const { mode, firebase_uid, email, oobCode } = result;
      
      if (mode === 'verifyEmail') {
        navigate("/email-verified", { 
          state: { 
            email, 
            firebase_uid,
            oobCode 
          } 
        });
      } else if (mode === 'resetPassword') {
        navigate(`/reset-password?oobCode=${oobCode}&firebase_uid=${firebase_uid}`);
      }
    };

    // Listen for password reset success
    const handlePasswordResetSuccess = () => {
      localStorage.removeItem('emailTimestamp');
      navigate("/password-changed-successfully");
    };

    // Listen for email verification success
    const handleEmailVerifiedSuccess = () => {
      localStorage.removeItem('emailTimestamp');
      navigate("/email-verified");
    };

    // Set up socket event listeners
    socket.on("emailActionResult", handleEmailActionResult);
    socket.on("passwordResetSuccess", handlePasswordResetSuccess);
    socket.on("emailVerifiedSuccess", handleEmailVerifiedSuccess);

    // Cleanup listeners on unmount
    return () => {
      socket.off("emailActionResult", handleEmailActionResult);
      socket.off("passwordResetSuccess", handlePasswordResetSuccess);
      socket.off("emailVerifiedSuccess", handleEmailVerifiedSuccess);
    };
  }, [navigate]);

  const handleSendPasswordResetEmail = async () => {
    try {
      const actionCodeSettings = {
        url: `${import.meta.env.VITE_FRONTEND_URL}/email-action-handler?mode=resetPassword&firebase_uid=${firebase_uid}&email=${email}`,
>>>>>>> origin/beta-branch
        handleCodeInApp: true,
      };

      await sendResetEmail(auth, email, actionCodeSettings);
      setButtonText("Resend Email");
      setButtonLoading(false);

      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await setDoc(doc(db, "users", userDoc.id), {
          emailTimestamp: serverTimestamp(),
        }, { merge: true });
      }

      const now = new Date();
      localStorage.setItem("emailTimestamp", now.toISOString());
    } catch (err) {
      setError("Failed to send password reset email");
      setButtonLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setButtonLoading(true);

    const canSendEmail = await checkTimestamp();
    if (canSendEmail) {
<<<<<<< HEAD
      await handleSendPasswordResetEmail();
=======
      if (type === "verification") {
        await handleSendVerificationEmail();
      } else {
        await handleSendPasswordResetEmail();
      }
>>>>>>> origin/beta-branch
    } else {
      setButtonLoading(false);
      console.log("Cannot send email yet");
    }
  };

<<<<<<< HEAD
=======
  const handleSendVerificationEmail = async () => {
    try {
      const actionCodeSettings = {
        url: `${import.meta.env.VITE_FRONTEND_URL}/email-action-handler?mode=verifyEmail&firebase_uid=${firebase_uid}&email=${email}`,
        handleCodeInApp: true,
      };

      await sendEmail(auth.currentUser!, actionCodeSettings);
      setButtonText("Resend Email");
      setButtonLoading(false);

      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await setDoc(doc(db, "users", userDoc.id), {
          emailTimestamp: serverTimestamp(),
        }, { merge: true });
      }

      const now = new Date();
      localStorage.setItem("emailTimestamp", now.toISOString());
    } catch (err) {
      setError("Failed to send verification email");
      setButtonLoading(false);
    }
  };

>>>>>>> origin/beta-branch
  const handleExitClick = () => {
    navigate("/");
  };

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      setButtonText(`Resend Email (${Math.ceil(timeRemaining / 1000)}s)`);
    } else {
      setButtonText("Send Email");
    }
  }, [timeRemaining]);
<<<<<<< HEAD
  
  useEffect(() => {
    const bc = new BroadcastChannel('password-reset');
  
    const handleResetPasswordSuccess = (message: MessageEvent) => {
      if (message.data === 'reset_password_success') {
        navigate("/password-changed-successfully");
      }
    };
  
    bc.addEventListener('message', handleResetPasswordSuccess);
  
    return () => {
      bc.removeEventListener('message', handleResetPasswordSuccess);
      bc.close();
    };
  }, [navigate]);
=======

>>>>>>> origin/beta-branch
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
<<<<<<< HEAD
                We sent you a link for your password recovery. Check your spam
                folder if you do not hear from us after awhile.
=======
                {type === "verification" ? 
                  "We sent you a link for your email verification. Check your spam folder if you do not hear from us after awhile." :
                  "We sent you a link for your password recovery. Check your spam folder if you do not hear from us after awhile."
                }
>>>>>>> origin/beta-branch
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