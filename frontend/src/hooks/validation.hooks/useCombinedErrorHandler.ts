import { useState } from "react";
import useFirebaseError from "./useFirebaseError";
import useNetworkError from "./useNetworkError";
import useSQLError from "./useSQLError";
import { auth, db } from "../../services/firebase";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";

const useCombinedErrorHandler = () => {
  const { error: firebaseError, handleFirebaseError } = useFirebaseError();
  const { error: networkError, handleNetworkError } = useNetworkError();
  const { error: sqlError, handleSQLError } = useSQLError();
  const [combinedError, setCombinedError] = useState<string | null>(null);

  const handleError = (error: any) => {
    if (error.code && error.code.startsWith("auth/")) {
      handleFirebaseError(error);
      setCombinedError(error.message);
    } else if (error.code && error.code.startsWith("ERR_")) {
      handleNetworkError(error);
      setCombinedError(error.message);
    } else if (error.code && error.code.startsWith("ER_")) {
      handleSQLError(error);
      setCombinedError(error.message);
    } else if (error.code === "ER_DUP_ENTRY") {
      handleSQLError(error);
      setCombinedError("Duplicate entry for a key.");
    } else {
      console.error("Unknown error:", error);
      setCombinedError("Registration Failed. Please try again.");
    }

    if (auth.currentUser) {
      deleteUser(auth.currentUser);
      deleteDoc(doc(db, "users", auth.currentUser.uid));
    }
  };

  return { firebaseError, networkError, sqlError, combinedError, handleError };
};

export default useCombinedErrorHandler;
