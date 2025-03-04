import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

import {
  auth,
  googleProvider,
  getAdditionalInfo,
  db,
} from "../../services/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { setDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import "../../index.css";
import { useUser } from "../../contexts/UserContext";
import useValidation from "../../hooks/validation.hooks/useValidation";
import PageTransition from "../../styles/PageTransition";
import useSignUpApi from "../../hooks/api.hooks/useSignUpApi";
import useCombinedErrorHandler from "../../hooks/validation.hooks/useCombinedErrorHandler";
import LoadingScreen from "../../components/LoadingScreen";
import bcrypt from "bcryptjs";

const AdminSignUp = () => {
  const { setUser, user } = useUser();
  const { handleError, combinedError } = useCombinedErrorHandler();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    terms: false,
  });

  const { errors, validate, validateForm } = useValidation(formData); // Pass formData here
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { signUpApi } = useSignUpApi();
  const [loading, setLoading] = useState(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { username, password, confirmPassword, email, terms } = formData;

    if (
      !(await validateForm({
        username,
        password,
        confirmPassword,
        email,
        terms: terms.toString(),
      }))
    ) {
      setLoading(false);
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await result.user.getIdToken();
      const additionalUserInfo = getAdditionalInfo(result);
      const userData = {
        firebaseToken: token,
        firebase_uid: result.user.uid,

        username: username,
        email: email,
        display_picture: null,
        isNew: additionalUserInfo,
        full_name: "",
        email_verified: result.user.emailVerified,
        isSSO: false,
        account_type: "admin" as "free" | "premium" | "admin",
      };

      await setDoc(doc(db, "users", userData.firebase_uid), {
        firebase_uid: userData.firebase_uid || "",
        username: userData.username,
        email: userData.email,
        password_hash: hashedPassword, // Store the hashed password
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        display_picture: userData.display_picture || "",
        full_name: "",
        email_verified: userData.email_verified,
        isSSO: userData.isSSO,
        account_type: userData.account_type,
      });

      // Call the API
      try {
        await signUpApi(
          userData.firebase_uid,
          username,
          email,
          password,
          false,
          false
        );
      } catch (apiError: any) {
        console.error("API Error:", apiError);
        handleError(apiError);
        setLoading(false);
        return; // Exit the function if API call fails
      }

      console.log("signUpApi", signUpApi);

      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        terms: false,
      });
      setSuccessMessage(
        "Account successfully created! Redirecting to login..."
      );
      setTimeout(() => {
        if (userData.account_type === "admin") {
            navigate("/admin/admin-dashboard");
        }
        else {
          navigate("/dashboard/home");
        }
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      handleError(error);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const additionalUserInfo = getAdditionalInfo(result);
      const userData = {
        firebaseToken: token,
        firebase_uid: result.user.uid,
        username: result.user.displayName,
        email: result.user.email,
        display_picture: result.user.photoURL,
        isNew: additionalUserInfo?.isNewUser,
        full_name: "",
        email_verified: result.user.emailVerified,
        isSSO: true,
        account_type: "admin" as "free" | "premium"| "admin",
      };

      await setDoc(doc(db, "users", userData.firebase_uid), {
        firebase_uid: userData.firebase_uid || "",
        username: userData.username,
        email: userData.email,
        password_hash: "N/A", // Store the hashed password if needed
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        display_picture: userData.display_picture || "",
        full_name: "",
        email_verified: userData.email_verified,
        isSSO: userData.isSSO,
        account_type: userData.account_type,
      });

      setUser(userData);
      localStorage.setItem("userToken", token);

      // Call the API
      await signUpApi(
        userData.firebase_uid,
        userData.username ?? "Anonymous",
        userData.email || "",
        "",
        true,
        result.user.emailVerified
      );

      setTimeout(() => {
        if (userData.isNew && userData.email_verified) {
          navigate("/dashboard/welcome");
        } 
        else if(userData.isNew && userData.email_verified === false){
          navigate("/dashboard/verify-email");
        }
        else if(userData.email_verified === false){
          navigate("/dashboard/verify-email");
        }
        else {
          navigate("/dashboard/home");
        }
      }, 2000);
    } catch (error: any) {
      setLoading(false);
      handleError(error);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <LoadingScreen />
      </PageTransition>
    ); // Show the loading screen
  }

  return (
    <PageTransition>
      <div className="font-aribau min-h-screen flex items-center justify-center">
        <header className="absolute top-20 left-20 flex items-center">
          <Link to="/" className="flex items-center space-x-4">
            <img src="/duel-learn-logo.svg" className="w-10 h-10" alt="icon" />
            <p className="text-white text-xl font-semibold">Duel Learn</p>
          </Link>
        </header>
        <div className="p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-center text-[#E2DDF3]">
            Create an Admin Account
          </h1>
          <p className="text-lg mb-8 text-center text-[#9F9BAE]">
            Please enter your details to sign up.
          </p>
          {successMessage && (
            <div className="bg-green-700 text-white text-center py-2 mb-4 rounded">
              {successMessage}
            </div>
          )}

          {combinedError && (
            <div className="bg-red-700 text-white text-center py-2 mb-4 rounded">
              {combinedError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="relative mb-4">
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                onBlur={(e) => validate("username", e.target.value)} // Validate on blur
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  errors.username
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {errors.username && (
                <p className="text-red-500 mt-1 text-sm">{errors.username}</p>
              )}
            </div>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  validate("password", e.target.value);
                }}
                onCopy={(e) => e.preventDefault()} // Disable copy
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              <span
                onClick={togglePassword}
                className="absolute top-3 right-3 text-[#9F9BAE] cursor-pointer"
              >
                {showPassword ? (
                  <VisibilityRoundedIcon />
                ) : (
                  <VisibilityOffRoundedIcon />
                )}
              </span>
              {errors.password && (
                <p className="text-red-500 mt-1 text-sm">{errors.password}</p>
              )}
            </div>
            <div className="relative mb-4">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  validate("confirmPassword", e.target.value, formData);
                }}
                onPaste={(e) => e.preventDefault()} // Disable paste
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 mt-1 text-sm">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <div className="relative mb-4">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                onBlur={(e) => validate("email", e.target.value)} // Validate on blur
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 mt-1 text-sm">{errors.email}</p>
              )}
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 text-[#4D18E8] bg-[#3B354D] border-gray-300 rounded focus:ring-2 focus:ring-[#4D18E8]"
                checked={formData.terms}
                onChange={(e) => {
                  setFormData({ ...formData, terms: e.target.checked });
                  validate("terms", e.target.checked.toString());
                }}
              />
              <label htmlFor="terms" className="ml-2 text-[#9F9BAE] text-sm">
                I agree to {""}
                <Link
                  to="/terms-and-conditions"
                  target="_blank"
                  className="text-[#4D18E8] underline hover:text-[#4D18E8]"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-500 mt-1 text-sm">{errors.terms}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 text-white bg-[#4D18E8] rounded-lg hover:bg-[#3814b6] focus:outline-none focus:ring-4 focus:ring-[#4D18E8]"
            >
              Create Account
            </button>
          </form>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-t border-[#9F9BAE]" />
            <span className="mx-2 text-[#9F9BAE]">or</span>
            <hr className="flex-grow border-t border-[#9F9BAE]" />
          </div>

          <button
            className="w-full border border-[#4D18E8] bg-[#0F0A18] text-white py-3 rounded-lg flex items-center justify-center hover:bg-[#1A1426] transition-colors"
            onClick={handleGoogleSignIn}
          >
            <img
              src="/google-logo.png"
              className="w-5 h-5 mr-3"
              alt="Google Icon"
            ></img>
            Sign up with Google
          </button>

          <p className="mt-4 text-center text-sm text-[#9F9BAE]">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#4D18E8] hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminSignUp;
