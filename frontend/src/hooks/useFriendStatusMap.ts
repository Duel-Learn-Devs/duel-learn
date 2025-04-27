import { useState, useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useLobbyStatus } from './useLobbyStatus';
import SocketService from '../services/socketService';

// Friend status information
export interface FriendStatus {
  isOnline: boolean;
  isInGame: boolean;
  isInLobby: boolean;
  gameMode: string | null;
}

/**
 * Hook to get status information for multiple friends at once
 * This optimizes by making a single socket request for all friends
 */
export function useFriendStatusMap(friendIds: string[]): Map<string, FriendStatus> {
  const [statusMap, setStatusMap] = useState<Map<string, FriendStatus>>(new Map());
  
  useEffect(() => {
    if (!friendIds.length) return;
    
    const socketService = SocketService.getInstance();
    const socket = socketService.getSocket();
    
    if (!socket) {
      console.log("No socket available when checking friend statuses");
      return;
    }
    
    // Request statuses for all friends at once
    socket.emit("requestOnlineStatus", { userIds: friendIds });
    socket.emit("requestGameStatus", { userIds: friendIds });
    socket.emit("requestLobbyStatus", { userIds: friendIds });
    
    // Handle status responses
    const handleOnlineStatusResponse = (data: Record<string, boolean>) => {
      setStatusMap(prevMap => {
        const newMap = new Map(prevMap);
        
        Object.entries(data).forEach(([userId, isOnline]) => {
          const currentStatus = newMap.get(userId) || { 
            isOnline: false, 
            isInGame: false, 
            isInLobby: false,
            gameMode: null
          };
          
          newMap.set(userId, {
            ...currentStatus,
            isOnline
          });
        });
        
        return newMap;
      });
    };
    
    const handleGameStatusResponse = (
      data: Record<string, { inGame: boolean; mode: string | null }>
    ) => {
      setStatusMap(prevMap => {
        const newMap = new Map(prevMap);
        
        Object.entries(data).forEach(([userId, status]) => {
          const currentStatus = newMap.get(userId) || { 
            isOnline: false, 
            isInGame: false, 
            isInLobby: false,
            gameMode: null
          };
          
          newMap.set(userId, {
            ...currentStatus,
            isInGame: status.inGame,
            gameMode: status.mode
          });
        });
        
        return newMap;
      });
    };
    
    const handleLobbyStatusResponse = (
      data: Record<string, { inLobby: boolean }>
    ) => {
      setStatusMap(prevMap => {
        const newMap = new Map(prevMap);
        
        Object.entries(data).forEach(([userId, status]) => {
          const currentStatus = newMap.get(userId) || { 
            isOnline: false, 
            isInGame: false, 
            isInLobby: false,
            gameMode: null
          };
          
          newMap.set(userId, {
            ...currentStatus,
            isInLobby: status.inLobby
          });
        });
        
        return newMap;
      });
    };
    
    // Individual status change handlers
    const handleOnlineStatusChange = (data: { userId: string; online: boolean }) => {
      setStatusMap(prevMap => {
        const newMap = new Map(prevMap);
        const currentStatus = newMap.get(data.userId) || { 
          isOnline: false, 
          isInGame: false, 
          isInLobby: false,
          gameMode: null
        };
        
        newMap.set(data.userId, {
          ...currentStatus,
          isOnline: data.online
        });
        
        return newMap;
      });
    };
    
    const handleGameStatusChange = (data: { 
      userId: string; 
      inGame: boolean;
      mode: string | null 
    }) => {
      setStatusMap(prevMap => {
        const newMap = new Map(prevMap);
        const currentStatus = newMap.get(data.userId) || { 
          isOnline: false, 
          isInGame: false, 
          isInLobby: false,
          gameMode: null
        };
        
        newMap.set(data.userId, {
          ...currentStatus,
          isInGame: data.inGame,
          gameMode: data.mode
        });
        
        return newMap;
      });
    };
    
    const handleLobbyStatusChange = (data: { 
      userId: string; 
      inLobby: boolean 
    }) => {
      setStatusMap(prevMap => {
        const newMap = new Map(prevMap);
        const currentStatus = newMap.get(data.userId) || { 
          isOnline: false, 
          isInGame: false, 
          isInLobby: false,
          gameMode: null
        };
        
        newMap.set(data.userId, {
          ...currentStatus,
          isInLobby: data.inLobby
        });
        
        return newMap;
      });
    };
    
    // Set up event listeners
    socket.on("onlineStatusResponse", handleOnlineStatusResponse);
    socket.on("gameStatusResponse", handleGameStatusResponse);
    socket.on("lobbyStatusResponse", handleLobbyStatusResponse);
    socket.on("userStatusChanged", handleOnlineStatusChange);
    socket.on("userGameStatusChanged", handleGameStatusChange);
    socket.on("userLobbyStatusChanged", handleLobbyStatusChange);
    
    // Clean up listeners
    return () => {
      socket.off("onlineStatusResponse", handleOnlineStatusResponse);
      socket.off("gameStatusResponse", handleGameStatusResponse);
      socket.off("lobbyStatusResponse", handleLobbyStatusResponse);
      socket.off("userStatusChanged", handleOnlineStatusChange);
      socket.off("userGameStatusChanged", handleGameStatusChange);
      socket.off("userLobbyStatusChanged", handleLobbyStatusChange);
    };
  }, [friendIds]);
  
  return statusMap;
} 