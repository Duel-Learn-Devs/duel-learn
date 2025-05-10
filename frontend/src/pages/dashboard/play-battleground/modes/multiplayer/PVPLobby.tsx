import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import "./../../styles/setupques.css";
import SelectStudyMaterialModal from "../../../../../components/modals/SelectStudyMaterialModal";
import QuestionTypeSelectionModal from "../../components/modal/QuestionTypeSelectionModal";
import InvitePlayerModal from "../../components/modal/InvitePlayerModal";
import { useUser } from "../../../../../contexts/UserContext";
import { generateLobbyCode } from "../../../../../services/pvpLobbyService";
import defaultAvatar from "/profile-picture/default-picture.svg";
import { Socket } from "socket.io-client";
import axios from "axios";
import SocketService from "../../../../../services/socketService";
import { toast } from "react-hot-toast";
import useManaCheck from "../../../../../hooks/useManaCheck";
import DocumentHead from "../../../../../components/DocumentHead";

// Import new modular components
import {
  PvPHeader,
  PlayerCard,
  LobbyCodeDisplay,
  BattleControls,
  ConfirmationDialog,
  ManaAlertModal,
} from "./components";
import BanPvPAccGame from "./components/BanPvPAccGame";

interface Player {
  firebase_uid: string;
  username: string;
  level: number;
  display_picture: string | null;
}

interface PlayerJoinedData {
  lobbyCode: string;
  playerId: string;
  playerName?: string;
  playerLevel?: number;
  playerPicture?: string | null;
}

interface PlayerReadyData {
  lobbyCode: string;
  playerId: string;
  isReady: boolean;
}

// Add this interface for invited player status
interface InvitedPlayerStatus {
  isPending: boolean;
  invitedAt: Date;
}

// Define a type for the study material
interface StudyMaterial {
  title: string;
  id?: string;
  study_material_id?: string; // Explicitly add study_material_id
  items?: any[];
  [key: string]: any; // For any other properties
}

