import React, { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useFriendList } from "../../../../hooks/friends.hooks/useFriendList";
import { useFriendSocket } from "../../../../hooks/friends.hooks/useFriendSocket";
import { useUser } from "../../../../contexts/UserContext";
import { Box, Tooltip, Stack } from "@mui/material";
import ErrorSnackbar from "../../../ErrorsSnackbar";
import cauldronGif from "/General/Cauldron.gif";
import { Friend } from "../../../../types/friendObject";
import noFriend from "/images/NoFriend.svg";
import defaultPicture from "/profile-picture/default-picture.svg";
import AddIcon from "@mui/icons-material/AddRounded";
import ProfileModal from "../../../modals/ProfileModal";
import { useNavigate } from "react-router-dom";
import { useOnlineStatus } from "../../../../hooks/useOnlineStatus";
import { useLobbyStatus } from "../../../../hooks/useLobbyStatus";
import SelectStudyMaterialModal from "../../../modals/SelectStudyMaterialModal";
import { createNewLobby } from "../../../../services/pvpLobbyService";
import { generateCode } from "../../../../pages/dashboard/play-battleground/utils/codeGenerator";
import { StudyMaterial } from "../../../../types/studyMaterialObject";

interface FriendItemProps {
  friend: Friend;
  onRemoveFriend: (friendId: string) => void;
  onViewProfile: (friendId: string) => void;
  onInvite: (friend: Friend) => void; // Add this prop
}

const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  onRemoveFriend,
  onViewProfile,
  onInvite,
}) => {
  const isOnline = useOnlineStatus(friend.firebase_uid);
  const { isInLobby, isInGame, gameMode } = useLobbyStatus(friend.firebase_uid);

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

  return (
    <Box className="flex items-center justify-between gap-2 mb-4 border-b border-[#3B354C] pb-4 last:border-none">
      <div
        className="flex items-center cursor-pointer"
        onClick={() => onViewProfile(friend.firebase_uid)}
      >
        <div className="relative">
          <img
            src={friend.display_picture || defaultPicture}
            alt="Avatar"
            className="w-14 h-14 rounded-[5px] mr-4 hover:scale-110 transition-all duration-300"
          />
          <Tooltip title={text} placement="top" arrow>
            <div
              className={`absolute bottom-[-2px] right-1 w-4 h-4 rounded-full border-2 border-[#120F1B] ${color}`}
            ></div>
          </Tooltip>
        </div>
        <div>
          <p className="font-medium">{friend.username}</p>
          <p className="text-sm text-[#9F9BAE]">Level {friend.level}</p>
        </div>
      </div>
      <Box flex={1} />
      <Tooltip title="Invite" enterDelay={100} arrow>
        <button
          className="bg-[#52A647] text-xs text-white py-2 px-4 rounded-md hover:scale-105 transition-all duration-300"
          onClick={() => onInvite(friend)}
        >
          <AddIcon sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>
      <Tooltip title="Remove Friend" enterDelay={100} arrow>
        <button
          className="bg-[#E03649] text-xs text-white py-2 px-4 rounded-md hover:bg-[#E84040] hover:scale-105 transition-all duration-300"
          onClick={() => onRemoveFriend(friend.firebase_uid)}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>
    </Box>
  );
};

const YourFriends: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    isError: false,
  });
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<string>("PvP");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [friendToInvite, setFriendToInvite] = useState<Friend | null>(null);
  const { friendList, handleRemoveFriend, loading, fetchFriends } =
    useFriendList(user?.firebase_uid);

  // Set up socket listener for friend request accepted events
  const handleFriendRequestAccepted = (data: { newFriend: Friend }) => {
    console.log("Friend added in YourFriends:", data.newFriend);
    setSnackbar({
      open: true,
      message: `${data.newFriend.username} is now your friend!`,
      isError: false,
    });
    // Refresh friend list when a new friend is added
    fetchFriends();
  };

  const handleFriendRemoved = (_data: { removedFriendId: string }) => {
    setSnackbar({
      open: true,
      message: "A friend was removed from your list.",
      isError: false,
    });
    fetchFriends();
  };

  // Use the socket hook to listen for real-time updates
  useFriendSocket({
    userId: user?.firebase_uid,
    onFriendRequestAccepted: handleFriendRequestAccepted,
    onFriendRemoved: handleFriendRemoved,
  });

  const onRemoveFriend = async (friendId: string) => {
    if (!user?.firebase_uid) return;

    try {
      await handleRemoveFriend(user.firebase_uid, friendId);
      setSnackbar({
        open: true,
        message: "Friend removed successfully!",
        isError: false,
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      setSnackbar({
        open: true,
        message: "Error removing friend. Please try again.",
        isError: true,
      });
    }
  };

  const handleInviteClick = (friend: Friend) => {
    // Store the friend to invite
    setFriendToInvite(friend);
    // Open material selection modal
    setMaterialModalOpen(true);
  };
  // Handler for material selection
  const handleMaterialSelect = (material: StudyMaterial) => {
    // Generate a new lobby code
    const lobbyCode = generateCode();

    // Create a new lobby state
    const lobbyState = createNewLobby(inviteMode, material);

    // Store the friend to invite
    localStorage.setItem("friendToInvite", JSON.stringify(friendToInvite));

    // Close the modal
    setMaterialModalOpen(false);

    // Navigate to welcome screen

    navigate("/dashboard/welcome-game-mode", {
      state: {
        mode: inviteMode,
        material: material,
        lobbyCode: lobbyState.lobbyCode,
        role: "host",
        friendToInvite: friendToInvite,
        isPvpLobbyCreation: true,
      },
    });
  };

  // Handler for mode selection
  const handleModeSelect = (mode: string) => {
    setInviteMode(mode);
  };

  const handleViewProfile = (friendId: string) => {
    setSelectedFriend(friendId);
    setProfileModalOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center">
        <img
          src={cauldronGif}
          alt="Loading..."
          style={{ width: "6rem", height: "auto" }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* Profile Modal */}
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedFriend || undefined}
      />

      <SelectStudyMaterialModal
        open={materialModalOpen}
        handleClose={() => setMaterialModalOpen(false)}
        mode={inviteMode}
        onMaterialSelect={handleMaterialSelect}
        onModeSelect={handleModeSelect}
        selectedTypes={selectedTypes}
        isLobby={true}
      />

      {friendList.length === 0 ? (
        <Stack
          spacing={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Box display="flex" justifyContent="center" alignItems="center">
            <img
              src={noFriend}
              alt="noFriend"
              style={{ width: "12rem", height: "auto", opacity: 0.75 }}
            />
          </Box>
          <p className="text-[#6F658D] font-bold text-[0.95rem]">
            {" "}
            No friends yet. Add friends and share the magic!
          </p>
        </Stack>
      ) : (
        friendList.map((friend) => (
          <FriendItem
            key={friend.firebase_uid}
            friend={friend}
            onRemoveFriend={onRemoveFriend}
            onViewProfile={handleViewProfile}
            onInvite={handleInviteClick}
          />
        ))
      )}
    </Box>
  );
};

export default YourFriends;
