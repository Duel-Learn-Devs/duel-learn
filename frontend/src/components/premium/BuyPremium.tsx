import PremiumBuyBG from "/shop-picture/PremiumBuyBG.png";
import PremiumStar from "/shop-picture/PremiumStar.svg";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/ClearRounded";
import Subscription from "./Subscription";
import PageTransition from "../../styles/PageTransition";

const BuyPremium = () => {
  const navigate = useNavigate();

  const handleCloseButton = () => {
    navigate(-1);
  };

  return (
    <PageTransition>
      <div>
        {/* bg image */}
        <div
          className=" h-screen w-screen flex justify-center items-center"
          style={{
            backgroundImage: `url(${PremiumBuyBG})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom center",
          }}
        >
          <div className="flex flex-col items-center text-center pb-24">
            <button
              onClick={handleCloseButton}
              className="absolute top-10 right-10 p-15 hover:scale-110 transition-all duration-300"
            >
              <CloseIcon className="text-[#C4BEDB]" />
            </button>
            <img src={PremiumStar} alt="" className="w-10 h-auto mb-6" />
            <p className="text-[40px] font-bold"> DUEL LEARN PREMIUM</p>
            <p className="text-lg text-[#C4BEDB] w-26">
              Choose the plan that fits your needs and unlock exclusive <br />
              features to enhance your learning experience.
            </p>
            <Subscription />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default BuyPremium;
