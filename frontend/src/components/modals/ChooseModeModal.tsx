import React, { useState, useEffect } from "react";
import {
  Box,
  Modal,
  Typography,
  Stack,
  Backdrop,
  Fade,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ModalFriendList from "/General/ModalFriendList.png";
import SelectStudyMaterialModal from "./SelectStudyMaterialModal"; // Assuming it's in the same folder
import PvPOptionsModal from "./PvPOptionsModal"; // Add this import
import { useAudio } from "../../contexts/AudioContext";
import { useNavigate } from "react-router-dom";
import { createNewLobby, joinExistingLobby, navigateToWelcomeScreen } from "../../services/pvpLobbyService";

// Add modeToTypesMap
const modeToTypesMap = {
  "Peaceful Mode": ["identification", "multiple-choice", "true-false"],
  "Time Pressured": ["identification", "multiple-choice", "true-false"],
  "PvP Mode": ["identification", "multiple-choice", "true-false"],
};

interface CustomModalProps {
  open: boolean;
  handleClose: () => void;
  preSelectedMaterial?: any;
  onModeSelect?: (mode: string) => void;
}

interface ButtonData {
  label: string;
  subtitle: string;
  variant: string;
  backgroundColor: string;
  hoverBackground: string;
  expanded?: boolean; // Optional property
  subButtons?: { label: string; subtitle: string }[]; // Optional property
  image: string;
  textColor: string;
}

const ChooseModeModal: React.FC<CustomModalProps> = ({ 
  open, 
  handleClose,
  preSelectedMaterial,
  onModeSelect 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [chooseModeOpen, setChooseModeOpen] = useState<boolean>(open);
  const { setActiveModeAudio } = useAudio();
  const [pvpOptionsOpen, setPvpOptionsOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  // Update when the parent open state changes
  useEffect(() => {
    setChooseModeOpen(open);
  }, [open]);

  const buttonData: ButtonData[] = [
    {
      label: "Peaceful Mode",
      subtitle: "Study your way, no rush, just flow!",
      variant: "contained",
      backgroundColor: "#E2DDF3",
      hoverBackground: "#E8E2FE",
      image: "/game-mode-selection/peaceful-mode-portrait.png",
      textColor: "#266349",
    },
    {
      label: "Time Pressured",
      subtitle: "Test your skills under time pressure!",
      variant: "outlined",
      backgroundColor: "#E2DDF3",
      hoverBackground: "#E8E2FE",
      image: "/game-mode-selection/time-pressured-mode-portrait.png",
      textColor: "#504c36",
    },
    {
      label: "PvP Mode",
      subtitle: "Face off, outsmart, and win now!",
      variant: "contained",
      backgroundColor: "#E2DDF3",
      hoverBackground: "#E8E2FE",
      image: "/game-mode-selection/pvp-mode-portrait.png",
      textColor: "#303869",
    },
  ];

  const handleModeClick = (mode: string) => {
    setSelectedMode(mode);
    setSelectedTypes(modeToTypesMap[mode as keyof typeof modeToTypesMap] || []);

    // If PvP mode, show options modal
    if (mode === "PvP Mode") {
      if (preSelectedMaterial) {
        // If we have pre-selected material, call onModeSelect directly
        if (onModeSelect) {
          onModeSelect(mode);
        }
        handleClose();
      } else {
        // Show PvP options modal
        setChooseModeOpen(false);
        setPvpOptionsOpen(true);
      }
      return;
    }

    // For other modes, keep existing logic
    if (preSelectedMaterial) {
      if (onModeSelect) {
        onModeSelect(mode);
      }
      handleClose();
    } else {
      setChooseModeOpen(false);
      setModalOpen(true);
    }
  };

  // Close all modals
  const closeAllModals = () => {
    setChooseModeOpen(false);
    setPvpOptionsOpen(false);
    setModalOpen(false);
    handleClose();
  };

  const handlePvPOptionsClose = () => {
    setPvpOptionsOpen(false);
    closeAllModals();
  };

  const handleStudyMaterialClose = () => {
    setModalOpen(false);
    closeAllModals();
  };

  // Back navigation from PvP Options modal
  const handlePvPOptionsBack = () => {
    setPvpOptionsOpen(false);
    setChooseModeOpen(true);
  };

  // Back navigation from Study Material modal
  const handleStudyMaterialBack = () => {
    setModalOpen(false);
    
    // If we came from PvP options, go back there
    if (selectedMode === "PvP Mode") {
      setPvpOptionsOpen(true);
    } else {
      // Otherwise go back to main mode selection
      setChooseModeOpen(true);
    }
  };

  const handleMaterialSelect = (material: any) => {
    setModalOpen(false);
    
    if (selectedMode && onModeSelect) {
      onModeSelect(selectedMode);
    }
    
    // If PVP mode, use the lobby service
    if (selectedMode === "PvP Mode" || selectedMode === "PvP") {
      const lobbyState = createNewLobby(selectedMode, material);
      navigateToWelcomeScreen(navigate, lobbyState);
    }
    
    handleClose();
  };

  const handleModeSelect = (mode: string) => {
    // Handle mode selection for non-preselected flow
    if (onModeSelect) {
      onModeSelect(mode);
    }
  };

  // Handler for creating a new lobby
  const handleCreateLobby = () => {
    setPvpOptionsOpen(false);
    setModalOpen(true);
  };

  // Handler for joining an existing lobby
  const handleJoinLobby = (lobbyCode: string) => {
    setPvpOptionsOpen(false);
    
    // Use the lobby service
    const lobbyState = joinExistingLobby(lobbyCode, selectedMode || "PvP Mode");
    navigateToWelcomeScreen(navigate, lobbyState);
  };

  return (
    <>
      <Modal
        open={chooseModeOpen}
        onClose={closeAllModals}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Darker background
          },
        }}
      >
        <Fade in={chooseModeOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "90%", sm: "880px" },
              height: { xs: "auto", sm: "600px" },
              bgcolor: "#120F1B",
              borderRadius: "0.8rem",
              border: "2px solid #3B354D",
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: { xs: "20px", sm: "40px" },
              paddingY: { xs: "60px", sm: "40px" },
            }}
          >
            {/* Close button */}
            <IconButton
              aria-label="close"
              onClick={closeAllModals}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#FFFFFF",
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Modal Friend List Image */}
            <Box
              component="img"
              src={ModalFriendList}
              alt="Modal Friend List"
              sx={{
                width: "70px",
                objectFit: "cover",
                borderRadius: "5px 5px 0 0",
                mb: 2,
              }}
            />

            {/* Modal Header */}
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "24px", sm: "32px" },
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              Choose Your Challenge
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#9F9BAE",
                mb: 5,
                textAlign: "center",
                fontSize: { xs: "14px", sm: "16px" },
              }}
            >
              Forge your learning quest, Magician!
            </Typography>

            {/* Buttons */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              justifyContent="center"
              alignItems="center"
            >
              {buttonData.map((button, index) => (
                <Box
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  sx={{
                    width: { xs: "100%", sm: "231px" },
                    height: { xs: "auto", sm: "272px" },
                    borderRadius: "0.8rem",
                    backgroundColor:
                      hoveredIndex === index
                        ? button.hoverBackground
                        : hoveredIndex !== null
                        ? "#716C82"
                        : button.backgroundColor,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    position: "relative",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transform:
                      hoveredIndex === index ? "scale(1.03)" : "scale(1)",
                    "&:hover": {
                      backgroundColor: button.hoverBackground,
                    },
                  }}
                  onClick={() => handleModeClick(button.label)}
                >
                  {/* Background Image */}
                  <Box
                    component="img"
                    src={button.image}
                    alt={button.label}
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      zIndex: 0,
                    }}
                  />

                  {/* Text Content */}
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      alignSelf: "center",
                      mt: "auto",
                      width: "100%",
                      padding: "0 8px",
                    }}
                  >
                    <Typography
                      sx={{
                        color: button.textColor,
                        fontWeight: "700",
                        fontSize: "17px",
                        mb: "1px",
                      }}
                    >
                      {button.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: button.textColor,
                        fontSize: "14px",
                        fontWeight: "650",
                      }}
                    >
                      {button.subtitle}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Fade>
      </Modal>

      {/* PvP Options Modal */}
      <PvPOptionsModal
        open={pvpOptionsOpen}
        handleClose={handlePvPOptionsClose}
        handleBack={handlePvPOptionsBack}
        onCreateLobby={handleCreateLobby}
        onJoinLobby={handleJoinLobby}
      />

      {/* Study Material Modal */}
      <SelectStudyMaterialModal
        open={modalOpen}
        handleClose={handleStudyMaterialClose}
        handleBack={handleStudyMaterialBack}
        mode={selectedMode}
        onMaterialSelect={handleMaterialSelect}
        onModeSelect={handleModeSelect}
        selectedTypes={selectedTypes}
      />
    </>
  );
};

export default ChooseModeModal;
