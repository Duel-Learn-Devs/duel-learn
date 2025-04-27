import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWandCursor from "./data/useWandCursor";
import GateRabbit from "/UserOnboarding/Gate.gif";
import PageTransition from "../../styles/PageTransition";
import { useAudio } from "../../contexts/AudioContext"; // Import the useAudio hook
import { useUser } from "../../contexts/UserContext";

const TutorialLast: React.FC = () => {
  const { user } = useUser();
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();
  const { pauseAudio } = useAudio(); // Use the pauseAudio function

  useWandCursor();

  useEffect(() => {
    const fadeInTimer = setTimeout(() => setFadeIn(true), 500); // Start fade-in after 500ms

    const handleKeyDown = (_event: KeyboardEvent) => {
      pauseAudio();
      navigate("/dashboard/home");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(fadeInTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, pauseAudio]);

  const handleNavigate = () => {
    console.log("Navigating to /dashboard/home...");
    pauseAudio();
    navigate("/dashboard/home");
  };

  return (
    <PageTransition>
      <div
        className="flex flex-col items-center justify-center h-screen bg-[#080511] overflow-hidden cursor-none relative"
        onClick={handleNavigate}
      >
        {/* GIF Wrapper */}
        <div className="relative">
          {/* Welcome GIF */}
          <img
            src={GateRabbit}
            alt="Gate Rabbit"
            className="z-0 w-[700px] h-auto"
          />

          {/* Grouped Fade-in Text Overlapping GIF */}
          <div
            className={`absolute top-[80%] left-1/2 transform -translate-x-1/2 text-center text-white transition-opacity duration-1000 z-10 ${
              fadeIn ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="text-xl whitespace-nowrap">
              Get ready to embark on your journey,{" "}
              <span className="font-bold">{user?.username}</span>.
            </p>
            <p
              className="text-[18px] text-[#9F9BAE] mt-5"
              style={{ animation: "fadeInOut 3s infinite" }}
            >
              Tap anywhere on the screen or press any key to continue
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default TutorialLast;
