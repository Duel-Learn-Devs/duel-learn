import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { generateLobbyCode } from "../services/pvpLobbyService";
import { useNavigate } from "react-router-dom";

interface LobbySettings {
  questionTypes?: string[];
  studyMaterialId?: string;
  studyMaterialTitle?: string;
  difficulty?: string;
  timeLimit?: number | null;
}

interface CreateLobbyResponse {
  lobbyCode: string;
  success: boolean;
  error?: string;
  settings?: LobbySettings;
}

export const usePvPLobby = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const createLobby = useCallback(
    async (initialSettings?: LobbySettings): Promise<CreateLobbyResponse> => {
      if (!user?.firebase_uid) {
        setError("User must be logged in to create a lobby");
        return {
          success: false,
          lobbyCode: "",
          error: "User must be logged in to create a lobby",
        };
      }

      setLoading(true);
      setError(null);

      try {
        // Generate a unique lobby code
        const lobbyCode = generateLobbyCode();

        // Prepare lobby data
        const lobbyData = {
          lobby_code: lobbyCode,
          host_id: user.firebase_uid,
          host_username: user.username,
          host_level: user.level || 1,
          host_picture: user.display_picture,
          status: "waiting",
          created_at: new Date().toISOString(),
          settings: {
            question_types: initialSettings?.questionTypes || [],
            study_material_id: initialSettings?.studyMaterialId || null,
            study_material_title: initialSettings?.studyMaterialTitle || null,
            difficulty: initialSettings?.difficulty || null,
            time_limit: initialSettings?.timeLimit || null,
          },
        };

        // Create the lobby in the database
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/lobby/create`,
          lobbyData
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to create lobby");
        }

        return {
          success: true,
          lobbyCode,
          settings: initialSettings,
        };
      } catch (err: any) {
        console.error("Error creating lobby:", err);
        setError(err.message || "Failed to create lobby");
        return {
          success: false,
          lobbyCode: "",
          error: err.message || "Failed to create lobby",
        };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const joinLobby = useCallback(
    async (lobbyCode: string) => {
      if (!user?.firebase_uid) {
        setError("User must be logged in to join a lobby");
        return {
          success: false,
          error: "User must be logged in to join a lobby",
        };
      }

      setLoading(true);
      setError(null);

      try {
        console.group("PvP Lobby Join API Call");
        console.log("Joining lobby:", lobbyCode);
        console.log("User data:", user);

        // Prepare guest data
        const guestData = {
          lobby_code: lobbyCode,
          player_id: user.firebase_uid,
          player_username: user.username,
          player_level: user.level || 1,
          player_picture: user.display_picture,
        };

        // Join the lobby
        console.log("Sending join request with data:", guestData);

        const joinResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/lobby/join`,
          guestData
        );

        console.log("Join response received:", joinResponse.data);
        console.groupEnd();

        if (!joinResponse.data.success) {
          throw new Error(joinResponse.data.message || "Failed to join lobby");
        }

        return {
          success: true,
          lobbyData: joinResponse.data.data,
        };
      } catch (err: any) {
        console.error("Join Lobby API Error:", err);
        console.log("Error response:", err.response?.data);
        console.groupEnd();

        setError(err.message || "Failed to join lobby");
        return {
          success: false,
          error: err.message || "Failed to join lobby",
        };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    createLobby,
    joinLobby,
    loading,
    error,
  };
};
