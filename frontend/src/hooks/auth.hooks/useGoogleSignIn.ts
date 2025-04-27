import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import {
  auth,
  getAdditionalInfo,
  googleProvider,
} from "../../services/firebase";
import useGoogleSignUpApi, { GoogleSignUpError } from "../api.hooks/useGoogleSignUpApi";
import useHandleError from "../validation.hooks/useHandleError";
import { useState } from "react";

const useGoogleSignIn = () => {
  const navigate = useNavigate();
  const { googleSignUpApi } = useGoogleSignUpApi();
  const { handleLoginError } = useHandleError();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async (account_type: "free" | "premium" | "admin") => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalUserInfo = getAdditionalInfo(result);
      const isNewUser = additionalUserInfo?.isNewUser ?? false;

      console.log("New User Status:", isNewUser);
      console.log("User Email Verified:", result.user.emailVerified);

      if (isNewUser) {
        try {
          await googleSignUpApi(
            result.user.uid,
            result.user.displayName,
            result.user.email,
            result.user.emailVerified,
            {
              creationTime: result.user.metadata.creationTime || null,
              lastSignInTime: result.user.metadata.lastSignInTime || null,
            },
            account_type

          );
        } catch (error) {
          console.error("Error during Google Sign Up:", error);
          if (error instanceof GoogleSignUpError) {
            if (error.code === 'EMAIL_IN_USE') {
              await auth.signOut();
              handleLoginError(new Error(error.message));
              setLoading(false);
              return;
            }
          }
          throw error;
        }
      }

      setTimeout(() => {
        console.log("isNewUser:", isNewUser);
        console.log("result.user.emailVerified:", result.user.emailVerified); 
        if (isNewUser && result.user.emailVerified) {
          console.log("New user, redirecting to welcome page");
          navigate("/dashboard/welcome");
        } else if (!result.user.emailVerified) {
          navigate("/dashboard/verify-email");
        } else {
          navigate("/dashboard/home");
        }
        setLoading(false);
      }, 2000);
    } catch (error: any) {
      handleLoginError(error);
      setLoading(false);
    }
  };

  return { handleGoogleSignIn, loading };
};

export default useGoogleSignIn;