import { useEffect, useState, useRef } from "react";
import "./styles/EffectUserOnboarding.css";
import { useNavigate } from "react-router-dom";
import UseWandCursor from "./data/useWandCursor"; // Import the custom hook
import WelcomePhoto from "/UserOnboarding/WelcomePhoto.gif";
import { useUser } from "../../contexts/UserContext"; // Import the useUser hook
import PageTransition from "../../styles/PageTransition";
import { useAudio } from "../../contexts/AudioContext"; // Import the useAudio hook
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

const WelcomePage = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const { playStartAudio, playLoopAudio, isPlaying, isMuted, toggleMute } =
    useAudio();
  const startAudioRef = useRef<HTMLAudioElement | null>(null);
  const loopAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  UseWandCursor();

  const handleNavigate = (e?: React.MouseEvent) => {
    // Check if the click was on the sound button
    if (e && (e.target as HTMLElement).closest("button")) {
      return;
    }
    console.log("Navigating to /tutorial/step-one...");
    navigate("/dashboard/tutorial/step-one");
  };
  // Initialize audio elements
  useEffect(() => {
    if (!isAudioInitialized) {
      startAudioRef.current = new Audio("/sounds-sfx/welcome-start.mp3");
      loopAudioRef.current = new Audio("/sounds-sfx/welcome-loop.mp3");
      loopAudioRef.current.loop = true;
      setIsAudioInitialized(true);
    }
  }, [isAudioInitialized]);

  // Handle audio playback
  useEffect(() => {
    if (isAudioInitialized && !isPlaying && !isMuted) {
      const playAudio = async () => {
        try {
          if (startAudioRef.current) {
            await startAudioRef.current.play();
            startAudioRef.current.addEventListener("ended", () => {
              if (loopAudioRef.current && !isMuted) {
                loopAudioRef.current.play();
              }
            });
          }
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      };
      playAudio();
    }

    return () => {
      if (startAudioRef.current) {
        startAudioRef.current.pause();
        startAudioRef.current.currentTime = 0;
      }
      if (loopAudioRef.current) {
        loopAudioRef.current.pause();
        loopAudioRef.current.currentTime = 0;
      }
    };
  }, [isAudioInitialized, isPlaying, isMuted]);

  // Handle mute state
  useEffect(() => {
    if (isAudioInitialized) {
      if (isMuted) {
        if (startAudioRef.current) {
          startAudioRef.current.pause();
        }
        if (loopAudioRef.current) {
          loopAudioRef.current.pause();
        }
      } else {
        if (!isPlaying) {
          if (startAudioRef.current) {
            startAudioRef.current.play();
          }
        }
      }
    }
  }, [isMuted, isAudioInitialized, isPlaying]);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 500);

    const handleKeyDown = (_event: KeyboardEvent) => {
      handleNavigate(); // Call without passing an event
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNavigate]);

  return (
    <PageTransition>
      <div
        className="flex flex-col items-center justify-center h-screen bg-[#080511] relative overflow-hidden cursor-none"
        onClick={handleNavigate}
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
