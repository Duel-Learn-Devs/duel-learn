import { useState } from "react";

const useSignUpApi = () => {
  const [apiError, setApiError] = useState<string | null>(null);

  const signUpApi = async (
    firebase_uid: string,
    username: string,
    email: string,
    password: string,
    isSSO: boolean,
    emailVerified: boolean
  ) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebase_uid,
          username,
          email,
          password,
          isSSO,
          emailVerified,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sign up");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      setApiError(error.message);
      throw error;
    }
  };

  return { signUpApi, apiError };
};

export default useSignUpApi;
