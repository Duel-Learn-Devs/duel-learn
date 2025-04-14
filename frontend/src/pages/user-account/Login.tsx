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
            setTimeout(() => {
              setLoading(true);
              navigate("/dashboard/welcome");
            }, 1500);
          } else if (userData && !userData.email_verified) {
            console.log("Email not verified, navigating to verification page");
            setLoading(true);
            navigate("/verify-email", { state: { token } });
          } else {
            console.log("Email verified, navigating to dashboard");

            // Check if user is admin and handle special redirection
            if (userData?.account_type === "admin") {
              console.log("Admin user detected, navigating to admin dashboard");
              setLoading(true);
              navigate("/admin/dashboard");
            } else {
              setLoading(true);
              navigate("/dashboard/home");
            }
          }
        } catch (loginError: any) {
          console.error("Error during login user data loading:", loginError);

          // Check for specific error messages
          if (loginError.message && loginError.message.includes("not found")) {
            // The user exists in Firebase but not in our database yet
            setSubmitError(
              "Your account exists but needs to be set up. Please complete registration."
            );

            // Redirect to verify email page to continue registration process
            setTimeout(() => {
              navigate("/verify-email", { state: { token } });
            }, 2000);
          } else {
            // For other errors, display the specific error message
            setSubmitError(
              loginError.message || "An error occurred during login"
            );
            setLoading(false);
          }
        }
      } catch (error) {
        handleError(error);
        setLoading(false);
      }
    },
  });

  const googleSubmit = async () => {
    setLoading(true);
    try {
      const account_type = "free";
      const authResult = await handleGoogleAuth(account_type);

      // Load user data using updated UserContext method
      const userData = await loadUserData(authResult.userData.uid);

      if (authResult.isNewUser) {
        setSuccessMessage("Account created successfully!");
        setTimeout(() => {
          setLoading(true);
          navigate("/dashboard/welcome");
        }, 1500);
      } else if (userData && !userData.email_verified) {
        setLoading(true);
        navigate("/verify-email", { state: { token: authResult.token } });
      } else {
        setLoading(true);
        navigate("/dashboard/home");
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
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
        <header className="absolute top-20 left-20 flex items-center">
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
              className="w-full py-3 text-white bg-[#4D18E8] rounded-lg hover:bg-[#3814b6] focus:outline-none focus:ring-4 focus:ring-[#4D18E8]"
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
            className="w-full border border-[#4D18E8] bg-[#0F0A18] text-white py-3 rounded-lg flex items-center justify-center hover:bg-[#1A1426] transition-colors"
            onClick={googleSubmit}
          >
            <img
              src="/google-logo.png"
              className="w-5 h-5 mr-3"
              alt="Google Icon"
            />
            Log in with Google
          </button>

          {/* Footer */}
          <p className="mt-4 text-center text-sm text-[#9F9BAE]">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-[#4D18E8] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
