import { useState } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"; // Import Firestore methods

const usernameValidation = (value: string) => {
  if (!value) {
    return "Username is required.";
  } else if (value.length < 8) {
    return "Username must be at least 8 characters.";
  } else if (value.length > 20) {
    return "Username cannot exceed 20 characters.";
  } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return "Username can only contain alphanumeric characters and underscores.";
  }
  return "";
};

const checkUsernameUnique = async (username: string, currentUserId: string) => {
  const db = getFirestore();
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return true;
  }
  const userDoc = querySnapshot.docs[0];
  return userDoc.id === currentUserId;
};

const useEditUsernameValidation = (formData: any, currentUserId: string) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = async (field: string, value: string) => {
    let error = "";

    if (field === "username") {
      error = usernameValidation(value);
      if (!error) {
        const isUnique = await checkUsernameUnique(value, currentUserId);
        if (!isUnique) {
          error = "Username is taken.";
        }
      }
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    return error;
  };

  return { errors, validate };
};

export default useEditUsernameValidation;
