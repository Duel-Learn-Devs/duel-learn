import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "react-hot-toast";
import sampleAvatar2 from "../../assets/images/sampleAvatar2.png";
import PageTransition from "../../styles/PageTransition";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";
=======
import { useNavigate, useLocation } from "react-router-dom";
import { auth, signOutUser, sendEmail, db } from "../../services/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import sampleAvatar2 from "../../assets/images/sampleAvatar2.png";
import PageTransition from "../../styles/PageTransition";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";
import firebaseEmailHandler from "../../services/firebaseEmailHandler";
>>>>>>> origin/beta-branch

const VerifyEmail = () => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
<<<<<<< HEAD
  const user = auth.currentUser;
  const email = user?.email || "";
  const { timeRemaining, isButtonDisabled: isTimestampButtonDisabled } = useEmailTimestamp(email);

  useEffect(() => {
    if (user) {
      setIsEmailVerified(user.emailVerified);
      console.log("Email Verified:", user.emailVerified);
    }
  }, [user]);

  const handleSendVerificationEmail = async () => {
    try {
      if (user) {
        await sendEmailVerification(user);
=======
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const email = userData.email || "";
  const { timeRemaining, isButtonDisabled: isTimestampButtonDisabled, checkTimestamp } = useEmailTimestamp(email);
  const { handleEmailAction } = firebaseEmailHandler();

  useEffect(() => {
    if (userData) {
      setIsEmailVerified(userData.email_verified);
      console.log("Email Verified:", userData.email_verified);
      if(auth.currentUser){
        console.log("Email Verified:", auth.currentUser.emailVerified);
      }
    }
  }, [userData]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    const oobCode = queryParams.get("oobCode");
    const continueUrl = queryParams.get("continueUrl");

    if (mode && oobCode && continueUrl) {
      handleEmailAction(mode, oobCode, continueUrl)
        .then((result) => {
          if (result?.success && result.mode === "verifyEmail") {
            navigate("/email-verified", { state: { email, firebase_uid: result.firebase_uid } });
          }
        })
        .catch((err) => {
          console.error("Error handling email action:", err);
          setErrorMessage("The spell has faded — your magic link has expired.");
        });
    }
  }, [location.search]);

  const handleSendVerificationEmail = async () => {
    try {      
      console.log("Email Verified:", userData.email_verified);
      const firebase_uid = userData.firebase_uid;
      if (auth.currentUser) {
        const actionCodeSettings = {
          url: `${import.meta.env.VITE_FRONTEND_URL}/email-action-handler?mode=verifyEmail&firebase_uid=${firebase_uid}&email=${email}`,
          handleCodeInApp: true,
        };
        await sendEmail(auth.currentUser!, actionCodeSettings);
>>>>>>> origin/beta-branch
        toast.success("Verification email sent.");
        setIsButtonDisabled(true);
        setIsEmailSent(true);

        const db = getFirestore();
        const usersRef = collection(db, "users");
<<<<<<< HEAD
        const q = query(usersRef, where("email", "==", user.email));
=======
        const q = query(usersRef, where("email", "==", auth.currentUser.email));
>>>>>>> origin/beta-branch
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await setDoc(doc(db, "users", userDoc.id), {
            emailTimestamp: serverTimestamp(),
          }, { merge: true });
        }
<<<<<<< HEAD
=======

        navigate("/check-your-mail", { state: { email, firebase_uid: auth.currentUser.uid, type: "verification" } });
>>>>>>> origin/beta-branch
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

<<<<<<< HEAD
  const handleBacktoLoginClick = () => {
    navigate("/dashboard/home");
=======
  const handleButtonClick = async () => {
    const canSendEmail = await checkTimestamp();
    if (canSendEmail) {
      await handleSendVerificationEmail();
    } else {
      navigate("/check-your-mail", { state: { email, firebase_uid: auth.currentUser?.uid, type: "verification" } });
    }
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userData");
      navigate("/login");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
>>>>>>> origin/beta-branch
  };

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }, [timeRemaining]);

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
<<<<<<< HEAD
            {errorMessage ? errorMessage : isEmailVerified ? "Email is Already Verified" : isEmailSent ? "Email has been sent. Please check your inbox." : "Please verify your email to continue."}
=======
            {errorMessage ? errorMessage : isEmailVerified ? "🌟 A Star Twinkles — Your Email Verification is Complete! 🌟" : isEmailSent ? "Email has been sent. Please check your inbox." : "Please verify your email to continue."}
>>>>>>> origin/beta-branch
          </p>
          {!isEmailVerified && (
            <button
              type="button"
              className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
<<<<<<< HEAD
              onClick={handleSendVerificationEmail}
              disabled={isButtonDisabled || isTimestampButtonDisabled}
            >
              {isButtonDisabled ? (
                <div className="relative">
=======
              onClick={handleButtonClick}
              disabled={isButtonDisabled || isTimestampButtonDisabled}
            >
              {isButtonDisabled ? (
                <div className="relative flex justify-center items-center">
>>>>>>> origin/beta-branch
                  <div className="loader w-6 h-6 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                  <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-transparent border-t-[#D1C4E9] animate-pulse"></div>
                </div>
              ) : timeRemaining !== null && timeRemaining > 0 ? (
                `Wait ${Math.ceil(timeRemaining / 1000)} seconds`
              ) : (
                "Send Verification Email"
              )}
            </button>
          )}
          <button
            type="button"
            className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
<<<<<<< HEAD
            onClick={handleBacktoLoginClick}
          >
            Back to Dashboard
=======
            onClick={handleLogoutClick}
          >
            Logout
>>>>>>> origin/beta-branch
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyEmail;
