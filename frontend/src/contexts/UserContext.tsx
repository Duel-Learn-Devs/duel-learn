import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

interface User {
  firebase_uid: string;
  username: string | null;
  email: string | null;
  display_picture: string | null;
  full_name: string | null;
  email_verified: boolean;
  isSSO: boolean;
  account_type: 'free' | 'premium' |'admin';
}

interface UserContextProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          localStorage.setItem("userToken", token); // Store token
          localStorage.setItem("userData", JSON.stringify(userData));
        }
      } else {
        setUser(null);
        localStorage.removeItem("userToken"); // Remove token
        localStorage.removeItem("userData");
      }
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
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
