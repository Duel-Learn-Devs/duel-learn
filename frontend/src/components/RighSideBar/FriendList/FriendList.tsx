import React, { useState, useEffect, useCallback } from "react";
import { Box, IconButton, Stack } from "@mui/material";
import { useUser } from "../../../contexts/UserContext";
import cauldronGif from "/General/Cauldron.gif";
import InviteSnackbar from "../../../components/InviteSnackbar";
import Modal from "./FriendListModal";
import FriendListItem from "./FriendListItem";
import FriendListActions from "./FriendListActions";
import { useFriendList } from "../../../hooks/friends.hooks/useFriendList";
import { useFriendSocket } from "../../../hooks/friends.hooks/useFriendSocket";
import { usePendingFriendRequests } from "../../../hooks/friends.hooks/usePendingFriendRequests";
import axios from "axios";
import { SnackbarState, FriendRequestData } from "../../../types/friendObject";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import noFriend from "/images/NoFriend.svg";
import { Friend } from "../../../contexts/UserContext";

const FriendList: React.FC = () => {
  const { user } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [localFriendList, setLocalFriendList] = useState<Friend[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingCountCache, setPendingCountCache] = useState<{
    count: number;
    timestamp: number;
  }>({ count: 0, timestamp: 0 });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    isSender: false,
    senderId: "",
  });

  // Get pending requests and handlers
  const { requestsCount, handleAcceptRequest, handleRejectRequest } =
    usePendingFriendRequests(user?.firebase_uid);

  // Update local count whenever the requestsCount changes
  useEffect(() => {
    setPendingCount(requestsCount);
  }, [requestsCount]);

  const { friendList, loading, error, handleSendFriendRequest, fetchFriends } =
    useFriendList(user?.firebase_uid);

  // Update local friend list when friendList changes
  useEffect(() => {
    if (friendList) {
      setLocalFriendList(friendList);
    }
  }, [friendList]);

  // Setup socket handlers
  const { sendFriendRequest } = useFriendSocket({
    userId: user?.firebase_uid,
    onFriendRequest: (data: FriendRequestData) => {
      setSnackbar({
        open: true,
        message: `${data.sender_username} sent you a friend request!`,
        isSender: false,
        senderId: data.sender_id,
      });

      // Update pending count cache on socket notification
      setPendingCountCache((prev) => ({
        count: prev.count + 1,
        timestamp: Date.now(),
      }));
      setPendingCount((prev) => prev + 1);
    },
    onFriendRequestAccepted: (data) => {
      // Show notification
      setSnackbar({
        open: true,
        message: `You are now friends with ${
          data.otherUser?.username || data.sender_username || "a new user"
        }!`,
        isSender: true,
        senderId: "",
      });

      // Make sure to update the friend list if this user received the acceptance
      if (data.newFriend) {
        setLocalFriendList((prev) => {
          // Check if friend already exists to prevent duplicates
          if (
            !prev.some((f) => f.firebase_uid === data.newFriend.firebase_uid)
          ) {
            return [...prev, data.newFriend];
          }
          return prev;
        });
      }

      // Update the pending count if this was from accepting a request
      // This is important for badge count
      if (data.receiver_id === user?.firebase_uid) {
        setPendingCount((prev) => Math.max(0, prev - 1));
        setPendingCountCache((prev) => ({
          count: Math.max(0, prev.count - 1),
          timestamp: Date.now(),
        }));
      }
    },
  });

  // Optimized function to fetch pending request count with caching
  const fetchPendingRequestCount = useCallback(
    async (force = false) => {
      if (!user?.firebase_uid) return;

      const now = Date.now();
      const cacheAge = now - pendingCountCache.timestamp;

      // Use cached value if it's recent (less than 30 seconds old) and not forced
      if (!force && cacheAge < 30000 && pendingCountCache.count >= 0) {
        console.log(
          "Using cached pending request count:",
          pendingCountCache.count
        );
        setPendingCount(pendingCountCache.count);
        return;
      }

      try {
        const response = await axios.get<{ count: number }>(
          `${import.meta.env.VITE_BACKEND_URL}/api/friend/requests-count/${
            user.firebase_uid
          }`
        );
        const { count } = response.data;
        if (typeof count === "number") {
          setPendingCount(count);
          setPendingCountCache({ count, timestamp: now });
          console.log("Updated pending request count from API:", count);
        }
      } catch (error) {
        console.error("Error fetching pending request count:", error);
      }
    },
    [user?.firebase_uid, pendingCountCache]
  );

  // Fetch the pending count on mount only
  useEffect(() => {
    if (user?.firebase_uid && pendingCountCache.timestamp === 0) {
      fetchPendingRequestCount(true); // Force initial fetch only if no cache
    }
  }, [
    user?.firebase_uid,
    fetchPendingRequestCount,
    pendingCountCache.timestamp,
  ]);

  const handleInvite = async (receiverId: string) => {
    if (!user?.firebase_uid || !user?.username) return;

    try {
      await handleSendFriendRequest(
        receiverId,
        user.firebase_uid,
        user.username
      );
      sendFriendRequest({
        sender_id: user.firebase_uid,
        receiver_id: receiverId,
        sender_username: user.username,
      });

      setSnackbar({
        open: true,
        message: "Friend request sent successfully!",
        isSender: true,
        senderId: "",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Error sending friend request",
        isSender: true,
        senderId: "",
      });
    }
  };

  const onAcceptFriendRequest = async (senderId: string) => {
    try {
      // Get the friend's information before accepting
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/user-info/${senderId}`
      );
      const friendInfo = response.data;

      // Accept the friend request
      await handleAcceptRequest(senderId);
      setSnackbar({ ...snackbar, open: false });

      // Optimistically update UI immediately
      setPendingCount((prev) => Math.max(0, prev - 1));

      // Immediately update the friendList with the new friend
      if (friendInfo) {
        setLocalFriendList((prev) => {
          // Check if friend already exists to prevent duplicates
          if (!prev.some((f) => f.firebase_uid === friendInfo.firebase_uid)) {
            return [...prev, friendInfo];
          }
          return prev;
        });
      }

      // Fetch updated data anyway to ensure consistency
      fetchFriends();

      // Update the pending count cache
      setPendingCountCache((prev) => ({
        count: Math.max(0, prev.count - 1),
        timestamp: Date.now(),
      }));
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Error accepting friend request",
        isSender: true,
        senderId: "",
      });
    }
  };

  const handleDeclineFriendRequest = async (senderId: string) => {
    try {
      await handleRejectRequest(senderId);
      setSnackbar({ ...snackbar, open: false });

      // Optimistically update UI
      setPendingCount((prev) => Math.max(0, prev - 1));

      // No need to call fetchPendingRequestCount() here
    } catch (error) {
      console.error("Error declining friend request:", error);
    }
  };

  const openModal = (tab: string) => {
    setActiveTab(tab);
    setModalOpen(true);

    // Only fetch pending request count when opening that tab and if cache is stale
    if (tab === "FRIEND REQUESTS") {
      const now = Date.now();
      const cacheAge = now - pendingCountCache.timestamp;

      // Only fetch if cache is older than 30 seconds
      if (cacheAge > 30000) {
        fetchPendingRequestCount(true);
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveTab("");
  };

  return (
    <>
      <Box className="rounded-[0.8rem] border-[0.2rem] border-[#3B354C] h-auto w-full">
        <div className="px-6 sm:px-6 md:px-8 pt-6 sm:pt-6 md:pt-8 pb-6 sm:pb-4">
          <div className="flex flex-row items-center mb-3 sm:mb-4 gap-2 sm:gap-3">
            <img
              src="/bunny.png"
              className="w-4 sm:w-8 md:w-10 h-auto"
              alt="icon"
            />
            <p className="text-sm sm:text-base md:text-xl font-semibold">
              Friend List
            </p>
          </div>
          <hr className="border-t-2 border-[#3B354D] mb-3 sm:mb-3 md:mb-4" />

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={1}
            >
              <img
                src={cauldronGif}
                alt="Loading..."
                style={{ width: "2.5rem", height: "auto" }}
              />
            </Box>
          ) : error ? (
            <div className="text-center text-red-500 text-xs sm:text-sm">
              {error}
            </div>
          ) : localFriendList.length === 0 ? (
            <Stack
              spacing={1}
              display="flex"
              justifyContent="center"
              alignItems="center"
              padding="0.5rem 0 0.75rem"
            >
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  src={noFriend}
                  alt="noFriend"
                  style={{
                    width: "8.5rem",
                    height: "auto",
                    opacity: 0.75,
                  }}
                />
              </Box>
              <p className="text-[#6F658D] font-semibold text-xs text-center px-2">
                Add friends and share the magic!
              </p>
            </Stack>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {localFriendList.map((friend: Friend) => (
                <FriendListItem key={friend.firebase_uid} friend={friend} />
              ))}
            </div>
          )}
        </div>

        <FriendListActions
          activeTab={activeTab}
          onTabChange={openModal}
          pendingCount={pendingCount}
        />
      </Box>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onFriendRequestHandled={fetchPendingRequestCount}
      />

      <InviteSnackbar
        open={snackbar.open}
        message={snackbar.message}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={snackbar.isSender ? 3000 : 6000}
        actionButtons={
          snackbar.isSender ? undefined : (
            <>
              <IconButton
                size="small"
                aria-label="accept"
                color="inherit"
                onClick={() => onAcceptFriendRequest(snackbar.senderId)}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label="decline"
                color="inherit"
                onClick={() => handleDeclineFriendRequest(snackbar.senderId)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          )
        }
      />
    </>
  );
};

export default FriendList;
