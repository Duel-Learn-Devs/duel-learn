import { Link, useNavigate } from "react-router-dom";
import ExitIcon from "../../assets/images/Exit.png";
import React, { useState } from "react";
import { TextField, CircularProgress, Modal } from "@mui/material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import PageTransition from "../../styles/PageTransition";
import sampleAvatar2 from "../../assets/images/sampleAvatar2.png"; // Add this import

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
  });

  const [errors, setErrors] = useState({
    email: "",
  });

  const [error, setError] = useState({ general: "" });
  const [loading, setLoading] = useState(false);
  const [isSSOModalOpen, setIsSSOModalOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { email } = formData;
    let formIsValid = true;
    let newErrors = { email: "" };

    if (!email) {
      newErrors.email = "Email or phone is required.";
      formIsValid = false;
    }

    if (!formIsValid) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      let q;

      // Check if the input is an email or phone number
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phonePattern = /^\d{10,15}$/;

      if (emailPattern.test(email)) {
        q = query(usersRef, where("email", "==", email));
      } else if (phonePattern.test(email)) {
        q = query(usersRef, where("phone", "==", email));
      } else {
        setError({ general: "Invalid email or phone format." });
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError({ general: "Account doesn't exist." });
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        if (userData.isSSO) {
          setIsSSOModalOpen(true);
        } else {
          navigate("/confirmation-account", { state: { email } });
        }
      }
    } catch (error) {
      setError({ general: (error as any).message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [field]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
    setError({ general: "" });
  };

  const handleExitClick = () => {
    navigate("/");
  };

  return (
    <PageTransition>
      <div className="h-screen mt-[-30px] flex flex-col items-center justify-center">
        <header className="absolute top-20 left-20 right-20 flex justify-between items-center">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center space-x-4">
            <img src="/duel-learn-logo.svg" className="w-10 h-10" alt="icon" />
            <p className="text-white text-xl font-semibold">Duel Learn</p>
          </Link>

          {/* Exit Button */}
          <img
            src={ExitIcon}
            alt="Exit Icon"
            style={{ width: "39px" }}
            className="hover:scale-110 cursor-pointer"
            onClick={handleExitClick}
          />
        </header>

        <div className="w-full max-w-md rounded-lg p-8 shadow-md">
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            Forgot Password
          </h1>
          <p className="text-lg text-center text-[#9F9BAE] mb-8 max-w-[340px] mx-auto break-words">
            Please enter your email or phone to search for your account.
          </p>

          {error.general && (
            <div className="w-full max-w-sm mb-4 px-4 py-2 bg-red-100 text-red-600 rounded-md border border-red-300">
              {error.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mt-0 mb-0">
              <input
                id="email"
                type="text"
                placeholder="Enter your email or phone"
                value={formData.email}
                autoComplete="off"
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`block w-full p-3 mb-4 rounded-lg bg-[#3B354D] text-[#E2DDF3] placeholder-[#9F9BAE] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] ${
                  errors.email ? "border border-red-500" : ""
                }`}
              />
            </div>
            <button
              type="submit"
              className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Submit"
              )}
            </button>
          </form>
        </div>
      </div>

      <Modal
        open={isSSOModalOpen}
        onClose={() => setIsSSOModalOpen(false)}
        aria-labelledby="sso-modal-title"
        aria-describedby="sso-modal-description"
      >
        <div className="h-screen flex flex-col items-center justify-center bg-black">
          <div className="flex flex-col mb-11 items-center justify-center">
            <img
              src={sampleAvatar2}
              style={{ width: "200px" }}
              alt="Profile Avatar"
            />
          </div>
          <div className="w-full max-w-md rounded-lg p-8 shadow-md bg-black">
            <p className="text-[18px] text-center text-[#9F9BAE] mb-8 max-w-[340px] mx-auto break-words">
              This account was created using Google. You cannot change the password.
            </p>
            <button
              type="button"
              className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
              onClick={() => setIsSSOModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default ForgotPassword;
