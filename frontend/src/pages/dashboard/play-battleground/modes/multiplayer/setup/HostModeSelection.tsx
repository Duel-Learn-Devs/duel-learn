import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  LobbyStatusUpdate,
} from "../../../../../../../src/socket";
import axios from "axios";
import CardBackImg from "/General/CardDesignBack.png";
import DefaultBackHoverCard from "/cards/DefaultCardInside.png";
import "./styles/animations.css";
import NormalCardQuickDraw from "/GameBattle/NormalCardQuickDraw.png";
import NormalCardTimeManipulation from "/GameBattle/NormalCardTimeManipulation.png";
import EpicCardAnswerShield from "/GameBattle/EpicCardAnswerShield.png";
import EpicCardRegeneration from "/GameBattle/EpicCardRegeneration.png";
import RareCardMindControl from "/GameBattle/RareCardMindControl.png";
import RareCardPoisonType from "/GameBattle/RareCardPoisonType.png";

// Utility function for conditional class names
const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export default function DifficultySelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    lobbyCode,
    hostUsername,
    guestUsername,
    hostId,
    guestId,
    material,
    questionTypes,
  } = location.state || {};

  console.log("DifficultySelection state:", {
    lobbyCode,
    hostUsername,
    guestUsername,
    hostId,
    guestId,
    material,
    questionTypes,
    locationState: location.state,
  });

  const [selectedDifficulty, setSelectedDifficulty] =
    useState<string>("Easy Mode");
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [guestLeft, setGuestLeft] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [socketEvents, setSocketEvents] = useState<string[]>([]);

  // Add debug info
  const addDebugInfo = (info: string) => {
    console.log(`[HOST DEBUG] ${info}`);
    setDebugInfo((prev) =>
      [...prev, `${new Date().toLocaleTimeString()}: ${info}`].slice(-10)
    );
  };

  // Add socket event tracking
  const trackSocketEvent = (event: string, data?: any) => {
    const eventInfo = `${event}: ${
      data ? JSON.stringify(data).substring(0, 100) : "no data"
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
      `Host: ${hostUsername}, Guest: ${guestUsername}, GuestId: ${guestId}`
    );

    const handleGuestLeave = () => {
      addDebugInfo("Guest left, showing notification...");
      setGuestLeft(true);

      // Force navigation after delay
      const timer = setTimeout(() => {
        addDebugInfo("Forcing navigation to dashboard...");
        window.location.href = "/dashboard/home";
      }, 3000);

      return () => clearTimeout(timer);
    };

    // Listen for guest leaving through direct event
    socket.on("player_left_difficulty_selection", (data: PlayerLeftData) => {
      trackSocketEvent("player_left_difficulty_selection", data);
      addDebugInfo(`Received leave event: ${JSON.stringify(data)}`);
      console.log("Player left data:", data, "Guest ID:", guestId);

      // Check if this is the guest leaving
      if (!data.isHost) {
        // If we know the guest ID, check it matches
        if (guestId && data.leavingPlayerId === guestId) {
          addDebugInfo(`Match by ID: Guest ${guestId} left`);
          handleGuestLeave();
        }
        // Or just assume any non-host leaving is our guest
        else {
          addDebugInfo(`Non-host left: ${data.leavingPlayerId}`);
          handleGuestLeave();
        }
      }
    });

    // Listen for lobby status updates
    socket.on("lobby_status_update", (data: LobbyStatusUpdate) => {
      trackSocketEvent("lobby_status_update", data);
      addDebugInfo(`Lobby status update: ${JSON.stringify(data)}`);

      if (data.status === "player_left" && !data.isHost) {
        // Any non-host player leaving should trigger our notification
        addDebugInfo(`Player left from lobby status: ${data.leavingPlayerId}`);
        handleGuestLeave();
      }
    });

    // Fallback direct connection monitoring
    const checkGuestConnection = setInterval(() => {
      if (lobbyCode && guestId && !guestLeft) {
        // Poll server to check if guest is still in lobby
        axios
          .get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/battle/check-player/${lobbyCode}/${guestId}`
          )
          .then((response) => {
            if (response.data && response.data.status === "left") {
              addDebugInfo("Guest detected as left via API check");
              handleGuestLeave();
            }
          })
          .catch((err) => {
            console.error("Error checking guest status", err);
          });
      }
    }, 10000); // Check every 10 seconds

    // Handle direct client disconnection
    const handleDisconnect = () => {
      addDebugInfo("Socket disconnected, checking guest status");
      // Extra logic could be added here
    };

    socket.on("disconnect", handleDisconnect);

    // Cleanup function
    return () => {
      socket.off("player_left_difficulty_selection");
      socket.off("lobby_status_update");
      socket.off("disconnect", handleDisconnect);
      clearInterval(checkGuestConnection);
      addDebugInfo("Cleaned up socket listeners");
    };
  }, [lobbyCode, guestId, hostUsername, guestUsername, guestLeft]);

  // Responsive window width tracking
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLeavePage = () => {
    addDebugInfo("Handling leave action...");
    if (!hostId || !lobbyCode) {
      addDebugInfo("Error: Missing hostId or lobbyCode");
      return;
    }

    try {
      socket.emit("leave_difficulty_selection", {
        lobbyCode,
        leavingPlayerId: hostId,
        isHost: true,
      });
      addDebugInfo("Emitted leave event, navigating...");
      window.location.href = "/dashboard/home";
    } catch (err) {
      const error = err as Error;
      addDebugInfo(`Error leaving: ${error.message}`);
      window.location.href = "/dashboard/home";
    }
  };

  const getCardDimensions = () => {
    let width = 150; // base width for mobile (increased from 120)
    let height = 210; // base height for mobile (increased from 168)

    if (windowWidth >= 768) {
      // md screens
      width = 200; // increased from 160
      height = 280; // increased from 224
    }
    if (windowWidth >= 1024) {
      // lg screens
      width = 220; // increased from 180
      height = 308; // increased from 252
    }
    if (windowWidth >= 1280) {
      // xl screens
      width = 240; // increased from 200
      height = 336; // increased from 280
    }
    return { width: `${width}px`, height: `${height}px` };
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

  const handleStartGame = async () => {
    if (!selectedDifficulty || !lobbyCode) return;

    try {
      // Get study material ID from material object
      const studyMaterialId = material?.study_material_id || material?.id;

      console.log("Starting game with:", {
        difficulty: selectedDifficulty,
        studyMaterialId,
        material,
        questionTypes,
      });

      // First update difficulty in battle_invitations
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/difficulty`,
        {
          lobby_code: lobbyCode,
          difficulty: selectedDifficulty,
        }
      );

      // Then initialize entry in battle_sessions with all required fields
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/gameplay/battle/initialize-session`,
        {
          lobby_code: lobbyCode,
          host_id: hostId,
          guest_id: guestId,
          host_username: hostUsername,
          guest_username: guestUsername,
          total_rounds: 30,
          is_active: true,
          host_in_battle: true,
          guest_in_battle: false,
          difficulty_mode: selectedDifficulty,
          study_material_id: studyMaterialId,
          question_types: questionTypes, // Add question types to the initialization
        }
      );

      navigate(`/dashboard/pvp-battle/${lobbyCode}`, {
        state: {
          lobbyCode,
          difficulty: selectedDifficulty,
          isHost: true,
          hostUsername,
          guestUsername,
          hostId,
          guestId,
          material,
          questionTypes, // Pass question types to the battle screen
        },
      });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const handleDifficultyChange = (direction: "left" | "right") => {
    const difficulties = ["Easy Mode", "Average Mode", "Hard Mode"];
    const currentIndex = difficulties.indexOf(selectedDifficulty);
    const newIndex =
      direction === "left"
        ? (currentIndex - 1 + difficulties.length) % difficulties.length
        : (currentIndex + 1) % difficulties.length;
    setSelectedDifficulty(difficulties[newIndex]);
  };

  const getDifficultyDescription = () => {
    switch (selectedDifficulty) {
      case "Easy Mode":
        return "Easy mode includes cards that belong to easy mode only.";
      case "Average Mode":
        return "Average mode includes cards that belong to average mode only.";
      case "Hard Mode":
        return "Hard mode includes cards that belong to hard mode only.";
      default:
        return "";
    }
  };

  const cardVariants = {
    hover: { rotateY: 180, transition: { duration: 0.5, ease: "easeInOut" } },
    initial: { rotateY: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  };

  const cardDimensions = getCardDimensions();
  const cardImages = getCardImages();

  return (
    <div className="min-h-screen flex items-center justify-center text-white p-4 md:p-8 overflow-x-hidden">
      {/* Debug Panel - Commented out for production 
      <div className="fixed bottom-4 left-4 z-[9999] bg-black bg-opacity-90 p-4 rounded-lg text-white text-sm max-w-[400px]">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        {debugInfo.map((info, index) => (
          <div key={index} className="mb-1 text-xs">{info}</div>
        ))}
        
        <h3 className="font-bold mt-4 mb-2">Socket Events:</h3>
        {socketEvents.map((event, index) => (
          <div key={`event-${index}`} className="mb-1 text-xs text-green-400">{event}</div>
        ))}
        
        <div className="mt-3 pt-2 border-t border-gray-700">
          <p className="text-xs text-yellow-400">Guest ID: {guestId || 'unknown'}</p>
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
        disabled={guestLeft}
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
          opacity: guestLeft ? 0.5 : 1,
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
            {guestLeft
              ? "The guest has left. You will be redirected shortly."
              : "Are you sure you want to leave? This will end the game setup process for both players."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button
            onClick={() => {
              addDebugInfo("Leave cancelled");
              setOpenLeaveModal(false);
            }}
            disabled={guestLeft}
            sx={{
              color: "white",
              opacity: guestLeft ? 0.5 : 1,
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
            disabled={guestLeft}
            variant="contained"
            sx={{
              backgroundColor: "#6B21A8",
              opacity: guestLeft ? 0.5 : 1,
              "&:hover": { backgroundColor: "#5B1C98" },
            }}
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Guest Left Alert */}
      {guestLeft && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-8 py-4 rounded-lg shadow-lg animate-pulse border-2 border-red-400 max-w-md">
          <div className="flex items-center">
            <div className="mr-4 text-2xl">⚠️</div>
            <div>
              <p className="font-bold text-xl">
                {guestUsername} has left the game!
              </p>
              <p className="text-base mt-2">
                Redirecting to dashboard in a few seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto mt-10 md:mt-16 lg:mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-4">
          {/* Left Column - Difficulty Selection */}
          <div className="flex flex-col items-center lg:items-start gap-4 px-4 md:px-8 order-2 lg:order-1">
            <div className="w-full text-center lg:text-left mb-4 md:mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold mb-2">
                SELECT DIFFICULTY
              </h1>
              <p className="text-gray-400 text-base md:text-lg">
                Choose a difficulty level that matches your skill!
              </p>
            </div>

            <div className="w-full space-y-3 md:space-y-5 mb-4 md:mb-7">
              {["Easy Mode", "Average Mode", "Hard Mode"].map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  disabled={guestLeft}
                  className={cn(
                    "w-full md:max-w-[550px] py-6 md:py-10 pl-5 md:pl-10 rounded-xl text-lg md:text-xl font-medium text-left transition-all duration-200",
                    selectedDifficulty === difficulty
                      ? "bg-[#49347e] border-2 md:border-4 border-[#3d2577]"
                      : "bg-[#3B354D]",
                    guestLeft ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  {difficulty}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartGame}
              disabled={guestLeft}
              className={cn(
                "w-full md:w-[240px] py-3 md:py-4 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors font-bold text-lg text-white",
                guestLeft ? "opacity-50 cursor-not-allowed" : ""
              )}
            >
              Start Game
            </button>
          </div>

          {/* Right Column - Card Display */}
          <div className="flex flex-col items-center justify-center order-1 lg:order-2 h-full">
            <div className="relative w-full flex flex-col items-center justify-center">
              {/* Glow effect */}
              <div
                className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[600px] lg:h-[600px] bg-[#6B21A8] blur-[150px] md:blur-[200px] lg:blur-[250px] rounded-full opacity-40 animate-pulse"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 0,
                  animation: "pulse 3s infinite alternate",
                }}
              ></div>

              {/* Cards Container */}
              <div
                className="flex justify-center items-center mb-8 relative z-10 space-x-10"
                style={{
                  width: "clamp(300px, 45vw, 600px)",
                }}
              >
                {[0, 1].map((index) => (
                  <motion.div
                    key={index}
                    className="relative z-10 perspective"
                    style={{
                      width: cardDimensions.width,
                      height: cardDimensions.height,
                      perspective: "1000px",
                      transformStyle: "preserve-3d",
                    }}
                    initial="initial"
                    whileHover="hover"
                    variants={cardVariants}
                  >
                    <motion.div
                      className="absolute w-full h-full backface-hidden"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <img
                        src={CardBackImg}
                        alt="Card back design"
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                    <motion.div
                      className="absolute w-full h-full backface-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <img
                        src={getCardImages()[index]}
                        alt={`Card ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Description */}
              <div className="flex justify-center items-center w-full max-w-md mt-4">
                <button
                  onClick={() => handleDifficultyChange("left")}
                  aria-label="Previous difficulty"
                  className="p-2"
                >
                  <ChevronLeft size={28} />
                </button>
                <p className="text-center text-base md:text-lg text-gray-300 px-4 flex-1">
                  {getDifficultyDescription()}
                </p>
                <button
                  onClick={() => handleDifficultyChange("right")}
                  aria-label="Next difficulty"
                  className="p-2"
                >
                  <ChevronRight size={28} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
