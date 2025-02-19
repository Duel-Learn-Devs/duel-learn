import { useEffect, useState } from "react";
import "./styles/EffectUserOnboarding.css";
import { useNavigate } from "react-router-dom";
import useWandCursor from "./data/useWandCursor"; // Import the custom hook
import WelcomePhoto from "../../assets/UserOnboarding/WelcomePhoto.gif";
import { useUser } from "../../contexts/UserContext"; // Import the useUser hook
import PageTransition from "../../styles/PageTransition";

const WelcomePage = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  // Use the wand cursor effect
  useWandCursor();

  // Handle click or key press event to navigate to /dashboard/home
  const handleNavigate = () => {
    console.log("Navigating to /tutorial/step-one...");
    navigate("/onboarding/tutorial/step-one");
  };

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 500);

    // Event listener for keydown to detect key press
    const handleKeyDown = (event: KeyboardEvent) => {
      handleNavigate(); // Navigate when any key is pressed
    };

    // Adding event listener for keydown event
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  return (
    <PageTransition>
      <div
        className="flex flex-col items-center justify-center h-screen bg-[#080511] relative overflow-hidden cursor-none"
        onClick={handleNavigate} // Navigate on click
      >
        {/* Animated Background Glow */}
        <div className="absolute w-[500px] h-[500px] bg-[#6B21A8] blur-[250px] rounded-full opacity-40 animate-pulse"></div>

        {/* Welcome Photo as Background */}
        <div
          className="relative mt-30 z-10 w-96 h-96 rounded bg-center"
          style={{
            backgroundImage: `url(${WelcomePhoto})`,
            backgroundSize: "contain", // Ensure the image fits without cropping
            backgroundRepeat: "no-repeat", // Prevents repeating the image
            backgroundPosition: "center", // Keeps the image centered
          }}
        ></div>

        {/* Welcome Text */}
        <p
          className={`text-[24px] mt-14 text-white transition-opacity duration-1000 ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
        >
          You've finally made it here,{" "}
          <span className="font-bold">{user?.username}</span>!
        </p>

        {/* Click to Continue Text */}
        <p
          className={`text-[18px] mt-20 text-[#3B354D] transition-opacity duration-1000 ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
          style={{ animation: "fadeInOut 3s infinite" }}
        >
          Tap anywhere on the screen or press any key to continue
        </p>
      </div>
    </PageTransition>
  );
};

export default WelcomePage;
