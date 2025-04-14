import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useUser } from "../../contexts/UserContext";
import PremiumStar from "/shop-picture/PremiumStar.svg";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planDetails, setPlanDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, refreshUserData } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Check for payment_id from checkout session redirect
    const paymentId = params.get("payment_id");

    // Check for payment_intent_id from PayMongo callback
    const paymentIntentId = params.get("payment_intent_id");

    if (paymentId) {
      // Verify payment by payment ID
      verifyPaymentById(paymentId);
    } else if (paymentIntentId) {
      // Verify payment by payment intent ID
      verifyPaymentByIntentId(paymentIntentId);
    } else {
      // If no IDs found, just check user's active subscriptions
      checkUserSubscription();
    }
  }, [location.search, user]);

  const verifyPaymentById = async (paymentId) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/payment/verify-payment-by-id/${paymentId}`
      );

      if (response.data.success) {
        setPlanDetails(response.data.planDetails);

        // Update user account type locally
        if (
          response.data.planDetails.planName.includes("MONTHLY") ||
          response.data.planDetails.planName.includes("ANNUAL")
        ) {
          updateUser({ account_type: "premium" });

          // You can also refresh the full user data to be certain
          refreshUserData().catch((err) =>
            console.error("Error refreshing user data:", err)
          );
        }
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setError(
        "There was an issue verifying your payment. Please contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymentByIntentId = async (paymentIntentId) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/payment/verify-payment/${paymentIntentId}`
      );

      if (response.data.success) {
        setPlanDetails(response.data.planDetails);

        // Update user account type locally
        if (
          response.data.planDetails.planName.includes("MONTHLY") ||
          response.data.planDetails.planName.includes("ANNUAL")
        ) {
          updateUser({ account_type: "premium" });

          // You can also refresh the full user data to be certain
          refreshUserData().catch((err) =>
            console.error("Error refreshing user data:", err)
          );
        }
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setError(
        "There was an issue verifying your payment. Please contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  const checkUserSubscription = async () => {
    if (!user || !user.firebase_uid) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      // Get the user's active subscription
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/payment/user-subscription/${
          user.firebase_uid
        }`
      );

      if (response.data.success) {
        setPlanDetails(response.data.planDetails);

        // Update user account type locally
        if (
          response.data.planDetails.planName.includes("MONTHLY") ||
          response.data.planDetails.planName.includes("ANNUAL")
        ) {
          updateUser({ account_type: "premium" });
        }
      } else {
        setError("No active subscription found");
      }
    } catch (error) {
      console.error("Subscription check error:", error);
      setError("There was an issue checking your subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard/shop");
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#A38CE6]"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex justify-center items-center ">
      <div className="max-w-lg p-8 bg-[#1E1A29] rounded-[0.8rem] flex flex-col items-center text-center">
        <img src={PremiumStar} alt="Premium" className="w-14 h-auto mb-6" />
        <CheckCircleIcon style={{ color: "#4CAF50", fontSize: "4rem" }} />
        <h1 className="text-3xl font-bold mt-4">Payment Successful!</h1>
        <p className="text-[#C4BEDB] mt-4 mb-6">
          Thank you for upgrading to Duel Learn Premium. Your account has been
          successfully upgraded.
        </p>

        {planDetails && (
          <div className="w-full bg-[#2A2439] p-4 rounded-[0.8rem] my-4">
            <h3 className="font-bold text-xl mb-2">{planDetails.planName}</h3>
            <p>Amount paid: ₱{planDetails.amount}</p>
          </div>
        )}

        <button
          onClick={handleBackToDashboard}
          className="mt-6 bg-[#A38CE6] hover:bg-[#8C77D1] text-white py-3 px-8 rounded-[0.8rem] transition-colors duration-300"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
