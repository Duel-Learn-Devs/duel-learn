import { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { generateCode } from '../pages/dashboard/play-battleground/utils/codeGenerator';

interface PvPLobbyCreationOptions {
  questionTypes?: string[];
  studyMaterial?: { id: string; title: string } | null;
}

interface PvPLobbyResult {
  isLoading: boolean;
  error: string | null;
  lobbyCode: string | null;
  createLobby: (options?: PvPLobbyCreationOptions) => Promise<string>;
}

/**
 * Custom hook for creating a PvP lobby without an initially invited guest
 */
export const usePvPLobbyCreation = (): PvPLobbyResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const { user } = useUser();

  /**
   * Creates a new PvP lobby without an invited guest
   * @param options Optional parameters for lobby creation
   * @returns The generated lobby code
   */
  const createLobby = async (options?: PvPLobbyCreationOptions): Promise<string> => {
    if (!user) {
      const noUserError = "Cannot create lobby: User is not logged in";
      setError(noUserError);
      throw new Error(noUserError);
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a unique lobby code
      const generatedLobbyCode = generateCode();
      
      // Create invitation data with null/placeholder values for the receiver
      const invitationData = {
        sender_id: user.firebase_uid,
        sender_username: user.username,
        sender_level: user.level || 1,
        // Use placeholder values for receiver fields
        receiver_id: 'no_guest_yet', // Placeholder to satisfy backend requirements
        receiver_username: '',
        receiver_level: 1,
        lobby_code: generatedLobbyCode,
        status: 'no_invitation', // Special status to indicate no guest yet
        question_types: options?.questionTypes || [],
        study_material_title: options?.studyMaterial?.title || null
      };

      // Make API call to create the lobby
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby`,
        invitationData
      );

      if (!response.data.success) {
        throw new Error("Failed to create battle lobby");
      }

      // Store the lobby code
      setLobbyCode(generatedLobbyCode);
      
      return generatedLobbyCode;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Unknown error creating lobby";
      
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    lobbyCode,
    createLobby
  };
}; 