import { useState } from "react";

const useResetPasswordApi = () => {
  const [apiError, setApiError] = useState<string | null>(null);

  const resetPasswordApi = async (
    firebase_uid: string,
    password_hash: string,
    updated_at: string
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ firebase_uid, password_hash, updated_at }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      setApiError(error.message);
      throw error;
    }
  };

  return { resetPasswordApi, apiError };
};

export default useResetPasswordApi;
