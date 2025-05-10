import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import useUserData from "../hooks/api.hooks/useUserData";
import { useAuth } from "./AuthContext";
import axios from "axios";
import SocketService from "../services/socketService";

interface User {
  firebase_uid: string;
  username: string | null;
  email: string | null;
  display_picture: string | null;
  full_name: string | null;
  email_verified: boolean;
  isSSO: boolean;
  account_type: "free" | "premium" | "admin";
  account_type_plan: string | null;
  isNew: boolean;
  level: number;
  exp: number;
  mana: number;
  coins: number;
  tech_pass: number;
}

export interface Friend {
  firebase_uid: string;
  exp: number;
  username: string;
  display_picture: string;
  level: number;
}

interface UserContextProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  loadUserData: (firebase_uid: string) => Promise<User | null>;
  updateUser: (updates: Partial<User>) => void;
  clearUserData: () => void;
  loginAndSetUserData: (
    firebase_uid: string,
    token: string
  ) => Promise<User | null>;
  refreshUserData: () => Promise<void>;
  socketConnected: boolean;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  });

  const [loading, setLoading] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const { fetchAndUpdateUserData } = useUserData();
  const auth = useAuth(); // Use the AuthContext

  // Get the socket service instance
  const socketService = SocketService.getInstance();

  // Connect socket using firebase_uid
  const connectSocket = useCallback((userId: string) => {
    console.log("Establishing socket connection for user:", userId);
    try {
      const socket = socketService.connect(userId);

      // Set up connected listener to update status
      const connectedListener = () => {
        console.log("Socket connected successfully");
        setSocketConnected(true);
      };

      // Set up disconnect listener
      const disconnectListener = () => {
        console.log("Socket disconnected");
        setSocketConnected(false);
      };

      socket.on("connected", connectedListener);
      socket.on("disconnect", disconnectListener);

      // Check immediate connection status
      setSocketConnected(socket.connected);

      return () => {
        socket.off("connected", connectedListener);
        socket.off("disconnect", disconnectListener);
      };
    } catch (error) {
      console.error("Failed to establish socket connection:", error);
      return undefined;
    }
  }, []);

  // Clear user data (used when logging out)
  const clearUserData = useCallback(() => {
    // Disconnect socket when logging out
    socketService.disconnect();
    setSocketConnected(false);

    setUser(null);
    localStorage.removeItem("userData");
  }, []);

  // Update the user object and localStorage
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;

      const updatedUser = { ...prevUser, ...updates };

      // Log the update
      console.log("Updating user data:", {
        before: prevUser.account_type,
        after: updates.account_type || prevUser.account_type,
      });

      // Update localStorage
      localStorage.setItem("userData", JSON.stringify(updatedUser));

      return updatedUser;
    });

    // Force an immediate storage sync
    const updatedData = localStorage.getItem("userData");
    console.log("Updated localStorage data:", JSON.parse(updatedData || "{}"));
  }, []);

  // Load user data from the API and connect socket
  const loadUserData = async (firebase_uid: string): Promise<User | null> => {
    if (!firebase_uid) {
      console.error("No firebase_uid provided to loadUserData");
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setLoadAttempts((prev) => prev + 1);
      console.log(`Attempting to load user data for: ${firebase_uid}`);
      console.log("Fetching user data from main database...");

      const userData = await fetchAndUpdateUserData(firebase_uid);
      if (userData) {
        // Cast to User type to ensure it has all required fields
        const typedUserData = userData as User;

        // Update local state and storage
        setUser(typedUserData);
        localStorage.setItem("userData", JSON.stringify(typedUserData));

        // Connect socket after loading user data
        connectSocket(firebase_uid);

        console.log("User data loaded and stored in context");
        return typedUserData;
      }

      // If we get here, no user data was found - check cache as fallback
      const cachedData = localStorage.getItem("userData");
      const parsedData = cachedData ? JSON.parse(cachedData) : null;

      if (parsedData && parsedData.firebase_uid === firebase_uid) {
        console.log("Using cached user data as fallback");
        setUser(parsedData);

        // Connect socket with cached data
        connectSocket(firebase_uid);

        return parsedData;
      }

      return null;
    } catch (error) {
      console.error("Error loading user data:", error);

      // If loading fails, try using cached data as fallback
      const cachedData = localStorage.getItem("userData");
      const parsedData = cachedData ? JSON.parse(cachedData) : null;

      if (parsedData && parsedData.firebase_uid === firebase_uid) {
        console.log("Using cached user data after load error");
        setUser(parsedData);

        // Connect socket with cached data
        connectSocket(firebase_uid);

        return parsedData;
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = useCallback(async (): Promise<void> => {
    if (!auth.currentUser) {
      console.log("Cannot refresh - user not authenticated");
      setLoading(false);
      return;
    }

    const firebase_uid = auth.currentUser.uid;

    try {
      setLoading(true);
      setLoadAttempts((prev) => prev + 1);
      console.log(`Manually refreshing user data for: ${firebase_uid}`);

      // Limit number of retry attempts to prevent endless loading
      if (loadAttempts >= 3) {
        console.log("Max load attempts reached, using cached data");
        const cachedData = localStorage.getItem("userData");
        if (cachedData) {
          setUser(JSON.parse(cachedData));
        }
        setLoading(false);
        return;
      }

      await loadUserData(firebase_uid);
    } catch (error) {
      console.error("Error refreshing user data:", error);

      // If refresh fails, try using cached data
      const cachedData = localStorage.getItem("userData");
      if (cachedData) {
        setUser(JSON.parse(cachedData));
      }
    } finally {
      setLoading(false);
    }
  }, [auth.currentUser, loadAttempts]);

  // Function to handle initial data loading
  const loadData = async () => {
    // Skip loading for static pages
    const staticPages = ["/privacy-policy", "/terms-and-conditions", "/"];
    if (staticPages.some((page) => window.location.pathname.includes(page))) {
      console.log(
        "Skipping API call for static page:",
        window.location.pathname
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user is authenticated
      if (auth.currentUser) {
        // Check if we already have data in localStorage
        const cachedData = localStorage.getItem("userData");
        const parsedData = cachedData ? JSON.parse(cachedData) : null;

        // Use cached data if available and the user ID matches
        if (parsedData && parsedData.firebase_uid === auth.currentUser.uid) {
          console.log("Using cached user data from localStorage");
          setUser(parsedData);

          // On initial mount, refresh in background after a short delay
          setTimeout(() => {
            loadUserData(auth.currentUser!.uid).catch((err) => {
              console.error("Background refresh failed:", err);
            });
          }, 1000);
        } else {
          // No cached data or user ID mismatch, need to load from API
          console.log("No cached data found, loading from API");
          await loadUserData(auth.currentUser.uid);
        }
      }
    } catch (error) {
      console.error("Error in initial data loading:", error);

      // If loading fails, try using cached data
      const cachedData = localStorage.getItem("userData");
      if (cachedData && auth.currentUser) {
        const parsedData = JSON.parse(cachedData);
        if (parsedData.firebase_uid === auth.currentUser.uid) {
          setUser(parsedData);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect to load data when auth state changes
  useEffect(() => {
    if (auth.isLoading) return;

    // Only perform fresh data load on auth state change (login/logout)
    if (auth.currentUser) {
      loadData();
    } else {
      // Clear data on logout
      clearUserData();
      setLoading(false);
    }
  }, [auth.currentUser, auth.isLoading, clearUserData]);

  // Effect to clean up socket connection on unmount
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  const loginAndSetUserData = async (
    firebase_uid: string,
    token: string
  ): Promise<User | null> => {
    console.log(`Login and set user data for ${firebase_uid}`);
    setLoading(true);

    try {
      // Set the token for API call
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Load user data (this also connects the socket)
      const userData = await loadUserData(firebase_uid);
      return userData;
    } catch (error) {
      console.error("Error in loginAndSetUserData:", error);

      // Try to use cached data if available
      const cachedData = localStorage.getItem("userData");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (parsedData.firebase_uid === firebase_uid) {
          setUser(parsedData);

          // Connect socket with cached data
          connectSocket(firebase_uid);

          return parsedData;
        }
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        loadUserData,
        updateUser,
        clearUserData,
        loginAndSetUserData,
        refreshUserData,
        socketConnected,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
