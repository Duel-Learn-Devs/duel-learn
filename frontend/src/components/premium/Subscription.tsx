import { useState } from "react";
import axios from "axios";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import FreePlan from "/premium-page/free-plan.svg";
import MonthlyPlan from "/premium-page/monthly-plan.svg";
import AnnualPlan from "/premium-page/yearly-plan.svg";
import Star from "/premium-page/star.svg";
import CancelSubscription from "../premium/CancelSubscription";

const Subscription = () => {
  const [processing, setProcessing] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isFreePlan = user?.account_type === "free";
  const isMonthlyPlan = user?.account_type_plan === "MONTHLY PLAN";
  const isYearlyPlan = user?.account_type_plan === "ANNUAL PLAN";

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

  const handleOpenCancelSubsModal = () => {
    setShowCancelModal(true);
  };

  return (
    <>
      <div className="flex flex-col items-center w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl mt-4 mb-10 px-4 md:px-0">
          {/* Free plan card - unchanged */}
          <div className="flex flex-col border-2 border-solid border-[#3B354C] rounded-[0.8rem] hover:border-[#E2DDF3] bg-inherit hover:bg-[#3B354C] transition-all duration-300 ease-in-out transform hover:-translate-y-2">
            <img
              src={FreePlan}
              alt=""
              className="w-full border-b-2 border-[#3B354C] rounded-t-[0.7rem]"
            />
            <div className="flex flex-col items-start p-4 sm:p-6 md:p-10 w-full">
              <p className="text-[18px] sm:text-[22px] md:text-[28px] font-semibold">
                Free Plan
              </p>
              <p className="text-[12px] sm:text-[14px] md:text-[16px] font-bold text-[#5A5076]">
                No fee
              </p>
              <p className="text-[12px] sm:text-[14px] md:text-[16px] text-[#C4BEDB] pt-2">
                For non-daily study sessions
              </p>
              <div className="flex flex-col gap-2 sm:gap-3 text-left pt-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Limited Scan Notes
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Limited Scan Notes
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Limited PvP Battles
                  </p>
                </div>
              </div>
              {isFreePlan ? (
                <button
                  className="mt-3 sm:mt-4 w-full bg-[#120F1D]  text-white text-[14px] sm:text-[16px] py-1.5 sm:py-2 px-4 rounded-[0.6rem] transition-colors duration-300"
                  disabled
                >
                  Current Plan
                </button>
              ) : (
                <button
                  className="mt-3 sm:mt-4 w-full bg-[#8565E7] hover:bg-[#4D18E8] text-white text-[14px] sm:text-[16px] py-1.5 sm:py-2 px-4 rounded-[0.6rem] transition-colors duration-300 ease-in-out"
                  disabled={processing}
                >
                  {processing ? "Processing..." : "DOWNGRADE TO FREE"}
                </button>
              )}
            </div>
          </div>

          {/* Monthly plan card - keep your current HTML structure but adjust sizing */}
          <div className="flex flex-col border-2 border-solid border-[#3B354C] rounded-[0.8rem] hover:border-[#E2DDF3] bg-inherit hover:bg-[#3B354C] transition-all duration-300 ease-in-out transform hover:-translate-y-2">
            <img
              src={MonthlyPlan}
              alt=""
              className="w-full border-b-2 border-[#3B354C] rounded-t-[0.7rem]"
            />
            <div className="flex flex-col items-start p-4 sm:p-6 md:p-10 w-full">
              <p className="text-[18px] sm:text-[22px] md:text-[28px] font-semibold">
                Monthly Plan
              </p>
              <p className="text-[12px] sm:text-[14px] md:text-[16px] font-bold text-[#5A5076]">
                ₱ 109.00 / MONTH
              </p>
              <p className="text-[12px] sm:text-[14px] md:text-[16px] text-[#C4BEDB] pt-2">
                Ideal for consistent learners
              </p>
              <div className="flex flex-col gap-2 sm:gap-3 text-left pt-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Unlimited Scan Notes
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Unlimited Scan Notes
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Unlimited PvP Battles
                  </p>
                </div>
              </div>
              {isMonthlyPlan ? (
                <button
                  onClick={handleOpenCancelSubsModal}
                  className="mt-3 sm:mt-4 w-full bg-[#120F1D] hover:bg-[#4D18E8] text-white text-[14px] sm:text-[16px] py-1.5 sm:py-2 px-4 rounded-[0.6rem] transition-colors duration-300"
                >
                  Cancel Subscription
                </button>
              ) : (
                <button
                  className="mt-3 sm:mt-4 w-full bg-[#8565E7] hover:bg-[#4D18E8] text-white text-[14px] sm:text-[16px] py-1.5 sm:py-2 px-4 rounded-[0.6rem] transition-colors duration-300 ease-in-out"
                  onClick={() => handleSubscription("monthly")}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "UPGRADE TO MONTHLY"}
                </button>
              )}
            </div>
          </div>

          {/* Annual plan card - keep your current HTML structure but adjust sizing */}
          <div className="flex flex-col border-2 border-solid border-[#3B354C] rounded-[0.8rem] hover:border-[#E2DDF3] bg-inherit hover:bg-[#3B354C] transition-all duration-300 ease-in-out transform hover:-translate-y-2">
            <img
              src={AnnualPlan}
              alt=""
              className="w-full border-b-2 border-[#3B354C] rounded-t-[0.7rem]"
            />
            <div className="flex flex-col items-start p-4 sm:p-6 md:p-10 w-full">
              <p className="text-[18px] sm:text-[22px] md:text-[28px] font-semibold">
                Annual Plan
              </p>
              <p className="text-[12px] sm:text-[14px] md:text-[16px] font-bold text-[#5A5076]">
                ₱ 1099.00 / YEAR
              </p>
              <p className="text-[12px] sm:text-[14px] md:text-[16px] text-[#C4BEDB] pt-2">
                <strong>Save P209 </strong>for constant study sessions
              </p>
              <div className="flex flex-col gap-2 sm:gap-3 text-left pt-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Unlimited Scan Notes
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Unlimited Scan Notes
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={Star}
                    alt=""
                    className="w-[12px] sm:w-[14px] md:w-[16px] h-auto"
                  />
                  <p className="text-[12px] sm:text-[13px] md:text-[15px] text-[#C4BEDB]">
                    Unlimited PvP Battles
                  </p>
                </div>
              </div>
              {isYearlyPlan ? (
                <button
                  onClick={handleOpenCancelSubsModal}
                  className="mt-3 sm:mt-4 w-full bg-[#120F1D] hover:bg-[#4D18E8] text-white text-[14px] sm:text-[16px] py-1.5 sm:py-2 px-4 rounded-[0.6rem] transition-colors duration-300"
                >
                  Cancel Subscription
                </button>
              ) : (
                <button
                  className="mt-3 sm:mt-4 w-full bg-[#8565E7] hover:bg-[#4D18E8] text-white text-[14px] sm:text-[16px] py-1.5 sm:py-2 px-4 rounded-[0.6rem] transition-colors duration-300 ease-in-out"
                  onClick={() => handleSubscription("annual")}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "UPGRADE TO YEARLY"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <CancelSubscription
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
    </>
  );
};

export default Subscription;
