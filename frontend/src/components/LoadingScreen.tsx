import React, { useState } from "react";
import cauldronGif from "../assets/General/Cauldron.gif";
import PageTransition from "../styles/PageTransition";

<<<<<<< HEAD
export const LoadingScreen: React.FC = () => {
=======
interface LoadingScreenProps {
  text?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ text }) => {
>>>>>>> origin/beta-branch
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
<<<<<<< HEAD
    loadingLines[Math.floor(Math.random() * loadingLines.length)]
=======
    text || loadingLines[Math.floor(Math.random() * loadingLines.length)]
>>>>>>> origin/beta-branch
  );

  const changeLine = () => {
    setCurrentLine(
<<<<<<< HEAD
      loadingLines[Math.floor(Math.random() * loadingLines.length)]
=======
      text || loadingLines[Math.floor(Math.random() * loadingLines.length)]
>>>>>>> origin/beta-branch
    );
  };

  return (
    <PageTransition>
      <main
        className="flex overflow-hidden flex-col justify-center items-center min-h-screen px-10 py-28  max-md:px-2 max-md:py-12"
        onClick={changeLine} // Change text when user clicks anywhere
      >
        <section className="flex flex-col items-center max-w-full w-[406px]">
          <img
            loading="lazy"
            src={cauldronGif}
            className="object-contain max-w-full aspect-square w-[225px]"
            alt="Loading animation"
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
