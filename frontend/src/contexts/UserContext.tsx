import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { auth } from "../services/firebase";
import useUserData from "../hooks/api.hooks/useUserData";

interface User {
  firebase_uid: string;
  username: string | null;
  email: string | null;
  display_picture: string | null;
  full_name: string | null;
  email_verified: boolean;
  isSSO: boolean;
  account_type: "free" | "premium" | "admin";
  isNew: boolean;
  level: number;
  exp: number;
  mana: number;
  coins: number;
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
  logout: () => Promise<void>;
  loginAndSetUserData: (firebase_uid: string, token: string) => Promise<User>;
  loading: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

const REFRESH_INTERVAL = 60000; // 1 minute

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  });

  const [loading] = useState(true);
  const { fetchAndUpdateUserData } = useUserData();

  // 🟢 Update user state and localStorage/sessionStorage
  const updateUserState = useCallback((userData: any) => {
    const updatedUser: User = {
      firebase_uid: userData.firebase_uid,
      username: userData.username,
      email: userData.email,
      display_picture: userData.display_picture,
      full_name: userData.full_name || null,
      email_verified: userData.email_verified,
      isSSO: userData.isSSO,
      account_type: userData.account_type || "free",
      isNew: userData.isNew || false,
      level: userData.level || 1,
      exp: userData.exp || 0,
      mana: userData.mana || 200,
      coins: userData.coins || 500,
    };

    setUser((prevUser) => {
      if (JSON.stringify(prevUser) !== JSON.stringify(updatedUser)) {
        localStorage.setItem("userData", JSON.stringify(updatedUser));
        sessionStorage.setItem("userData", JSON.stringify(updatedUser));
        return updatedUser;
      }
      return prevUser;
    });

    return updatedUser;
  }, []);

  // 🔑 Handle login and fetch user data
  const loginAndSetUserData = useCallback(
    async (firebase_uid: string, token: string) => {
      try {
        const userData = await fetchAndUpdateUserData(firebase_uid, token);
        return updateUserState(userData);
      } catch (error) {
        console.error("Error during login and data setup:", error);
        throw error;
      }
    },
    [fetchAndUpdateUserData, updateUserState]
  );

  // 🚪 Logout function
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      setUser(null);
      localStorage.removeItem("userData");
      sessionStorage.removeItem("userData");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  // 🔄 Refresh user data periodically
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(async () => {
        try {
          const token = await auth.currentUser?.getIdToken(true);
          if (token) {
            const userData = await fetchAndUpdateUserData(
              user.firebase_uid,
              token
            );
            updateUserState(userData);
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }, REFRESH_INTERVAL);

      return () => clearInterval(intervalId);
    }
  }, [user, fetchAndUpdateUserData, updateUserState]);

  /*
  // ✅ Auth state listener (alternative approach using Firestore)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            updateUserState(userData);
            localStorage.setItem("userToken", token);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
        }
      } else {
        setUser(null);
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [updateUserState]);
  */

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
        loginAndSetUserData,
        loading,
        updateUser: updateUserState,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
