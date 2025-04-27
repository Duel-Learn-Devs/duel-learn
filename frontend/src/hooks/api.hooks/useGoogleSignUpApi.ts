import { useState } from "react";
import { auth } from "../../services/firebase";
import { updateProfile } from "firebase/auth";
import { generateUniqueUsername } from "../../utils/usernameGenerator";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

interface GoogleSignUpResponse {
  message: string;
  firebase_uid: string;
}

export class GoogleSignUpError extends Error {
  constructor(
    message: string,
    public readonly code: 'EMAIL_IN_USE' | 'AUTH_ERROR' | 'API_ERROR' | 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'GoogleSignUpError';
  }
}

const useGoogleSignUpApi = () => {
  const [apiError, setApiError] = useState<GoogleSignUpError | null>(null);

  const checkEmailUniqueness = async (email: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking email uniqueness:", error);
      throw new GoogleSignUpError(
        "Failed to verify email uniqueness",
        'API_ERROR'
      );
    }
  };

  const googleSignUpApi = async (
    firebase_uid: string,
    displayName: string | undefined | null,
    email: string | undefined | null,
    emailVerified: boolean,
    metadata: { creationTime: string | null; lastSignInTime: string | null },
    account_type: "free" | "premium" | "admin"
  ): Promise<GoogleSignUpResponse> => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new GoogleSignUpError(
          "No authentication token available",
          'AUTH_ERROR'
        );
      }

      // Check email uniqueness
      if (email) {
        const isEmailUnique = await checkEmailUniqueness(email);
        if (!isEmailUnique) {
          throw new GoogleSignUpError(
            "This email is already registered. Please sign in instead.",
            'EMAIL_IN_USE'
          );
        }
      }

      // Generate unique username
      const username = await generateUniqueUsername(displayName, email);
      const isNew = metadata.creationTime === metadata.lastSignInTime;

      console.log("Google Sign Up - Pre-profile update:", {
        username,
        isNew,
        emailVerified,
        metadata
      });

      // Update Firebase profile with the generated username
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: username
          });
          console.log("Updated Firebase profile with username:", username);
        } catch (error) {
          console.error("Error updating profile displayName:", error);
          // Continue with sign up even if profile update fails
        }
      }

      // Prepare data for backend API
      const signUpData = {
        username,
        email: email || '',
        password: 'N/A',  // For SSO users
        email_verified: Boolean(emailVerified),  // Ensure boolean
        isSSO: true,  // Explicitly set as boolean
        uid: firebase_uid,
        account_type
      };

      console.log("GoogleSignUpApi preparing request:", {
        ...signUpData,
        password: '[HIDDEN]',
        token: token ? 'present' : 'missing',
        currentUser: auth.currentUser ? 'present' : 'missing'
      });

      // Then sign up the user
      const signUpResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/sign-up`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(signUpData),  // Send data as is, isSSO is already true
        }
      );

      if (!signUpResponse.ok) {
        const errorData = await signUpResponse.json();
        throw new GoogleSignUpError(
          errorData.error || "Failed to sign up user",
          'API_ERROR'
        );
      }

      const responseData = await signUpResponse.json();
      console.log("Google sign-up response:", responseData);
      setApiError(null);
      
      return responseData;
    } catch (error) {
      if (error instanceof GoogleSignUpError) {
        setApiError(error);
        throw error;
      }
      
      const genericError = new GoogleSignUpError(
        error instanceof Error ? error.message : "An unexpected error occurred",
        'UNKNOWN_ERROR'
      );
      setApiError(genericError);
      throw genericError;
    }
  };

  return { googleSignUpApi, apiError };
};

export default useGoogleSignUpApi;