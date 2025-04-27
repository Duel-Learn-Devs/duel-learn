import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Friend } from "../../contexts/UserContext";
import { useFriendSocket } from "./useFriendSocket";

export const useFriendList = (userId: string | undefined) => {
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [_pendingRequests, setPendingRequests] = useState<{
    [key: string]: string;
  }>({});

  const addFriend = useCallback((newFriend: Friend) => {
    setFriendList((prevList) => {
      if (
        !prevList.some(
          (friend) => friend.firebase_uid === newFriend.firebase_uid
        )
      ) {
        return [...prevList, newFriend];
      }
      return prevList;
    });
  }, []);

  const removeFriend = useCallback((friendId: string) => {
    setFriendList((prevList) =>
      prevList.filter((friend) => friend.firebase_uid !== friendId)
    );
  }, []);

  const fetchFriends = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/friend-info/${userId}`
      );
      setFriendList(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      setError("Failed to load friends");
      console.error("Error fetching friends:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Enhanced handler for friend request acceptance via socket
  const handleFriendRequestAccepted = useCallback(
    (data: { newFriend: Friend }) => {
      console.log(
        "Friend request accepted, adding new friend:",
        data.newFriend
      );
      addFriend(data.newFriend);
      // Refresh the friend list to ensure consistency
      fetchFriends();
    },
    [addFriend, fetchFriends]
  );

  const {
    socket,
    isConnected,
    acceptFriendRequest,
    removeFriend: emitRemoveFriend,
  } = useFriendSocket({
    userId,
    onFriendRequestAccepted: handleFriendRequestAccepted,
    onFriendRemoved: (data) => {
      removeFriend(data.removedFriendId);
    },
  });

  const handleSendFriendRequest = async (
    receiverId: string,
    senderId: string,
    senderUsername: string,
    receiverUsername?: string
  ) => {
    if (!senderId || !receiverId) {
      throw new Error("Invalid user ID. Please try again.");
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/request`,
        {
          sender_id: senderId,
          sender_username: senderUsername,
          receiver_id: receiverId,
          receiver_username: receiverUsername,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // Update pendingRequests state
      setPendingRequests((prev) => ({
        ...prev,
        [receiverId]: senderUsername,
      }));

      return response;
    } catch (error: any) {
      if (error?.response?.status === 400) {
        throw new Error(
          error.response.data.message || "Failed to send friend request"
        );
      }
      throw error;
    }
  };

  const handleAcceptFriendRequest = async (
    senderId: string,
    receiverId: string
  ) => {
    try {
      // Get both sender and receiver info first
      const [senderResponse, receiverResponse] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/info/${senderId}`
        ),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/info/${receiverId}`
        ),
      ]);

      const senderInfo = senderResponse.data as Friend;
      const receiverInfo = receiverResponse.data as Friend;

      // Accept the friend request via API
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/accept`,
        { sender_id: senderId, receiver_id: receiverId },
        { headers: { "Content-Type": "application/json" } }
      );

      // Emit socket event with complete user info
      if (socket && isConnected) {
        acceptFriendRequest({
          sender_id: senderId,
          sender_username: senderInfo.username,
          receiver_id: receiverId,
          receiver_username: receiverInfo.username,
          senderInfo: senderInfo,
          receiverInfo: receiverInfo,
        });
      }

      // Add the friend locally immediately for instant UI update
      if (userId === receiverId) {
        // We are the receiver, add the sender as friend
        addFriend(senderInfo);
      } else {
        // We are the sender, add the receiver as friend
        addFriend(receiverInfo);
      }

      // Refresh the friend list to ensure consistency
      fetchFriends();

      return response;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  };

  const handleRemoveFriend = async (senderId: string, receiverId: string) => {
    try {
      // Optimistically remove the friend from the list
      removeFriend(receiverId);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/remove`,
        { sender_id: senderId, receiver_id: receiverId },
        { headers: { "Content-Type": "application/json" } }
      );

      if (socket && isConnected) {
        emitRemoveFriend({
          sender_id: senderId,
          receiver_id: receiverId,
        });
      }

      return response;
    } catch (error) {
      console.error("Error removing friend:", error);
      // If there's an error, refresh the friend list to ensure consistency
      await fetchFriends();
      throw error;
    }
  };

  // Listen for socket reconnects to refresh data
  useEffect(() => {
    if (isConnected && userId) {
      fetchFriends();
    }
  }, [isConnected, userId, fetchFriends]);

  // Initial data fetch
  useEffect(() => {
    fetchFriends();
  }, [userId, fetchFriends]);

  return {
    friendList,
    loading,
    error,
    fetchFriends,
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRemoveFriend,
    addFriend,
    removeFriend,
    isConnected,
  };
};
