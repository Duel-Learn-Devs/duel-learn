import { useState } from "react";
import { auth } from "../../services/firebase";
import userService from "../../api/userService";
import authService from "../../api/authService";

interface SignUpResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const useSignUpApi = () => {
  const [apiError, setApiError] = useState<string | null>(null);

  const signUpApi = async (
    firebase_uid: string,
    isNew: boolean,
    email_verified: boolean
  ): Promise<SignUpResponse> => {
    try {
      if (!auth.currentUser) throw new Error("No current user found");

      console.log("SignUpApi received params:", {
        firebase_uid,
        isNew,
        email_verified,
        currentUserEmail: auth.currentUser?.email,
        currentUserVerified: auth.currentUser?.emailVerified
      });

      // 1. Get stored user data
      const storedUserData = await userService.getStoredUserData(firebase_uid);
      console.log("Stored user data:", storedUserData);
      
      // 2. Verify data consistency
      if (!auth.currentUser?.email || storedUserData.user.email !== auth.currentUser.email) {
        throw new Error("User data verification failed");
      }

      // 3. Create account in database using combined information
      try {
        // Get current username from stored data
        const userData = {
          firebase_uid,
          username: storedUserData.user.username,
          email: storedUserData.user.email,
          password: storedUserData.user.password,
          account_type: storedUserData.user.account_type,
          email_verified,
          updated_at: new Date().toISOString(),
          isSSO: auth.currentUser.providerData[0]?.providerId === "google.com",
        };

        // Use authService for sign up
        const result = await authService.signUpUser(userData);
        
        return {
          success: true,
          message: result.message || "User signed up successfully"
        };
      } catch (error: any) {
        console.error("Error in sign up API:", error);
        setApiError(error.message);
        return {
          success: false,
          error: error.message
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setApiError(message);
      throw error;
    }
  };

  return { signUpApi, apiError };
};

export default useSignUpApi;