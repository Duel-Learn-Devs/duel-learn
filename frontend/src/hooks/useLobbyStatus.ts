import { useState, useEffect } from "react";
import SocketService from "../services/socketService";

// Define game mode types
export type GameMode =
  | "pvp-battle"
  | "peaceful-mode"
  | "time-pressured-mode"
  | "creating-study-material"
  | "game-setup"
  | "question-setup"
  | "timer-setup"
  | "loading-game"
  | "pvp-host-setup"
  | "pvp-player2-setup"
  | "pvp-lobby"
  | "peaceful-summary"
  | "time-pressured-summary"
  | "pvp-summary"
  | null;

export const useLobbyStatus = (userId: string) => {
  const [isInLobby, setIsInLobby] = useState<boolean>(false);
  const [isInGame, setIsInGame] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Get socket from the service
    const socketService = SocketService.getInstance();
    const socket = socketService.getSocket();

    if (!socket) {
      console.log("No socket available when checking status");
      return;
    }

    console.log(`Checking status for user: ${userId}`);

    // Request initial status
    socket.emit("requestGameStatus", { userIds: [userId] });
    socket.emit("requestLobbyStatus", { userIds: [userId] });

    // Handle responses
    const handleGameStatusResponse = (
      data: Record<string, { inGame: boolean; mode: GameMode }>
    ) => {
      if (data[userId] !== undefined) {
        setIsInGame(data[userId].inGame);
        setGameMode(data[userId].mode);
      }
    };

    const handleLobbyStatusResponse = (
      data: Record<string, { inLobby: boolean; lobbyCode?: string }>
    ) => {
      if (data[userId] !== undefined) {
        setIsInLobby(data[userId].inLobby);
        setLobbyCode(data[userId].lobbyCode || null);
      }
    };

    const handleGameStatusChange = (data: {
      userId: string;
      inGame: boolean;
      mode: GameMode;
    }) => {
      if (data.userId === userId) {
        setIsInGame(data.inGame);
        setGameMode(data.mode);
      }
    };

    const handleLobbyStatusChange = (data: {
      userId: string;
      inLobby: boolean;
      lobbyCode?: string;
    }) => {
      if (data.userId === userId) {
        setIsInLobby(data.inLobby);
        setLobbyCode(data.lobbyCode || null);
      }
    };

    // When a player enters a game
    const handlePlayerEnteredGame = (data: {
      playerId: string;
      mode: GameMode;
    }) => {
      if (data.playerId === userId) {
        setIsInGame(true);
        setGameMode(data.mode);
        setIsInLobby(false);
        setLobbyCode(null);
      }
    };

    // When a player exits a game
    const handlePlayerExitedGame = (data: { playerId: string }) => {
      if (data.playerId === userId) {
        setIsInGame(false);
        setGameMode(null);
      }
    };

    const handlePlayerJoinedLobby = (data: {
      playerId: string;
      lobbyCode: string;
    }) => {
      if (data.playerId === userId) {
        setIsInLobby(true);
        setLobbyCode(data.lobbyCode);
      }
    };

    const handlePlayerLeftLobby = (data: { playerId: string }) => {
      if (data.playerId === userId) {
        setIsInLobby(false);
        setLobbyCode(null);
      }
    };

    // Set up listeners
    socket.on("gameStatusResponse", handleGameStatusResponse);
    socket.on("lobbyStatusResponse", handleLobbyStatusResponse);
    socket.on("userGameStatusChanged", handleGameStatusChange);
    socket.on("userLobbyStatusChanged", handleLobbyStatusChange);
    socket.on("player_entered_game", handlePlayerEnteredGame);
    socket.on("player_exited_game", handlePlayerExitedGame);
    socket.on("player_joined_lobby", handlePlayerJoinedLobby);
    socket.on("player_left_lobby", handlePlayerLeftLobby);

    // Clean up
    return () => {
      if (socket) {
        socket.off("gameStatusResponse", handleGameStatusResponse);
        socket.off("lobbyStatusResponse", handleLobbyStatusResponse);
        socket.off("userGameStatusChanged", handleGameStatusChange);
        socket.off("userLobbyStatusChanged", handleLobbyStatusChange);
        socket.off("player_entered_game", handlePlayerEnteredGame);
        socket.off("player_exited_game", handlePlayerExitedGame);
        socket.off("player_joined_lobby", handlePlayerJoinedLobby);
        socket.off("player_left_lobby", handlePlayerLeftLobby);
      }
    };
  }, [userId]);

  // Return both statuses and game mode
  return { isInLobby, isInGame, gameMode, lobbyCode };
};
