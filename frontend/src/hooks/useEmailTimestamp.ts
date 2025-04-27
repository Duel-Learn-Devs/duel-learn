import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

const useEmailTimestamp = (email: string, firebase_uid?: string) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const checkTimestamp = async () => {
    try {
      if (firebase_uid) {
        // Try to get timestamp from Firestore first
        const userDoc = await getDoc(doc(db, "temp_users", firebase_uid));
        const firestoreTimestamp = userDoc.data()?.emailTimestamp;
        
        if (firestoreTimestamp) {
          const timestampDate = firestoreTimestamp.toDate();
          const now = new Date();
          const elapsed = now.getTime() - timestampDate.getTime();
          const remaining = 5 * 60 * 1000 - elapsed; // 5 minutes

          if (remaining > 0) {
            setTimeRemaining(remaining);
            setIsButtonDisabled(true);
            return false;
          }
        }
      }

      // Fallback to localStorage if Firestore check fails or user not found
      const localTimestamp = localStorage.getItem("emailTimestamp");
      if (localTimestamp) {
        const timestampDate = new Date(localTimestamp);
        const now = new Date();
        const elapsed = now.getTime() - timestampDate.getTime();
        const remaining = 5 * 60 * 1000 - elapsed;

        if (remaining > 0) {
          setTimeRemaining(remaining);
          setIsButtonDisabled(true);
          return false;
        }
      }

      setIsButtonDisabled(false);
      return true;
    } catch (error) {
      console.error("Error checking timestamp:", error);
      // Fallback to localStorage on error
      return checkLocalTimestamp();
    }
  };

  const checkLocalTimestamp = () => {
    const localTimestamp = localStorage.getItem("emailTimestamp");
    if (localTimestamp) {
      const timestampDate = new Date(localTimestamp);
      const now = new Date();
      const elapsed = now.getTime() - timestampDate.getTime();
      const remaining = 5 * 60 * 1000 - elapsed;

      if (remaining > 0) {
        setTimeRemaining(remaining);
        setIsButtonDisabled(true);
        return false;
      }
    }
    setIsButtonDisabled(false);
    return true;
  };

  useEffect(() => {
    checkTimestamp();
  }, [email, firebase_uid]);

  useEffect(() => {
    if (timeRemaining !== null) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            clearInterval(interval);
            setIsButtonDisabled(false);
            return null;
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  return { timeRemaining, isButtonDisabled, checkTimestamp };
};

export default useEmailTimestamp;
