import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { FriendRequestData } from "../../types/friendObject";

interface UseFriendSocketProps {
  userId: string | undefined;
  onFriendRequest?: (data: FriendRequestData) => void;
  onFriendRequestAccepted?: (data: any) => void;
  onFriendRequestRejected?: (data: any) => void;
  onFriendRemoved?: (data: { removedFriendId: string }) => void;
  onFriendRequestSent?: (data: {
    success: boolean;
    receiver_id: string;
    receiver_username?: string;
  }) => void;
}

export const useFriendSocket = ({
  userId,
  onFriendRequest,
  onFriendRequestAccepted,
  onFriendRequestRejected,
  onFriendRemoved,
  onFriendRequestSent,
}: UseFriendSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Prevent duplicate connections
  useEffect(() => {
    if (userId && !socketRef.current) {
      const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        // Explicitly request websocket transport first for better performance
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("Socket connected, setting up for user:", userId);
        setIsConnected(true);
        newSocket.emit("setup", userId);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected for user:", userId);
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error for user:", userId, error);
        setIsConnected(false);
      });

      socketRef.current = newSocket;

      return () => {
        console.log("Cleaning up socket for user:", userId);
        newSocket.disconnect();
        newSocket.close();
        socketRef.current = null;
        setIsConnected(false);
      };
    }
  }, [userId]);

  // Set up a single useEffect for all event listeners
  useEffect(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket) return;

    console.log("Setting up socket event listeners for user:", userId);

    // Set up event listeners
    if (onFriendRequest) {
      currentSocket.on("newFriendRequest", onFriendRequest);
    }

    if (onFriendRequestAccepted) {
      currentSocket.on("friendRequestAccepted", onFriendRequestAccepted);
    }

    if (onFriendRequestRejected) {
      currentSocket.on("friendRequestRejected", onFriendRequestRejected);
    }

    if (onFriendRemoved) {
      currentSocket.on("friendRemoved", onFriendRemoved);
    }

    if (onFriendRequestSent) {
      currentSocket.on("friendRequestSent", onFriendRequestSent);
    }

    // Generic error handler
    currentSocket.on(
      "error",
      (error: { type: string; message: string; details: string }) => {
        console.error("Socket error for user:", userId, error);
      }
    );

    return () => {
      // Clean up listeners
      if (currentSocket) {
        currentSocket.off("newFriendRequest");
        currentSocket.off("friendRequestAccepted");
        currentSocket.off("friendRequestRejected");
        currentSocket.off("friendRemoved");
        currentSocket.off("friendRequestSent");
        currentSocket.off("error");
      }
    };
  }, [
    userId,
    onFriendRequest,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRemoved,
    onFriendRequestSent,
  ]);

  // Socket action methods - only emit when connected
  const sendFriendRequest = (requestData: {
    sender_id: string;
    receiver_id: string;
    sender_username: string;
    receiver_username?: string;
  }) => {
    if (!socketRef.current?.connected) {
      console.error("Socket not connected when trying to send friend request");
      return;
    }

    if (
      !requestData.sender_id ||
      !requestData.receiver_id ||
      !requestData.sender_username
    ) {
      console.error("Missing required data for friend request:", requestData);
      return;
    }

    socketRef.current.emit("sendFriendRequest", requestData);
  };

  const acceptFriendRequest = (data: {
    sender_id: string;
    sender_username: string;
    receiver_id: string;
    receiver_username: string;
    senderInfo?: any;
    receiverInfo?: any;
  }) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("acceptFriendRequest", data);
  };

  const rejectFriendRequest = (data: {
    sender_id: string;
    receiver_id: string;
  }) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("rejectFriendRequest", data);
  };

  const removeFriend = (data: { sender_id: string; receiver_id: string }) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("removeFriend", data);
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
};
