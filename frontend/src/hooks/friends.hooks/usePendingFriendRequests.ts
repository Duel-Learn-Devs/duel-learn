import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useFriendSocket } from "./useFriendSocket";
import { PendingRequest } from "../../types/friendObject";

export const usePendingFriendRequests = (userId: string | undefined) => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestsCount, setRequestsCount] = useState(0);

  // Add cache control
  const requestsCache = useRef<{
    data: PendingRequest[];
    count: number;
    timestamp: number;
  }>({ data: [], count: 0, timestamp: 0 });
  const isFetchingRef = useRef(false);

  const { socket, isConnected } = useFriendSocket({
    userId,
    onFriendRequest: (data) => {
      console.log("Socket: New friend request received", data);
      const newRequest: PendingRequest = {
        friendrequest_id: `${data.sender_id}_${Date.now()}`,
        sender_id: data.sender_id,
        sender_username: data.sender_username,
        receiver_id: userId || "",
        receiver_username: data.receiver_username || "",
        status: "pending",
        created_at: new Date().toISOString(),
        sender_info: {
          username: data.sender_username,
          level: 0,
        },
      };
      addPendingRequest(newRequest);
      setRequestsCount((prev) => prev + 1);

      // Update cache
      requestsCache.current = {
        data: [...requestsCache.current.data, newRequest],
        count: requestsCache.current.count + 1,
        timestamp: Date.now(),
      };
    },
    onFriendRequestAccepted: (data) => {
      console.log("Socket: Friend request accepted", data);
      if (data.newFriend) {
        removePendingRequest(data.newFriend.firebase_uid);
        setRequestsCount((prev) => Math.max(0, prev - 1));

        // Update cache
        const updatedRequests = requestsCache.current.data.filter(
          (req) => req.sender_id !== data.newFriend.firebase_uid
        );
        requestsCache.current = {
          data: updatedRequests,
          count: Math.max(0, requestsCache.current.count - 1),
          timestamp: Date.now(),
        };
      }
    },
    onFriendRequestRejected: (data) => {
      console.log("Socket: Friend request rejected", data);
      if (data.sender_id) {
        removePendingRequest(data.sender_id);
        setRequestsCount((prev) => Math.max(0, prev - 1));

        // Update cache
        const updatedRequests = requestsCache.current.data.filter(
          (req) => req.sender_id !== data.sender_id
        );
        requestsCache.current = {
          data: updatedRequests,
          count: Math.max(0, requestsCache.current.count - 1),
          timestamp: Date.now(),
        };
      }
    },
  });

  // Add socket connection status logging
  useEffect(() => {
    console.log("Socket connection status:", isConnected);
  }, [isConnected]);

  const addPendingRequest = useCallback((request: PendingRequest) => {
    console.log("Adding pending request:", request);
    setPendingRequests((prevRequests) => {
      if (!prevRequests.some((r) => r.sender_id === request.sender_id)) {
        return [...prevRequests, request];
      }
      return prevRequests;
    });
  }, []);

  const removePendingRequest = useCallback((senderId: string) => {
    console.log("Removing pending request for sender:", senderId);
    setPendingRequests((prevRequests) =>
      prevRequests.filter((request) => request.sender_id !== senderId)
    );
  }, []);

  const fetchPendingRequests = useCallback(
    async (force = false) => {
      if (!userId) return;

      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        console.log(
          "Already fetching pending requests, skipping duplicate call"
        );
        return;
      }

      const now = Date.now();
      const cacheAge = now - requestsCache.current.timestamp;

      // Use cache if it's recent and not empty and not forced
      if (
        !force &&
        cacheAge < 30000 &&
        requestsCache.current.data.length >= 0
      ) {
        console.log("Using cached pending requests data");
        setPendingRequests(requestsCache.current.data);
        setRequestsCount(requestsCache.current.count);
        setLoading(false);
        return;
      }

      try {
        isFetchingRef.current = true;
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/friend/pending/${userId}`
        );
        const requests = Array.isArray(response.data) ? response.data : [];
        console.log("Fetched pending requests:", requests);

        setPendingRequests(requests);
        setRequestsCount(requests.length);
        setError("");

        // Update cache
        requestsCache.current = {
          data: requests,
          count: requests.length,
          timestamp: now,
        };
      } catch (err) {
        setError("Failed to load pending friend requests");
        console.error("Error fetching pending requests:", err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [userId]
  );

  const handleRejectRequest = async (senderId: string) => {
    if (!userId) return;

    try {
      console.log("Rejecting friend request from:", senderId);

      // Optimistic UI update
      removePendingRequest(senderId);
      setRequestsCount((prev) => Math.max(0, prev - 1));

      // Update cache optimistically
      const updatedRequests = requestsCache.current.data.filter(
        (req) => req.sender_id !== senderId
      );
      requestsCache.current = {
        data: updatedRequests,
        count: Math.max(0, requestsCache.current.count - 1),
        timestamp: Date.now(),
      };

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/reject`,
        {
          sender_id: senderId,
          receiver_id: userId,
        }
      );

      // Emit socket event for real-time update
      if (socket && isConnected) {
        console.log("Emitting rejectFriendRequest event:", {
          sender_id: senderId,
          receiver_id: userId,
        });
        socket.emit("rejectFriendRequest", {
          sender_id: senderId,
          receiver_id: userId,
        });
      } else {
        console.log("Socket not connected, couldn't emit event");
      }
    } catch (err) {
      setError("Failed to reject friend request");
      console.error("Error rejecting friend request:", err);

      // Restore cache and UI state on error
      fetchPendingRequests(true);
      throw err;
    }
  };

  const handleAcceptRequest = async (
    senderId: string,
    senderUsername?: string
  ) => {
    if (!userId) return;

    try {
      console.log("Accepting friend request from:", senderId);

      // First get both users' information
      const [senderInfo, receiverInfo] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/friend/user-info/${senderId}`
        ),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/friend/user-info/${userId}`
        ),
      ]);

      // Then accept the request
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/accept`,
        {
          sender_id: senderId,
          sender_username: senderUsername || senderInfo.data.username,
          receiver_id: userId,
          receiver_username: receiverInfo.data.username,
        }
      );

      // Update local state
      removePendingRequest(senderId);
      setRequestsCount((prev) => Math.max(0, prev - 1));

      // Emit socket event for real-time update with complete user info
      if (socket && isConnected) {
        console.log("Emitting acceptFriendRequest event with user info:", {
          sender_id: senderId,
          sender_username: senderUsername || senderInfo.data.username,
          receiver_id: userId,
          receiver_username: receiverInfo.data.username,
          senderInfo: senderInfo.data,
          receiverInfo: receiverInfo.data,
        });

        socket.emit("acceptFriendRequest", {
          sender_id: senderId,
          sender_username: senderUsername || senderInfo.data.username,
          receiver_id: userId,
          receiver_username: receiverInfo.data.username,
          senderInfo: senderInfo.data,
          receiverInfo: receiverInfo.data,
        });
      } else {
        console.log(
          "Socket not connected, couldn't emit acceptFriendRequest event"
        );
      }

      return response.data;
    } catch (err) {
      setError("Failed to accept friend request");
      console.error("Error accepting friend request:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (userId && !isFetchingRef.current) {
      // Only fetch if cache is empty or stale (older than 30 seconds)
      const cacheAge = Date.now() - requestsCache.current.timestamp;
      if (cacheAge > 30000 || requestsCache.current.data.length === 0) {
        fetchPendingRequests();
      } else {
        // Use cache
        setPendingRequests(requestsCache.current.data);
        setRequestsCount(requestsCache.current.count);
        setLoading(false);
      }
    }
  }, [userId, fetchPendingRequests]);

  return {
    pendingRequests,
    loading,
    error,
    handleAcceptRequest,
    handleRejectRequest,
    requestsCount,
    isConnected,
    fetchPendingRequests, // Export this so components can refresh when needed
  };
};
