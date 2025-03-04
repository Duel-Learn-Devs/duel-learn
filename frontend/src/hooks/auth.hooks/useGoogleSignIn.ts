import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { signInWithPopup } from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import {
  auth,
  googleProvider,
  getAdditionalInfo,
  db,
} from "../../services/firebase";
import useSignUpApi from "../api.hooks/useSignUpApi";
import useHandleError from "../validation.hooks/useHandleError";

const useGoogleSignIn = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const { signUpApi } = useSignUpApi();
  const { handleLoginError } = useHandleError();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const additionalUserInfo = getAdditionalInfo(result);
      const userData = {
        firebaseToken: token,
        firebase_uid: result.user.uid,
        username: result.user.displayName,
        email: result.user.email,
        display_picture: result.user.photoURL,
        isNew: additionalUserInfo?.isNewUser,
        full_name: "",
        email_verified: result.user.emailVerified,
        isSSO: true,
        account_type: "free" as "free" | "premium" |"admin",
      };

      const userDoc = await getDoc(doc(db, "users", userData.firebase_uid));
      const isNewUser =
        !userDoc.exists() ||
        (userDoc.exists() &&
          Date.now() - userDoc.data().created_at.toMillis() < 5000);

      if (isNewUser) {
        await setDoc(doc(db, "users", userData.firebase_uid), {
          firebase_uid: userData.firebase_uid || "",
          username: userData.username,
          email: userData.email,
          password_hash: "N/A",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          display_picture: userData.display_picture || "",
          full_name: "",
          email_verified: userData.email_verified,
          isSSO: userData.isSSO,
          account_type: userData.account_type,
        });

        await signUpApi(
          userData.firebase_uid,
          userData.username ?? "Anonymous",
          userData.email || "",
          "",
          true,
          result.user.emailVerified
        );
      }

      setUser(userData);
      localStorage.setItem("userToken", token);

      setTimeout(() => {
        if (userData.account_type === "admin") {
          navigate("/admin/admin-dashboard");
        } else if (isNewUser && userData.email_verified) {
          navigate("/dashboard/welcome");
        } else if (isNewUser && userData.email_verified === false) {
          navigate("/dashboard/verify-email");
        } else if (userData.email_verified === false) {
          navigate("/dashboard/verify-email");
        } else {
          navigate("/dashboard/home");
        }
      }, 2000);
    } catch (error: any) {
      handleLoginError(error);
    }
  };

  return { handleGoogleSignIn };
};

export default useGoogleSignIn;