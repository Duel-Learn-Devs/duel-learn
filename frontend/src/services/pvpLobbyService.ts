import { generateCode } from "../pages/dashboard/play-battleground/utils/codeGenerator";
import { StudyMaterial } from "../types/studyMaterialObject";

// Define interfaces for clear typing
export interface PvPLobbyHost {
  role: 'host';
  lobbyCode: string;
  mode: string;
  material: StudyMaterial | null;
  selectedTypes?: string[];
}

export interface PvPLobbyGuest {
  role: 'guest';
  lobbyCode: string;
  mode: string;
  isJoining: true;
}

export type PvPLobbyUser = PvPLobbyHost | PvPLobbyGuest;

// Central function to generate lobby code
export const generateLobbyCode = (): string => {
  return generateCode();
};

// Function to create state for a new lobby creation
export const createNewLobby = (mode: string, material?: StudyMaterial): PvPLobbyHost => {
  const lobbyCode = generateLobbyCode();
  
  return {
    role: 'host',
    lobbyCode,
    mode,
    material: material || null,
  };
};

// Function to create state for joining an existing lobby
export const joinExistingLobby = (lobbyCode: string, mode: string): PvPLobbyGuest => {
  return {
    role: 'guest',
    lobbyCode,
    mode,
    isJoining: true,
  };
};

// Navigation helper to ensure consistent welcome screen navigation
export const navigateToWelcomeScreen = (navigate: any, lobbyState: PvPLobbyUser) => {
  const formattedMode = lobbyState.mode === "PvP Mode" ? "PvP" : lobbyState.mode;
  
  navigate("/dashboard/welcome-game-mode", {
    state: {
      mode: formattedMode,
      lobbyCode: lobbyState.lobbyCode,
      material: 'material' in lobbyState ? lobbyState.material : undefined,
      isJoining: lobbyState.role === 'guest',
      role: lobbyState.role,
      selectedTypes: 'selectedTypes' in lobbyState ? lobbyState.selectedTypes : undefined,
    }
  });
};

// Add this function to connect with socket when creating a lobby
export const createLobbyWithSocket = (lobbyCode: string, user: any, socket: any): void => {
  if (!socket || !user) return;
  
  socket.emit("createLobby", {
    lobbyCode,
    hostId: user.firebase_uid,
    hostName: user.username,
    hostLevel: user.level,
    hostPicture: user.display_picture || null
  });
  
  console.log(`Socket notification sent: Host created lobby ${lobbyCode}`);
};

// Add this function for joining a lobby via socket
export const joinLobbyWithSocket = (lobbyCode: string, user: any, socket: any): void => {
  if (!socket || !user) return;
  
  socket.emit("validateLobby", {
    lobbyCode,
    playerId: user.firebase_uid,
    playerName: user.username,
    playerLevel: user.level,
    playerPicture: user.display_picture || null
  });
  
  console.log(`Socket validation requested for lobby ${lobbyCode}`);
}; 