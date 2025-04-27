import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { auth } from "../services/firebase";
import { User as FirebaseUser, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// Define the interface for our authentication context
interface AuthContextProps {
  currentUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<FirebaseUser>;
  resetPassword: (email: string) => Promise<void>;
  getToken: () => Promise<string | null>;
}

// Create the context with undefined initial value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
  const [error, setError] = useState<string | null>(null);

  // Login function
  const login = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);
      setToken(token);
      return userCredential.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Signup function
  const signup = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);
      setToken(token);
      return userCredential.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      setToken(null);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Reset password function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Get token function - useful for making authenticated API calls
  const getToken = async (): Promise<string | null> => {
    try {
      if (currentUser) {
        console.log('🔐 Getting fresh token for user:', currentUser.uid);
        const token = await currentUser.getIdToken(true);
        console.log(`✅ Token obtained: ${token.substring(0, 10)}...`);
        localStorage.setItem("authToken", token);
        setToken(token);
        return token;
      } else {
        console.warn('⚠️ Cannot get token - no current user');
      }
      return null;
    } catch (error: any) {
      console.error('❌ Error getting token:', error);
      setError(error.message);
      return null;
    }
  };

  // Set up auth state listener
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setIsLoading(true);
        
        if (user) {
          console.log("User is authenticated:", user.uid);
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          // Get fresh token
          const token = await user.getIdToken(true);
          localStorage.setItem("authToken", token);
          setToken(token);
        } else {
          console.log("No authenticated user");
          setCurrentUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("authToken");
          setToken(null);
        }
      } catch (error) {
        console.error("Error in auth state listener:", error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Provide auth context value
  const value: AuthContextProps = {
    currentUser,
    isAuthenticated,
    isLoading,
    token,
    error,
    login,
    logout,
    signup,
    resetPassword,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
