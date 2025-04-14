import React, { useState, useEffect } from "react";
import { Box, Typography, Button, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/CancelOutlined";
import InviteFriendList from "/General/ModalFriendList.png";
import ProfileIcon from "/profile-picture/default-picture.svg";
import axios from "axios";
import { useUser } from "../../../../../contexts/UserContext";
import { useBattleInvitations } from "../../../../../hooks/battle.hooks/useBattleInvitations";
import { useSnackbar } from "../../../../../contexts/SnackbarContext";

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
          <img src={InviteFriendList} alt="Invite Icon" className="w-16" />
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
            friends.map((friend) => (
              <div
                key={friend.firebase_uid}
                className="p-3 rounded-md w-[550px] flex justify-between items-center mb-2"
              >
                <div className="flex items-center">
                  <img
                    src={friend.display_picture || ProfileIcon}
                    alt="Avatar"
                    className="w-14 h-14 rounded-[5px] mr-4 hover:scale-110 transition-all duration-300"
                  />
                  <div>
                    <Typography className="text-white">
                      {friend.username}
                    </Typography>
                    <Typography sx={{ color: "white", fontSize: "0.835rem" }}>
                      LVL {friend.level}
                    </Typography>
                  </div>
                </div>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#57A64E",
                    "&:disabled": {
                      backgroundColor: "#2E5428",
                      color: "#A0A0A0",
                    },
                  }}
                  disabled={inviting}
                  onClick={() => {
                    console.log("Inviting friend:", friend);
                    handleInvite(friend);
                  }}
                >
                  {inviting ? "SENDING..." : "INVITE"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Box>
  );
};

export default InvitePlayerModal;
