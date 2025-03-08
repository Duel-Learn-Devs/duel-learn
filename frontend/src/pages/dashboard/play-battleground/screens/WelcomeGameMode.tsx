import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DefaultUnknownPic from "../../../../assets/General/DefaultUnknownPic.png";
import { useAudio } from "../../../../contexts/AudioContext";

const WelcomeGameMode: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const audioContext = useAudio();
  const { mode, material } = location.state || {};
  const [fadeOut, setFadeOut] = useState(false);
  const [setupIsReady, setSetupIsReady] = useState(false);

  console.log("WelcomeGameMode received state:", { mode, material });
  console.log("Current audio playing status:", audioContext.isPlaying, "Track:", audioContext.currentTrack);

  // Check if SetUpQuestionType is ready
  useEffect(() => {
    const checkSetupComponent = async () => {
      try {
        await import('../components/setup/SetUpQuestionType');
        setSetupIsReady(true);
      } catch (error) {
        console.error('Error loading setup component:', error);
      }
    };

    checkSetupComponent();
  }, []);

  // Only start transition when setup is ready
  useEffect(() => {
    if (setupIsReady) {
      // If audio isn't already playing, try to start it based on mode
      if (!audioContext.isPlaying) {
        if (mode === "Peaceful") {
          audioContext.playPeacefulModeAudio();
        } else if (mode === "Time Pressured") {
          audioContext.playTimePressuredAudio();
        } else if (mode === "PvP") {
          audioContext.playPvPModeAudio(); // Add PvP audio playback
        }
      }
      
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          navigate("/dashboard/setup/questions", {
            state: {
              mode,
              material: typeof material === 'string' ? { title: material } : material,
              fromWelcome: true
            }
          });
        }, 1000);
      }, 1500);
    }
  }, [setupIsReady, navigate, mode, material, audioContext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="flex flex-col items-center justify-center h-screen text-center px-6 sm:px-8 md:px-12 lg:px-16"
      style={{ opacity: fadeOut ? 0 : 1, transition: "opacity 1s ease-in-out" }}
    >
      {mode && (
        <>
          <motion.img
            src={DefaultUnknownPic}
            alt="Game Mode"
            className="w-60 sm:w-60 md:w-68 lg:w-64 xl:w-[382px] mb-6 sm:mb-8 md:mb-10 lg:mb-12"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.p
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {mode} Mode Activated!
          </motion.p>
          <motion.p
            className="text-sm sm:text-base md:text-lg lg:text-xl mt-16"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{
              color: "#6F658D",
              maxWidth: "700px",
              margin: "31px auto",
              marginTop: "1.7rem"
            }}
          >
            {mode === "Peaceful" && "Take your time, master at your own pace! ✨"}
            {mode === "Time Pressured" && "Beat the clock, unleash your magical prowess! ⚡"}
            {mode === "PvP" && "Battle head-to-head for magical supremacy! 🏆"}
          </motion.p>
        </>
      )}
    </motion.div>
  );
};

export default WelcomeGameMode;