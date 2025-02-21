import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import cauldronGif from "../assets/General/Cauldron.gif"; // Importing the gif animation for cauldron asset
import PageTransition from "../styles/PageTransition"; // Importing the PageTransition component

export const LoadingScreen: React.FC = () => {
  const navigate = useNavigate(); // Hook to programmatically navigate to different routes

  // Array of magical-themed loading lines
  const loadingLines = [
    "For relaxed practice and review. The best way to retain those lessons in your head, Magician.",
    "A true Magician never stops learning. Prepare your spells of knowledge!",
    "The ancient scrolls whisper wisdom to those who seek it. Listen closely!",
    "Sharpen your mind, for the battle of wits is about to begin!",
    "Knowledge is the most powerful spell. Are you ready to cast yours?",
    "Every great sorcerer once started as a humble student. Keep learning!",
    "Your magical journey of wisdom continues... Stay enchanted!",
    "The battlefield of minds awaits! Will you emerge as the grand mage?",
    "Memorize, strategize, and triumph—your magic is your knowledge!",
    "Focus your energy, channel your intellect, and prepare for the duel!",
    "Ancient runes light the path of knowledge. Follow them wisely!",
  ];

  const [currentLine, setCurrentLine] = useState(
    loadingLines[Math.floor(Math.random() * loadingLines.length)]
  );

  useEffect(() => {
    // Set a timer to navigate to the dashboard home page after 5 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard/home");
    }, 5000);

    // Clear the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [navigate]);

  // Function to update the loading line on user interaction
  const changeLine = () => {
    setCurrentLine(
      loadingLines[Math.floor(Math.random() * loadingLines.length)]
    );
  };

  return (
    <PageTransition>
      <main
        className="flex overflow-hidden flex-col justify-center items-center min-h-screen px-10 py-28 bg-gray-950 max-md:px-2 max-md:py-12"
        onClick={changeLine} // Change text when user clicks anywhere
      >
        <section className="flex flex-col items-center max-w-full w-[406px]">
          <img
            loading="lazy"
            src={cauldronGif} // Using the imported cauldron gif
            className="object-contain max-w-full aspect-square w-[225px]"
            alt="Loading animation" // Alt text for the image
          />
          <h1
            className="mt-8 text-2xl font-extrabold text-white max-md:mt-5"
            style={{ fontFamily: "Nunito" }}
          >
            LOADING <span className="dot-1">.</span>
            <span className="dot-2">.</span>
            <span className="dot-3">.</span>
          </h1>
          <p
            className="self-stretch mt-7 text-xl font-medium text-center text-zinc-400 max-md:mt-5 max-md:max-w-full"
            style={{ fontFamily: "Nunito" }}
          >
            <span className="font-normal text-[#9F9BAE]">{currentLine}</span>
          </p>
        </section>
      </main>
    </PageTransition>
  );
};

export default LoadingScreen;
