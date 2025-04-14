import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Update game status in both local state and via socket
  const setInGame = (inGame: boolean, mode: GameMode) => {
    setIsInGame(inGame);
    setGameMode(mode);

    // Broadcast status change via socket if user is logged in
    if (user?.firebase_uid) {
      const socket = socketService.getSocket();

      if (socket?.connected) {
        socket.emit("userGameStatusChanged", {
          userId: user.firebase_uid,
          inGame,
          mode,
        });

        if (inGame) {
          socket.emit("player_entered_game", {
            playerId: user.firebase_uid,
            mode,
          });
        } else {
          socket.emit("player_exited_game", {
            playerId: user.firebase_uid,
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
          socket.emit("userGameStatusChanged", {
            userId: user.firebase_uid,
            inGame: false,
            mode: null,
          });
          socket.emit("player_exited_game", {
            playerId: user.firebase_uid,
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
