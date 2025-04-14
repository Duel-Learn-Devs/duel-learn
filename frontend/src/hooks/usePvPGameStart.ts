import { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

interface GameStartOptions {
  lobbyCode: string;
  hostId: string;
  guestId: string;
  hostUsername: string;
  guestUsername: string;
  questionTypes: string[];
  studyMaterialId?: string;
  studyMaterialTitle?: string;
  difficulty?: string;
}

export const usePvPGameStart = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  
  const startGame = async (options: GameStartOptions) => {
    if (!user?.firebase_uid) {
      setError("User must be logged in to start a game");
      return { success: false, error: "User must be logged in to start a game" };
    }
    
    setIsStarting(true);
    setError(null);
    
    try {
      // First set the difficulty if not already set
      const difficulty = options.difficulty || null;
      
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby/difficulty`, {
        lobby_code: options.lobbyCode,
        difficulty: difficulty,
      });
      
      // Then initialize the battle session
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/gameplay/battle/initialize-session`, {
        lobby_code: options.lobbyCode,
        host_id: options.hostId,
        guest_id: options.guestId,
        host_username: options.hostUsername,
        guest_username: options.guestUsername,
        total_rounds: 30,
        is_active: true,
        host_in_battle: true,
        guest_in_battle: true,
        difficulty_mode: difficulty,
        study_material_id: options.studyMaterialId,
        study_material_title: options.studyMaterialTitle,
        question_types: options.questionTypes
      });
      
      // Update lobby status to in_progress
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/lobby/status`, {
        lobby_code: options.lobbyCode,
        status: 'in_progress'
      });
      
      return {
        success: true,
        gameData: {
          lobbyCode: options.lobbyCode,
          difficulty,
          hostId: options.hostId,
          guestId: options.guestId,
          hostUsername: options.hostUsername,
          guestUsername: options.guestUsername,
          isHost: user.firebase_uid === options.hostId,
          questionTypes: options.questionTypes,
          studyMaterialId: options.studyMaterialId,
          studyMaterialTitle: options.studyMaterialTitle
        }
      };
    } catch (err: any) {
      console.error("Error starting game:", err);
      setError(err.message || "Failed to start game");
      return { 
        success: false, 
        error: err.message || "Failed to start game" 
      };
    } finally {
      setIsStarting(false);
    }
  };
  
  return {
    startGame,
    isStarting,
    error
  };
}; 