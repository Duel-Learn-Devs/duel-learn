import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/HighlightOffRounded";
import Subscription from "./Subscription";
import PageTransition from "../../styles/PageTransition";
import PremiumBuyBG from "/premium-page/Payment.png";
import "../../styles/custom-scrollbar.css"; // Make sure this path is correct

const BuyPremium = () => {
  const navigate = useNavigate();

  const handleCloseButton = () => {
    navigate(-1);
  };

  return (
    <PageTransition>
      <div className="h-screen overflow-y-auto custom-scrollbar">
        {/* bg image */}
        <div
          className="flex justify-center items-start px-3 sm:px-6 py-8 sm:py-12 min-h-screen"
          style={{
            backgroundImage: `url(${PremiumBuyBG})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="flex flex-col items-center text-center w-full pt-14 sm:pt-20">
            <button
              onClick={handleCloseButton}
              className="fixed top-4 right-4 sm:top-10 sm:right-10 md:top-20 md:right-20 p-2 hover:scale-110 transition-all duration-300 z-10"
            >
              <CloseIcon fontSize="large" className="text-[#C4BEDB]" />
            </button>

            <h1 className="text-2xl sm:text-3xl md:text-[40px] font-bold">
              DUEL LEARN PREMIUM
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[#6F658D] max-w-[90%] sm:max-w-[70%] md:max-w-[30vw] mx-auto mt-2 sm:mt-3 mb-4 sm:mb-6 z-10">
              Choose the plan that fits your needs and unlock exclusive features
              to enhance your learning experience.
            </p>
            <Subscription />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default BuyPremium;
