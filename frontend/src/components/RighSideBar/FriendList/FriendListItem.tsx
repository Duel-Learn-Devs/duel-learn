import React from "react";
import { Button, Tooltip } from "@mui/material";
import defaultPicture from "/profile-picture/default-picture.svg";
import { Friend } from "../../../contexts/UserContext";
import ProfileModal from "../../modals/ProfileModal";
import { useState } from "react";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { useLobbyStatus } from "../../../hooks/useLobbyStatus";
import SelectStudyMaterialModal from "../../modals/SelectStudyMaterialModal";
import { useNavigate } from "react-router-dom";
import {
  createNewLobby,
  generateLobbyCode,
} from "../../../services/pvpLobbyService";
import { StudyMaterial } from "../../../types/studyMaterialObject";
import { useSnackbar } from "../../../contexts/SnackbarContext";
import useManaCheck from "../../../hooks/useManaCheck";
import ManaAlertModal from "../../../pages/dashboard/play-battleground/modes/multiplayer/components/ManaAlertModal";

interface FriendListItemProps {
  friend: Friend;
}

const FriendListItem: React.FC<FriendListItemProps> = ({ friend }) => {
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<string>("PvP");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const navigate = useNavigate();

  // Use hooks to get status
  const isOnline = useOnlineStatus(friend.firebase_uid);
  const { isInLobby, isInGame, gameMode } = useLobbyStatus(friend.firebase_uid);
  const { showSnackbar } = useSnackbar();

  // Initialize mana check hook with PVP requirement (10 mana)
  const {
    hasSufficientMana,
    isManaModalOpen,
    closeManaModal,
    currentMana,
    requiredMana,
  } = useManaCheck(10);

  const handleViewProfile = (friendId: string) => {
    setSelectedFriend(friendId);
    setProfileModalOpen(true);
  };

  // Get status color and text
  const getStatusInfo = () => {
    if (isInGame) {
      let statusText = "In Game";
      let color = "bg-orange-500"; // Default color

      switch (gameMode) {
        case "pvp-battle":
          color = "bg-[#A4ADE6]"; // PvP Mode color
          statusText = "In PVP Battle";
          break;
        case "peaceful-mode":
          color = "bg-[#76F7C3]"; // Peaceful Mode color
          statusText = "In Peaceful Mode";
          break;
        case "time-pressured-mode":
          color = "bg-[#FFCF47]"; // Time Pressured Mode color
          statusText = "In Time-Pressured Mode";
          break;
        case "creating-study-material":
          color = "bg-[#4D18E8]"; // Creating Study Material color
          statusText = "Creating Study Material";
          break;
        // Game setup states
        case "game-setup":
          color = "bg-[#8A7FFF]";
          statusText = "Setting Up Game";
          break;
        case "question-setup":
          color = "bg-[#8A7FFF]";
          statusText = "Selecting Questions";
          break;
        case "timer-setup":
          color = "bg-[#8A7FFF]";
          statusText = "Setting Timer";
          break;
        case "loading-game":
          color = "bg-[#8A7FFF]";
          statusText = "Loading Game";
          break;
        // PVP setup states
        case "pvp-host-setup":
          color = "bg-[#A4ADE6]";
          statusText = "Setting Up PVP";
          break;
        case "pvp-player2-setup":
          color = "bg-[#A4ADE6]";
          statusText = "Setting Up PVP";
          break;
        case "pvp-lobby":
          color = "bg-[#A4ADE6]";
          statusText = "In PVP Lobby";
          break;
        // Post-game states
        case "peaceful-summary":
        case "time-pressured-summary":
          color = "bg-[#6DB566]";
          statusText = "Viewing Results";
          break;
        case "pvp-summary":
          color = "bg-[#A4ADE6]";
          statusText = "Viewing PVP Results";
          break;
      }

      return { color, text: statusText };
    } else if (isInLobby) {
      return { color: "bg-blue-500", text: "In Lobby" };
    } else if (isOnline) {
      return { color: "bg-green-500", text: "Online" };
    } else {
      return { color: "bg-gray-500", text: "Offline" };
    }
  };

  const { color, text } = getStatusInfo();

  // Handler for the INVITE button with mana check
  const handleInviteClick = () => {
    // Check if friend is online and not in game
    if (!isOnline) {
      showSnackbar(`${friend.username} is currently offline`, "error");
      return;
    }

    if (isInGame) {
      showSnackbar(`${friend.username} is currently in ${text}`, "error");
      return;
    }

    // Check if user has enough mana
    if (!hasSufficientMana()) {
      // Modal will be shown automatically via the hook
      return;
    }

    // Open material selection modal
    setMaterialModalOpen(true);
  };

  // Determine if invite should be disabled
  const isInviteDisabled = !isOnline || isInGame;

  // Get button text based on status
  const getButtonText = () => {
    if (!isOnline) return "OFFLINE";
    if (isInGame) return "BUSY";
    return "DUEL";
  };

  // Handler for material selection with mana check
  const handleMaterialSelect = (material: StudyMaterial) => {
    // Check mana again before proceeding
    if (!hasSufficientMana()) {
      return;
    }

    // Generate a new lobby code
    const lobbyCode = generateLobbyCode();

    // Create a new lobby state
    const lobbyState = createNewLobby(inviteMode, material);

    // Store the friend to invite
    localStorage.setItem("friendToInvite", JSON.stringify(friend));

    // Close the modal
    setMaterialModalOpen(false);

    // Navigate to welcome screen
    navigate("/dashboard/welcome-game-mode", {
      state: {
        mode: inviteMode,
        material: material,
        lobbyCode: lobbyState.lobbyCode,
        role: "host",
        friendToInvite: friend,
        isPvpLobbyCreation: true,
      },
    });
  };

  // Handler for mode selection
  const handleModeSelect = (mode: string) => {
    setInviteMode(mode);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={friend.display_picture || defaultPicture}
              onClick={() => handleViewProfile(friend.firebase_uid)}
              alt="Avatar"
              className="w-10 sm:w-10 md:w-12 cursor-pointer h-auto mr-3 rounded-[5px] hover:scale-105 transition-all duration-300 ease-in-out"
            />
            {/* Status indicator positioned to overlap the image corner */}
            <Tooltip title={text} placement="top" arrow>
              <div
                className={`absolute bottom-[-2px] right-1 w-3.5 h-3.5 rounded-full border-2 border-[#120F1B] ${color}`}
              ></div>
            </Tooltip>
          </div>

          {/* Text content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <p className="text-sm sm:text-base text-[#E2DDF3] truncate">
                {friend.username}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm text-[#9F9BAE]">
                Level {friend.level}
              </p>
              <p className="text-[#9F9BAE] text-xs">•</p>
              <p className="text-xs sm:text-sm text-[#9F9BAE]">
                EXP {friend.exp}
              </p>
            </div>
          </div>
        </div>

        {/* Simplified button with inline styles */}
        <button
          onClick={handleInviteClick}
          disabled={isInviteDisabled}
          style={{
            borderRadius: "0.6rem",
            marginLeft: "8px",
            padding: "4px 10px",
            minWidth: "60px",
            fontSize: "0.8rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "all 0.3s ease",
            backgroundColor: isInviteDisabled ? "#120F1D" : "#52A647",
            color: isInviteDisabled ? "#A0A0A0" : "white",
            border: "none",
            cursor: isInviteDisabled ? "not-allowed" : "pointer",
            position: "relative",
            zIndex: 10,
            opacity: 1,
            visibility: "visible",
          }}
          className={`${!isInviteDisabled && " hover:scale-110"}`}
        >
          {getButtonText()}
        </button>
      </div>
      {/* Profile Modal */}
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedFriend || undefined}
      />

      {/* Study Material Selection Modal */}
      <SelectStudyMaterialModal
        open={materialModalOpen}
        handleClose={() => setMaterialModalOpen(false)}
        mode={inviteMode}
        onMaterialSelect={handleMaterialSelect}
        onModeSelect={handleModeSelect}
        selectedTypes={selectedTypes}
        isLobby={true}
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

export default FriendListItem;
