import {
  Box,
  Card,
  CardContent,
  Typography,
  CardMedia,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/system";
import { useState } from "react";
import SelectStudyMaterialModal from "./modals/SelectStudyMaterialModal";
import PvPOptionsModal from "./modals/PvPOptionsModal";
import { StudyMaterial } from "../types/studyMaterialObject";
import { useAudio } from "../contexts/AudioContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createNewLobby,
  joinExistingLobby,
  navigateToWelcomeScreen,
} from "../services/pvpLobbyService";
import useManaCheck from "../hooks/useManaCheck";
import ManaAlertModal from "../pages/dashboard/play-battleground/modes/multiplayer/components/ManaAlertModal";

// Using a function to make the styled component responsive with theme access
const ModeCard = styled(Card)(({ theme }) => {
  const isXsScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return {
    padding: isXsScreen ? "1rem 0.75rem" : "1.5rem 0.75rem", // Responsive padding with rem
    borderRadius: "0.8rem",
    height: isXsScreen ? "120px" : "220px", // Fixed height values instead of vh
    minHeight: isXsScreen ? "120px" : "140px", // Min height with px
    maxHeight: isXsScreen ? "180px" : "240px", // Max height with px
    width: "100%",
    cursor: "pointer",
    background: "#E2DDF3",
    position: "relative", // Add position relative
    transform: "scale(1)",
    transition: "all 0.3s",
    overflow: "hidden", // Prevent content overflow
    "& .cardMedia": {
      transform: "scale(1)",
      transition: "transform 0.5s ease-in-out",
    },
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 10px 20px rgba(0,0,0,0.12)", // Add shadow for lifting effect
      "& .cardMedia": {
        transform: "scale(1.05)", // Scale and translate on hover
      },
    },
  };
});

interface ChooseYourChallengeProps {
  onSelectMode?: (mode: string) => void;
  onSelectMaterial?: (material: StudyMaterial) => void;
}

// Update the mode names and types to match ChooseModeModal
const modeToTypesMap = {
  "Peaceful Mode": ["identification", "multiple-choice", "true-false"],
  "Time Pressured": ["identification", "multiple-choice", "true-false"],
  "PvP Mode": ["identification", "multiple-choice", "true-false"],
};

