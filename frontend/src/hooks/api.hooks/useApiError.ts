import { useState } from "react";

const useApiError = () => {
  const [apiError, setApiError] = useState<string | null>(null);

  const handleApiError = (error: any) => {
    let errorMessage = "An unknown error occurred";

    if (error.code) {
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "The email address is already in use by another account.";
          break;
        case "auth/invalid-email":
          errorMessage = "The email address is not valid.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled.";
          break;
        case "auth/weak-password":
          errorMessage = "The password is not strong enough.";
          break;
        case "auth/user-disabled":
          errorMessage = "The user account has been disabled by an administrator.";
          break;
        case "auth/user-not-found":
          errorMessage = "There is no user record corresponding to this identifier.";
          break;
        case "auth/wrong-password":
          errorMessage = "The password is invalid or the user does not have a password.";
          break;
        default:
          errorMessage = error.message || "An unknown error occurred";
      }
    } else if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = "The server could not understand the request due to invalid syntax.";
          break;
        case 401:
          errorMessage = "The client must authenticate itself to get the requested response.";
          break;
        case 403:
          errorMessage = "The client does not have access rights to the content.";
          break;
        case 404:
          errorMessage = "The server can not find the requested resource.";
          break;
        case 500:
          errorMessage = "The server encountered an unexpected condition.";
          break;
        default:
          errorMessage = error.response.data.message || "An unknown error occurred";
      }
    } else if (error.code === "ER_DUP_ENTRY") {
      errorMessage = "Duplicate entry for a key.";
    } else if (error.code === "ER_BAD_FIELD_ERROR") {
      errorMessage = "Unknown column in the field list.";
    } else if (error.code === "ER_NO_REFERENCED_ROW") {
      errorMessage = "Cannot add or update a child row: a foreign key constraint fails.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    setApiError(errorMessage);
  };

  return { apiError, handleApiError };
};

export default useApiError;