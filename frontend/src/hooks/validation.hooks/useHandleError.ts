import { useState } from "react";

const useHandleError = () => {
  const [error, setError] = useState(""); // State for handling errors

  const handleLoginError = (error: any) => {
    console.error("Login error:", error);

    const errorMessages: { [key: string]: string } = {
      "auth/invalid-email":
        "User not Found. Please enter a valid email or username.",
      "auth/email-already-in-use":
        "This email is already registered. Try logging in.",
      "auth/user-not-found": "No account found with this email. Sign up first.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/weak-password": "Your password must be at least 6 characters long.",
      "auth/too-many-requests": "Too many failed attempts. Try again later.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/requires-recent-login": "Please log in again to continue.",
      "auth/operation-not-allowed": "This authentication method is disabled.",
      "auth/missing-email": "Please enter an email address.",
      "auth/missing-password": "Please enter a passwords.",
      "auth/invalid-credential":
        "Invalid credentials. Please check your details.",
      "auth/account-exists-with-different-credential":
        "This email is linked to another sign-in method. Try using Google or Facebook login.",
        
    };

    // Set a friendly error message or fallback to Firebase's default message
    setError(
      errorMessages[error.code] ||
        "An unknown error occurred. Please try again."
    );
  };

  return { error, handleLoginError, setError };
};

export default useHandleError;