const PVPLobby: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    mode,
    material,
    selectedTypes,
    lobbyCode: stateLobbyCode,
    isGuest,
    friendToInvite,
  } = location.state || {};
  const { lobbyCode: urlLobbyCode } = useParams<{ lobbyCode?: string }>();
  // console.log(
  //   "Mode:",
  //   mode,
  //   "Material:",
  //   material,
  //   "Selected Types:",
  //   selectedTypes
  // );

  const questionTypes = [
    { display: "Identification", value: "identification" },
    { display: "Multiple Choice", value: "multiple-choice" },
    { display: "True or False", value: "true-false" },
  ];

  const { user, loading, updateUser } = useUser(); // Get the user and loading state from UserContext

  // Initialize mana check hook with required 10 mana
  const {
    hasSufficientMana,
    isManaModalOpen,
    closeManaModal,
    currentMana,
    requiredMana,
  } = useManaCheck(10);

  const [openDialog, setOpenDialog] = useState(false); // State to control the modal
  const [copySuccess, setCopySuccess] = useState(false); // To track if the text was copied

  const [modalOpenChangeQuestionType, setModalOpenChangeQuestionType] =
    useState(false); // State for the ChoosePvPModeModal
  const [selectedTypesFinal, setSelectedTypesFinal] = useState<string[]>(
    location.state?.selectedTypes || selectedTypes || []
  );

  // State to manage selected material and mode
  const [selectedMaterial, setSelectedMaterial] =
    useState<StudyMaterial | null>(
      location.state?.selectedMaterial || material
    );
  const [selectedMode, setSelectedMode] = useState<string | null>(mode);
  const [openMaterialModal, setOpenMaterialModal] = useState(false);

  // State for invite modal
  const [showInviteModal, setShowInviteModal] = useState(false); // State for the invite modal
  const [selectedPlayer, setSelectedPlayer] = useState<string>(""); // State for the selected player name

  const [players, setPlayers] = useState<Player[]>([]); // Initialize players state as an empty array
  const [invitedPlayer, setInvitedPlayer] = useState<Player | null>(null); // State for the invited player

  // Use URL param first, then state lobby code, then generate new one (only once)
  const [lobbyCode, setLobbyCode] = useState<string>(() => {
    const code = urlLobbyCode || stateLobbyCode || generateLobbyCode();
    console.log("Using lobby code:", code, { urlLobbyCode, stateLobbyCode });
    return code;
  });

  // Add this effect to handle lobby code changes
  useEffect(() => {
    if (urlLobbyCode && urlLobbyCode !== lobbyCode) {
      setLobbyCode(urlLobbyCode);
      console.log("Updated lobby code from URL:", urlLobbyCode);
    } else if (
      stateLobbyCode &&
      !urlLobbyCode &&
      stateLobbyCode !== lobbyCode
    ) {
      setLobbyCode(stateLobbyCode);
      console.log("Updated lobby code from state:", stateLobbyCode);
    }
  }, [urlLobbyCode, stateLobbyCode]);

  // Add these states
  const [socket, setSocket] = useState<Socket | null>(null);

  // Add this state to track if current user is a guest (invited player)
  const [isCurrentUserGuest, setIsCurrentUserGuest] = useState<boolean>(
    isGuest || false
  );

  // Add state to track invited player status
  const [invitedPlayerStatus, setInvitedPlayerStatus] =
    useState<InvitedPlayerStatus>({
      isPending: false,
      invitedAt: new Date(),
    });

  // Add this state to track player ready status
  const [playerReadyState, setPlayerReadyState] = useState<{
    hostReady: boolean;
    guestReady: boolean;
  }>({
    hostReady: true, // Host is always considered ready
    guestReady: false,
  });

  // Add loading state for ready status operations
  const [readyStateLoading, setReadyStateLoading] = useState(false);

  // Add battle started state
  const [battleStarted, setBattleStarted] = useState(false);
  const [battleStartLoading, setBattleStartLoading] = useState(false);

  // Add invitationSent state
  const [invitationSent, setInvitationSent] = useState<boolean>(false);

  // Add these new states in the main PVPLobby component after the existing states
  const [showBanModal, setShowBanModal] = useState(false);
  const [isBanActive, setIsBanActive] = useState(false);

  // Add refs to track mana deduction
  const hostManaDeductedRef = useRef<boolean>(false);
  const guestManaDeductedRef = useRef<boolean>(false);

  // Add this ref near the top with other refs
  const hasNavigatedRef = useRef(false);

  // Set the state variables
  useEffect(() => {
    if (mode) {
      setSelectedMode(mode);
    }
    if (material) {
      setSelectedMaterial(material);
    }

    // Add default question types if they're missing (for guests joining via invitation)
    if (selectedTypes) {
      setSelectedTypesFinal(selectedTypes);
    } else if (location.state?.isGuest) {
      // Guest joining via invitation - set defaults
      setSelectedTypesFinal(["multiple-choice", "true-false"]);
    }
  }, [mode, material, selectedTypes, location.state?.isGuest]);

  // Update the socket initialization effect
  useEffect(() => {
    if (loading || !user?.firebase_uid) {
      console.log("User data not ready yet, waiting...");
      return;
    }

    console.log("Setting up socket service for user:", user.firebase_uid);
    const socketService = SocketService.getInstance();
    const newSocket = socketService.connect(user.firebase_uid);

    // Wait for socket to connect
    if (!newSocket.connected) {
      newSocket.on("connect", () => {
        console.log("Socket connected successfully");
        setSocket(newSocket);
      });
    } else {
      setSocket(newSocket);
    }

    // IMPORTANT: Use the service's on method for better reliability
    const handleBattleInvitation = (data: any) => {
      console.group("🔔 PVPLobby - Battle Invitation Received");
      console.log("Raw data:", JSON.stringify(data));

      // Validate user
      if (!user?.firebase_uid) {
        console.log("User not logged in, ignoring invitation");
        console.groupEnd();
        return;
      }

      // Skip our own invitations
      if (data.senderId === user.firebase_uid) {
        console.log("This is our own invitation, ignoring");
        console.groupEnd();
        return;
      }

      // Validate the critical fields
      if (!data.senderId) {
        console.error("⚠️ Missing senderId in battle invitation data!");
        console.groupEnd();
        return;
      }

      if (!data.lobbyCode) {
        console.error("⚠️ Missing lobbyCode in battle invitation data!");
        console.groupEnd();
        return;
      }

      // All checks passed, set the data
      console.log("Setting invitation data:", data);
      setInvitedPlayer({
        firebase_uid: String(data.senderId || "missing-sender"),
        username: data.senderName || "Unknown Player",
        level: 1,
        display_picture: null,
      });

      // Then open the invitation dialog
      setShowInviteModal(true);
      console.groupEnd();
    };

    // Register the handler with proper cleanup
    const removeListener = socketService.on(
      "battle_invitation",
      handleBattleInvitation
    );

    if (newSocket.connected) {
      // Let others know this user is in a lobby
      newSocket.emit("userLobbyStatusChanged", {
        userId: user.firebase_uid,
        inLobby: true,
        lobbyCode: lobbyCode,
      });

      // Also broadcast player joined lobby event
      newSocket.emit("player_joined_lobby", {
        playerId: user.firebase_uid,
        lobbyCode: lobbyCode,
      });
    } else {
      newSocket.once("connect", () => {
        console.log("Socket connected, emitting lobby status");
        // Let others know this user is in a lobby
        newSocket.emit("userLobbyStatusChanged", {
          userId: user.firebase_uid,
          inLobby: true,
          lobbyCode: lobbyCode,
        });

        // Also broadcast player joined lobby event
        newSocket.emit("player_joined_lobby", {
          playerId: user.firebase_uid,
          lobbyCode: lobbyCode,
        });
      });
    }

    return () => {
      if (removeListener) removeListener();
      if (newSocket) {
        console.log("Cleaning up socket connection");
        newSocket.disconnect();
      }
      newSocket.emit("userLobbyStatusChanged", {
        userId: user.firebase_uid,
        inLobby: false,
        lobbyCode: lobbyCode,
      });
      newSocket.emit("player_left_lobby", {
        playerId: user.firebase_uid,
        lobbyCode: lobbyCode,
      });
    };
  }, [user?.firebase_uid, loading]);

  // Add this effect to handle lobby code from URL
  useEffect(() => {
    if (urlLobbyCode) {
      setLobbyCode(urlLobbyCode);
      // Here you can add logic to fetch lobby data if needed
      console.log("Joined lobby:", urlLobbyCode);
    }
  }, [urlLobbyCode]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(lobbyCode) // Use the actual lobby code instead of hardcoded "641283"
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 5000);
      })
      .catch(() => {
        setCopySuccess(false);
      });
  };

  // Open the confirmation dialog
  const handleBackClick = () => {
    if (isBanActive) {
      toast.error(
        "You cannot leave while banned. Please wait until your ban expires."
      );
      return;
    }
    setOpenDialog(true); // Show the modal on back button click
  };

  // Confirm navigation
  const handleConfirmLeave = () => {
    setOpenDialog(false); // Close the modal
    navigate("/dashboard/home"); // Navigate to the home page
  };

  // Cancel navigation
  const handleCancelLeave = () => {
    setOpenDialog(false); // Close the modal if canceled
  };

  // Replace the battle started check useEffect
  useEffect(() => {
    // Only run this for guests, not for hosts
    if (!isCurrentUserGuest || !lobbyCode || hasNavigatedRef.current) return;

    const checkBattleStarted = async () => {
      try {
        // Prevent concurrent checks
        if (hasNavigatedRef.current) return;

        // Proceed with battle status check
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/battle/invitations-lobby/battle-status/${lobbyCode}`
        );

        if (
          response.data.success &&
          response.data.data.battle_started &&
          !hasNavigatedRef.current
        ) {
          console.log(
            "Battle has started! Navigating to difficulty selection..."
          );
          setBattleStarted(true);

          // Check if guest has enough mana - if not, display modal but still let them join
          // (since the host already started the battle)
          if (user?.mana && user.mana < requiredMana) {
            toast(
              "You don't have enough mana, but the battle is already starting!",
              {
                icon: "⚠️",
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "#fff",
                },
              }
            );
          }

          // Only deduct mana once using the ref flag
          if (!guestManaDeductedRef.current && user?.firebase_uid) {
            // Mark as deducted immediately to prevent race conditions
            guestManaDeductedRef.current = true;

            try {
              // Deduct mana points for guest
              const manaResponse = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/mana/reduce`,
                {
                  firebase_uid: user.firebase_uid,
                }
              );

              // Update user mana in context
              if (updateUser && typeof updateUser === "function") {
                updateUser({ mana: manaResponse.data.mana });
              }

              console.log("Guest mana reduced to:", manaResponse.data.mana);

              // Trigger mana replenishment in the background for guest
              axios
                .post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/mana/replenish`,
                  {
                    firebase_uid: user.firebase_uid,
                  }
                )
                .catch((error) => {
                  console.error(
                    "Error starting mana replenishment for guest:",
                    error
                  );
                });
            } catch (error) {
              console.error("Error reducing guest mana:", error);
              // Don't block navigation if mana reduction fails
            }
          } else {
            console.log("Guest mana already deducted, skipping deduction");
          }

          // Mark as navigated BEFORE navigation to prevent any possibility of double navigation
          hasNavigatedRef.current = true;

          // Get host and guest IDs
          const hostId = players[0]?.firebase_uid;
          const guestId = user?.firebase_uid;

          // Navigate guest to their specific route with host username
          navigate("/dashboard/select-difficulty/pvp/player2", {
            state: {
              lobbyCode,
              material: selectedMaterial,
              questionTypes: selectedTypesFinal,
              isGuest: true,
              hostUsername: players[0]?.username,
              guestUsername: user?.username,
              hostId: hostId, // Pass the actual host ID
              guestId: guestId, // Pass the actual guest ID
            },
          });
        }
      } catch (error) {
        console.error("Error checking battle status:", error);
      }
    };

    // Check once immediately
    checkBattleStarted();
  }, [
    isCurrentUserGuest,
    lobbyCode,
    navigate,
    selectedMaterial,
    selectedTypesFinal,
    players,
    user?.username,
    user?.firebase_uid,
    updateUser,
    requiredMana,
  ]);

  // Update the handleBattleStart function
  const handleBattleStart = async () => {
    // For host: only allow battle start if guest is ready
    if (!isCurrentUserGuest) {
      if (!playerReadyState.guestReady) {
        // Show a message that guest isn't ready
        toast.error("Your opponent is not ready yet!");
        return;
      }

      // Check if host has enough mana - always show the modal if insufficient
      if (user?.mana && user.mana < requiredMana) {
        // Show the mana modal
        closeManaModal(); // Close it first in case it's already open
        setTimeout(() => {
          // Using hasSufficientMana to show the modal
          hasSufficientMana();
        }, 50);
        return;
      }

      // Ban check removed from here since we check on component mount

      setBattleStartLoading(true);

      try {
        // Only deduct mana once using the ref flag
        if (!hostManaDeductedRef.current && user?.firebase_uid) {
          // Mark as deducted immediately to prevent race conditions
          hostManaDeductedRef.current = true;

          // First deduct mana points
          const manaResponse = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/mana/reduce`,
            {
              firebase_uid: user.firebase_uid,
            }
          );

          if (!manaResponse.data.success) {
            toast.error("Failed to deduct mana. Please try again.");
            setBattleStartLoading(false);
            // Reset the flag since deduction failed
            hostManaDeductedRef.current = false;
            return;
          }

          // Update user mana in context
          if (updateUser && typeof updateUser === "function") {
            updateUser({ mana: manaResponse.data.mana });
          }

          console.log("Host mana reduced to:", manaResponse.data.mana);
        } else {
          console.log("Host mana already deducted, skipping deduction");
        }

        // Then update battle_started status in the database
        const response = await axios.put(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/battle/invitations-lobby/battle-status`,
          {
            lobby_code: lobbyCode,
            battle_started: true,
          }
        );

        if (response.data.success) {
          console.log("Battle Started!");

          // Get the appropriate IDs
          const hostId = user?.firebase_uid;
          const guestId =
            invitedPlayer?.firebase_uid || players[1]?.firebase_uid;

          // Navigate host to their specific route with FIXED guest username
          navigate("/dashboard/select-difficulty/pvp", {
            state: {
              lobbyCode,
              material: selectedMaterial,
              questionTypes: selectedTypesFinal,
              isHost: true,
              hostUsername: user?.username,
              guestUsername:
                invitedPlayer?.username || players[1]?.username || "Guest",
              hostId: hostId,
              guestId: guestId,
            },
          });

          // Trigger mana replenishment in the background
          axios
            .post(`${import.meta.env.VITE_BACKEND_URL}/api/mana/replenish`, {
              firebase_uid: user?.firebase_uid,
            })
            .catch((error) => {
              console.error("Error starting mana replenishment:", error);
            });
        }
      } catch (error) {
        console.error("Error starting battle:", error);
        toast.error("Failed to start battle. Please try again.");
        // Reset the mana deducted flag on error
        hostManaDeductedRef.current = false;
      } finally {
        setBattleStartLoading(false);
      }
    } else {
      // For guest: toggle ready state - explicitly check mana when setting ready
      toggleGuestReadyState();
    }
  };

  const handleChangeMaterial = () => {
    setOpenMaterialModal(true); // Open the SelectStudyMaterialModal directly
  };

  const handleMaterialSelect = async (material: any) => {
    try {
      console.log("Selected material:", material); // Log the selected material

      // Update local state
      setSelectedMaterial(material);

      // Update in database only - no socket emit
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/settings`,
        {
          lobby_code: lobbyCode,
          question_types: selectedTypesFinal,
          study_material_title: material.title,
          study_material_id: material.study_material_id || material.id, // Add study_material_id
        }
      );

      setOpenMaterialModal(false);
    } catch (error) {
      console.error("Error updating study material:", error);
    }
  };

  const handleModeSelect = (mode: string) => {
    console.log("Mode Selected:", mode); // Debugging log
    setSelectedMode(mode); // Update selected mode
  };

  const handleChangeQuestionType = () => {
    setModalOpenChangeQuestionType(true);
  };

  const handleQuestionTypeUpdate = async (selected: string[]) => {
    try {
      // Update local state
      setSelectedTypesFinal(selected);

      // Update in database only - no socket emit
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/settings`,
        {
          lobby_code: lobbyCode,
          question_types: selected,
          study_material_title: selectedMaterial?.title,
        }
      );

      setModalOpenChangeQuestionType(false);
    } catch (error) {
      console.error("Error updating question types:", error);
    }
  };

  const handleInvite = async (friend: Player) => {
    console.log("Socket:", socket);
    console.log("User ID:", user?.firebase_uid);
    console.log("Username:", user?.username);

    if (!user?.firebase_uid || !user?.username) {
      console.error("Missing user data for invitation");
      return;
    }

    try {
      console.log("Handling invite for friend:", friend);

      // Set invited player status to pending
      setInvitedPlayerStatus({
        isPending: true,
        invitedAt: new Date(),
      });

      // Set the invited player in state
      setInvitedPlayer(friend);

      // For manual invites (from the invite modal), close the modal
      setShowInviteModal(false);

      // Set invitation sent state to start polling
      setInvitationSent(true);

      // Create invitation data
      const invitationData = {
        sender_id: user.firebase_uid,
        sender_username: user.username,
        sender_level: user.level || 1,
        receiver_id: friend.firebase_uid,
        receiver_username: friend.username,
        receiver_level: friend.level || 1,
        lobby_code: lobbyCode,
        status: "pending",
        question_types: selectedTypesFinal,
        study_material_title: selectedMaterial?.title,
      };

      // Make POST request to create battle invitation
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby`,
        invitationData
      );

      if (!response.data.success) {
        throw new Error("Failed to create battle invitation");
      }

      // Create the notification data
      const notificationData = {
        senderId: user.firebase_uid,
        senderName: user.username,
        receiverId: friend.firebase_uid,
        lobbyCode: lobbyCode,
        timestamp: new Date().toISOString(),
      };

      // Get or create socket connection
      let currentSocket = socket;
      if (!currentSocket) {
        console.log("Creating new socket connection...");
        const socketService = SocketService.getInstance();
        currentSocket = socketService.connect(user.firebase_uid);
        setSocket(currentSocket);
      }

      // Ensure socket is connected before sending
      if (!currentSocket.connected) {
        console.log("Waiting for socket to connect...");
        await new Promise<void>((resolve) => {
          currentSocket?.once("connect", () => {
            console.log("Socket connected successfully");
            resolve();
          });
        });
      }

      // Then emit socket event
      console.log("Emitting battle invitation:", notificationData);
      currentSocket.emit("notify_battle_invitation", notificationData);
    } catch (error) {
      console.error("Error sending invitation:", error);
      // Reset pending status on error
      setInvitedPlayerStatus({
        isPending: false,
        invitedAt: new Date(),
      });

      // Show error toast
      toast.error("Failed to send invitation. Please try again.");
    }
  };

  // Update the useEffect that handles player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      console.log("User Data:", user);

      if (isCurrentUserGuest) {
        // If current user is a guest, they should be player 2
        const hostInfo = location.state?.invitedPlayer || {
          firebase_uid: "host-placeholder",
          username: "Host",
          level: 1,
          display_picture: defaultAvatar,
        };

        const fetchedPlayers: Player[] = [
          // Host info from invitation data
          {
            firebase_uid: hostInfo.firebase_uid,
            username: hostInfo.username,
            level: hostInfo.level,
            display_picture: hostInfo.display_picture || defaultAvatar,
          },
          // Current user as player 2
          {
            firebase_uid: user?.firebase_uid || "",
            username: user?.username || "Player 2",
            level: user?.level || 1,
            display_picture: user?.display_picture || defaultAvatar,
          },
        ];
        setPlayers(fetchedPlayers);
      } else {
        // Original behavior for host - they are player 1
        const fetchedPlayers: Player[] = [
          {
            firebase_uid: user?.firebase_uid || "",
            username: user?.username || "Player 1",
            level: user?.level || 1,
            display_picture: user?.display_picture || defaultAvatar,
          },
        ];
        setPlayers(fetchedPlayers);
      }
    };

    fetchPlayerData();
  }, [user, isCurrentUserGuest, location.state?.invitedPlayer]);

  // Update the useEffect that handles socket events
  useEffect(() => {
    if (loading || !user?.firebase_uid || !lobbyCode) return;

    const socketService = SocketService.getInstance();
    const socket = socketService.getSocket();

    if (!socket) {
      console.error("Socket not available for lobby events");
      return;
    }

    // For guest: notify the host that we've joined and request lobby info
    if (isCurrentUserGuest) {
      console.group("🎮 Guest requesting lobby info");
      console.log("Lobby code:", lobbyCode);
      console.log("Requester ID:", user.firebase_uid);
      console.groupEnd();

      // Send join event via socket
      socket.emit("join_lobby", {
        lobbyCode: lobbyCode,
        playerId: user.firebase_uid,
        playerName: user.username,
        playerLevel: user.level || 1,
        playerPicture: user.display_picture || null,
        hostId: location.state?.invitedPlayer?.firebase_uid,
      });

      // Request lobby details
      socket.emit("request_lobby_info", {
        lobbyCode: lobbyCode,
        requesterId: user.firebase_uid,
      });
    }

    // For host: listen for players joining the lobby
    const handlePlayerJoined = (data: PlayerJoinedData) => {
      console.log("Player joined lobby:", data);
      if (data.lobbyCode === lobbyCode && !isCurrentUserGuest) {
        // Add the player to our state
        const joinedPlayer = {
          firebase_uid: data.playerId,
          username: data.playerName || "Player 2",
          level: data.playerLevel || 1,
          display_picture: data.playerPicture || defaultAvatar,
        };

        setInvitedPlayer(joinedPlayer);

        // Send current lobby state to the joined player
        socket.emit("lobby_info_response", {
          lobbyCode: lobbyCode,
          requesterId: data.playerId,
          hostId: user.firebase_uid,
          hostName: user.username || "Host", // Add fallback
          hostPicture: user.display_picture || defaultAvatar, // Use default avatar as fallback
          hostLevel: user.level || 1, // Ensure level has a fallback
          material: selectedMaterial,
          questionTypes: selectedTypesFinal,
          mode: selectedMode,
        });
      }
    };

    // For host: respond to lobby info requests
    const handleLobbyInfoRequest = (data: any) => {
      if (data.lobbyCode === lobbyCode && !isCurrentUserGuest) {
        console.log("Sending lobby info to guest:", data.requesterId);

        socket.emit("lobby_info_response", {
          lobbyCode: lobbyCode,
          requesterId: data.requesterId,
          hostId: user.firebase_uid,
          hostName: user.username || "Host", // Add fallback
          hostPicture: user.display_picture || defaultAvatar, // Use default avatar as fallback
          hostLevel: user.level || 1, // Ensure level has a fallback
          material: selectedMaterial,
          questionTypes: selectedTypesFinal,
          mode: selectedMode,
        });
      }
    };

    // For guest: handle lobby info response
    const handleLobbyInfoResponse = (data: any) => {
      if (
        data.lobbyCode === lobbyCode &&
        data.requesterId === user?.firebase_uid
      ) {
        console.group("🎮 Received lobby info from host");
        console.log("Full data:", data);
        console.log("Host ID:", data.hostId);
        console.log("Host Name:", data.hostName);
        console.log("Host Level:", data.hostLevel);
        console.log("Host Picture:", data.hostPicture);
        console.groupEnd();

        if (data.material) {
          setSelectedMaterial((prev: StudyMaterial | null) => ({
            ...prev,
            title: data.material.title,
          }));
        }

        if (data.questionTypes && Array.isArray(data.questionTypes)) {
          setSelectedTypesFinal(sortQuestionTypes(data.questionTypes));
        }

        if (data.mode) {
          setSelectedMode(data.mode);
        }

        // Enhanced host player object
        const hostPlayer = {
          firebase_uid: data.hostId,
          username: data.hostName || "Host",
          level: data.hostLevel || 1,
          display_picture: data.hostPicture || defaultAvatar,
        };

        // Log what we're updating to - add more detail to debug
        console.log("Updating players array with host:", hostPlayer);
        console.log("Current players array:", players);

        // The key fix - use a functional update with immediate logging:
        setPlayers((prevPlayers) => {
          // Create new array with host info in first position
          const newPlayers = [...prevPlayers];
          newPlayers[0] = hostPlayer;

          // Log the array we're about to set
          console.log("New players array after update:", newPlayers);

          return newPlayers;
        });
      }
    };

    // Register event handlers
    const removePlayerJoinedListener = socketService.on(
      "player_joined_lobby",
      handlePlayerJoined
    );
    const removeLobbyInfoRequestListener = socketService.on(
      "request_lobby_info",
      handleLobbyInfoRequest
    );
    const removeLobbyInfoResponseListener = socketService.on(
      "lobby_info_response",
      handleLobbyInfoResponse
    );

    // Cleanup
    return () => {
      if (removePlayerJoinedListener) removePlayerJoinedListener();
      if (removeLobbyInfoRequestListener) removeLobbyInfoRequestListener();
      if (removeLobbyInfoResponseListener) removeLobbyInfoResponseListener();
    };
  }, [
    loading,
    user?.firebase_uid,
    lobbyCode,
    isCurrentUserGuest,
    selectedMaterial,
    selectedTypesFinal,
    selectedMode,
  ]);

  // Add this effect to sync material changes from host to guest
  useEffect(() => {
    if (!isCurrentUserGuest || !socket || !lobbyCode) return;

    const handleMaterialUpdate = (data: any) => {
      if (data.lobbyCode === lobbyCode) {
        setSelectedMaterial((prev: StudyMaterial | null) => ({
          ...prev,
          title: data.material.title,
        }));
        setSelectedTypesFinal(data.questionTypes);
        setSelectedMode(data.mode);
      }
    };

    socket.on("lobby_material_update", handleMaterialUpdate);

    return () => {
      socket.off("lobby_material_update", handleMaterialUpdate);
    };
  }, [isCurrentUserGuest, socket, lobbyCode]);

  // Add this effect to handle both accepted and declined invitations
  useEffect(() => {
    if (!socket) return;

    socket.on("battle_invitation_accepted", (data: any) => {
      if (data.lobbyCode === lobbyCode) {
        setInvitedPlayerStatus({
          isPending: false,
          invitedAt: new Date(),
        });
      }
    });

    socket.on("battle_invitation_declined", (data: any) => {
      if (data.lobbyCode === lobbyCode) {
        // Reset both invited player and pending status
        setInvitedPlayer(null);
        setInvitedPlayerStatus({
          isPending: false,
          invitedAt: new Date(),
        });
      }
    });

    return () => {
      socket.off("battle_invitation_accepted");
      socket.off("battle_invitation_declined");
    };
  }, [socket, lobbyCode]);

  // Add this to your existing socket useEffect
  useEffect(() => {
    if (!socket || !isCurrentUserGuest) return;

    const handleLobbySettingsUpdate = (data: any) => {
      if (data.lobbyCode === lobbyCode) {
        setSelectedTypesFinal(data.question_types);
        if (data.study_material_title) {
          setSelectedMaterial((prev: StudyMaterial | null) => ({
            ...prev,
            title: data.study_material_title,
          }));
        }
      }
    };

    socket.on("lobby_settings_updated", handleLobbySettingsUpdate);

    return () => {
      socket.off("lobby_settings_updated", handleLobbySettingsUpdate);
    };
  }, [socket, lobbyCode, isCurrentUserGuest]);

  // Add this helper function near the top of the component
  const sortQuestionTypes = (types: string[]) => {
    // Use the order defined in questionTypes array
    const orderMap = new Map(
      questionTypes.map((qt, index) => [qt.value, index])
    );
    return [...types].sort((a, b) => {
      const orderA = orderMap.get(a) ?? 999;
      const orderB = orderMap.get(b) ?? 999;
      return orderA - orderB;
    });
  };

  // Update the toggleGuestReadyState function to also check mana for guests
  const toggleGuestReadyState = async () => {
    if (!user?.firebase_uid || !lobbyCode) return;

    // If the guest is already ready, they can always cancel ready status
    if (playerReadyState.guestReady) {
      setReadyStateLoading(true);
      updateGuestReadyState(false);
      return;
    }

    // If guest is not ready and trying to become ready, explicitly check mana
    if (
      !playerReadyState.guestReady &&
      user?.mana &&
      user.mana < requiredMana
    ) {
      // Show the mana modal
      closeManaModal(); // Close it first in case it's already open
      setTimeout(() => {
        // Using hasSufficientMana to show the modal
        hasSufficientMana();
      }, 50);
      return;
    }

    setReadyStateLoading(true);
    updateGuestReadyState(true);
  };

  // Helper function to update the guest ready state
  const updateGuestReadyState = async (isReady: boolean) => {
    try {
      // Update ready state in the database
      const response = await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/ready-state`,
        {
          lobby_code: lobbyCode,
          player_id: user?.firebase_uid,
          is_ready: !playerReadyState.guestReady, // Toggle current state
        }
      );

      if (response.data.success) {
        // Update local state
        setPlayerReadyState((prev) => ({
          ...prev,
          guestReady: !prev.guestReady,
        }));

        // Also update via socket for immediate feedback to host
        if (socket) {
          socket.emit("player_ready_state_changed", {
            lobbyCode: lobbyCode,
            playerId: user.firebase_uid,
            isReady: !playerReadyState.guestReady,
          });
        }
      }
    } catch (error) {
      console.error("Error updating ready state:", error);
    } finally {
      setReadyStateLoading(false);
    }
  };

  // Add this function to check ready state from database
  const checkReadyState = async () => {
    if (!lobbyCode) return;

    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/ready-state/${lobbyCode}`
      );

      if (response.data.success) {
        const { hostReady, guestReady } = response.data.data;
        setPlayerReadyState({
          hostReady: hostReady || true, // Default to true for host
          guestReady: guestReady || false,
        });
      }
    } catch (error) {
      console.error("Error checking ready state:", error);
    }
  };

  // Modify the useEffect that periodically checks ready state
  useEffect(() => {
    // Only start polling if an invitation has been sent or we're a guest
    if (!lobbyCode || (!invitationSent && !isCurrentUserGuest)) {
      return;
    }

    console.log(
      `Starting ready state polling. Invitation sent: ${invitationSent}, Is guest: ${isCurrentUserGuest}`
    );

    // Check immediately
    checkReadyState();

    // Then check every 1.2 seconds
    const interval = setInterval(checkReadyState, 1200);

    return () => clearInterval(interval);
  }, [lobbyCode, invitationSent, isCurrentUserGuest]);

  // Modify the checkLobbySettings function to only trigger UI updates when something actually changes
  const checkLobbySettings = async () => {
    if (!lobbyCode) return;

    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/settings/${lobbyCode}`
      );

      if (response.data.success) {
        const { question_types, study_material_title } = response.data.data;

        // Track if we're making any changes
        let settingsChanged = false;

        // Update question types if different
        if (question_types && Array.isArray(question_types)) {
          if (
            JSON.stringify(question_types.sort()) !==
            JSON.stringify(selectedTypesFinal.sort())
          ) {
            console.log("Updating question types from poll:", question_types);
            setSelectedTypesFinal(question_types);
            settingsChanged = true;
          }
        }

        // Update study material if different
        if (
          study_material_title &&
          study_material_title !== selectedMaterial?.title
        ) {
          console.log(
            "Updating study material from poll:",
            study_material_title
          );
          setSelectedMaterial((prev: StudyMaterial | null) => ({
            ...prev,
            title: study_material_title,
          }));
          settingsChanged = true;
        }

        // Only show the visual indicator if settings actually changed
        if (settingsChanged && isCurrentUserGuest) {
          setSettingsUpdated(true);
          // Clear the update notification after 2 seconds
          setTimeout(() => setSettingsUpdated(false), 2000);
        }
      }
    } catch (error) {
      console.error("Error polling lobby settings:", error);
    }
  };

  // Add a state for settings update indicator
  const [settingsUpdated, setSettingsUpdated] = useState(false);

  // Move useRef to component top level to fix invalid hook call
  const invitationSentRef = useRef(false);

  // Modify the useEffect that periodically checks lobby settings
  useEffect(() => {
    // Only start polling if an invitation has been sent or we're a guest
    if (!lobbyCode || (!invitationSent && !isCurrentUserGuest)) {
      return;
    }

    console.log(
      `Starting lobby settings polling. Invitation sent: ${invitationSent}, Is guest: ${isCurrentUserGuest}`
    );

    // Check immediately
    checkLobbySettings();

    // Then check every 1.2 seconds for more responsive updates
    const interval = setInterval(checkLobbySettings, 1200);

    return () => clearInterval(interval);
  }, [lobbyCode, invitationSent, isCurrentUserGuest]);

  // Add this to handle real-time player joining through sockets
  useEffect(() => {
    if (!socket) return;

    // Handle a player joining lobby in real-time
    const handlePlayerJoiningLobby = (data: {
      lobbyCode: string;
      playerId: string;
      playerName?: string;
      playerLevel?: number;
      playerPicture?: string | null;
    }) => {
      console.log(
        `Player joining lobby via socket: ${data.playerName || data.playerId}`
      );

      // Only process if we're in this lobby
      if (data.lobbyCode !== lobbyCode) return;

      // Create player object from received data
      const joiningPlayer: Player = {
        firebase_uid: data.playerId,
        username: data.playerName || "Guest",
        level: data.playerLevel || 1,
        display_picture: data.playerPicture || null,
      };

      // Add player to guest player state
      setInvitedPlayer(joiningPlayer);
      setShowInviteModal(true);

      // Play a sound or add visual notification if desired
      // playSoundEffect("playerJoined.mp3");

      // Show notification toast
      toast.success(`${joiningPlayer.username} joined your lobby!`);
    };

    // Set up the event listener
    socket.on("playerJoiningLobby", handlePlayerJoiningLobby);

    // Clean up
    return () => {
      socket.off("playerJoiningLobby", handlePlayerJoiningLobby);
    };
  }, [socket, lobbyCode]);

  // Update the useEffect that runs when the component mounts to emit a createLobby event for hosts
  useEffect(() => {
    // Initialize lobby
    if (isCurrentUserGuest && lobbyCode) {
      // Join lobbby and notify server
      socket?.emit("createLobby", {
        lobbyCode,
        hostId: user?.firebase_uid,
        hostName: user?.username,
        hostLevel: user?.level,
        hostPicture: user?.display_picture || null,
      });

      console.log(`Host created lobby: ${lobbyCode}`);
    }

    // ... existing code for non-socket initializations ...
  }, [
    isCurrentUserGuest,
    lobbyCode,
    socket,
    user?.firebase_uid,
    user?.username,
    user?.level,
    user?.display_picture,
  ]);

  // Add a new useEffect that handles auto-invitation when coming from FriendListItem
  useEffect(() => {
    // Only process if we have a friendToInvite from location state and socket is connected
    if (friendToInvite && user?.firebase_uid && !isCurrentUserGuest) {
      console.log("Auto-sending invite to friend:", friendToInvite);

      // Check if we have material and question types ready
      if (!selectedMaterial || selectedTypesFinal.length === 0) {
        console.log("Material or question types not ready yet, waiting...");
        return;
      }

      // Only send if we haven't already sent one and socket is connected
      if (!invitationSentRef.current && socket?.connected) {
        // Set a small delay to ensure everything is initialized properly
        const timer = setTimeout(async () => {
          try {
            console.log("Sending auto-invitation to:", friendToInvite.username);

            // Set invited player status to pending
            setInvitedPlayerStatus({
              isPending: true,
              invitedAt: new Date(),
            });

            // Set the invited player in state
            setInvitedPlayer(friendToInvite);

            // Create invitation data
            const invitationData = {
              lobby_code: lobbyCode,
              sender_id: user.firebase_uid,
              sender_username: user.username,
              sender_level: user.level || 1,
              receiver_id: friendToInvite.firebase_uid,
              receiver_username: friendToInvite.username,
              receiver_level: friendToInvite.level || 1,
              receiver_picture: friendToInvite.display_picture,
              status: "pending",
              question_types: selectedTypesFinal,
              study_material_title: selectedMaterial?.title || null,
              host_ready: true,
              guest_ready: false,
              battle_started: false,
            };

            // Make POST request to create battle invitation
            const response = await axios.post(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/battle/invitations-lobby`,
              invitationData
            );

            if (!response.data.success) {
              throw new Error("Failed to create battle invitation");
            }

            // Create the notification data for socket
            const notificationData = {
              senderId: user.firebase_uid,
              senderName: user.username,
              senderLevel: user.level || 1,
              senderPicture: user.display_picture || null,
              receiverId: friendToInvite.firebase_uid,
              receiverName: friendToInvite.username,
              receiverLevel: friendToInvite.level || 1,
              receiverPicture: friendToInvite.display_picture,
              lobbyCode: lobbyCode,
              timestamp: new Date().toISOString(),
            };

            // Emit socket event to notify the friend
            console.log(
              "Emitting battle invitation socket event:",
              notificationData
            );
            socket.emit("notify_battle_invitation", notificationData);

            // Also emit battle_invitation event for better compatibility
            socket.emit("battle_invitation", notificationData);

            // Mark as sent
            invitationSentRef.current = true;

            // Set invitation sent state to start polling
            setInvitationSent(true);

            // Show success notification
            toast.success(`Invitation sent to ${friendToInvite.username}!`);
          } catch (error) {
            console.error("Error sending auto-invitation:", error);
            // Reset pending status on error
            setInvitedPlayerStatus({
              isPending: false,
              invitedAt: new Date(),
            });

            setInvitedPlayer(null);

            // Show error toast
            toast.error("Failed to send invitation. Please try again.");
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [
    friendToInvite,
    socket?.connected,
    user?.firebase_uid,
    user?.username,
    user?.level,
    user?.display_picture,
    selectedMaterial,
    selectedTypesFinal,
    isCurrentUserGuest,
    lobbyCode,
  ]);

  // Add a useEffect to listen for invitation closed events
  useEffect(() => {
    const handleInvitationClosed = (event: CustomEvent) => {
      console.log(
        "Battle invitation closed event received in PVPLobby",
        event.detail
      );

      // Verify this event is for our lobby
      if (event.detail.lobbyCode === lobbyCode) {
        console.log("Resetting invitation status for lobby", lobbyCode);

        // Reset the invitation status
        setInvitedPlayerStatus({
          isPending: false,
          invitedAt: new Date(),
        });

        // Remove the invited player display
        setInvitedPlayer(null);
      }
    };

    // Add event listener
    window.addEventListener(
      "battle_invitation_closed",
      handleInvitationClosed as EventListener
    );

    // Clean up event listener
    return () => {
      window.removeEventListener(
        "battle_invitation_closed",
        handleInvitationClosed as EventListener
      );
    };
  }, [lobbyCode]); // Only re-attach if lobbyCode changes

  // Add this effect to listen for socket ready state changes
  useEffect(() => {
    if (!socket || !lobbyCode) return;

    const handlePlayerReadyChange = (data: PlayerReadyData) => {
      if (data.lobbyCode === lobbyCode) {
        // Update local state based on which player changed status
        if (isCurrentUserGuest && data.playerId !== user?.firebase_uid) {
          // Host changed status (less common case)
          setPlayerReadyState((prev) => ({
            ...prev,
            hostReady: data.isReady,
          }));
        } else if (
          !isCurrentUserGuest &&
          data.playerId !== user?.firebase_uid
        ) {
          // Guest changed status
          setPlayerReadyState((prev) => ({
            ...prev,
            guestReady: data.isReady,
          }));
        }
      }
    };

    socket.on("player_ready_state_changed", handlePlayerReadyChange);

    return () => {
      socket.off("player_ready_state_changed", handlePlayerReadyChange);
    };
  }, [socket, lobbyCode, isCurrentUserGuest, user?.firebase_uid]);

  // Handle ban status change from BanPvPAccGame component
  const handleBanStatusChange = (isBanned: boolean) => {
    setIsBanActive(isBanned);
  };

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!user?.firebase_uid) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/gameplay/user/ban-status/${
            user.firebase_uid
          }`
        );
        const data = response.data as {
          success: boolean;
          data: { banUntil: string };
        };

        if (data.success && data.data.banUntil) {
          const banUntil = new Date(data.data.banUntil);
          if (banUntil > new Date()) {
            setShowBanModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking ban status:", error);
      }
    };

    checkBanStatus();
  }, [user?.firebase_uid]);

  return (
    <>
      <DocumentHead title={`PvP Mode | Duel Learn`} />
      <div className="relative min-h-screen flex flex-col items-center justify-center text-white px-6 py-8 overflow-hidden">
        {/* Full-Width Fixed Header */}
        <PvPHeader
          onBackClick={handleBackClick}
          onChangeMaterial={handleChangeMaterial}
          onChangeQuestionType={handleChangeQuestionType}
          selectedMaterial={selectedMaterial}
          selectedTypesFinal={selectedTypesFinal}
          questionTypes={questionTypes}
          isCurrentUserGuest={isCurrentUserGuest}
        />

        {/* Centered Content Wrapper */}
        <div className="flex-grow flex items-center justify-center w-full">
          <motion.div
            className="paper-container flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-center p-6 sm:p-8 rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            {/* Players Section */}
            <div className="flex mt-24 w-full justify-between items-center">
              {/* Player 1 (Host) */}
              <motion.div
                className="flex flex-col ml-[-250px] mr-[210px] items-center"
                initial={{ x: -1000 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                <PlayerCard
                  player={
                    isCurrentUserGuest
                      ? players[0]
                      : {
                          firebase_uid: user?.firebase_uid || "",
                          username: user?.username || "Player 1",
                          level: user?.level || 1,
                          display_picture:
                            user?.display_picture || defaultAvatar,
                        }
                  }
                  isHost={true}
                />
              </motion.div>

              {/* VS Text with Double Impact Animation */}
              <motion.span
                className="text-xl mt-14 sm:text-2xl md:text-[70px] font-bold text-[#4D18E8]"
                style={{ WebkitTextStroke: "1px #fff" }}
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: 1,
                  scale: [1.5, 2, 1],
                }}
                transition={{
                  duration: 1,
                  ease: "easeInOut",
                }}
              >
                VS
              </motion.span>

              {/* Player 2 */}
              <motion.div className="flex flex-col mr-[-250px] ml-[210px] items-center">
                {isCurrentUserGuest ? (
                  <PlayerCard
                    player={{
                      firebase_uid: user?.firebase_uid || "",
                      username: user?.username || "Player 2",
                      level: user?.level || 1,
                      display_picture: user?.display_picture || defaultAvatar,
                    }}
                    isHost={false}
                  />
                ) : (
                  <PlayerCard
                    player={invitedPlayer}
                    isHost={false}
                    isPending={invitedPlayerStatus.isPending}
                    onClick={() => {
                      if (
                        !isCurrentUserGuest &&
                        !players[1] &&
                        !invitedPlayer
                      ) {
                        setSelectedPlayer("");
                        setShowInviteModal(true);
                      }
                    }}
                  />
                )}
              </motion.div>
            </div>

            {/* Battle Start Button - modified */}
            <BattleControls
              onBattleStart={handleBattleStart}
              isHost={!isCurrentUserGuest}
              hostReady={playerReadyState.hostReady}
              guestReady={playerReadyState.guestReady}
              loading={readyStateLoading || battleStartLoading}
              disabledReason={user?.mana < 10 ? "Not enough mana" : undefined}
            />
          </motion.div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationDialog
          open={openDialog}
          title="Are you sure you want to leave?"
          content="If you leave, your current progress will be lost. Please confirm if you wish to proceed."
          onConfirm={handleConfirmLeave}
          onCancel={handleCancelLeave}
          confirmText="Yes, Leave"
          cancelText="Cancel"
        />

        {/* Mana Alert Modal */}
        <ManaAlertModal
          isOpen={isManaModalOpen}
          onClose={closeManaModal}
          currentMana={currentMana}
          requiredMana={requiredMana}
        />

        {/* Select Study Material Modal */}
        <SelectStudyMaterialModal
          open={openMaterialModal}
          handleClose={() => setOpenMaterialModal(false)}
          mode={selectedMode}
          isLobby={true}
          onMaterialSelect={handleMaterialSelect}
          onModeSelect={handleModeSelect}
          selectedTypes={selectedTypesFinal}
        />

        {/* Question Type Selection Modal - Only show for host */}
        {!isCurrentUserGuest && (
          <QuestionTypeSelectionModal
            open={modalOpenChangeQuestionType}
            onClose={() => setModalOpenChangeQuestionType(false)}
            selectedTypes={selectedTypesFinal || []}
            questionTypes={questionTypes}
            onConfirm={handleQuestionTypeUpdate}
          />
        )}

        {/* Invite Player Modal */}
        {showInviteModal && (
          <InvitePlayerModal
            open={showInviteModal}
            handleClose={() => setShowInviteModal(false)}
            onInviteSuccess={handleInvite}
            lobbyCode={lobbyCode}
            inviterName={user?.username ?? undefined}
            senderId={user?.firebase_uid}
            selectedTypesFinal={selectedTypesFinal}
            selectedMaterial={
              selectedMaterial
                ? {
                    id: selectedMaterial.id || "",
                    title: selectedMaterial.title,
                  }
                : null
            }
          />
        )}

        {/* Ban Modal - using the new component */}
        {user?.firebase_uid && (
          <BanPvPAccGame
            isOpen={showBanModal}
            onClose={() => setShowBanModal(false)}
            userId={user.firebase_uid}
            onBanStatusChange={handleBanStatusChange}
          />
        )}
      </div>
    </>
  );
};

export default PVPLobby;
