import React, { useEffect, useState } from "react";
import Typewriter from "typewriter-effect";
import "./styles/EffectUserOnboarding.css";
import { useNavigate } from "react-router-dom";
import useWandCursor from "./data/useWandCursor";
import Tutorial1Magician from "../../assets/UserOnboarding/StandingBunny.gif";
import PageTransition from "../../styles/PageTransition";

const TutorialOnePage: React.FC = () => {
  const [animate, setAnimate] = useState<boolean>(false);
  const [showFullText, setShowFullText] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);
  const [typingDone, setTypingDone] = useState<boolean>(false);
  const [key, setKey] = useState(0); // Key to force Typewriter re-render
  const navigate = useNavigate();

  useWandCursor();

  useEffect(() => {
    setAnimate(true);
    setKey(prevKey => prevKey + 1); // Force Typewriter to restart
  }, []);

  const dialogues = [
    `Congratulations on stepping into the magical world of <span class="font-bold">Duel Learn</span>! Before we reveal the powerful spells you'll be casting here, let's first attune your grimoire to your unique style.`,
    `A wizard’s journey begins with the right tools—so let’s <i>personalize</i> your experience!`,
  ];

  const handleClick = () => {
    if (!typingDone) {
      setShowFullText(true);
      setTypingDone(true);
    } else if (clickCount < dialogues.length - 1) {
      setClickCount((prev) => prev + 1);
      setShowFullText(false);
      setTypingDone(false);
      setAnimate(false);
      setTimeout(() => {
        setAnimate(true);
        setKey(prevKey => prevKey + 1); // Restart Typewriter
      }, 100);
    } else {
      navigate("/dashboard/my-preferences");
    }
  };

  return (
    <PageTransition>
      <div
        className="flex flex-col items-center justify-center h-screen bg-[#080511] relative overflow-hidden cursor-none"
        onClick={handleClick}
      >
        {/* Sparkles Container */}
        <div id="sparkles-container"></div>

        {/* Magic Wand Cursor */}
        <div className="wand-cursor"></div>

        {/* Animated Background Glow */}
        <div className="absolute w-[500px] h-[500px] bg-[#6B21A8] blur-[250px] rounded-full opacity-40 animate-pulse"></div>

        {/* Dialogue Box Container */}
        <div
          className="relative z-10 flex items-center justify-center"
          style={{ minHeight: "150px" }}
        >
          {/* Actual Dialogue Box */}
          <div
            className={`bg-[#221D30] text-white py-9 px-14 rounded-lg shadow-lg max-w-[650px] transition-all duration-700 ${
              animate ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          >
            <div className="text-center text-[18px]">
              {showFullText ? (
                <span
                  dangerouslySetInnerHTML={{ __html: dialogues[clickCount] }}
                />
              ) : (
                <Typewriter
                key={key} // Force re-render
                onInit={(typewriter) => {
                  typewriter
                    .typeString(dialogues[clickCount])
                    .callFunction(() => setTypingDone(true))
                    .start();
                }}
                options={{
                  autoStart: true,
                  loop: false,
                  delay: 50,
                }}
              />
              )}
            </div>
            {/* Triangle for the speech bubble */}
            <div className="absolute w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-[#221D30] left-[50%] translate-x-[-50%] top-full"></div>
          </div>
        </div>

        {/* Image Container */}
        <div
          className="relative mt-8 z-10 w-96 h-96 rounded bg-center"
          style={{
            backgroundImage: `url(${Tutorial1Magician})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Click to Continue Text */}
        <p
          className={`absolute bottom-[10%] text-[18px] text-[#3B354D] transition-opacity duration-1000 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
          style={{ animation: "fadeInOut 3s infinite" }}
        >
          Tap anywhere on the screen to continue
        </p>
      </div>
    </PageTransition>
  );
};

export default TutorialOnePage;