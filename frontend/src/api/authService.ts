import apiClient from "./apiClient";

/**
 * Auth API service - contains methods for authentication-related API operations.
 * This service uses the centralized apiClient which handles authentication tokens.
 */
export const authService = {
  /**
   * Completes the sign-up process by storing the user data in the backend
   */
  signUpUser: async (userData: {
    username: string;
    email: string;
    password: string;
    email_verified: boolean;
    isSSO: boolean;
    account_type: "free" | "premium" | "admin";
  }) => {
    try {
      const response = await apiClient.post("/user/sign-up", userData);
      return response.data;
    } catch (error) {
      console.error("Error during sign up:", error);
      throw error;
    }
  },

  /**
   * Updates the email verification status in the backend
   */
  updateEmailVerified: async (data: {
    firebase_uid: string;
    email_verified: boolean;
    updated_at: string;
  }) => {
    try {
      const response = await apiClient.post(
        "/user/update-email-verified",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating email verification status:", error);
      throw error;
    }
  },

  /**
   * Resets the user's password in the backend
   */
  resetPassword: async (data: {
    firebase_uid: string;
    password_hash: string;
    updated_at: string;
  }) => {
    try {
      const response = await apiClient.post("/user/reset-password", data);
      return response.data;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  },
};

export default authService;
