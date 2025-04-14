import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { updateProfile } from "firebase/auth";
import { auth } from "../../services/firebase";
import "../../index.css";
import PageTransition from "../../styles/PageTransition";
import useCombinedErrorHandler from "../../hooks/validation.hooks/useCombinedErrorHandler";
import LoadingScreen from "../../components/LoadingScreen";
import { useFormik } from "formik";
import * as Yup from "yup";
import useGoogleAuth from "../../hooks/auth.hooks/useGoogleAuth";
import { useStoreUser } from "../../hooks/api.hooks/useStoreUser";
import { useUser } from "../../contexts/UserContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { setAuthToken } from "../../api/apiClient";
import PasswordValidationTooltip from "../../components/PasswordValidationTooltip";

const SignUp = () => {
  const { handleError, combinedError } = useCombinedErrorHandler();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { storeUser } = useStoreUser();
  const { handleGoogleAuth, loading: googleLoading } = useGoogleAuth();
  const { loadUserData } = useUser();
  const { signup, error: authError } = useAuth();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      handleError(new Error(authError));
    }
  }, [authError, handleError]);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Add functions to check uniqueness
  const checkUsernameUnique = async (username: string) => {
    const db = getFirestore();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const checkEmailUnique = async (email: string) => {
    const db = getFirestore();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .required("Username is required.")
      .min(2, "Username must be at least 2 characters.")
      .max(20, "Username cannot exceed 20 characters.")
      .matches(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain alphanumeric characters and underscores."
      )
      .test("unique", "Username is already taken", async function (value) {
        if (!value) return true; // Skip if empty as required() will handle it
        try {
          return await checkUsernameUnique(value);
        } catch (error) {
          return false;
        }
      }),
    email: Yup.string()
      .required("Email is required.")
      .email("Please enter a valid email address.")
      .test("unique", "Email is already in use", async function (value) {
        if (!value) return true; // Skip if empty as required() will handle it
        try {
          return await checkEmailUnique(value);
        } catch (error) {
          return false;
        }
      }),
    password: Yup.string()
      .required("Password is required.")
      .min(8, "Password must be at least 8 characters.")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter.")
      .matches(/[0-9]/, "Password must contain at least one number.")
      .matches(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character."
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Please confirm your password."),
    terms: Yup.boolean().oneOf(
      [true],
      "You must agree to the terms and conditions."
    ),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      terms: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      let firebaseUser = null; // Variable to track if we need to delete Firebase user on error

      try {
        console.log("=== Starting SignUp Process ===");
        console.log("Creating Firebase user...");

        // Use AuthContext signup instead of direct Firebase call
        const user = await signup(values.email, values.password);
        firebaseUser = user; // Store reference for cleanup in case of error
        console.log("Firebase user created:", user.uid);

        await updateProfile(user, { displayName: values.username });
        console.log("Firebase profile updated");

        // Get a fresh token and make sure it's set in apiClient
        console.log("Getting fresh token and setting up authentication...");

        // Multiple attempts to get a fresh token if needed
        let token = null;
        let tokenAttempts = 0;
        const MAX_TOKEN_ATTEMPTS = 3;

        while (!token && tokenAttempts < MAX_TOKEN_ATTEMPTS) {
          try {
            tokenAttempts++;
            console.log(`Token attempt ${tokenAttempts}/${MAX_TOKEN_ATTEMPTS}`);

            // Force refresh token
            token = await user.getIdToken(true);
            console.log(
              `Got Firebase token (attempt ${tokenAttempts}):`,
              token.substring(0, 10) + "..."
            );

            // Explicitly set the token to ensure it's available for the API call
            setAuthToken(token);
            console.log("Token explicitly set in apiClient");
          } catch (tokenError) {
            console.error(
              `Failed to get token on attempt ${tokenAttempts}:`,
              tokenError
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!token) {
          throw new Error(
            "Failed to obtain authentication token after multiple attempts. Please try again."
          );
        }

        // Increase the delay to ensure token is properly set
        console.log("Waiting for token to propagate...");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Ready to proceed with API call
        console.log("Proceeding with storeUser API call...");

        // Store user data in backend
        console.log("Calling storeUser with data:", {
          username: values.username,
          email: values.email,
          password: "***",
          account_type: "free",
        });

        const storeUserResult = await storeUser({
          username: values.username,
          email: values.email,
          password: values.password,
          account_type: "free",
          isNew: user.metadata.creationTime === user.metadata.lastSignInTime,
          isSSO: false,
        });
        console.log("Store user result:", storeUserResult);

        if (!storeUserResult.success) {
          throw new Error(storeUserResult.error);
        }

        // Remove the loadUserData call as it should only happen after email verification
        // await loadUserData(user.uid);

        setSuccessMessage("Account created! Please verify your email.");

        setTimeout(() => {
          console.log("Navigating to verify-email");
          navigate("/verify-email", { state: { token } });
        }, 2000);
      } catch (error) {
        console.error("Registration error:", error);

        // Clean up Firebase user if it was created but subsequent steps failed
        if (firebaseUser) {
          try {
            console.log("Cleaning up Firebase user due to registration error");
            await firebaseUser.delete();
            console.log("Firebase user deleted successfully");
          } catch (deleteError) {
            console.error("Error deleting Firebase user:", deleteError);
            // Continue with error handling even if deletion fails
          }
        }

        handleError(error);
        setLoading(false);
      }
    },
  });

  const handleGoogleSubmit = async () => {
    try {
      const authResult = await handleGoogleAuth("free");

      // Google users are pre-verified, so load user data for them
      // Google auth typically verifies email automatically
      if (auth.currentUser && auth.currentUser.emailVerified) {
        await loadUserData(authResult.userData.uid);
      }

      if (authResult.isNewUser) {
        setSuccessMessage("Account created successfully!");
        setTimeout(() => {
          setLoading(true);
          navigate("/dashboard/welcome");
        }, 1500);
      } else {
        setSuccessMessage("Account already exists. Redirecting to login...");
        setTimeout(() => {
          setLoading(true);
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      handleError(error);
    }
  };

  if (loading || googleLoading) {
    return (
      <PageTransition>
        <LoadingScreen />
      </PageTransition>
    );
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
            Create an Account
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

          <form onSubmit={formik.handleSubmit}>
            <div className="relative mb-4">
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                required
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  formik.touched.username && formik.errors.username
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {formik.touched.username && formik.errors.username && (
                <p className="text-red-500 mt-1 text-sm">
                  {formik.errors.username}
                </p>
              )}
            </div>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  setIsPasswordFocused(false);
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onCopy={(e) => e.preventDefault()}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  formik.touched.password && formik.errors.password
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

              <PasswordValidationTooltip
                password={formik.values.password}
                isVisible={
                  isPasswordFocused ||
                  !!(formik.touched.password && formik.errors.password)
                }
              />

              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 mt-1 text-sm">
                  {formik.errors.password}
                </p>
              )}
            </div>
            <div className="relative mb-4">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                required
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                onPaste={(e) => e.preventDefault()}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <p className="text-red-500 mt-1 text-sm">
                    {formik.errors.confirmPassword}
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
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  formik.touched.email && formik.errors.email
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 mt-1 text-sm">
                  {formik.errors.email}
                </p>
              )}
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="w-4 h-4 text-[#4D18E8] bg-[#3B354D] border-gray-300 rounded focus:ring-2 focus:ring-[#4D18E8]"
                checked={formik.values.terms}
                onChange={formik.handleChange}
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
            {formik.touched.terms && formik.errors.terms && (
              <p className="text-red-500 mt-1 text-sm">{formik.errors.terms}</p>
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
            onClick={handleGoogleSubmit}
          >
            <img
              src="/google-logo.png"
              className="w-5 h-5 mr-3"
              alt="Google Icon"
            />
            Create account with Google
          </button>

          <p className="mt-4 text-center text-sm text-[#9F9BAE]">
            Already have an account?{" "}
            <button
              onClick={() => {
                setLoading(true);
                navigate("/login");
              }}
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

export default SignUp;
