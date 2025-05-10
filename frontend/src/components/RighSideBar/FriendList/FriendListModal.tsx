import React, { useEffect } from "react";
import CloseIcon from "@mui/icons-material/ClearRounded";
import YourFriends from "./Modals/YourFriends";
import FriendRequests from "./Modals/FriendRequest";
import FindFriends from "./Modals/FindFriends";
import ModalIconFriendList from "/bunny.png";
import { Box, Tooltip, IconButton, Modal, Backdrop, Fade } from "@mui/material";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onFriendRequestHandled?: () => void; // New prop
  setActiveTab: (tab: string) => void; // Function to update active tab in the parent
  fromPVPLobby?: boolean; // New prop to indicate if opened from PVPLobby
}

const FriendListModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onFriendRequestHandled,
  fromPVPLobby = false, // Default to false
}) => {
  useEffect(() => {
    if (fromPVPLobby) {
      setActiveTab("YOUR FRIENDS"); // Force "YOUR FRIENDS" tab when from PVP
    }
  }, [fromPVPLobby, setActiveTab]);

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.6)", // Match the opacity from your original
          zIndex: 49, // Make sure this is below the modal's z-index
        },
      }}
    >
      <Fade in={isOpen}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "689px",
            maxWidth: "95%",
            maxHeight: "95vh",
            bgcolor: "#120F1B",
            border: "2px solid #3B354D",
            borderRadius: "0.8rem",
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
            p: { xs: 2, sm: 3, md: 4.5 },
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
          }}
        >
          {/* Close Button */}
          <Tooltip
            title="Close"
            enterDelay={100}
            arrow
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -12],
                    },
                  },
                ],
              },
            }}
          >
            <IconButton
              onClick={onClose}
              className="self-end hover:scale-110 transition-all duration-300 ease-in"
            >
              <CloseIcon className="text-[#6F658D]" />
            </IconButton>
          </Tooltip>

          <div className="w-full mb-8 flex justify-center">
            <img src={ModalIconFriendList} className="w-16" alt="Friend List" />
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center border-gray-600 mb-5">
            <button
              onClick={() => setActiveTab("YOUR FRIENDS")}
              className={`flex-1 py-2 text-[0.95rem] font-bold text-center  ${
                activeTab === "YOUR FRIENDS"
                  ? "text-[#E2DDF3] border-b-2 border-[#E2DDF3] "
                  : "text-[#6F658D] hover:text-[#E2DDF3]"
              }`}
            >
              YOUR FRIENDS
            </button>

            {fromPVPLobby ? null : (
              <>
                <button
                  onClick={() => setActiveTab("FRIEND REQUESTS")}
                  className={`flex-1 py-2 text-[0.95rem] font-bold text-center ${
                    activeTab === "FRIEND REQUESTS"
                      ? "text-[#E2DDF3] border-b-2 border-[#E2DDF3] "
                      : "text-[#6F658D] hover:text-[#E2DDF3]"
                  }`}
                >
                  FRIEND REQUESTS
                </button>
                <button
                  onClick={() => setActiveTab("FIND FRIENDS")}
                  className={`flex-1 py-2 text-[0.95rem] font-bold text-center ${
                    activeTab === "FIND FRIENDS"
                      ? "text-[#E2DDF3] border-b-2 border-[#E2DDF3] "
                      : "text-[#6F658D] hover:text-[#E2DDF3]"
                  }`}
                >
                  FIND FRIENDS
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-5 rounded-md overflow-y-auto max-h-[360px] scrollbar-thin scrollbar-thumb-[#221d35] scrollbar-track-transparent">
            {activeTab === "YOUR FRIENDS" && <YourFriends />}
            {fromPVPLobby ? null : (
              <>
                {!fromPVPLobby && activeTab === "FRIEND REQUESTS" && (
                  <FriendRequests
                    onFriendRequestHandled={onFriendRequestHandled}
                  />
                )}
                {!fromPVPLobby && activeTab === "FIND FRIENDS" && (
                  <FindFriends />
                )}
              </>
            )}
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};

export default FriendListModal;
