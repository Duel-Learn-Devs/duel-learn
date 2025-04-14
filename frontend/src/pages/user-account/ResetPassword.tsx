import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { CircularProgress, Modal } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth, db } from "../../services/firebase"; // Adjust the path as needed
import PageTransition from "../../styles/PageTransition";
import sampleAvatar2 from "/images/sampleAvatar2.png"; // Add this import
import useResetPasswordApi from "../../hooks/api.hooks/useResetPasswordApi";
import { setDoc, doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs"; // Add this import
import { socket } from "../../services/socket";
import { useFormik } from "formik";
import * as Yup from "yup";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const [isInvalidModalOpen, setIsInvalidModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetPasswordApi } = useResetPasswordApi();

  const validationSchema = Yup.object({
    newpassword: Yup.string()
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
      .required("Please confirm your password.")
      .oneOf([Yup.ref("newpassword")], "Passwords do not match."),
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const oobCode = queryParams.get("oobCode");
    const firebase_uid = queryParams.get("firebase_uid") || "";

    if (!oobCode) {
      formik.setErrors({ general: "Invalid or missing reset code." });
      setIsInvalidModalOpen(true);
      setLoading(false);
      return;
    }

    console.log(
      "firebase_uid received from location SecurityCode:",
      firebase_uid
    );

    const validateCode = async () => {
      try {
        await verifyPasswordResetCode(auth, oobCode);
      } catch (err) {
        formik.setErrors({ general: "Reset code is invalid or expired." });
        setIsInvalidModalOpen(true);
      } finally {
        setLoading(false);
      }
    };
    validateCode();
  }, [location.search]);

  const formik = useFormik({
    initialValues: {
      newpassword: "",
      confirmPassword: "",
      general: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const queryParams = new URLSearchParams(location.search);
      const oobCode = queryParams.get("oobCode");
      const firebase_uid = queryParams.get("firebase_uid") || "";
      const updated_at = new Date().toISOString();
      const password_hash = await bcrypt.hash(values.newpassword, 10);

      if (!oobCode) {
        formik.setErrors({ general: "Invalid or missing reset code." });
        setIsInvalidModalOpen(true);
        return;
      }

      setLoading(true);

      try {
        const userDocRef = doc(db, "users", firebase_uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isMatch = await bcrypt.compare(
            values.newpassword,
            userData.password_hash
          );
          if (isMatch) {
            formik.setErrors({
              general: "Cannot use old password. Please try again",
            });
            setLoading(false);
            return;
          }
        }

        await confirmPasswordReset(auth, oobCode, values.newpassword);
        await resetPasswordApi(firebase_uid, password_hash, updated_at);

        // Update the user document with new password hash
        const userRef = doc(db, "users", firebase_uid);
        await setDoc(userRef, { updated_at, password_hash }, { merge: true });

        socket.emit("passwordResetSuccess");
        navigate("/password-changed-successfully");
      } catch (err) {
        formik.setErrors({ general: "Failed to Reset Password." });
        console.log(err);
      } finally {
        setLoading(false);
      }
    },
  });

  const togglePassword = () => setShowPassword(!showPassword);
  const toggleConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);
  const handleBacktoLoginClick = () => navigate("/login");

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
          {/* <img
          src={ExitIcon}
          alt="Exit Icon"
          style={{ width: "39px" }}
          className="hover:scale-110 cursor-pointer"
          onClick={handleExitClick}
        /> */}
        </header>

        <div className="w-full max-w-md rounded-lg p-8 shadow-md">
          {/* Heading */}
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            Reset Password
          </h1>
          <p className="text-lg text-center text-[#9F9BAE] mb-8 max-w-[370px] mx-auto break-words">
            Your new password must be different from your previously used
            password.
          </p>

          {/* Error Message Box */}
          {formik.errors.general && (
            <div className="w-full max-w-sm mb-4 px-4 py-2 bg-red-100 text-red-600 rounded-md border border-red-300">
              {formik.errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={formik.handleSubmit}>
            {/* New Password Input */}
            <div className="relative mb-4">
              <input
                id="newpassword"
                type={showPassword ? "text" : "password"}
                name="newpassword"
                placeholder="Enter your password"
                value={formik.values.newpassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#E2DDF3] placeholder-[#9F9BAE] focus:outline-none focus:ring-2 pr-12 ${
                  formik.touched.newpassword && formik.errors.newpassword
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {/* Password Toggle Button */}
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
              {formik.touched.newpassword && formik.errors.newpassword && (
                <p className="text-red-500 mt-1 text-sm">
                  {formik.errors.newpassword}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative mb-4">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#E2DDF3] placeholder-[#9F9BAE] focus:outline-none focus:ring-2 pr-12 ${
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                    ? "border border-red-500 focus:ring-red-500"
                    : "focus:ring-[#4D18E8]"
                }`}
              />
              {/* Confirm Password Toggle Button */}
              <span
                onClick={toggleConfirmPassword}
                className="absolute top-3 right-3 text-[#9F9BAE] cursor-pointer"
              >
                {showConfirmPassword ? (
                  <VisibilityRoundedIcon />
                ) : (
                  <VisibilityOffRoundedIcon />
                )}
              </span>
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <p className="text-red-500 mt-1 text-sm">
                    {formik.errors.confirmPassword}
                  </p>
                )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#4D18E8] text-white py-3 rounded-md hover:bg-[#4D18E8] focus:ring-4 focus:ring-[#4D18E8]"
              disabled={loading} // Disable the button when loading
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" /> // Show the loading spinner
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>

      <Modal
        open={isInvalidModalOpen}
        onClose={() => setIsInvalidModalOpen(false)}
        aria-labelledby="invalid-modal-title"
        aria-describedby="invalid-modal-description"
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
              Invalid or missing reset code.
            </p>
            <button
              type="button"
              className="w-full mt-2 bg-[#4D18E8] text-white py-3 rounded-lg hover:bg-[#6931E0] transition-colors"
              onClick={handleBacktoLoginClick}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default ResetPassword;
