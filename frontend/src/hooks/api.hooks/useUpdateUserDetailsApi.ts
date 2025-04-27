import { useState } from "react";
import userService from "../../api/userService";

const useUpdateUserDetailsApi = () => {
  const [apiError, setApiError] = useState<string | null>(null);

  const updateUserDetailsApi = async (
    firebase_uid: string,
    username?: string,
    newpassword?: string,
    display_picture?: string
  ) => {
    try {
      const data = await userService.updateUserProfile({
        firebase_uid,
        username,
        newpassword,
        display_picture
      });
      return data;
    } catch (error: any) {
      console.error('Error updating user details:', error);
      setApiError(error.message);
      throw error;
    }
  };

  return { updateUserDetailsApi, apiError };
};

export default useUpdateUserDetailsApi;
