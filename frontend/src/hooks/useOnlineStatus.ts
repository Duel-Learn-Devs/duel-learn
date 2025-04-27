import { useState, useEffect } from "react";
import SocketService from "../services/socketService";

export const useOnlineStatus = (userId: string) => {
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    // Get socket from the service
    const socketService = SocketService.getInstance();
    const socket = socketService.getSocket();

    if (!socket) {
      console.log("No socket available when checking online status");
      return;
    }

    console.log(`Checking online status for user: ${userId}`);

    // Request initial status
    socket.emit("requestOnlineStatus", { userIds: [userId] });

    // Handle responses
    const handleStatusResponse = (data: Record<string, boolean>) => {
      if (data[userId] !== undefined) {
        setIsOnline(data[userId]);
      }
    };

    const handleStatusChange = (data: { userId: string; online: boolean }) => {
      if (data.userId === userId) {
        setIsOnline(data.online);
      }
    };

    // Set up listeners
    socket.on("onlineStatusResponse", handleStatusResponse);
    socket.on("userStatusChanged", handleStatusChange);

    // Clean up
    return () => {
      if (socket) {
        socket.off("onlineStatusResponse", handleStatusResponse);
        socket.off("userStatusChanged", handleStatusChange);
      }
    };
  }, [userId]);

  return isOnline;
};
