import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../index.css";
import { useUser } from "../../contexts/UserContext";
import { useAuth } from "../../contexts/AuthContext";
import useCombinedErrorHandler from "../../hooks/validation.hooks/useCombinedErrorHandler";
import { collection, query, where, getDocs } from "firebase/firestore";
import PageTransition from "../../styles/PageTransition";
import useGoogleAuth from "../../hooks/auth.hooks/useGoogleAuth";
import LoadingScreen from "../../components/LoadingScreen";
import { useFormik } from "formik";
import * as Yup from "yup";

//import axios from "axios";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase"; // Ensure you have this import for Firebase auth
// Icons
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useStoreUser } from "../../hooks/api.hooks/useStoreUser";
import { setAuthToken } from "../../api/apiClient";

const Login = () => {
  const { user, loadUserData } = useUser();
  const { login, isLoading: authLoading, error: authError } = useAuth();
  const { handleError, combinedError } = useCombinedErrorHandler();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { handleGoogleAuth, loading: googleLoading } = useGoogleAuth();
  const [loading, setLoading] = useState(false);
  const { storeUser } = useStoreUser();
  const [submitError, setSubmitError] = useState("");
  // Add a separate loading state specifically for the Google button
  const [googleButtonLoading, setGoogleButtonLoading] = useState(false);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      handleError(new Error(authError));
    }
  }, [authError, handleError]);

  // Check if user is already logged in and redirect
  useEffect(() => {
    if (user && user.isNew) {
      setLoading(true);
      navigate("/dashboard/welcome");
    }
  }, [user, navigate]);

  // Global error handler to prevent getting stuck in loading state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // If still loading after 15 seconds, reset loading state
      if (loading) {
        console.warn("Login process timed out - resetting loading state");
        setLoading(false);
        setSubmitError("Login process timed out. Please try again.");
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const validationSchema = Yup.object({
    username: Yup.string().required("Username or email is required."),
    password: Yup.string().required("Password is required."),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      let email = values.username;
      const isEmailFormat = /\S+@\S+\.\S+/.test(values.username);

      try {
        // First, determine whether input is email or username
        if (!isEmailFormat) {
          // If username is provided, check first in temp_users collection
          const tempUsersRef = collection(db, "temp_users");
          const tempUsersQuery = query(
            tempUsersRef,
            where("username", "==", values.username)
          );
          const tempUsersSnapshot = await getDocs(tempUsersQuery);

          if (!tempUsersSnapshot.empty) {
            // User exists in temp_users collection
            const userDoc = tempUsersSnapshot.docs[0];
            const userData = userDoc.data();
            email = userData.email;

            console.log(
              "Found user in temp_users collection, attempting to sign in with Firebase"
            );

            // Try to sign in with Firebase using the AuthContext
            const result = await login(email, values.password);

            // Get a fresh token and make sure it's set in apiClient
            const token = await result.getIdToken();
            console.log("Got Firebase token:", token.substring(0, 10) + "...");

            // Explicitly set the token to ensure it's available for the API call
            setAuthToken(token);
            console.log("Token explicitly set in apiClient");

            // Add a small delay to ensure token is properly set
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log("Firebase sign in successful, storing user data");

            // Store user data using storeUser endpoint
            const storeUserResult = await storeUser({
              username: userData.username,
              email: userData.email,
              password: values.password,
              account_type: userData.account_type || "free",
              isNew: true,
              isSSO: false,
            });
            console.log("Store user result:", storeUserResult);

            if (!storeUserResult.success) {
              throw new Error(storeUserResult.error);
            }

            console.log("Navigating to email verification page");
            // Navigate to verify email page
            setLoading(true);
            navigate("/verify-email", { state: { token } });
            return;
          }

          // If not found in temp_users, check in users collection
          const usersRef = collection(db, "users");
          const usersQuery = query(
            usersRef,
            where("username", "==", values.username)
          );
          const usersSnapshot = await getDocs(usersQuery);

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            email = userDoc.data().email;
          } else {
            throw new Error("Username not found");
          }
        } else {
          // If email is provided, check first in temp_users collection
          const tempUsersRef = collection(db, "temp_users");
          const tempUsersQuery = query(
            tempUsersRef,
            where("email", "==", values.username)
          );
          const tempUsersSnapshot = await getDocs(tempUsersQuery);

          if (!tempUsersSnapshot.empty) {
            // User exists in temp_users collection
            const userDoc = tempUsersSnapshot.docs[0];
            const userData = userDoc.data();

            console.log(
              "Found user in temp_users collection with email search, attempting to sign in with Firebase"
            );

            // Try to sign in with Firebase using the AuthContext
            const result = await login(email, values.password);

            // Get a fresh token and make sure it's set in apiClient
            const token = await result.getIdToken();
            console.log("Got Firebase token:", token.substring(0, 10) + "...");

            // Explicitly set the token to ensure it's available for the API call
            setAuthToken(token);
            console.log("Token explicitly set in apiClient");

            // Add a small delay to ensure token is properly set
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log("Firebase sign in successful, storing user data");

            // Store user data using storeUser endpoint
            await storeUser({
              username: userData.username,
              email: userData.email,
              password: values.password,
              account_type: userData.account_type || "free",
              isNew: true,
              isSSO: false,
            });

            console.log("Navigating to email verification page");
            // Navigate to verify email page
            setLoading(true);
            navigate("/verify-email", { state: { token } });
            return;
          }

          // If not in temp_users, we proceed with normal login flow
          // The email input will be used directly
        }

        // Proceed with standard login using AuthContext
        const result = await login(email, values.password);

        // Get a fresh token and make sure it's set in apiClient
        const token = await result.getIdToken();
        console.log("Got Firebase token:", token.substring(0, 10) + "...");

        // Explicitly set the token to ensure it's available for the API call
        setAuthToken(token);
        console.log("Token explicitly set in apiClient");

        // Add a small delay to ensure token is properly set
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Use the loadUserData function from UserContext
        try {
          const userData = await loadUserData(result.uid);
          console.log("User data after login:", userData);

          if (userData?.isNew) {
            setSuccessMessage("Account found successfully!");
            setLoading(true);
            setTimeout(() => {
              navigate("/dashboard/welcome");
            }, 1500);
          } else if (userData && !userData.email_verified) {
            console.log("Email not verified, navigating to verification page");
            setLoading(true);
            navigate("/verify-email", { state: { token } });
          } else if (userData?.account_type === "admin") {
            console.log("Admin user detected, navigating to admin dashboard");
            setLoading(true);
            navigate("/admin/dashboard");
          } else {
            setLoading(true);
            navigate("/dashboard/home");
          }
        } catch (loginError: any) {
          console.error("Error during login user data loading:", loginError);

          // Add this global error handler to catch any unhandled navigation failures
          setLoading(false); // <-- Add this line to ensure loading state is reset

          // Check for specific error messages
          if (loginError.message && loginError.message.includes("not found")) {
            // The user exists in Firebase but not in our database yet
            setSubmitError(
              "Your account exists but needs to be set up. Please complete registration."
            );
            setTimeout(() => {
              navigate("/verify-email", { state: { token } });
            }, 2000);
          } else {
            // For other errors, display the specific error message
            setSubmitError(
              loginError.message || "An error occurred during login"
            );
          }
        }
      } catch (error) {
        handleError(error);
        setLoading(false);
      }
    },
  });

  const googleSubmit = async () => {
    try {
      // Use button-specific loading state instead of the full page loading
      setGoogleButtonLoading(true);

      const account_type = "free";
      const authResult = await handleGoogleAuth(account_type);

      // Load user data using updated UserContext method
      const userData = await loadUserData(authResult.userData.uid);

      // Only now set the full page loading before navigation
      setLoading(true);

      if (authResult.isNewUser) {
        setSuccessMessage("Account created successfully!");
        return setTimeout(() => {
          navigate("/dashboard/welcome");
        }, 1000);
      } else if (userData && !userData.email_verified) {
        return setTimeout(() => {
          navigate("/verify-email", { state: { token: authResult.token } });
        }, 1000);
      } else {
        return setTimeout(() => {
          navigate("/dashboard/home");
        }, 1000);
      }
    } catch (error) {
      handleError(error);
      setGoogleButtonLoading(false); // Make sure to turn off button loading state if there's an error
    } finally {
      // If there was an error and we never went to the next screen, ensure button loading is reset
      setTimeout(() => {
        if (googleButtonLoading) setGoogleButtonLoading(false);
      }, 5000);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <LoadingScreen />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="font-aribau min-h-screen flex items-center justify-center">
        {/* Simple Header */}
        <header className="absolute top-10 left-20 flex items-center">
          <Link to="/" className="flex items-center space-x-4">
            <img src="/duel-learn-logo.svg" className="w-10 h-10" alt="icon" />
            <p className="text-white text-xl font-semibold">Duel Learn</p>
          </Link>
        </header>

        <div className="w-full max-w-md  rounded-lg p-8 shadow-md">
          {/* Heading */}
          <h1 className="text-3xl font-bold text-center text-[#E2DDF3] mb-2">
            Login your Account
          </h1>
          <p className="text-lg text-center text-[#9F9BAE] mb-8">
            Please enter your details to login.
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
          {submitError && (
            <div className="bg-red-700 text-white text-center py-2 mb-4 rounded">
              {submitError}
            </div>
          )}
          {/* Form */}
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="relative mb-4">
              <label htmlFor="username" className="sr-only">
                Username or Email
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your username or email"
                required
                className={`block w-full p-3 rounded-[0.8rem] bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
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

            {/* Password Input */}
            <div className="relative mb-4">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your password"
                required
                className={`block w-full p-3 rounded-[0.8rem] bg-[#3B354D] text-[#9F9BAE] placeholder-gray-500 focus:outline-none focus:ring-2 ${
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
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 mt-1 text-sm">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-[#9F9BAE] hover:text-[#E2DDF3]"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3 text-white bg-[#4D18E8] rounded-[0.8rem] hover:bg-[#3814b6] focus:outline-none focus:ring-4 focus:ring-[#4D18E8]"
            >
              Login
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-grow border-t border-[#9F9BAE]" />
            <span className="mx-2 text-[#9F9BAE]">or</span>
            <hr className="flex-grow border-t border-[#9F9BAE]" />
          </div>

          {/* Google Sign-In */}
          <button
            className="w-full border border-[#4D18E8] bg-[#0F0A18] text-white py-3 rounded-[0.8rem] flex items-center justify-center hover:bg-[#1A1426] transition-colors"
            onClick={googleSubmit}
            disabled={googleButtonLoading} // Disable the button while loading
          >
            {googleButtonLoading ? (
              // Show a spinner with Google colors when loading
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {/* Google-colored spinner */}
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#E8E8E8"
                    strokeWidth="2"
                  ></circle>

                  {/* Blue segment (Google blue) */}
                  <path
                    strokeLinecap="round"
                    strokeWidth="2"
                    stroke="#4285F4"
                    d="M12 2a10 10 0 0 1 10 10"
                  ></path>

                  {/* Red segment (Google red) */}
                  <path
                    strokeLinecap="round"
                    strokeWidth="2"
                    stroke="#EA4335"
                    d="M22 12a10 10 0 0 1-5 8.66"
                  ></path>

                  {/* Yellow segment (Google yellow) */}
                  <path
                    strokeLinecap="round"
                    strokeWidth="2"
                    stroke="#FBBC05"
                    d="M17 20.66A10 10 0 0 1 7 20.66"
                  ></path>

                  {/* Green segment (Google green) */}
                  <path
                    strokeLinecap="round"
                    strokeWidth="2"
                    stroke="#34A853"
                    d="M7 20.66A10 10 0 0 1 2 12"
                  ></path>
                </svg>
                Signing in...
              </div>
            ) : (
              // Show regular button content when not loading
              <>
                <img
                  src="/google-logo.png"
                  className="w-5 h-5 mr-3"
                  alt="Google Icon"
                />
                Log in with Google
              </>
            )}
          </button>

          {/* Footer */}
          <p className="mt-4 text-center text-sm text-[#9F9BAE]">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-[#4D18E8] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
