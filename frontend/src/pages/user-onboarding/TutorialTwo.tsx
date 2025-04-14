import * as React from "react";
import Typewriter from "typewriter-effect";
import useWandCursor from "./data/useWandCursor";
import { useNavigate } from "react-router-dom";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CharacterTalking from "/UserOnboarding/NoddingBunny.gif";
import PageTransition from "../../styles/PageTransition";
import { useAudio } from "../../contexts/AudioContext"; // Import the useAudio hook
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

export default function TutorialTwo() {
  useWandCursor();
  const navigate = useNavigate();
  const { playUserOnboardingAudio, isMuted, toggleMute } = useAudio(); // Use the playUserOnboardingAudio function

  const dialogues = [
    `First, you'll want to <strong>create study materials</strong>. Think of them as your magical tomes—crafted manually or with the help of our assistive tools such as <strong>OCR and AI</strong>!`,
  ];

  const [clickCount, setClickCount] = React.useState(0);
  const [showFullText, setShowFullText] = React.useState(false);
  const [typingDone, setTypingDone] = React.useState(false);
  const [animate, setAnimate] = React.useState(false);
  const [key, setKey] = React.useState(0); // Force Typewriter re-render

  React.useEffect(() => {
    setAnimate(true);
    setKey((prevKey) => prevKey + 1); // Restart Typewriter
    playUserOnboardingAudio(); // Play user onboarding audio
  }, [playUserOnboardingAudio]);

  const handleClick = (e: React.MouseEvent) => {
    // Check if the click was on the sound button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

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
        setKey((prevKey) => prevKey + 1);
      }, 100);
    } else {
      navigate("/dashboard/tutorial/step-three");
    }
  };

  const handleSkipTutorial = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigate("/dashboard/tutorial/last-step");
  };

  return (
    <PageTransition>
      <main
        className="relative flex flex-col items-center px-20 py-20 text-white h-screen bg-[#080511] overflow-hidden cursor-none"
        role="main"
        onClick={handleClick}
      >
        <div className="absolute top-4 right-4 z-50 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="text-white hover:text-gray-300 transition-colors pointer-events-auto"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeOffIcon style={{ height: 23, width: 23 }} />
            ) : (
              <VolumeUpIcon style={{ height: 23, width: 23 }} />
            )}
          </button>
        </div>
        {/* Magic Wand Cursor */}
        <div className="wand-cursor"></div>

        {/* Animated Background Glow */}
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[#6B21A8] blur-[250px] rounded-full opacity-40 animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>

        {/* Skip Tutorial Button */}
        <button
          onClick={handleSkipTutorial}
          className="flex gap-2 items-center text-[#3B354D] text-[12px] md:text-[14px] font-bold transition-colors hover:text-white self-end mb-2 md:mb-0 z-10"
          aria-label="Skip tutorial"
        >
          <span>SKIP TUTORIAL</span>
          <ArrowForwardIosIcon className="!w-4 !h-4 md:!w-5 md:!h-5 transition-colors" />
        </button>

        {/* Video Section */}
        <div className="flex justify-center items-center w-full mt-10 md:mt-16 z-10">
          <div className="w-full max-w-[801px] h-[297px] bg-zinc-300 rounded-xl"></div>
        </div>

        {/* Dialogue Box */}
        <div className="flex flex-col-reverse md:flex-row mt-12 sm:mt-15 md:mt-20 gap-10 w-full items-center justify-between max-w-[1100px] z-10">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <img
              src={CharacterTalking}
              alt="Character talking"
              className="w-[200px] h-[200px] md:w-[250px] md:h-[250px] rounded-md object-cover"
            />
          </div>

          {/* Speech Bubble with Typewriter Effect */}
          <div
            className={`relative bg-[#221D30] text-sm md:text-xl text-white rounded px-8 md:px-16 py-8 md:py-14 w-[816px] h-[auto] max-w-full transition-all duration-700 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
          >
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
                  delay: 30,
                }}
              />
            )}

            {/* Left-Pointing Arrow for larger screens */}
            <div className="absolute w-0 h-0 border-t-[15px] border-t-transparent border-b-[15px] border-b-transparent border-r-[15px] border-r-[#221D30] left-[-15px] top-1/2 transform -translate-y-1/2 md:block hidden"></div>
            {/* Down-Pointing Arrow for smaller screens */}
            <div className="absolute w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-[#221D30] left-1/2 top-full transform -translate-x-1/2 md:hidden block"></div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
