import { useState, useEffect } from "react";
import { linkWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import useUpdateUserDetailsApi from "./api.hooks/useUpdateUserDetailsApi";
import { useUser } from "../contexts/UserContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import { clearProfileCache } from "../pages/dashboard/profile/ProfileHeader";

const useAccountSettings = () => {
  const { user, setUser } = useUser();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isCreatingPassword, setIsCreatingPassword] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const { updateUserDetailsApi } = useUpdateUserDetailsApi();
  const [error, setError] = useState({ general: "" });
  const [hasNoPassword, setHasNoPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Track changes for each field
  const [changedFields, setChangedFields] = useState({
    username: false,
    display_picture: false,
    password: false,
  });

  // Validation Schema
  const validationSchema = Yup.object({
    username: Yup.string()
      .required("Username is required")
      .min(2, "Username must be at least 2 characters")
      .max(30, "Username must be at most 30 characters")
      .matches(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    newpassword: Yup.string().when([], {
      is: () => isChangingPassword || isCreatingPassword,
      then: (schema) =>
        schema
          .required("Password is required")
          .min(8, "Password must be at least 8 characters")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
          ),
      otherwise: (schema) => schema,
    }),
    confirmPassword: Yup.string().when([], {
      is: () => isChangingPassword || isCreatingPassword,
      then: (schema) =>
        schema
          .required("Please confirm your password")
          .oneOf([Yup.ref("newpassword")], "Passwords must match"),
      otherwise: (schema) => schema,
    }),
  });

  // Check if username exists in Firestore
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      // Query Firestore for documents with matching username
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      // If no documents found, username is available
      if (querySnapshot.empty) {
        return false;
      }

      // If username exists, check if it belongs to current user
      let belongsToCurrentUser = false;
      querySnapshot.forEach((doc) => {
        if (doc.id === user?.firebase_uid) {
          belongsToCurrentUser = true;
        }
      });

      // If username belongs to current user, it's not a conflict
      return !belongsToCurrentUser;
    } catch (error) {
      console.error("Error checking username:", error);
      return false; // Assume no conflict in case of error
    }
  };

  interface FormValues {
    username: string;
    newpassword: string;
    confirmPassword: string;
    display_picture: string;
  }
  const formik = useFormik<FormValues>({
    initialValues: {
      username: user?.username || "",
      newpassword: "",
      confirmPassword: "",
      display_picture: user?.display_picture || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values: FormValues): Promise<void> => {
      setIsLoading(true);
      setError({ general: "" });

      try {
        // Check if username is being changed and verify it's not taken
        if (changedFields.username && values.username !== user?.username) {
          const usernameExists: boolean = await checkUsernameExists(
            values.username
          );
          if (usernameExists) {
            setError({ general: "Username already taken by another user" });
            setIsLoading(false);
            return;
          }
        }

        // Only check password if it's being changed
        if (changedFields.password) {
          const userDoc = await getDoc(doc(db, "users", user!.firebase_uid));
          if (userDoc.exists()) {
            const userDataFromDb = userDoc.data();
            if (values.newpassword) {
              const isMatch: boolean = await bcrypt.compare(
                values.newpassword,
                userDataFromDb.password_hash
              );
              if (isMatch) {
                setError({
                  general: "Cannot use old password. Please try again",
                });
                setIsLoading(false);
                return;
              }
            }
          }

          if (isCreatingPassword) {
            const credential = EmailAuthProvider.credential(
              user!.email!,
              values.newpassword
            );
            await linkWithCredential(auth.currentUser!, credential);
            console.log("Password linked successfully");
          }
        }

        // Only update display picture in Firestore if it changed
        if (changedFields.display_picture) {
          await updateDoc(doc(db, "users", user!.firebase_uid), {
            display_picture: values.display_picture,
            updated_at: new Date(),
          });
        }

        // Update user details through API only for changed fields
        await updateUserDetailsApi(
          user!.firebase_uid,
          changedFields.username ? values.username : undefined,
          changedFields.password ? values.newpassword : undefined,
          changedFields.display_picture ? values.display_picture : undefined
        );

        console.log("User details saved successfully");
        const updatedUserData = {
          ...user!,
          ...(changedFields.username && { username: values.username }),
          ...(changedFields.display_picture && {
            display_picture: values.display_picture,
          }),
        };
        setUser(updatedUserData);
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
        sessionStorage.setItem("userData", JSON.stringify(updatedUserData));

        // Add this line to clear the profile cache
        clearProfileCache();

        // Add this after successful user update
        if (changedFields.username) {
          try {
            await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/study-material/update-creator`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  created_by: values.username,
                  created_by_id:
                    user?.firebase_uid || localStorage.getItem("firebase_uid"),
                }),
              }
            );

            await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/study-material/top-picks?timestamp=${Date.now()}`
            );
          } catch (error) {
            console.error(
              "Failed to update study materials with new username",
              error
            );
          }
        }

        // Add this code inside the try block, after the updateUserDetailsApi call at approximately line 105
        if (changedFields.username && values.username !== user?.username) {
          try {
            console.log(
              "Updating study materials with new username:",
              values.username
            );
            // Update study materials with the new username
            await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/study-material/update-creator`,
              {
                method: "POST", // Correct method
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  created_by: values.username,
                  created_by_id:
                    user?.firebase_uid || localStorage.getItem("firebase_uid"),
                }),
              }
            );

            // Force refresh the caches
            await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/study-material/top-picks?timestamp=${Date.now()}`
            );
          } catch (error) {
            console.error(
              "Failed to update study materials with new username:",
              error
            );
          }
        }

        // Reset all states
        setIsEditing(false);
        setIsChangingPassword(false);
        setIsCreatingPassword(false);
        setChangedFields({
          username: false,
          display_picture: false,
          password: false,
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error updating user details:", error);
        setError({ general: "Error updating user details. Please try again." });
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    if (user) {
      formik.setValues({
        username: user.username || "",
        newpassword: "",
        confirmPassword: "",
        display_picture: user.display_picture || "",
      });
      // Reset change tracking when user data is loaded
      setChangedFields({
        username: false,
        display_picture: false,
        password: false,
      });
    }
  }, [user]);

  useEffect(() => {
    // Check if the user has no password by checking both isSSO and checking
    // if they've previously created a password
    const checkPasswordStatus = async () => {
      if (!user) return;

      try {
        // Only check Firestore if the user is an SSO user
        if (user.isSSO) {
          const userDoc = await getDoc(doc(db, "users", user.firebase_uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // If password_hash exists, the user has already set a password
            setHasNoPassword(!userData.password_hash);
          } else {
            setHasNoPassword(true);
          }
        } else {
          // Non-SSO users always have a password
          setHasNoPassword(false);
        }
      } catch (error) {
        console.error("Error checking password status:", error);
        // Default to assuming user has no password if check fails
        setHasNoPassword(user.isSSO || false);
      }
    };

    checkPasswordStatus();
  }, [user]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDiscardClick = () => {
    setIsLoading(true);
    formik.resetForm();
    setIsEditing(false);
    setIsChangingPassword(false);
    setIsCreatingPassword(false);
    setChangedFields({
      username: false,
      display_picture: false,
      password: false,
    });
    setIsLoading(false);
  };

  const handlePasswordChangeClick = () => {
    setIsChangingPassword(true);
    setChangedFields((prev) => ({ ...prev, password: true }));
  };

  const handleCreatePasswordClick = () => {
    setIsCreatingPassword(true);
    setChangedFields((prev) => ({ ...prev, password: true }));
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleProfilePictureChange = (newPicture: string) => {
    formik.setFieldValue("display_picture", newPicture);
    setChangedFields((prev) => ({ ...prev, display_picture: true }));
  };

  // Simplified handleUsernameChange function

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    formik.handleChange(e);

    // Track if username has changed from original value
    setChangedFields((prev) => ({
      ...prev,
      username: newUsername !== user?.username,
    }));
  };

  const hasChanges = () => {
    return Object.values(changedFields).some(Boolean);
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/delete-account`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firebase_uid: user!.firebase_uid,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      await auth.signOut();
      localStorage.removeItem("userData");
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      setError({
        general:
          error instanceof Error
            ? error.message
            : "Failed to delete account. Please try again.",
      });
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  return {
    formik,
    isEditing,
    isChangingPassword,
    isCreatingPassword,
    showPassword,
    showConfirmPassword,
    error,
    hasNoPassword,
    isLoading,
    handleEditClick,
    handleDiscardClick,
    handlePasswordChangeClick,
    handleCreatePasswordClick,
    togglePassword,
    toggleConfirmPassword,
    hasChanges,
    handleProfilePictureChange,
    handleUsernameChange,
    isDeleteModalOpen,
    isDeletingAccount,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteAccount,
    changedFields,
  };
};

export default useAccountSettings;
