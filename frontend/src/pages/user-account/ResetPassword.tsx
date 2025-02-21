import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  CircularProgress,
  Modal,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../../services/firebase"; // Adjust the path as needed
import usePasswordValidation from "../../hooks/validation.hooks/usePasswordValidation";
import PageTransition from "../../styles/PageTransition";
import sampleAvatar2 from "../../assets/images/sampleAvatar2.png"; // Add this import
import useResetPasswordApi from "../../hooks/api.hooks/useResetPasswordApi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const [isInvalidModalOpen, setIsInvalidModalOpen] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const oobCode = queryParams.get("oobCode");
    const firebase_uid = queryParams.get("firebase_uid") || "";

    if (!oobCode) {
      setError({ general: "Invalid or missing reset code." });
      setIsInvalidModalOpen(true);
      setLoading(false);
      return;
    }

    console.log("firebase_uid received from location SecurityCode:", firebase_uid);

    const validateCode = async () => {
      try {
        await verifyPasswordResetCode(auth, oobCode);
      } catch (err) {
        setError({ general: "Reset code is invalid or expired." });
        setIsInvalidModalOpen(true);
      } finally {
        setLoading(false);
      }
    };
    validateCode();
  }, [location.search]);

  const [formData, setFormData] = useState({
    newpassword: "", // Only password is used here
    confirmPassword: "", // New field for confirming password
  });


  const { errors, validatePassword, validatePasswordForm } = usePasswordValidation();

  const [loading, setLoading] = useState(false); // Loading state for the submit button

  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for toggling confirm password visibility
  const togglePassword = () => {
    setShowPassword(!showPassword); // Toggle password visibility
  };
  const toggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword); // Toggle confirm password visibility
  };

  const [error, setError] = useState({ general: "" }); // For general errors

  const { resetPasswordApi } = useResetPasswordApi();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { newpassword, confirmPassword } = formData;

    const formIsValid = validatePasswordForm({
      newpassword,
      confirmPassword,
    }, "newpassword");

    if (!formIsValid) {
      return;
    }

    setLoading(true); // Start loading spinner

    const queryParams = new URLSearchParams(location.search);
    const oobCode = queryParams.get("oobCode");
    const firebase_uid = queryParams.get("firebase_uid") || "";

    if (!oobCode) {
      setError({ general: "Invalid or missing reset code." });
      setIsInvalidModalOpen(true);
      setLoading(false);
      return;
    }

    console.log("firebase_uid received from location SecurityCode:", firebase_uid);

    try {
      await confirmPasswordReset(auth, oobCode, newpassword);
      await resetPasswordApi(firebase_uid, newpassword);
      console.log(firebase_uid, newpassword) // Call the backend API to update the password hash
      alert("Password successfully reset!");
      navigate("/login");
    } catch (err) {
      setError({ general: "Failed to Reset Password." });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Update the input value

    setFormData((prevData) => {
      const updatedData = { ...prevData, [field]: value };
      // Validate the field on change
      validatePassword(field, value, updatedData, "newpassword");
      return updatedData;
    });

    // Clear the general error when typing in either field
    setError({ general: "" });
  };

  const handleExitClick = () => {
    navigate("/"); // Navigate to home when the exit icon is clicked
  };

  const handleBacktoLoginClick = () => {
    navigate("/login"); // Navigate to login when the button is clicked
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
          {error.general && (
            <div className="w-full max-w-sm mb-4 px-4 py-2 bg-red-100 text-red-600 rounded-md border border-red-300">
              {error.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* New Password Input */}
            <div className="relative mb-4">
              <input
                id="password-field"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                required
                value={formData.newpassword}
                onChange={(e) => handleInputChange("newpassword", e.target.value)}
                onCopy={(e) => e.preventDefault()} // Disable copy
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#E2DDF3] placeholder-[#9F9BAE] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] pr-12 ${
                  errors.newpassword ? "border border-red-500" : ""
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
              {errors.newpassword && (
                <p className="text-red-500 mt-1 text-sm">{errors.newpassword}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative mb-4">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password-field"
                name="confirmPassword"
                placeholder="Confirm your password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                className={`block w-full p-3 rounded-lg bg-[#3B354D] text-[#E2DDF3] placeholder-[#9F9BAE] focus:outline-none focus:ring-2 focus:ring-[#4D18E8] pr-12 ${
                  errors.confirmPassword ? "border border-red-500" : ""
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
              {errors.confirmPassword && (
                <p className="text-red-500 mt-1 text-sm">
                  {errors.confirmPassword}
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