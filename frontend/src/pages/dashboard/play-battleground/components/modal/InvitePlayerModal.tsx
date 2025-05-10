import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Button, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/CancelOutlined";
import InviteFriendList from "/General/ModalFriendList.png";
import ProfileIcon from "/profile-picture/default-picture.svg";
import axios from "axios";
import { useUser } from "../../../../../contexts/UserContext";
import { useBattleInvitations } from "../../../../../hooks/battle.hooks/useBattleInvitations";
import { useSnackbar } from "../../../../../contexts/SnackbarContext";
import { useOnlineStatus } from "../../../../../hooks/useOnlineStatus";
import { useLobbyStatus } from "../../../../../hooks/useLobbyStatus";
import { GameMode } from "../../../../../hooks/useLobbyStatus";
import { useFriendStatusMap } from "../../../../../hooks/useFriendStatusMap";
import { useSortedFriends } from "../../../../../hooks/useSortedFriends";

// Define a proper interface for FriendItem props
interface FriendItemProps {
  friend: {
    firebase_uid: string;
    username: string;
    level: number;
    display_picture: string | null;
  };
  inviting: boolean;
  onInvite: (friend: Player) => void;
  showSnackbar: (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => void;
}

// Update the FriendItem component with proper typing
const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  inviting,
  onInvite,
  showSnackbar,
}) => {
  // Now hooks are at the top level of this component with proper typing
  const isOnline = useOnlineStatus(friend.firebase_uid);
  const { isInLobby, isInGame, gameMode } = useLobbyStatus(friend.firebase_uid);

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

  // Determine if invite should be disabled
  const isInviteDisabled = !isOnline || isInGame || inviting;

  // Get button text based on status
  const getButtonText = () => {
    if (inviting) return "SENDING...";
    if (!isOnline) return "OFFLINE";
    if (isInGame) return "BUSY";
    return "DUEL";
  };

  // Handle invite click with status check
  const handleInviteClick = () => {
    if (!isOnline) {
      showSnackbar(`${friend.username} is currently offline`, "error");
      return;
    }

    if (isInGame) {
      showSnackbar(`${friend.username} is currently in ${text}`, "error");
      return;
    }

    onInvite(friend);
  };

  return (
    <div
      key={friend.firebase_uid}
      className="p-3 rounded-md w-[550px] flex justify-between items-center mb-2"
    >
      <div className="flex items-center">
        <div className="relative">
          <img
            src={friend.display_picture || ProfileIcon}
            alt="Avatar"
            className="w-14 h-14 rounded-[5px] mr-4 hover:scale-110 transition-all duration-300"
          />
          {/* Status indicator */}
          <Tooltip title={text} placement="top" arrow>
            <div
              className={`absolute bottom-[-2px] right-1 w-4 h-4 rounded-full border-2 border-[#080511] ${color}`}
            ></div>
          </Tooltip>
        </div>
        <div>
          <Typography className="text-white">{friend.username}</Typography>
          <Typography sx={{ color: "white", fontSize: "0.835rem" }}>
            LVL {friend.level}
          </Typography>
        </div>
      </div>
      {/* Simplified button with inline styles */}
      <button
        onClick={handleInviteClick}
        disabled={isInviteDisabled}
        style={{
          borderRadius: "0.6rem",
          marginLeft: "8px",
          padding: "8px 20px",
          minWidth: "60px",
          fontSize: "0.8rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.3s ease",
          cursor: isInviteDisabled ? "not-allowed" : "pointer",
          backgroundColor: isInviteDisabled ? "#120F1D" : "#52A647",
          color: isInviteDisabled ? "#A0A0A0" : "white",
          opacity: 1,
          visibility: "visible",
          position: "relative",
          zIndex: 10,
        }}
        className={`${!isInviteDisabled && " hover:scale-110"}`}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

interface Player {
  firebase_uid: string;
  username: string;
  level: number;
  display_picture: string | null;
}

interface InvitePlayerModalProps {
  open: boolean;
  handleClose: () => void;
  onInviteSuccess: (friend: Player, invitationInfo: any) => void;
  lobbyCode: string;
  inviterName?: string;
  senderId?: string;
  onInvitationAccepted?: (lobbyCode: string) => void;
  selectedTypesFinal: string[];
  selectedMaterial: { id: string; title: string } | null;
}

const InvitePlayerModal: React.FC<InvitePlayerModalProps> = ({
  open,
  handleClose,
  onInviteSuccess,
  lobbyCode,
  selectedTypesFinal,
  selectedMaterial,
}) => {
  const [friends, setFriends] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const { user } = useUser();
  const { showSnackbar } = useSnackbar();
  const { sendBattleInvitation } = useBattleInvitations();

  // Extract friend IDs for status mapping
  const friendIds = useMemo(() => {
    return friends.map((friend) => friend.firebase_uid);
  }, [friends]);

  // Get status information for all friends
  const statusMap = useFriendStatusMap(friendIds);

  // Get sorted friend list
  const sortedFriends = useSortedFriends(friends, statusMap);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.firebase_uid || !open) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/lobby/invite-friends/${
            user.firebase_uid
          }`
        );

        // Map the response data to match the Player interface
        const formattedFriends: Player[] = (
          response.data as { data: any[] }
        ).data.map((friend: any) => ({
          firebase_uid: friend.firebase_uid,
          username: friend.username,
          level: friend.level || 1,
          display_picture: friend.display_picture,
        }));

        setFriends(formattedFriends);
        setError(null);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError("Failed to load friends list");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [user?.firebase_uid, open]);

  const handleInvite = async (friend: Player) => {
    if (!user) {
      console.error("Cannot send invitation: User is not logged in");
      return;
    }

    try {
      setInviting(true);

      // Validate required fields
      if (
        !user.firebase_uid ||
        !user.username ||
        !friend.firebase_uid ||
        !lobbyCode
      ) {
        console.error("Missing required fields for invitation");
        return;
      }

      // Create invitation data
      const invitationData = {
        lobby_code: lobbyCode,
        sender_id: user.firebase_uid,
        sender_username: user.username,
        sender_level: user.level || 1,
        receiver_id: friend.firebase_uid,
        receiver_username: friend.username,
        receiver_level: friend.level || 1,
        receiver_picture: friend.display_picture,
        status: "pending" as const,
        question_types: selectedTypesFinal,
        study_material_title: selectedMaterial?.title || null,
        host_ready: true,
        guest_ready: false,
        battle_started: false,
      };

      // Send the invitation using our hook
      const response = await sendBattleInvitation(invitationData);

      // Close the modal immediately after sending
      handleClose();

      // Trigger success callback
      onInviteSuccess(friend, {
        ...invitationData,
        dbRecord: response.data,
      });
    } catch (error) {
      console.error("Error inviting player:", error);
      showSnackbar("Failed to send battle invitation", "error");
    } finally {
      setInviting(false);
    }
  };

  if (!open) return null;

  return (
    <Box className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      {/* Backdrop */}
      <Box className="absolute inset-0" onClick={handleClose}></Box>

      {/* Modal */}
      <div
        className="bg-[#080511] border-[#3B354D] border rounded-[1rem] w-[679px] h-[529px] p-5 sm:p-5 md:p-9 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Tooltip title="Close" enterDelay={100} arrow>
          <IconButton
            onClick={handleClose}
            className="self-end hover:scale-110 transition-all duration-300"
          >
            <CloseIcon className="text-[#6F658D]" fontSize="large" />
          </IconButton>
        </Tooltip>

        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <img src="/bunny.png" className="w-16 h-auto" alt="icon" />
        </div>
        <Typography variant="h6" className="text-white text-center mb-4">
          Invite Friends
        </Typography>

        {/* Error message */}
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        {/* Friend List */}
        <div
          className="flex flex-col items-center mt-5 mb-5"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : friends.length === 0 ? (
            <div className="text-white">No friends found</div>
          ) : (
            sortedFriends.map((friend) => (
              <FriendItem
                key={friend.firebase_uid}
                friend={friend}
                inviting={inviting}
                onInvite={handleInvite}
                showSnackbar={showSnackbar}
              />
            ))
          )}
        </div>
      </div>
    </Box>
  );
};

export default InvitePlayerModal;
