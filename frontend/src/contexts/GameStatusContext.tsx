import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import SocketService from "../services/socketService";
import { useUser } from "./UserContext";
import { GameMode } from "../hooks/useLobbyStatus";

interface GameStatusContextProps {
  isInGame: boolean;
  gameMode: GameMode;
  setInGame: (inGame: boolean, mode: GameMode) => void;
}

const GameStatusContext = createContext<GameStatusContextProps | undefined>(
  undefined
);

export const GameStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isInGame, setIsInGame] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const { user } = useUser();
  const socketService = SocketService.getInstance();
  const lastStatusUpdateRef = useRef<{inGame: boolean, mode: GameMode, timestamp: number}>({
    inGame: false,
    mode: null,
    timestamp: 0
  });

  // Update game status in both local state and via socket with debounce
  const setInGame = (inGame: boolean, mode: GameMode) => {
    // Skip redundant updates
    if (isInGame === inGame && gameMode === mode) {
      return;
    }
    
    // Check if we're updating too quickly (debounce)
    const now = Date.now();
    const timeSinceLastUpdate = now - lastStatusUpdateRef.current.timestamp;
    const isSameTransition = 
      lastStatusUpdateRef.current.inGame !== inGame && 
      lastStatusUpdateRef.current.mode !== mode;
      
    // If same transition happened within 500ms, skip this update to avoid flickering
    if (isSameTransition && timeSinceLastUpdate < 500) {
      console.log("Skipping rapid status change to prevent flickering");
      return;
    }
    
    // Update refs
    lastStatusUpdateRef.current = {
      inGame,
      mode,
      timestamp: now
    };
    
    // Update state
    setIsInGame(inGame);
    setGameMode(mode);

    // Broadcast status change via socket if user is logged in
    if (user?.firebase_uid) {
      const socket = socketService.getSocket();

      if (socket?.connected) {
        // Always include both inGame and mode fields
        socket.emit("userGameStatusChanged", {
          userId: user.firebase_uid,
          inGame,
          mode: mode || null, // Ensure mode is never undefined
        });

        if (inGame) {
          socket.emit("player_entered_game", {
            playerId: user.firebase_uid,
            inGame: true,
            mode: mode || null,
          });
        } else {
          socket.emit("player_exited_game", {
            playerId: user.firebase_uid,
            inGame: false,
            mode: null,
          });
        }
      }
    }
  };

  // Listen for game status changes from other users
  useEffect(() => {
    if (!user?.firebase_uid) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleGameStatusChange = (data: {
      userId: string;
      inGame: boolean;
      mode: GameMode;
    }) => {
      if (data.userId === user.firebase_uid) {
        setIsInGame(data.inGame);
        setGameMode(data.mode);
      }
    };

    socket.on("userGameStatusChanged", handleGameStatusChange);

    return () => {
      socket.off("userGameStatusChanged", handleGameStatusChange);
    };
  }, [user?.firebase_uid]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Reset game status when context unmounts
      if (user?.firebase_uid && isInGame) {
        const socket = socketService.getSocket();
        if (socket?.connected) {
          // Ensure all required fields are included
          socket.emit("userGameStatusChanged", {
            userId: user.firebase_uid,
            inGame: false,
            mode: null,
          });
          socket.emit("player_exited_game", {
            playerId: user.firebase_uid,
            inGame: false,
            mode: null,
          });
        }
      }
    };
  }, [user?.firebase_uid, isInGame]);

  return (
    <GameStatusContext.Provider value={{ isInGame, gameMode, setInGame }}>
      {children}
    </GameStatusContext.Provider>
  );
};

export const useGameStatus = () => {
  const context = useContext(GameStatusContext);
  if (context === undefined) {
    throw new Error("useGameStatus must be used within a GameStatusProvider");
  }
  return context;
};
