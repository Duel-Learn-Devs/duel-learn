import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "react-hot-toast";
import sampleAvatar2 from "../../assets/images/sampleAvatar2.png";
import PageTransition from "../../styles/PageTransition";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";

const VerifyEmail = () => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
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
        toast.success("Verification email sent.");
        setIsButtonDisabled(true);
        setIsEmailSent(true);

        const db = getFirestore();
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await setDoc(doc(db, "users", userDoc.id), {
            emailTimestamp: serverTimestamp(),
          }, { merge: true });
        }
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

  const handleBacktoLoginClick = () => {
    navigate("/dashboard/home");
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
            {errorMessage ? errorMessage : isEmailVerified ? "Email is Already Verified" : isEmailSent ? "Email has been sent. Please check your inbox." : "Please verify your email to continue."}
          </p>
          {!isEmailVerified && (
            <button
              type="button"
              className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
              onClick={handleSendVerificationEmail}
              disabled={isButtonDisabled || isTimestampButtonDisabled}
            >
              {isButtonDisabled ? (
                <div className="relative">
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
            onClick={handleBacktoLoginClick}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyEmail;
