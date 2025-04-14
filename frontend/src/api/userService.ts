import apiClient from "./apiClient";
import { auth } from "../services/firebase";

/**
 * User API service - contains methods for user-related API operations.
 * This service uses the centralized apiClient which handles authentication tokens.
 */
export const userService = {
  /**
   * Get the current user's profile information
   */
  getCurrentUserInfo: async (firebase_uid: string) => {
    try {
      const response = await apiClient.get(`/user/info/${firebase_uid}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      throw error;
    }
  },

  /**
   * Update user profile information
   */
  updateUserProfile: async (data: {
    firebase_uid: string;
    username?: string;
    newpassword?: string;
    display_picture?: string;
  }) => {
    try {
      const response = await apiClient.post("/user/update-user-details", data);
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  /**
   * Delete the user's account
   */
  deleteAccount: async (firebase_uid: string) => {
    try {
      const response = await apiClient.delete("/user/delete-account", {
        data: { firebase_uid },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  },

  /**
   * Store temporary user data during signup process
   */
  storeUserData: async (firebase_uid: string, userData: any) => {
    try {
      // Log the request details for debugging
      console.log(`Storing user data for ID: ${firebase_uid}`);
      console.log("Request URL:", `/user/store-user/${firebase_uid}`);

      // Ensure we have an authenticated user
      if (!auth.currentUser) {
        console.error("No authenticated user found for storeUserData");
        throw new Error("Authentication required: No user is signed in");
      }

      // Try to get a fresh token with retry logic
      let currentToken;
      let retries = 0;
      const MAX_RETRIES = 3;

      while (!currentToken && retries < MAX_RETRIES) {
        try {
          // Force refresh the token
          currentToken = await auth.currentUser.getIdToken(true);
          console.log(
            `Got token on attempt ${retries + 1}: ${currentToken.substring(
              0,
              10
            )}...`
          );
        } catch (tokenError) {
          console.error(
            `Token retrieval attempt ${retries + 1} failed:`,
            tokenError
          );
          retries++;
          // Wait a bit longer between retries
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }

      if (!currentToken) {
        console.error(
          "Failed to retrieve authentication token after multiple attempts"
        );
        throw new Error("Failed to obtain authentication token");
      }

      // Make the request with explicit token in headers
      console.log(
        `Making API request with token: ${currentToken.substring(0, 10)}...`
      );

      // Filter userData to only include fields expected by the backend validation schema
      const filteredUserData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        account_type: userData.account_type,
      };

      console.log("Filtered user data for API request:", {
        ...filteredUserData,
        password: "***", // Mask password in logs
      });

      const response = await apiClient.post(
        `/user/store-user/${firebase_uid}`,
        filteredUserData,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      console.log("Store user data response:", response.status);
      return response.data;
    } catch (error) {
      console.error("Error storing user data:", error);
      throw error;
    }
  },

  /**
   * Retrieve stored temporary user data
   */
  getStoredUserData: async (firebase_uid: string) => {
    try {
      const response = await apiClient.get(`/user/store-user/${firebase_uid}`);
      return response.data;
    } catch (error) {
      console.error("Error getting stored user data:", error);
      throw error;
    }
  },
};

export default userService;