const ChooseYourChallenge: React.FC<ChooseYourChallengeProps> = ({
  onSelectMode,
  onSelectMaterial,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preSelectedMaterial, skipMaterialSelection } = location.state || {};
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isLobby, setIsLobby] = useState(false);
  const [pvpOptionsOpen, setPvpOptionsOpen] = useState(false);
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { setActiveModeAudio } = useAudio();
  const [modalHistoryStack, setModalHistoryStack] = useState<string[]>([]);

  // Initialize mana check hook with PVP requirement (10 mana)
  const {
    hasSufficientMana,
    isManaModalOpen,
    closeManaModal,
    currentMana,
    requiredMana,
  } = useManaCheck(10);

  // Close all modals
  const closeAllModals = () => {
    setModalOpen(false);
    setPvpOptionsOpen(false);
    setModalHistoryStack([]);
  };

  // Handler for material selection
  const handleMaterialSelect = (material: StudyMaterial) => {
    if (onSelectMaterial) {
      onSelectMaterial(material);
    }
    setModalOpen(false);

    // If this is for PVP mode, use the lobby service
    if (selectedMode === "PvP Mode" || selectedMode === "PvP") {
      const lobbyState = createNewLobby(selectedMode, material);
      navigateToWelcomeScreen(navigate, lobbyState);
    } else {
      // Regular flow for other modes
      navigate("/dashboard/welcome-game-mode", {
        state: {
          mode: selectedMode,
          material,
          skipMaterialSelection: skipMaterialSelection,
        },
      });
    }
  };

  // Handler for mode selection
  const handleModeSelect = (mode: string) => {
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  // Handler for back button from study material modal
  const handleStudyMaterialBack = () => {
    setModalOpen(false);

    // Check if we have a previous modal to go back to
    if (modalHistoryStack.length > 0) {
      const prevModal = modalHistoryStack[modalHistoryStack.length - 1];
      setModalHistoryStack((stack) => stack.slice(0, -1)); // Remove current modal from history

      if (prevModal === "pvpOptions") {
        setPvpOptionsOpen(true);
      }
    }
  };

  // Handler for material selection modal close button
  const handleStudyMaterialClose = () => {
    closeAllModals();
  };

  // Handler for PvP options modal back button
  const handlePvPOptionsBack = () => {
    setPvpOptionsOpen(false);
    setModalHistoryStack([]);
  };

  // Handler for PvP options modal close button
  const handlePvPOptionsClose = () => {
    closeAllModals();
  };

  // Update handleModeClick to check mana for PvP mode
  const handleModeClick = (mode: string) => {
    setSelectedMode(mode);
    setSelectedTypes(modeToTypesMap[mode as keyof typeof modeToTypesMap] || []);

    // Check mana for Time Pressured mode
    if (mode === "Time Pressured") {
      // Check if user has enough mana
      if (!hasSufficientMana()) {
        // Modal will be shown automatically via the hook
        return;
      }
    }

    // If it's PvP mode, check mana and then show material selection directly
    if (mode === "PvP Mode") {
      // Check if user has enough mana
      if (!hasSufficientMana()) {
        // Modal will be shown automatically via the hook
        return;
      }

      setIsLobby(true);
      setModalOpen(true); // Open material selection modal directly
      setModalHistoryStack([]);
      return;
    }

    // For other modes, show material selection
    if (skipMaterialSelection && preSelectedMaterial) {
      if (onSelectMode) {
        onSelectMode(mode);
      }
      if (onSelectMaterial) {
        onSelectMaterial(preSelectedMaterial);
      }

      navigate("/dashboard/welcome-game-mode", {
        state: {
          mode,
          material: preSelectedMaterial,
          preSelectedMaterial,
          skipMaterialSelection: true,
        },
      });
    } else {
      // Show material selection modal
      setModalOpen(true);
      setModalHistoryStack([]);
    }
  };

  // Handler for creating a new lobby - also check mana
  const handleCreateLobby = () => {
    // Check mana again before proceeding
    if (!hasSufficientMana()) {
      return;
    }

    setPvpOptionsOpen(false);
    setModalOpen(true);
    // Update history stack to remember we came from pvpOptions
    setModalHistoryStack(["pvpOptions"]);
  };

  // Handler for joining an existing lobby - also check mana
  const handleJoinLobby = (lobbyCode: string) => {
    // Check mana before proceeding
    if (!hasSufficientMana()) {
      return;
    }

    setPvpOptionsOpen(false);

    // Use the lobby service for joining
    const lobbyState = joinExistingLobby(lobbyCode, selectedMode || "PvP Mode");
    navigateToWelcomeScreen(navigate, lobbyState);
  };

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1rem", // Use rem for gap
          "@media (min-width: 768px)": {
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.5rem", // Use rem for horizontal gap in desktop
          },
        }}
      >
        {/* Peaceful Mode */}
        <ModeCard onClick={() => handleModeClick("Peaceful Mode")}>
          <CardMedia
            component="svg"
            className="cardMedia"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: -1,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            image="/game-mode-selection/peaceful-mode.svg"
          />
          <CardContent sx={{ padding: 0, height: "100%" }}>
            <Box
              sx={{
                position: "absolute",
                bottom: isXsScreen ? "1.5rem" : "1.25rem", // Use rem for positioning
                left: isXsScreen ? "1.5rem" : "1rem", // Use rem for positioning
                textAlign: "left",
                maxWidth: "80%",
              }}
            >
              <Typography
                fontWeight="700"
                className="text-[#266349]"
                sx={{
                  fontSize: isXsScreen ? "1rem" : "1.3rem", // Responsive font size with rem
                  marginBottom: "0.1rem", // Use rem for margin
                }}
              >
                Peaceful Mode
              </Typography>
              <Typography
                fontWeight="650"
                className="text-[#266349]"
                sx={{
                  fontSize: isXsScreen ? "0.65rem" : "0.85rem", // Responsive font size with rem
                }}
              >
                Study your way, no rush, just flow!
              </Typography>
            </Box>
          </CardContent>
        </ModeCard>

        {/* Time Pressured Mode */}
        <ModeCard onClick={() => handleModeClick("Time Pressured")}>
          <CardMedia
            component="svg"
            className="cardMedia"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: -1,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            image="/game-mode-selection/time-pressured-mode.svg"
          />
          <CardContent sx={{ padding: 0, height: "100%" }}>
            <Box
              sx={{
                position: "absolute",
                bottom: isXsScreen ? "1.5rem" : "1.25rem", // Use rem for positioning
                left: isXsScreen ? "1.5rem" : "1rem", // Use rem for positioning
                textAlign: "left",
                maxWidth: "80%",
              }}
            >
              <Typography
                fontWeight="700"
                className="text-[#504c36]"
                sx={{
                  fontSize: isXsScreen ? "1rem" : "1.3rem", // Responsive font size with rem
                  marginBottom: "0.1rem", // Use rem for margin
                }}
              >
                Time Pressured
              </Typography>
              <Typography
                fontWeight="650"
                className="text-[#504c36]"
                sx={{
                  fontSize: isXsScreen ? "0.7rem" : "0.85rem", // Responsive font size with rem
                }}
              >
                Beat the clock, challenge your speed!
              </Typography>
            </Box>
          </CardContent>
        </ModeCard>

        {/* PvP Mode */}
        <ModeCard onClick={() => handleModeClick("PvP Mode")}>
          <CardMedia
            component="svg"
            className="cardMedia"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: -1,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            image="/game-mode-selection/pvp-mode.svg"
          />
          <CardContent sx={{ padding: 0, height: "100%" }}>
            <Box
              sx={{
                position: "absolute",
                bottom: isXsScreen ? "1.5rem" : "1.25rem", // Use rem for positioning
                left: isXsScreen ? "1.5rem" : "1rem", // Use rem for positioning
                maxWidth: "80%",
              }}
            >
              <Typography
                fontWeight="700"
                className="text-[#303869]"
                sx={{
                  fontSize: isXsScreen ? "1rem" : "1.3rem", // Responsive font size with rem
                  marginBottom: "0.1rem", // Use rem for margin
                }}
              >
                PvP Mode
              </Typography>
              <Typography
                variant="body2"
                fontWeight="650"
                className="text-[#303869]"
                sx={{
                  fontSize: isXsScreen ? "0.65rem" : "0.85rem", // Responsive font size with rem
                }}
              >
                Outsmart your opponent and win!
              </Typography>
            </Box>
          </CardContent>
        </ModeCard>
      </Box>

      {/* PvP Options Modal */}
      <PvPOptionsModal
        open={pvpOptionsOpen}
        handleClose={handlePvPOptionsClose} // X button closes everything
        handleBack={handlePvPOptionsBack} // Back button returns to choose mode
        onCreateLobby={handleCreateLobby}
        onJoinLobby={handleJoinLobby}
      />

      {/* Material Selection Modal */}
      <SelectStudyMaterialModal
        open={modalOpen}
        handleClose={handleStudyMaterialClose} // X button closes everything
        handleBack={handleStudyMaterialBack} // Back button navigates based on history
        mode={selectedMode}
        isLobby={isLobby}
        onMaterialSelect={handleMaterialSelect}
        onModeSelect={handleModeSelect}
        selectedTypes={selectedTypes}
      />

      {/* Mana Alert Modal */}
      <ManaAlertModal
        isOpen={isManaModalOpen}
        onClose={closeManaModal}
        currentMana={currentMana}
        requiredMana={requiredMana}
      />
    </>
  );
};

export default ChooseYourChallenge;
