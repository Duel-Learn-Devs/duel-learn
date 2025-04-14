import { useState } from "react";
import axios from "axios";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const Subscription = () => {
  const [processing, setProcessing] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();

  const handleSubscription = async (plan) => {
    setProcessing(true);

    try {
      if (plan === "free") {
        // For free plan - direct API call and redirect to success
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/payment/create-payment`,
          {
            firebase_uid: user.firebase_uid,
            username: user.username,
            email: user.email,
            plan: plan,
          }
        );

        if (response.data.success) {
          navigate("/dashboard/payment-success");
        }
      } else {
        // For paid plans, we create a checkout session with PayMongo
        const response = await axios.post(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/payment/create-checkout-session`,
          {
            firebase_uid: user.firebase_uid,
            username: user.username,
            email: user.email,
            plan: plan,
          }
        );

        if (response.data.success && response.data.checkout_url) {
          // Redirect user to the PayMongo checkout page
          window.location.href = response.data.checkout_url;
        } else {
          throw new Error("Failed to create checkout session");
        }
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to process subscription. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-3 sm gap-4 w-full max-w-4xl mt-8">
      {/* free */}
      <div className="flex flex-col items-center gap-2 justify-center p-6 border-2 border-solid border-[#3B354C] rounded-[0.8rem] hover:border-[#A38CE6] bg-inherit hover:bg-[#3B354C] transition-all duration-300 ease-in transform hover:-translate-y-2">
        <p className="text-xl font-semibold">FREE PLAN</p>
        <p className="text-3xl font-bold mt-2">₱0</p>
        <div className="flex flex-col gap-1">
          <p className="text-md text-[#C4BEDB] mt-2">Limited Scan Notes</p>
          <p className="text-md text-[#C4BEDB]">Limited AI Fact check</p>
          <p className="text-md text-[#C4BEDB]">Limited PvP Battles</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 justify-center p-6 border-2 border-solid border-[#3B354C] rounded-[0.8rem] hover:border-[#A38CE6] bg-inherit hover:bg-[#3B354C] transition-all duration-300 ease-in transform hover:-translate-y-2">
        <p className="text-xl font-semibold">MONTHLY PLAN</p>
        <p className="text-3xl font-bold mt-2">₱109</p>
        <div className="flex flex-col gap-1">
          <p className="text-md text-[#C4BEDB] mt-2">Unlimited Scan Notes</p>
          <p className="text-md text-[#C4BEDB]">Unlimited AI Fact check</p>
          <p className="text-md text-[#C4BEDB]">Unlimited PvP Battles</p>
        </div>
        <button
          className="mt-4 bg-[#A38CE6] hover:bg-[#8C77D1] text-white py-2 px-4 rounded-md transition-colors duration-300"
          onClick={() => handleSubscription("monthly")}
          disabled={processing}
        >
          {processing ? "Processing..." : "Subscribe for ₱109"}
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 justify-center p-6 border-2 border-solid border-[#3B354C] rounded-[0.8rem] hover:border-[#A38CE6] bg-inherit hover:bg-[#3B354C] transition-all duration-300 ease-in transform hover:-translate-y-2">
        <p className="text-xl font-semibold">ANNUAL PLAN</p>
        <p className="text-3xl font-bold mt-2">₱1099</p>
        <div className="flex flex-col gap-1">
          <p className="text-md text-[#C4BEDB] mt-2">Unlimited Scan Notes</p>
          <p className="text-md text-[#C4BEDB]">Unlimited AI Fact check</p>
          <p className="text-md text-[#C4BEDB]">Unlimited PvP Battles</p>
          <p className="text-md text-[#C4BEDB]">Saves ₱209</p>
        </div>
        <button
          className="mt-4 bg-[#A38CE6] hover:bg-[#8C77D1] text-white py-2 px-4 rounded-md transition-colors duration-300"
          onClick={() => handleSubscription("annual")}
          disabled={processing}
        >
          {processing ? "Processing..." : "Subscribe for ₱1099"}
        </button>
      </div>
    </div>
  );
};

export default Subscription;
