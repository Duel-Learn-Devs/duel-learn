import React, { useState, useEffect } from "react";
import {
  Box,
  Modal,
  Typography,
  Stack,
  Fade,
  IconButton,
  TextField,
  Button,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ModalFriendList from "/General/ModalFriendList.png";
import SocketService from "../../services/socketService";
import { useUser } from "../../contexts/UserContext";
import { usePvPLobby } from "../../hooks/usePvPLobby";
import axios from "axios";

interface PvPOptionsModalProps {
  open: boolean;
  handleClose: () => void;
  handleBack?: () => void;
  onCreateLobby: () => void;
  onJoinLobby: (lobbyCode: string) => void;
}

const PvPOptionsModal: React.FC<PvPOptionsModalProps> = ({
  open,
  handleClose,
  handleBack,
  onCreateLobby,
  onJoinLobby,
}) => {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [lobbyCode, setLobbyCode] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [validatingLobby, setValidatingLobby] = useState(false);
  const { user } = useUser();
  const { joinLobby } = usePvPLobby();

  // Get socket instance
  const socketService = SocketService.getInstance();
  const socket = socketService.getSocket();

  // Listen for lobby validation response
  useEffect(() => {
    if (!socket) return;

    const handleLobbyValidationResponse = (data: {
      exists: boolean;
      lobbyCode: string;
      error?: string;
    }) => {
      setValidatingLobby(false);

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.exists && data.lobbyCode === lobbyCode) {
        setIsJoining(true);
        // Proceed with joining the lobby
        onJoinLobby(lobbyCode);
      } else {
        setError("Lobby not found or no longer active");
      }
    };

    socket.on("lobbyValidationResponse", handleLobbyValidationResponse);

    return () => {
      socket.off("lobbyValidationResponse", handleLobbyValidationResponse);
    };
  }, [socket, lobbyCode, onJoinLobby]);

  const handleCreateLobby = () => {
    onCreateLobby();
  };

  const handleShowJoinForm = () => {
    setShowJoinForm(true);
  };

  const handleJoinSubmit = async () => {
    if (!lobbyCode.trim()) {
      setError("Please enter a lobby code");
      return;
    }

    // Ensure consistent format - uppercase and trim whitespace
    const formattedLobbyCode = lobbyCode.trim().toUpperCase();

    // Validate lobby code format more strictly
    if (!/^[A-Z0-9]{4,6}$/.test(formattedLobbyCode)) {
      setError(
        "Invalid lobby code format. Should be 4-6 alphanumeric characters."
      );
      return;
    }

    if (!user) {
      setError("You must be logged in to join a lobby");
      return;
    }

    // Set loading state
    setValidatingLobby(true);
    setError("");

    try {
      // Use the lobby API to validate and join the lobby
      console.log("Validating and joining lobby:", formattedLobbyCode);

      // First validate the lobby through the API
      const validateResponse = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/lobby/validate/${formattedLobbyCode}`
      );

      if (!validateResponse.data.success) {
        throw new Error(validateResponse.data.message || "Invalid lobby code");
      }

      console.log("Lobby validation successful:", validateResponse.data);

      // Now that lobby is validated, join it
      setIsJoining(true);

      const joinResponse = await joinLobby(formattedLobbyCode);

      if (!joinResponse.success) {
        throw new Error(joinResponse.error || "Failed to join lobby");
      }

      console.log("Successfully joined lobby:", joinResponse);

      // Get lobby details with all settings
      const detailsResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/lobby/${formattedLobbyCode}`
      );

      const lobbyData = detailsResponse.data.data;

      // Parse settings
      const settings = lobbyData.settings || {};

      // Prepare data for navigation
      const lobbyState = {
        lobbyCode: formattedLobbyCode,
        isGuest: true,
        isJoining: true,
        role: "guest",
        mode: "PvP",
        selectedTypes: settings.question_types || [],
        selectedMaterial: settings.study_material_title
          ? {
              title: settings.study_material_title,
              id: settings.study_material_id,
            }
          : null,
        hostInfo: {
          firebase_uid: lobbyData.host_id,
          username: lobbyData.host_username,
          level: lobbyData.host_level,
          display_picture: lobbyData.host_picture,
        },
      };

      // Close the modal
      handleClose();

      // Notify parent component and pass to navigation
      onJoinLobby(formattedLobbyCode);

      // Use the socket to inform the host that someone is joining
      if (socket) {
        socket.emit("guest_joined_lobby", {
          lobbyCode: formattedLobbyCode,
          guestId: user.firebase_uid,
          guestName: user.username,
          guestLevel: user.level,
          guestPicture: user.display_picture,
        });
      }
    } catch (err: any) {
      console.error("Error joining lobby:", err);
      setError(err.message || "Failed to join lobby");
      setIsJoining(false);
    } finally {
      setValidatingLobby(false);
    }
  };

  const handleBackNavigation = () => {
    if (showJoinForm) {
      setShowJoinForm(false);
      setLobbyCode("");
      setError("");
    } else if (handleBack) {
      handleBack();
    } else {
      handleClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "500px" },
            bgcolor: "#120F1B",
            border: "2px solid #3B354D",
            borderRadius: "0.8rem",
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: { xs: "20px", sm: "40px" },
            paddingY: { xs: "60px", sm: "40px" },
          }}
        >
          {/* Back button */}
          <IconButton
            aria-label="back"
            onClick={handleBackNavigation}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              color: "#6F658D",
              transition: "color 0.3s ease-in-out",
              "&:hover": {
                color: "#E2DDF3",
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          {/* Modal Friend List Image */}
          <Box
            sx={{
              width: "70px",
              objectFit: "cover",
              borderRadius: "5px 5px 0 0",
              mb: 2,
            }}
          />

          {!showJoinForm ? (
            <>
              {/* Modal Header for Options */}
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "24px", sm: "32px" },
                  textAlign: "center",
                }}
              >
                PvP Mode
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
                Choose how you want to battle!
              </Typography>

              {/* Options Buttons */}
              <Stack spacing={3} sx={{ width: "80%" }}>
                <Button
                  onClick={handleCreateLobby}
                  sx={{
                    backgroundColor: "#8565E7",
                    color: "#E2DDF3",
                    fontWeight: "bold",
                    padding: "12px 24px",
                    borderRadius: "0.6rem",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: "#4D18E8",
                    },
                  }}
                >
                  Create New Lobby
                </Button>
              </Stack>
            </>
          ) : (
            <>
              {/* Join Lobby Form */}
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "24px", sm: "32px" },
                  color: "#FFFFFF",
                  textAlign: "center",
                }}
              >
                Join Lobby
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
                Enter the lobby code to join a battle
              </Typography>

              <TextField
                fullWidth
                value={lobbyCode}
                onChange={(e) => {
                  setLobbyCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="Enter lobby code"
                error={!!error}
                helperText={error}
                disabled={isJoining || validatingLobby}
                sx={{
                  mb: 3,
                  width: "80%",
                  backgroundColor: "#3B354C",
                  borderRadius: "8px",
                  input: { color: "#FFFFFF" },
                  label: { color: "#6F658D" },
                  ".MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  // Error styles
                  ".MuiFormHelperText-root": {
                    color: "#f44336",
                  },
                }}
              />

              <Button
                onClick={handleJoinSubmit}
                disabled={isJoining || validatingLobby}
                sx={{
                  backgroundColor: "#E2DDF3",
                  color: "#303869",
                  fontWeight: "bold",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  width: "80%",
                  "&:hover": {
                    backgroundColor: "#9F9BAE",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "#6F658D",
                    color: "#9F9BAE",
                  },
                }}
              >
                {validatingLobby ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isJoining ? (
                  "Joining..."
                ) : (
                  "Join Battle"
                )}
              </Button>
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default PvPOptionsModal;
