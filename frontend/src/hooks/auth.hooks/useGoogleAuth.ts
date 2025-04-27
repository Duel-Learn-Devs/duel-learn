import { useState } from "react";
import { signInWithPopup, browserPopupRedirectResolver, deleteUser } from "firebase/auth";
import {
  auth,
  googleProvider,
} from "../../services/firebase";
import useGoogleSignUpApi, { GoogleSignUpError } from "../api.hooks/useGoogleSignUpApi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'EMAIL_IN_USE' | 'AUTH_ERROR' | 'API_ERROR' | 'POPUP_CLOSED' | 'POPUP_BLOCKED' | 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

interface AuthResult {
  token: string;
  isNewUser: boolean;
  emailVerified: boolean;
  userData: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
}

const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const { googleSignUpApi } = useGoogleSignUpApi();

  const checkUserExists = async (email: string | null): Promise<boolean> => {
    if (!email) return false;
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleGoogleAuth = async (account_type: "free" | "premium" | "admin"): Promise<AuthResult> => {
    setLoading(true);
    try {
      // 1. Attempt Google Sign In
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      const token = await result.user.getIdToken();

      // 2. Check if user exists in our database
      const userExists = await checkUserExists(result.user.email);
      const isNewUser = !userExists;

      // 3. If new user, create account through googleSignUpApi
      if (isNewUser) {
        try {
          await googleSignUpApi(
            result.user.uid,
            result.user.displayName ?? null,
            result.user.email ?? null,
            result.user.emailVerified,
            {
              creationTime: result.user.metadata.creationTime ?? null,
              lastSignInTime: result.user.metadata.lastSignInTime ?? null
            },
            account_type
          );
        } catch (error) {
          // If account creation fails, sign out and throw error
          if (auth.currentUser) {
            try {
              await deleteUser(auth.currentUser);
            } catch (deleteError) {
              console.error("Error deleting user from Firebase:", deleteError);
            }
          }
          if (error instanceof GoogleSignUpError) {
            throw new GoogleAuthError(error.message, error.code === 'EMAIL_IN_USE' ? 'EMAIL_IN_USE' : 'API_ERROR');
          }
          throw error;
        }
      }

      // 4. Return authentication result
      return {
        token,
        isNewUser,
        emailVerified: result.user.emailVerified,
        userData: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
        }
      };

    } catch (error: any) {
      // Handle specific Google Sign-In errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new GoogleAuthError('Sign-in cancelled. Please try again.', 'POPUP_CLOSED');
      } else if (error.code === 'auth/popup-blocked') {
        throw new GoogleAuthError('Pop-up blocked by browser. Please enable pop-ups for this site.', 'POPUP_BLOCKED');
      } else if (error instanceof GoogleAuthError) {
        throw error;
      } else {
        throw new GoogleAuthError(
          error.message || 'An unexpected error occurred',
          'UNKNOWN_ERROR'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return { handleGoogleAuth, loading };
};

export default useGoogleAuth; 