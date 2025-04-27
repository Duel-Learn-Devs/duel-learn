"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/HostModeSelection.css";
import "./styles/animations.css";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  IconButton,
} from "@mui/material";
import {
  socket,
  PlayerLeftData,
  LobbyClosedData,
  LobbyStatusUpdate,
} from "../../../../../../../src/socket";
import "../../../../../user-onboarding/styles/EffectUserOnboarding.css";
import CardBackImg from "/General/CardDesignBack.png";
import DefaultBackHoverCard from "/cards/DefaultCardInside.png";
import NormalCardQuickDraw from "/GameBattle/NormalCardQuickDraw.png";
import NormalCardTimeManipulation from "/GameBattle/NormalCardTimeManipulation.png";
import EpicCardAnswerShield from "/GameBattle/EpicCardAnswerShield.png";
import EpicCardRegeneration from "/GameBattle/EpicCardRegeneration.png";
import RareCardMindControl from "/GameBattle/RareCardMindControl.png";
import RareCardPoisonType from "/GameBattle/RareCardPoisonType.png";

export default function Player2ModeSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hostUsername, guestUsername, lobbyCode, hostId, guestId } =
    location.state || {};
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<string>("Easy Mode");
  const [hostSelectedDifficulty, setHostSelectedDifficulty] = useState<
    string | null
  >(null);
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [hostLeft, setHostLeft] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isJoiningBattle, setIsJoiningBattle] = useState(false);

  // Add debug info
  const addDebugInfo = (info: string) => {
    console.log(`[GUEST DEBUG] ${info}`);
    setDebugInfo((prev) =>
      [...prev, `${new Date().toLocaleTimeString()}: ${info}`].slice(-10)
    );
  };

  // Add socket event tracking
  const [socketEvents, setSocketEvents] = useState<string[]>([]);
  const trackSocketEvent = (event: string, data?: any) => {
    const eventInfo = `${event}: ${data ? JSON.stringify(data).substring(0, 100) : "no data"
      }`;
    console.log(`[SOCKET EVENT] ${eventInfo}`);
    setSocketEvents((prev) =>
      [...prev, `${new Date().toLocaleTimeString()}: ${eventInfo}`].slice(-5)
    );
  };

  // Socket debug setup
  useEffect(() => {
    // Create a handler that captures all socket events
    const handleAny = (event: string, ...args: any[]) => {
      trackSocketEvent(event, args[0]);
    };

    socket.onAny(handleAny);

    return () => {
      socket.offAny(handleAny);
    };
  }, []);

  // Debug connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      const status = document.body.getAttribute("data-socket-status");
      addDebugInfo(`Socket status: ${status}`);
    };
    updateConnectionStatus();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-socket-status") {
          updateConnectionStatus();
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Make sure we join the lobby room to receive events
  useEffect(() => {
    if (lobbyCode) {
      addDebugInfo(`Joining lobby: ${lobbyCode}`);
      // Join using socket.io room
      socket.emit("join", lobbyCode);
    }

    return () => {
      if (lobbyCode) {
        socket.emit("leave", lobbyCode);
      }
    };
  }, [lobbyCode]);

  useEffect(() => {
    addDebugInfo(`Component mounted with lobbyCode: ${lobbyCode}`);
    addDebugInfo(
      `Host: ${hostUsername}, Guest: ${guestUsername}, HostId: ${hostId}`
    );

    const handleHostLeave = () => {
      setHostLeft(true);
      addDebugInfo("Host left, preparing to redirect...");
      // Force navigation after delay
      const timer = setTimeout(() => {
        addDebugInfo("Forcing navigation to dashboard...");
        window.location.href = "/dashboard/home";
      }, 3000);

      // Cleanup timer if component unmounts
      return () => clearTimeout(timer);
    };

    // Listen for host leaving
    socket.on("player_left_difficulty_selection", (data: PlayerLeftData) => {
      addDebugInfo(`Received leave event: ${JSON.stringify(data)}`);
      console.log("Player left data:", data, "Host ID:", hostId);

      // Check if this is the host leaving - multiple ways to verify
      if (data.isHost) {
        if (data.leavingPlayerId === hostId) {
          addDebugInfo(`Match by ID: Host ${hostId} left`);
          handleHostLeave();
        } else {
          addDebugInfo(
            `WARNING: Host left but ID doesn't match our host: ${data.leavingPlayerId} vs ${hostId}`
          );
          // Still handle as host left since isHost flag is true
          handleHostLeave();
        }
      }
    });

    // Listen for lobby closed event
    socket.on("lobby_closed", (data: LobbyClosedData) => {
      addDebugInfo(`Lobby closed: ${JSON.stringify(data)}`);
      if (data.reason === "host_left") {
        handleHostLeave();
      }
    });

    // Listen for lobby status updates
    socket.on("lobby_status_update", (data: LobbyStatusUpdate) => {
      addDebugInfo(`Lobby status update: ${JSON.stringify(data)}`);
      if (data.status === "player_left" && data.isHost) {
        if (data.leavingPlayerId === hostId) {
          addDebugInfo(`Match by lobby status: Host ${hostId} left`);
          handleHostLeave();
        } else {
          addDebugInfo(
            `WARNING: Host left from lobby status but ID doesn't match: ${data.leavingPlayerId} vs ${hostId}`
          );
          // Still handle as host left since isHost flag is true
          handleHostLeave();
        }
      }
    });

    // Cleanup function
    return () => {
      socket.off("player_left_difficulty_selection");
      socket.off("lobby_closed");
      socket.off("lobby_status_update");
      addDebugInfo("Cleaned up socket listeners");
    };
  }, [navigate, lobbyCode, hostId, hostUsername, guestUsername]);

  // Poll for host's difficulty selection
  useEffect(() => {
    if (isNavigating) return; // Skip checks if already navigating

    const checkDifficulty = async () => {
      try {
        // First check if the host has selected a difficulty
        const difficultyResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL
          }/api/battle/invitations-lobby/difficulty/${lobbyCode}`
        );

        if (
          difficultyResponse.data.success &&
          difficultyResponse.data.data.difficulty
        ) {
          // Show difficulty immediately
          setHostSelectedDifficulty(difficultyResponse.data.data.difficulty);
          setSelectedDifficulty(difficultyResponse.data.data.difficulty);

          // Then check if the host has actually created a battle session and entered
          const sessionResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/session-state/${lobbyCode}`
          );

          // Only proceed if the host has created a session and is in battle
          if (
            sessionResponse.data.success &&
            sessionResponse.data.data.host_in_battle === 1
          ) {
            console.log("Host has entered the battle, joining now...");

            // Set navigating state to prevent multiple attempts
            setIsNavigating(true);
            // Show joining UI immediately
            setIsJoiningBattle(true);

            // Clear the interval before doing anything else
            clearInterval(interval);

            try {
              // When host has selected and entered, update battle_sessions to mark guest as ready
              await axios.put(
                `${import.meta.env.VITE_BACKEND_URL
                }/api/gameplay/battle/update-session`,
                {
                  lobby_code: lobbyCode,
                  guest_in_battle: true, // Mark guest as entered
                }
              );

              // Add slightly longer delay before navigation to ensure UI shows properly and data is synchronized
              setTimeout(() => {
                // Navigate to battle
                navigate(`/dashboard/pvp-battle/${lobbyCode}`, {
                  state: {
                    lobbyCode,
                    difficulty: difficultyResponse.data.data.difficulty,
                    isHost: false,
                    hostUsername,
                    guestUsername,
                    hostId,
                    guestId,
                  },
                  replace: true, // Use replace instead of push to prevent back navigation
                });
              }, 1500);
            } catch (err) {
              console.error("Error updating session:", err);
              setIsNavigating(false); // Reset if there's an error
              setIsJoiningBattle(false); // Hide the joining UI
            }
          } else {
            console.log(
              "Host has selected difficulty but hasn't entered the battle yet. Waiting..."
            );
          }
        }
      } catch (error) {
        console.error("Error checking host status:", error);
      }
    };

    // Check immediately 
    checkDifficulty();

    // Then check every 3 seconds (was 3000)
    const interval = setInterval(checkDifficulty, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [
    lobbyCode,
    navigate,
    hostUsername,
    guestUsername,
    hostId,
    guestId,
    isNavigating,
  ]);

  const handleLeavePage = () => {
    addDebugInfo("Handling leave action...");
    if (!guestId || !lobbyCode) {
      addDebugInfo("Error: Missing guestId or lobbyCode");
      return;
    }

    try {
      // Broadcast multiple leave notifications for redundancy
      addDebugInfo(
        `Emitting leave event for ${guestId} from lobby ${lobbyCode}`
      );

      // Primary leave notification
      socket.emit("leave_difficulty_selection", {
        lobbyCode,
        leavingPlayerId: guestId,
        isHost: false,
      });

      // Also emit a direct message to the lobby
      socket.emit("to_lobby", {
        lobbyCode,
        type: "player_left",
        playerId: guestId,
        isHost: false,
      });

      // Explicitly disconnect from the socket
      setTimeout(() => {
        addDebugInfo("Emitted leave event, navigating...");
        // Force navigation using window.location
        window.location.href = "/dashboard/home";
      }, 500); // Small delay to allow socket events to be sent
    } catch (err) {
      const error = err as Error;
      addDebugInfo(`Error leaving: ${error.message}`);
      // Still force navigation even if socket emit fails
      window.location.href = "/dashboard/home";
    }
  };

  const handleManualSelection = (mode: string) => {
    setSelectedDifficulty(mode);
  };

  const handleDifficultyChange = (direction: "left" | "right") => {
    if (direction === "left") {
      if (selectedDifficulty === "Easy Mode") {
        setSelectedDifficulty("Hard Mode"); // Loop back to Hard Mode
      } else if (selectedDifficulty === "Average Mode") {
        setSelectedDifficulty("Easy Mode");
      } else if (selectedDifficulty === "Hard Mode") {
        setSelectedDifficulty("Average Mode");
      }
    } else if (direction === "right") {
      if (selectedDifficulty === "Easy Mode") {
        setSelectedDifficulty("Average Mode");
      } else if (selectedDifficulty === "Average Mode") {
        setSelectedDifficulty("Hard Mode");
      } else if (selectedDifficulty === "Hard Mode") {
        setSelectedDifficulty("Easy Mode"); // Loop back to Easy Mode
      }
    }
  };

  const getCardImages = () => {
    switch (selectedDifficulty) {
      case "Easy Mode":
        return [NormalCardQuickDraw, NormalCardTimeManipulation];
      case "Average Mode":
        return [EpicCardAnswerShield, EpicCardRegeneration];
      case "Hard Mode":
        return [RareCardMindControl, RareCardPoisonType];
      default:
        return [NormalCardQuickDraw, NormalCardTimeManipulation];
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen text-white p-4 md:p-8">
      {/* Debug Panel - Commented out for production
      <div className="fixed bottom-4 left-4 z-[9999] bg-black bg-opacity-90 p-4 rounded-lg text-white text-sm max-w-[400px]">
        <h3 className="font-bold mb-2">Debug Info (Guest View):</h3>
        {debugInfo.map((info, index) => (
          <div key={index} className="mb-1 text-xs">{info}</div>
        ))}
        
        <h3 className="font-bold mt-4 mb-2">Socket Events:</h3>
        {socketEvents.map((event, index) => (
          <div key={`event-${index}`} className="mb-1 text-xs text-green-400">{event}</div>
        ))}
        
        <div className="mt-3 pt-2 border-t border-gray-700">
          <p className="text-xs text-yellow-400">Host ID: {hostId || 'unknown'}</p>
          <p className="text-xs text-yellow-400">Lobby: {lobbyCode || 'unknown'}</p>
        </div>
      </div>
      */}

      {/* Back Button */}
      <IconButton
        onClick={() => {
          addDebugInfo("Back button clicked");
          setOpenLeaveModal(true);
        }}
        disabled={hostLeft}
        sx={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "white",
          backgroundColor: "rgba(107, 33, 168, 0.1)",
          "&:hover": {
            backgroundColor: "rgba(107, 33, 168, 0.2)",
          },
          zIndex: 1000,
          opacity: hostLeft ? 0.5 : 1,
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Leave Confirmation Modal */}
      <Dialog
        open={openLeaveModal}
        onClose={() => {
          addDebugInfo("Modal closed");
          setOpenLeaveModal(false);
        }}
        PaperProps={{
          style: {
            backgroundColor: "#1a1a1a",
            color: "white",
            border: "1px solid #333",
          },
        }}
      >
        <DialogTitle>Leave Game Setup?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "gray" }}>
            {hostLeft
              ? "The host has left. You will be redirected shortly."
              : "Are you sure you want to leave? This will end the game setup process."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button
            onClick={() => {
              addDebugInfo("Leave cancelled");
              setOpenLeaveModal(false);
            }}
            disabled={hostLeft}
            sx={{
              color: "white",
              opacity: hostLeft ? 0.5 : 1,
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              addDebugInfo("Leave confirmed");
              handleLeavePage();
            }}
            disabled={hostLeft}
            variant="contained"
            sx={{
              backgroundColor: "#6B21A8",
              opacity: hostLeft ? 0.5 : 1,
              "&:hover": { backgroundColor: "#5B1C98" },
            }}
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Host Left Alert */}
      {hostLeft && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse border-2 border-red-400">
          <div className="flex items-center">
            <div className="mr-3 text-xl">⚠️</div>
            <div>
              <p className="font-bold text-lg">
                {hostUsername} has left the game
              </p>
              <p className="text-sm mt-1">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}

      {/* Joining Battle Overlay */}
      {isJoiningBattle && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-t-4 border-purple-600 border-solid rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Joining Battle</h2>
          <p className="text-gray-300">Connecting with {hostUsername}...</p>
        </div>
      )}

      <div className="w-full max-w-5xl mt-10 md:mt-20 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-xl sm:text-2xl md:text-[33px] mt-[-20px] md:mt-[-40px] font-bold mb-3 px-3 mb-5 sm:px-0">
            {hostUsername ? `${hostUsername.toUpperCase()} IS` : "HOST"}{" "}
            CURRENTLY SELECTING DIFFICULTY
            <span className="dot-1">.</span>
            <span className="dot-2">.</span>
            <span className="dot-3">.</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-lg">
            Please wait while the host makes their selection
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex justify-center w-full mb-8 md:mb-16 relative z-10 overflow-x-auto">
          <div className="flex space-x-3 md:space-x-10">
            <button
              onClick={() => handleManualSelection("Easy Mode")}
              disabled={hostLeft}
              className={`px-4 md:px-8 py-2 md:py-3 text-sm md:text-base transition-all ${hostLeft ? "opacity-50 cursor-not-allowed " : "cursor-pointer "
                }${selectedDifficulty === "Easy Mode"
                  ? "text-[#6B21A8] font-bold border-b-2 border-[#6B21A8]"
                  : "text-gray-400 hover:text-gray-300"
                }`}
            >
              EASY MODE
            </button>
            <button
              onClick={() => handleManualSelection("Average Mode")}
              disabled={hostLeft}
              className={`px-4 md:px-8 py-2 md:py-3 text-sm md:text-lg transition-all ${hostLeft ? "opacity-50 cursor-not-allowed " : "cursor-pointer "
                }${selectedDifficulty === "Average Mode"
                  ? "text-[#6B21A8] font-bold border-b-2 border-[#6B21A8]"
                  : "text-gray-400 hover:text-gray-300"
                }`}
            >
              AVERAGE MODE
            </button>
            <button
              onClick={() => handleManualSelection("Hard Mode")}
              disabled={hostLeft}
              className={`px-4 md:px-8 py-2 md:py-3 text-sm md:text-lg transition-all ${hostLeft ? "opacity-50 cursor-not-allowed " : "cursor-pointer "
                }${selectedDifficulty === "Hard Mode"
                  ? "text-[#6B21A8] font-bold border-b-2 border-[#6B21A8]"
                  : "text-gray-400 hover:text-gray-300"
                }`}
            >
              HARD MODE
            </button>
          </div>
        </div>

        {/* Card Grid */}
        <div className="relative w-full flex justify-center">
          {/* Glow effect */}
          <div
            className="absolute w-3/4 md:w-[600px] h-3/4 md:h-[600px] bg-[#6B21A8] blur-[150px] md:blur-[250px] rounded-full opacity-40 animate-glow"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 0,
            }}
          ></div>

          {/* Cards with responsive spacing */}
          <div
            className="grid grid-cols-2 gap-4 md:gap-8 lg:gap-14 mb-8 md:mb-14 relative z-10 mx-auto px-2"
            style={{
              maxWidth: "fit-content",
              width: "clamp(300px, 50vw, 500px)",
              placeItems: "center",
            }}
          >
            {[0, 1].map((index) => (
              <div
                key={index}
                className="flip-card relative z-10"
                style={{
                  width: "clamp(120px, 20vw, 180px)",
                  height: "clamp(160px, 28vw, 250px)",
                }}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <img
                      src={CardBackImg}
                      alt="Card back design"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flip-card-back">
                    <img
                      src={getCardImages()[index]}
                      alt={`Card ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex justify-center items-center w-full max-w-xl mt-6 md:mt-10 px-4">
          <button
            className="p-1 md:p-2 bg-transparent"
            onClick={() => handleDifficultyChange("left")}
            disabled={hostLeft}
          >
            <KeyboardArrowLeft style={{ opacity: hostLeft ? 0.5 : 1 }} />
          </button>
          <p className="text-center text-sm md:text-lg text-gray-300 mx-2 md:mx-8">
            {selectedDifficulty === "Easy Mode" &&
              "Easy mode includes cards that belong to easy mode only."}
            {selectedDifficulty === "Average Mode" &&
              "Average mode includes cards that belong to average mode only."}
            {selectedDifficulty === "Hard Mode" &&
              "Hard mode includes cards that belong to hard mode only."}
          </p>
          <button
            className="p-1 md:p-2 bg-transparent"
            onClick={() => handleDifficultyChange("right")}
            disabled={hostLeft}
          >
            <KeyboardArrowRight style={{ opacity: hostLeft ? 0.5 : 1 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
