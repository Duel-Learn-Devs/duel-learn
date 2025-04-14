import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ExitIcon from "/images/Exit.png";
import sampleAvatarDeployment from "/images/sampleAvatar2.png";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import PageTransition from "../../styles/PageTransition";
import { auth, sendResetEmail } from "../../services/firebase";
import useEmailTimestamp from "../../hooks/useEmailTimestamp";

const ConfirmationAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, type } = location.state || {};
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPhone, setIsPhone] = useState(false);
  const { timeRemaining, isButtonDisabled, checkTimestamp } =
    useEmailTimestamp(email);

  useEffect(() => {
    if (!email) {
      setError("No email or phone provided");
      setLoading(false);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\d{10,15}$/;

    if (emailPattern.test(email)) {
      setIsPhone(false);
    } else if (phonePattern.test(email)) {
      setIsPhone(true);
    } else {
      setError("Invalid email or phone format");
      setLoading(false);
      return;
    }
  }, [email]);

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const db = getFirestore();
        const usersRef = collection(db, "users");
        let q;

        if (isPhone) {
          q = query(usersRef, where("phone", "==", email));
        } else {
          q = query(usersRef, where("email", "==", email));
        }

        const querySnapshot = await getDocs(q);
        console.log("Query Snapshot:", querySnapshot);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          // Define type for user data
          interface UserData {
            username: string;
            profilePic?: string;
            email?: string;
            phone?: string;
          }

          const userData = userDoc.data() as UserData;
          setUsername(userData.username || "");
          setProfilePic(userData.profilePic || "");
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError("Failed to fetch user data");
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchUsername();
    }
  }, [email, isPhone]);

  const handleContinueClick = async () => {
    setButtonLoading(true);
    try {
      const canSendEmail = await checkTimestamp();
      if (!canSendEmail) {
        setButtonLoading(false);
        return;
      }

      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where(isPhone ? "phone" : "email", "==", email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const firebase_uid = userDoc.id;

        if (type === "reset") {
          // For password reset flow
          const actionCodeSettings = {
            url: `${
              import.meta.env.VITE_FRONTEND_URL
            }/email-action-handler?mode=verifyEmail&firebase_uid=${firebase_uid}&email=${email}`,
            handleCodeInApp: true,
          };

          await sendResetEmail(auth, email, actionCodeSettings);

          // Update email timestamp in Firestore
          await setDoc(
            doc(db, "users", userDoc.id),
            {
              emailTimestamp: serverTimestamp(),
            },
            { merge: true }
          );

          // Update local timestamp
          const now = new Date();
          localStorage.setItem("emailTimestamp", now.toISOString());

          navigate("/check-your-mail", {
            state: {
              email,
              firebase_uid,
              type: "reset",
            },
          });
        } else {
          // For email verification flow
          navigate("/check-your-mail", {
            state: {
              email,
              firebase_uid,
              type: "verification",
            },
          });
        }
      } else {
        setError("User not found");
      }
    } catch (err) {
      console.error("Error navigating to check your mail:", err);
      setError("Failed to process request");
    } finally {
      setButtonLoading(false);
    }
  };

  const handleExitClick = () => {
    navigate("/");
  };

  return (
    <PageTransition>
      <div className="h-screen mt-[-30px] flex flex-col items-center justify-center">
        <header className="absolute top-20 left-20 right-20 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-4">
            <img src="/duel-learn-logo.svg" className="w-10 h-10" alt="icon" />
            <p className="text-white text-xl font-semibold">Duel Learn</p>
          </Link>

          <img
            src={ExitIcon}
            alt="Exit Icon"
            style={{ width: "39px" }}
            className="hover:scale-110 cursor-pointer"
            onClick={handleExitClick}
          />
        </header>

        <div className="flex flex-col items-center justify-center">
          <img
            src={profilePic || sampleAvatarDeployment}
            style={{ width: "100px" }}
            alt="Profile Avatar"
          />
          {loading ? (
            <h2 className="text-white uppercase text-lg text-center mt-5">
              Loading...
            </h2>
          ) : error ? (
            <h2 className="text-red-500 uppercase text-lg text-center mt-5">
              {error}
            </h2>
          ) : (
            <h2 className="text-white uppercase text-lg text-center mt-5">
              {username}
            </h2>
          )}
        </div>

        <div className="w-full max-w-md rounded-lg p-8 shadow-md">
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            Is this you?
          </h1>
          <p className="text-lg text-center text-[#9F9BAE] mb-8 max-w-[340px] mx-auto break-words">
            {type === "reset"
              ? "Confirm this is you and we'll send a code to reset your password."
              : "Confirm this is you and we'll send a code to recover your account."}
          </p>

          <button
            type="submit"
            className={`w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors flex justify-center items-center`}
            onClick={handleContinueClick}
            disabled={buttonLoading || isButtonDisabled}
          >
            {buttonLoading ? (
              <div className="relative">
                <div className="loader w-6 h-6 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-transparent border-t-[#D1C4E9] animate-pulse"></div>
              </div>
            ) : timeRemaining !== null && timeRemaining > 0 ? (
              `Wait ${Math.ceil(timeRemaining / 1000)} seconds`
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default ConfirmationAccount;
