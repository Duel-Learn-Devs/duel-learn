import React from "react";
import { motion } from "framer-motion";
import { Add } from "@mui/icons-material";
import defaultAvatar from "/profile-picture/default-picture.svg";

interface PlayerInfo {
  firebase_uid: string;
  username: string;
  level: number;
  display_picture: string | null;
}

interface PlayerCardProps {
  player: PlayerInfo | null;
  isHost: boolean;
  isPending?: boolean;
  onClick?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isHost,
  isPending = false,
  onClick,
}) => {
  const isNoPlayer = !player;
  const cursorStyle =
    isNoPlayer && !isHost ? "cursor-pointer" : "cursor-default";

  return (
    <motion.div
      className={`flex flex-col items-center ${cursorStyle}`}
      onClick={!isHost && isNoPlayer ? onClick : undefined}
    >
      <div className="relative">
        <div
          className={`w-16 h-16 sm:w-[185px] sm:h-[185px] mt-5 rounded-md flex items-center justify-center ${
            isNoPlayer ? "bg-white bg-opacity-30" : ""
          }`}
        >
          {player ? (
            <>
              <motion.img
                src={player.display_picture || defaultAvatar}
                alt={`${player.username}'s Avatar`}
                className="w-full h-full rounded-md"
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={
                  isPending
                    ? { scale: [0.95, 1.05, 0.95], opacity: [0.5, 0.7, 0.5] }
                    : { scale: 1, opacity: 1 }
                }
                transition={
                  isPending
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.5 }
                }
              />
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-purple-500 text-sm font-semibold bg-black bg-opacity-50 px-3 py-1 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    Waiting for player...
                  </motion.div>
                </div>
              )}
            </>
          ) : (
            <Add className="text-gray-500" style={{ fontSize: "48px" }} />
          )}
        </div>
        <div className={`text-center mt-5 ${isPending ? "opacity-50" : ""}`}>
          <p className="text-sm sm:text-base font-semibold">
            {player ? player.username : isHost ? "HOST" : "PLAYER 2"}
          </p>
          <p className="text-xs sm:text-sm text-gray-400">
            {player ? `LVL ${player.level}` : "LVL ???"}
          </p>
          {isPending && (
            <p className="text-xs text-purple-400 mt-1">Invitation sent</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
