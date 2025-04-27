import { useState } from "react";
import userService from "../../api/userService";
import { AxiosError } from "axios";

const useUserData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndUpdateUserData = async (firebase_uid: string) => {
    setLoading(true);
    setError(null);

    try {
      // Use the userService to get user data
      const response = await userService.getCurrentUserInfo(firebase_uid);
      return response.user;
    } catch (err) {
      // Improved error handling with specific messages for common errors
      const axiosError = err as AxiosError<{ error?: string, message?: string }>;
      let errorMessage = "An error occurred while fetching user data";
      
      if (axiosError.response) {
        // Check for specific error messages from the API
        if (axiosError.response.status === 404) {
          errorMessage = "User not found. The account may need to be created or verified.";
        } else if (axiosError.response.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (axiosError.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error(`Error fetching user data: ${errorMessage}`, err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchAndUpdateUserData,
    loading,
    error,
  };
};

export default useUserData;
