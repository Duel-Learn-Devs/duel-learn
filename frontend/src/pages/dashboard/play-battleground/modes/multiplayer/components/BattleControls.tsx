import React from "react";
import { motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import ManaIcon from "/ManaIcon.png";

interface BattleControlsProps {
  onBattleStart: () => void;
  isHost: boolean;
  hostReady: boolean;
  guestReady: boolean;
  loading: boolean;
  disabledReason?: string;
}

const BattleControls: React.FC<BattleControlsProps> = ({
  onBattleStart,
  isHost,
  hostReady,
  guestReady,
  loading,
  disabledReason,
}) => {
  const isButtonDisabled =
    loading || (isHost && !guestReady) || !!disabledReason;

  // Determine button styles based on states
  const getButtonStyle = () => {
    if (isHost && !guestReady) {
      return "bg-[#3a3a3a] hover:bg-[#4a4a4a] cursor-not-allowed";
    }
    if (!isHost && guestReady) {
      return "bg-[#E44D4D] hover:bg-[#C03A3A]";
    }
    return "bg-[#4D1EE3] hover:bg-purple-800";
  };

  // Determine button text based on states
  const getButtonText = () => {
    if (loading) {
      return <CircularProgress size={24} color="inherit" />;
    }

    if (isHost) {
      if (guestReady) {
        return (
          <>
            BATTLE START! -10
            <img
              src={ManaIcon}
              alt="Mana"
              className="w-4 h-4 sm:w-3 sm:h-3 md:w-5 md:h-5 ml-2 filter invert brightness-0"
            />
          </>
        );
      }
      return <>START 1/2 (Waiting for player)</>;
    }

    // Guest view
    return guestReady ? "CANCEL 2/2" : "START 1/2";
  };

  return (
    <motion.button
      onClick={onBattleStart}
      disabled={isButtonDisabled}
      className={`mt-6 sm:mt-11 w-full max-w-[250px] sm:max-w-[300px] md:max-w-[350px] py-2 sm:py-3 
        ${getButtonStyle()} 
        text-white rounded-lg text-md sm:text-lg shadow-lg transition flex items-center justify-center`}
      whileHover={!isButtonDisabled ? { scale: 1.05 } : {}}
      whileTap={!isButtonDisabled ? { scale: 0.95 } : {}}
    >
      {getButtonText()}
    </motion.button>
  );
};

export default BattleControls;
