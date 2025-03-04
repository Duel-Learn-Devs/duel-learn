import { useState } from "react";

const useUpdateEmailVerifiedApi = () => {
  const [apiError, setApiError] = useState<string | null>(null);

  const updateEmailVerifiedApi = async (firebase_uid: string, email_verified: boolean, updated_at: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/update-email-verified`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebase_uid, email_verified, updated_at }),
      });

      if (!response.ok) {
        throw new Error('Failed to update email verified status');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      setApiError(error.message);
      throw error;
    }
  };

  return { updateEmailVerifiedApi, apiError };
};

export default useUpdateEmailVerifiedApi;
