import { useState } from 'react';
import { auth } from '../../services/firebase';
import userService from '../../api/userService';

interface StoreUserData {
  username: string;
  email: string;
  password: string;
  account_type: "free" | "premium" | "admin";
  isNew: boolean;
  isSSO: boolean;
}

interface StoreUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const useStoreUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeUser = async (userData: StoreUserData): Promise<StoreUserResponse> => {
    setIsLoading(true);
    setError(null);
    console.log("=== Starting storeUser request ===");

    try {
      // Ensure we have a current user before proceeding
      if (!auth.currentUser) {
        console.error("No authenticated user found");
        throw new Error('Authentication required: No user is signed in');
      }

      const firebase_uid = auth.currentUser.uid;
      console.log("Current user UID:", firebase_uid);

      // Ensure we have a fresh token before making the request
      try {
        const freshToken = await auth.currentUser.getIdToken(true);
        console.log("Fresh token obtained:", freshToken.substring(0, 10) + "...");
        
        // Explicitly set token in apiClient
        import('../../api/apiClient').then(({ setAuthToken }) => {
          setAuthToken(freshToken);
          console.log("Token explicitly set in apiClient");
        });
        
        // Add small delay to ensure token propagation
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (tokenError) {
        console.error("Failed to refresh token:", tokenError);
        throw new Error('Failed to obtain authentication token. Please try again or log out and back in.');
      }

      // Use userService to store the user data
      console.log(`Calling userService.storeUserData for ${firebase_uid}`);
      const response = await userService.storeUserData(firebase_uid, userData);
      console.log("Store user response:", response);

      return {
        success: true,
        message: response.message || 'User stored successfully'
      };

    } catch (err) {
      console.error("Store user error:", err);
      
      // Provide specific error messages based on the type of error
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check for specific token-related errors
        if (errorMessage.includes('token') || errorMessage.includes('auth')) {
          errorMessage = 'Authentication error: ' + errorMessage;
        }
      }
      
      // Handle axios errors specifically
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        if (axiosErr.response?.status === 401) {
          errorMessage = 'Authentication failed: No valid token provided';
        }
        
        if (axiosErr.response?.data?.error) {
          errorMessage = axiosErr.response.data.error;
        }
      }
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
      console.log("=== End storeUser request ===");
    }
  };

  return {
    storeUser,
    isLoading,
    error
  };
}; 