import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import PoisonatedEffect from "/GameBattle/PoisonatedEffect.png";
import DefaultProfilePic from "/profile-picture/default-picture.svg";
import { BattleState } from "../BattleState";

export interface PlayerInfoProps {
  name: string;
  health: number;
  maxHealth: number;
  isRightAligned?: boolean;
  userId?: string;
  poisonEffectActive?: boolean;
  battleState?: BattleState | null;
}

/**
 * PlayerInfo component displays player avatar, name, and health bar
 */
const PlayerInfo: React.FC<PlayerInfoProps> = ({
  name,
  health,
  maxHealth,
  isRightAligned = false,
  userId,
  poisonEffectActive = false,
  battleState,
}) => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previousHealth, setPreviousHealth] = useState(health);
  const [isHit, setIsHit] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

  // Update previous health when health changes
  useEffect(() => {
    if (health < previousHealth) {
      setIsHit(true);
      setIsHealing(false);
      // Reset hit state after animation
      setTimeout(() => setIsHit(false), 500);
    } else if (health > previousHealth) {
      setIsHealing(true);
      setIsHit(false);
      // Reset healing state after animation
      setTimeout(() => setIsHealing(false), 1000);
    }
    setPreviousHealth(health);
  }, [health]);

  // Fetch user profile picture if userId is provided
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user-info/profile/${userId}`
        );

        if (response.data.success && response.data.data.display_picture) {
          setProfilePicture(response.data.data.display_picture);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // Generate avatar for the user
  const renderAvatar = () => {
    if (loading) {
      // Show loading state
      return (
        <motion.div
          className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gray-600 rounded-lg animate-pulse ${
            poisonEffectActive
              ? "border-2 border-green-400 shadow-lg shadow-green-500/50"
              : ""
          }`}
          animate={
            isHit
              ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, -5, 5, 0],
                  transition: { duration: 0.5 },
                }
              : poisonEffectActive
              ? {
                  filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
                  boxShadow: [
                    "0 0 0 rgba(74, 222, 128, 0.4)",
                    "0 0 10px rgba(74, 222, 128, 0.7)",
                    "0 0 0 rgba(74, 222, 128, 0.4)",
                  ],
                  transition: { duration: 2, repeat: Infinity },
                }
              : {}
          }
        />
      );
    }

    if (profilePicture) {
      // Show profile picture if available
      return (
        <motion.div
          className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gray-800 rounded-lg overflow-hidden ${
            poisonEffectActive
              ? "border-2 border-green-400 shadow-lg shadow-green-500/50"
              : ""
          }`}
          animate={
            isHit
              ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, -5, 5, 0],
                  filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                  transition: { duration: 0.5 },
                }
              : poisonEffectActive
              ? {
                  filter: [
                    "brightness(1) hue-rotate(0deg)",
                    "brightness(1.2) hue-rotate(60deg)",
                    "brightness(1) hue-rotate(0deg)",
                  ],
                  boxShadow: [
                    "0 0 0 rgba(74, 222, 128, 0.4)",
                    "0 0 10px rgba(74, 222, 128, 0.7)",
                    "0 0 0 rgba(74, 222, 128, 0.4)",
                  ],
                  transition: { duration: 2, repeat: Infinity },
                }
              : {}
          }
          style={{
            backgroundImage: `url(${profilePicture})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      );
    }

    // Default cat profile picture when no profile picture is available
    return (
      <motion.div
        className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gray-800 rounded-lg overflow-hidden ${
          poisonEffectActive
            ? "border-2 border-green-400 shadow-lg shadow-green-500/50"
            : ""
        }`}
        animate={
          isHit
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, -5, 5, 0],
                filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                transition: { duration: 0.5 },
              }
            : poisonEffectActive
            ? {
                filter: [
                  "brightness(1) hue-rotate(0deg)",
                  "brightness(1.2) hue-rotate(60deg)",
                  "brightness(1) hue-rotate(0deg)",
                ],
                boxShadow: [
                  "0 0 0 rgba(74, 222, 128, 0.4)",
                  "0 0 10px rgba(74, 222, 128, 0.7)",
                  "0 0 0 rgba(74, 222, 128, 0.4)",
                ],
                transition: { duration: 2, repeat: Infinity },
              }
            : {}
        }
        style={{
          backgroundImage: `url(${DefaultProfilePic})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  };

  return (
    <motion.div
      className={`flex items-center gap-2 sm:gap-3 flex-1 ${
        isRightAligned ? "justify-end" : ""
      }`}
      animate={
        isHit
          ? {
              x: [0, -5, 5, -5, 5, 0],
              transition: { duration: 0.5 },
            }
          : isHealing
          ? {
              y: [0, -2, 0, -2, 0],
              transition: { duration: 0.5 },
            }
          : {}
      }
    >
      {!isRightAligned && renderAvatar()}
      <div
        className={`flex flex-col gap-1 ${isRightAligned ? "items-end" : ""}`}
      >
        <div
          className={`text-xs sm:text-sm ${
            poisonEffectActive
              ? "text-green-400 font-semibold"
              : isHealing
              ? "text-green-400 font-semibold"
              : "text-white"
          }`}
        >
          {poisonEffectActive ? (
            <motion.span
              animate={{
                textShadow: [
                  "0 0 0px #4ade80",
                  "0 0 8px #4ade80",
                  "0 0 0px #4ade80",
                ],
                transition: { duration: 2, repeat: Infinity },
              }}
            >
              {name}
            </motion.span>
          ) : isHealing ? (
            <motion.span
              animate={{
                textShadow: [
                  "0 0 0px #4ade80",
                  "0 0 8px #4ade80",
                  "0 0 0px #4ade80",
                ],
                transition: { duration: 1, repeat: 2 },
              }}
            >
              {name}
            </motion.span>
          ) : (
            name
          )}
        </div>
        <div
          className={`flex items-center gap-1 ${
            isRightAligned ? "justify-end" : ""
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={health}
              initial={{
                y: -20,
                opacity: 0,
                color: isHit ? "#ff0000" : isHealing ? "#10b981" : "#ffffff",
              }}
              animate={{
                y: 0,
                opacity: 1,
                color: poisonEffectActive
                  ? "#4ade80"
                  : isHealing
                  ? "#10b981"
                  : "#ffffff",
                textShadow: poisonEffectActive
                  ? ["0 0 0px #4ade80", "0 0 5px #4ade80", "0 0 0px #4ade80"]
                  : isHealing
                  ? ["0 0 0px #10b981", "0 0 5px #10b981", "0 0 0px #10b981"]
                  : "none",
                transition:
                  poisonEffectActive || isHealing
                    ? {
                        duration: 2,
                        repeat: poisonEffectActive ? Infinity : 0,
                        color: { duration: 0.3 },
                      }
                    : { duration: 0.3 },
              }}
              exit={{ y: 20, opacity: 0 }}
              className="text-[10px] sm:text-xs font-bold"
            >
              {health} HP
            </motion.span>
          </AnimatePresence>
          <span
            className={`text-[10px] sm:text-xs ${
              poisonEffectActive
                ? "text-green-700"
                : isHealing
                ? "text-green-700"
                : "text-gray-500"
            }`}
          >
            /{maxHealth}
          </span>
        </div>
        <div
          className={`w-20 sm:w-36 md:w-48 lg:w-64 h-2 lg:h-2.5 bg-gray-900 rounded-full overflow-hidden ${
            poisonEffectActive
              ? "border border-green-400"
              : isHealing
              ? "border border-green-500"
              : ""
          }`}
        >
          <motion.div
            className={`h-full ${
              poisonEffectActive ? "bg-green-500" : "bg-purple-600"
            } rounded-full`}
            initial={{ width: `${(previousHealth / maxHealth) * 100}%` }}
            animate={{
              width: `${(health / maxHealth) * 100}%`,
              backgroundColor: isHit
                ? "#ff0000"
                : isHealing
                ? "#10b981"
                : poisonEffectActive
                ? "#4ade80"
                : "#9333ea",
              boxShadow: poisonEffectActive
                ? [
                    "inset 0 0 0px #4ade80",
                    "inset 0 0 8px #fff",
                    "inset 0 0 0px #4ade80",
                  ]
                : isHealing
                ? [
                    "inset 0 0 0px #10b981",
                    "inset 0 0 12px #fff",
                    "inset 0 0 0px #10b981",
                  ]
                : "none",
              transition: {
                width: { duration: 0.3, ease: "easeOut" },
                backgroundColor: { duration: 0.3 },
                boxShadow:
                  poisonEffectActive || isHealing
                    ? {
                        duration: poisonEffectActive ? 2 : 1,
                        repeat: poisonEffectActive ? Infinity : 2,
                      }
                    : { duration: 0 },
              },
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full ${
              isRightAligned ? "ml-auto mr-1" : "ml-1"
            } mt-1`}
            animate={
              poisonEffectActive
                ? {
                    backgroundColor: ["#ffffff", "#d9ffcc", "#ffffff"],
                    boxShadow: [
                      "0 0 0px #4ade80",
                      "0 0 5px #4ade80",
                      "0 0 0px #4ade80",
                    ],
                    transition: { duration: 2, repeat: Infinity },
                  }
                : isHealing
                ? {
                    backgroundColor: ["#ffffff", "#d9ffcc", "#ffffff"],
                    boxShadow: [
                      "0 0 0px #10b981",
                      "0 0 5px #10b981",
                      "0 0 0px #10b981",
                    ],
                    transition: { duration: 1, repeat: 2 },
                  }
                : {}
            }
          ></motion.div>
          {poisonEffectActive && (
            <motion.img
              src={PoisonatedEffect}
              alt="Poisonated Effect"
              className="w-5 h-5 lg:w-6 lg:h-6 mt-1"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0, -5, 0],
                filter: [
                  "drop-shadow(0 0 0px #4ade80)",
                  "drop-shadow(0 0 3px #4ade80)",
                  "drop-shadow(0 0 0px #4ade80)",
                ],
                transition: { duration: 1.5, repeat: Infinity },
              }}
            />
          )}
        </div>
      </div>
      {isRightAligned && renderAvatar()}
    </motion.div>
  );
};

export default PlayerInfo;
