import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { Snackbar } from "@mui/material";
import axios from "axios";
import NotificationCard from "./NotificationCard";
import { Box } from "@mui/material";

/**
 * BattleInvitationCenter
 * Centralized component that handles all battle invitation notifications
 * This includes both incoming and outgoing invitations
 */
const BattleInvitationCenter: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [socket, setSocket] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Debug flag - set to true to enable additional console logs
  const DEBUG = true;

  // State to track incoming battle invitations
  const [incomingInvitation, setIncomingInvitation] = useState<{
    open: boolean;
    lobbyCode: string;
    senderId: string;
    senderName: string;
    senderLevel: number;
    senderPicture: string | undefined;
    message?: string;
    status: "pending" | "accepted" | "declined" | "expired";
  }>({
    open: false,
    lobbyCode: "",
    senderId: "",
    senderName: "",
    senderLevel: 0,
    senderPicture: undefined,
    message: undefined,
    status: "pending",
  });

  // State to track outgoing battle invitations
  const [outgoingInvitation, setOutgoingInvitation] = useState<{
    open: boolean;
    lobbyCode: string;
    receiverId: string;
    receiverName: string;
    receiverLevel: number;
    receiverPicture: string | undefined;
    message?: string;
    status: "pending" | "accepted" | "declined" | "expired";
  }>({
    open: false,
    lobbyCode: "",
    receiverId: "",
    receiverName: "",
    receiverLevel: 0,
    receiverPicture: undefined,
    message: undefined,
    status: "pending",
  });

  // State for system notifications
  const [systemNotification, setSystemNotification] = useState<{
    open: boolean;
    type: "info" | "success" | "warning" | "error";
    message: string;
    lobbyCode?: string;
  }>({
    open: false,
    type: "info",
    message: "",
    lobbyCode: "",
  });

  // State for cancelled invitations (shown to the guest)
  const [cancelledInvitation, setCancelledInvitation] = useState<{
    open: boolean;
    lobbyCode: string;
    hostName: string;
    hostPicture: string | undefined;
    type: "cancelled" | "timeout";
  }>({
    open: false,
    lobbyCode: "",
    hostName: "",
    hostPicture: undefined,
    type: "cancelled",
  });

  // Status flags
  const [isProcessing, setIsProcessing] = useState(false);

  // Add a debug log function to avoid JSX issues
  const debugLog = useCallback(
    (message: string, data?: any) => {
      if (DEBUG) {
        if (data) {
          console.log(`[BattleInvitationCenter Debug] ${message}:`, data);
        } else {
          console.log(`[BattleInvitationCenter Debug] ${message}`);
        }
      }
    },
    [DEBUG]
  );

  const log = useCallback((message: string) => {
    console.log(`[BattleInvitationCenter] ${message}`);
    setLogs((prev) => [message, ...prev].slice(0, 10));
  }, []);

  // Socket connection setup
  useEffect(() => {
    if (!user?.firebase_uid) return;

    // Create direct socket connection
    const newSocket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      log(`Socket connected: ${newSocket.id}`);
      // Setup user immediately after connection
      newSocket.emit("setup", user.firebase_uid);
    });

    newSocket.on("connected", (data) => {
      log(`Server confirmed connection: ${JSON.stringify(data)}`);
    });

    // 1. Listen for incoming battle invitations
    newSocket.on("battle_invitation", (data) => {
      log(`📥 Incoming invitation: ${JSON.stringify(data)}`);

      // Skip if it's our own invitation
      if (data.senderId === user.firebase_uid) {
        log("Ignoring our own invitation");
        return;
      }

      // Validate required fields
      if (!data.senderId || !data.senderName || !data.lobbyCode) {
        log("Missing required invitation data");
        return;
      }

      // Set invitation state for the snackbar
      setIncomingInvitation({
        open: true,
        senderName: data.senderName || "Unknown Player",
        lobbyCode: data.lobbyCode,
        senderId: data.senderId,
        senderPicture: data.senderPicture || undefined,
        senderLevel: data.senderLevel || 0,
        status: "pending",
        message: undefined,
      });

      log(`Incoming invitation set with lobbyCode: ${data.lobbyCode}`);
    });

    // 2. Listen for outgoing battle invitations (confirmation)
    newSocket.on("battle_invitation_sent", (data) => {
      log(`📤 Outgoing invitation confirmed: ${JSON.stringify(data)}`);

      // Validate required fields
      if (!data.receiverId || !data.receiverName || !data.lobbyCode) {
        log("Missing required outgoing invitation data");
        return;
      }

      // Set outgoing invitation state
      setOutgoingInvitation({
        open: true,
        receiverName: data.receiverName || "Unknown Player",
        lobbyCode: data.lobbyCode,
        receiverId: data.receiverId,
        receiverPicture: data.receiverPicture || undefined,
        receiverLevel: data.receiverLevel || 0,
        status: "pending",
        message: undefined,
      });

      log(`Outgoing invitation set with lobbyCode: ${data.lobbyCode}`);
    });

    // 3. Listen for invitation responses
    newSocket.on("battle_invitation_accepted", (data) => {
      log(`✅ Invitation accepted: ${JSON.stringify(data)}`);

      // Update outgoing invitation if it matches
      if (
        outgoingInvitation.open &&
        outgoingInvitation.receiverId === data.receiverId
      ) {
        setOutgoingInvitation((prev) => ({
          ...prev,
          status: "accepted",
          message: `${prev.receiverName} accepted your invitation!`,
        }));

        // Show "moving to arena" message after a delay
        setTimeout(() => {
          setOutgoingInvitation((prev) => ({
            ...prev,
            message: "Moving you to the PvP arena...",
          }));

          // Close after another delay
          setTimeout(() => {
            setOutgoingInvitation((prev) => ({ ...prev, open: false }));
          }, 1500);
        }, 1000);
      }
    });

    newSocket.on("battle_invitation_declined", (data) => {
      log(`❌ Invitation declined: ${JSON.stringify(data)}`);
      debugLog("Detailed decline data", {
        data,
        isCurrentUser: data.receiverId === user?.firebase_uid,
        userId: user?.firebase_uid,
        currentTimestamp: new Date().toISOString(),
      });

      // Update outgoing invitation if it matches (host view)
      if (
        outgoingInvitation.open &&
        outgoingInvitation.receiverId === data.receiverId
      ) {
        setOutgoingInvitation((prev) => ({
          ...prev,
          status: "declined",
          message: `${prev.receiverName} declined your invitation.`,
        }));

        // Close after a delay
        setTimeout(() => {
          setOutgoingInvitation((prev) => ({ ...prev, open: false }));
        }, 2000);
      }

      // Show cancelled notification if we're the receiver (guest view)
      if (data.receiverId === user?.firebase_uid) {
        log(`Host ${data.senderName || "Unknown"} cancelled the invitation`);
        debugLog("Showing CANCELLED notification to guest", {
          hostName: data.senderName,
          lobbyCode: data.lobbyCode,
        });

        // Handle case where senderName is missing
        const hostName = data.senderName || "Host";

        // Close any existing incoming invitation
        setIncomingInvitation((prev) => ({
          ...prev,
          open: false,
        }));

        // Show cancelled notification
        setCancelledInvitation({
          open: true,
          lobbyCode: data.lobbyCode,
          hostName: hostName,
          hostPicture: data.senderPicture,
          type: "cancelled",
        });

        debugLog("Set cancelledInvitation state", {
          open: true,
          lobbyCode: data.lobbyCode,
          hostName: hostName,
          type: "cancelled",
        });

        // Auto close after a delay
        setTimeout(() => {
          setCancelledInvitation((prev) => ({ ...prev, open: false }));
          debugLog("Auto-closed cancelled notification");
        }, 5000);
      }
    });

    // Listen for invitation expiration with enhanced logging
    newSocket.on("battle_invitation_expired", (data) => {
      log(`⏱️ Invitation expired: ${JSON.stringify(data)}`);
      console.log("⚠️ Detailed expiration data:", {
        data,
        isReceiver: data.receiverId === user?.firebase_uid,
        isIncomingOpen: incomingInvitation.open,
        isOutgoingOpen: outgoingInvitation.open,
        userId: user?.firebase_uid,
      });

      // Handle expired outgoing invitation
      if (
        outgoingInvitation.open &&
        ((data.senderId === user.firebase_uid &&
          data.receiverId === outgoingInvitation.receiverId) ||
          data.lobbyCode === outgoingInvitation.lobbyCode)
      ) {
        setOutgoingInvitation((prev) => ({
          ...prev,
          status: "expired",
          message: `Invitation to ${prev.receiverName} expired.`,
        }));

        // Close after a delay
        setTimeout(() => {
          setOutgoingInvitation((prev) => ({ ...prev, open: false }));
        }, 2000);
      }

      // Handle expired incoming invitation (already opened notification)
      if (
        incomingInvitation.open &&
        ((data.senderId === incomingInvitation.senderId &&
          data.receiverId === user.firebase_uid) ||
          data.lobbyCode === incomingInvitation.lobbyCode)
      ) {
        setIncomingInvitation((prev) => ({
          ...prev,
          status: "expired",
          message: `Invitation from ${prev.senderName} expired.`,
        }));

        // Close after a delay
        setTimeout(() => {
          setIncomingInvitation((prev) => ({ ...prev, open: false }));
        }, 2000);
      }

      // Handle invitation timeout without an open notification (guest view)
      if (!incomingInvitation.open && data.receiverId === user?.firebase_uid) {
        console.log("🔔 Showing TIMEOUT notification to guest", {
          hostName: data.senderName,
          lobbyCode: data.lobbyCode,
        });

        // Show timeout notification
        setCancelledInvitation({
          open: true,
          lobbyCode: data.lobbyCode,
          hostName: data.senderName || "Host",
          hostPicture: data.senderPicture,
          type: "timeout",
        });

        // Add debug log for the state change
        console.log("🔔 Set cancelledInvitation state for timeout:", {
          open: true,
          lobbyCode: data.lobbyCode,
          hostName: data.senderName || "Host",
          type: "timeout",
        });

        // Auto close after a delay
        setTimeout(() => {
          setCancelledInvitation((prev) => ({ ...prev, open: false }));
          console.log("🔔 Auto-closed timeout notification");
        }, 5000);
      }
    });

    newSocket.on("disconnect", () => {
      log("Socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      log(`Socket connection error: ${error.message}`);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      log("Cleaning up socket connection");
      if (newSocket) {
        newSocket.off("battle_invitation");
        newSocket.off("battle_invitation_sent");
        newSocket.off("battle_invitation_accepted");
        newSocket.off("battle_invitation_declined");
        newSocket.off("battle_invitation_expired");
        newSocket.off("battle_state_updated");
        newSocket.off("system_announcement");
        newSocket.off("player_ready_state_changed");
        newSocket.off("battle_started");
        newSocket.off("battle_error");
        newSocket.off("connect");
        newSocket.off("connected");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
        newSocket.disconnect();
      }
    };
  }, [
    log,
    user?.firebase_uid,
    outgoingInvitation.open,
    outgoingInvitation.receiverId,
    incomingInvitation.open,
    incomingInvitation.senderId,
  ]);

  // Handle accepting an invitation
  const handleAcceptInvitation = useCallback(async () => {
    if (!user?.firebase_uid || !incomingInvitation.senderId) return;

    try {
      setIsProcessing(true);
      setIncomingInvitation((prev) => ({
        ...prev,
        status: "accepted",
        message: `You accepted ${prev.senderName}'s invite!`,
      }));

      // Fetch host information
      const hostResponse = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/host/${incomingInvitation.senderId}`
      );

      // Fetch invitation details including material and question types
      const invitationResponse = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/details/${
          incomingInvitation.lobbyCode
        }/${incomingInvitation.senderId}/${user.firebase_uid}`
      );

      if (!hostResponse.data.success || !invitationResponse.data.success) {
        throw new Error("Failed to fetch required information");
      }

      const hostInfo = hostResponse.data.data;
      const invitationDetails = invitationResponse.data.data;

      // Update invitation status to 'accepted'
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/status/update`,
        {
          lobby_code: incomingInvitation.lobbyCode,
          sender_id: incomingInvitation.senderId,
          receiver_id: user.firebase_uid,
          status: "accepted",
        }
      );

      // Notify the sender
      if (socket) {
        socket.emit("accept_battle_invitation", {
          senderId: incomingInvitation.senderId,
          receiverId: user.firebase_uid,
          receiverName: user.username,
          lobbyCode: incomingInvitation.lobbyCode,
        });
      }

      // Show "moving to arena" message
      setTimeout(() => {
        setIncomingInvitation((prev) => ({
          ...prev,
          message: "Moving you to the PvP arena...",
        }));

        // Navigate to the lobby with all information after a brief delay
        setTimeout(() => {
          navigate(`/dashboard/pvp-lobby/${incomingInvitation.lobbyCode}`, {
            state: {
              isGuest: true,
              lobbyCode: incomingInvitation.lobbyCode,
              selectedMaterial: {
                title: invitationDetails.study_material_title,
              },
              selectedTypes: invitationDetails.question_types,
              invitedPlayer: {
                firebase_uid: incomingInvitation.senderId,
                username: hostInfo.username,
                level: hostInfo.level,
                display_picture: hostInfo.display_picture,
              },
            },
          });

          // Close the invitation
          setIncomingInvitation((prev) => ({ ...prev, open: false }));
          setIsProcessing(false);
        }, 1500);
      }, 1000);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      showSnackbar("Failed to accept battle invitation", "error");
      setIncomingInvitation((prev) => ({ ...prev, open: false }));
      setIsProcessing(false);
    }
  }, [incomingInvitation, user, socket, navigate, showSnackbar, log]);

  // Handle declining an invitation
  const handleDeclineInvitation = useCallback(async () => {
    if (!user?.firebase_uid || !incomingInvitation.senderId) return;

    try {
      setIncomingInvitation((prev) => ({
        ...prev,
        status: "declined",
        message: `You declined ${prev.senderName}'s invite.`,
      }));

      // Update invitation status to 'declined'
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/status/update`,
        {
          lobby_code: incomingInvitation.lobbyCode,
          sender_id: incomingInvitation.senderId,
          receiver_id: user.firebase_uid,
          status: "declined",
        }
      );

      // Notify the sender
      if (socket) {
        socket.emit("decline_battle_invitation", {
          senderId: incomingInvitation.senderId,
          receiverId: user.firebase_uid,
          receiverName: user.username || "Player",
          lobbyCode: incomingInvitation.lobbyCode,
        });
      }

      // Auto close after showing the declined message
      setTimeout(() => {
        setIncomingInvitation((prev) => ({ ...prev, open: false }));
      }, 2000);
    } catch (error) {
      console.error("Error declining invitation:", error);
      setIncomingInvitation((prev) => ({ ...prev, open: false }));
    }
  }, [incomingInvitation, user, socket]);

  // Handle cancelling an outgoing invitation
  const handleCancelInvitation = useCallback(async () => {
    // Log the call to help with debugging
    console.log("🔄 handleCancelInvitation called", {
      userId: user?.firebase_uid,
      receiverId: outgoingInvitation?.receiverId,
      receiverName: outgoingInvitation?.receiverName,
      timestamp: new Date().toISOString(),
    });

    // Check if the user or invitation data is valid
    if (!user?.firebase_uid) {
      console.warn("Cannot cancel invitation: user is not logged in");
      return;
    }

    // Even if receiverId is missing, close the notification anyway
    if (!outgoingInvitation.receiverId) {
      console.warn("Missing receiverId, but closing notification anyway");
      setOutgoingInvitation((prev) => ({ ...prev, open: false }));

      // Dispatch event to notify PVPLobby that invitation is closed
      window.dispatchEvent(
        new CustomEvent("battle_invitation_closed", {
          detail: { lobbyCode: outgoingInvitation.lobbyCode },
        })
      );
      return;
    }

    try {
      log(`🚫 Cancelling invitation to ${outgoingInvitation.receiverName}`);

      // Close the invitation immediately for better UX
      setOutgoingInvitation((prev) => ({ ...prev, open: false }));

      // Dispatch event to notify PVPLobby that invitation is closed
      window.dispatchEvent(
        new CustomEvent("battle_invitation_closed", {
          detail: {
            lobbyCode: outgoingInvitation.lobbyCode,
            receiverId: outgoingInvitation.receiverId,
          },
        })
      );

      // Update invitation status to 'declined'
      console.log(
        "🔄 Sending API request to update invitation status to declined"
      );
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/battle/invitations-lobby/status/update`,
        {
          lobby_code: outgoingInvitation.lobbyCode,
          sender_id: user.firebase_uid,
          receiver_id: outgoingInvitation.receiverId,
          status: "declined",
        }
      );

      // Notify the receiver
      if (socket) {
        // Create the cancel data with required fields
        const cancelData = {
          senderId: user.firebase_uid,
          receiverId: outgoingInvitation.receiverId,
          receiverName: outgoingInvitation.receiverName,
          lobbyCode: outgoingInvitation.lobbyCode,
          // Include these fields for the cancelled notification on the receiver side
          senderName: user.username || "Host",
          senderPicture: user.display_picture || undefined,
        };

        debugLog("Emitting decline_battle_invitation with data", cancelData);
        socket.emit("decline_battle_invitation", cancelData);
      } else {
        console.error("Socket is not available for emitting decline event");
      }

      showSnackbar("Battle invitation cancelled", "info");
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      // Make sure the notification is closed even if there's an error
      setOutgoingInvitation((prev) => ({ ...prev, open: false }));
      showSnackbar("Failed to cancel battle invitation", "error");
    }
  }, [outgoingInvitation, user, socket, showSnackbar, log, debugLog]);

  // Utility function to show system notifications
  const showSystemNotification = useCallback(
    (
      type: "info" | "success" | "warning" | "error",
      message: string,
      lobbyCode?: string,
      autoClose: boolean = true
    ) => {
      setSystemNotification({
        open: true,
        type,
        message,
        lobbyCode,
      });

      // Auto close after 5 seconds if autoClose is true
      if (autoClose) {
        setTimeout(() => {
          setSystemNotification((prev) => ({ ...prev, open: false }));
        }, 5000);
      }
    },
    []
  );

  // Setup event handlers for system notifications
  useEffect(() => {
    if (!socket) return;

    // Listen for battle state update events
    socket.on(
      "battle_state_updated",
      (data: {
        notifyPlayers?: boolean;
        playerIds?: string[];
        lobbyCode?: string;
        message?: string;
      }) => {
        log(`🎮 Battle state updated: ${JSON.stringify(data)}`);

        const showNotification =
          data.notifyPlayers &&
          (data.playerIds?.includes(user?.firebase_uid || "") ||
            data.lobbyCode === incomingInvitation.lobbyCode ||
            data.lobbyCode === outgoingInvitation.lobbyCode);

        if (showNotification) {
          showSystemNotification(
            "info",
            data.message || "Battle state has been updated",
            data.lobbyCode
          );
        }
      }
    );

    // Listen for system announcements
    socket.on(
      "system_announcement",
      (data: {
        type?: "info" | "success" | "warning" | "error";
        message?: string;
        lobbyCode?: string;
      }) => {
        log(`📢 System announcement: ${JSON.stringify(data)}`);

        // Always show system announcements
        showSystemNotification(
          data.type || "info",
          data.message || "System announcement",
          data.lobbyCode
        );
      }
    );

    // Listen for player ready state changes
    socket.on(
      "player_ready_state_changed",
      (data: {
        playerId?: string;
        playerName?: string;
        isReady?: boolean;
        lobbyCode?: string;
      }) => {
        log(`🎮 Player ready state changed: ${JSON.stringify(data)}`);

        // Only show notification if we're in a match with this player
        if (
          (outgoingInvitation.open &&
            data.lobbyCode === outgoingInvitation.lobbyCode) ||
          (incomingInvitation.open &&
            data.lobbyCode === incomingInvitation.lobbyCode)
        ) {
          const playerName =
            data.playerId === user?.firebase_uid
              ? "You are"
              : `${data.playerName || "Opponent is"}`;

          showSystemNotification(
            "info",
            `${playerName} ${data.isReady ? "ready" : "not ready"} to battle!`,
            data.lobbyCode
          );
        }
      }
    );

    // Listen for battle started event
    socket.on(
      "battle_started",
      (data: { lobbyCode?: string; message?: string }) => {
        log(`⚔️ Battle started: ${JSON.stringify(data)}`);

        showSystemNotification(
          "success",
          data.message || "Battle is starting! Prepare yourself!",
          data.lobbyCode
        );
      }
    );

    // Listen for battle error events
    socket.on(
      "battle_error",
      (data: { message?: string; lobbyCode?: string }) => {
        log(`❗ Battle error: ${JSON.stringify(data)}`);

        showSystemNotification(
          "error",
          data.message || "An error occurred with your battle.",
          data.lobbyCode || "",
          true // auto close after 5 seconds
        );
      }
    );

    // Clean up listeners
    return () => {
      socket.off("battle_state_updated");
      socket.off("system_announcement");
      socket.off("player_ready_state_changed");
      socket.off("battle_started");
      socket.off("battle_error");
    };
  }, [
    socket,
    log,
    user?.firebase_uid,
    incomingInvitation.lobbyCode,
    outgoingInvitation.lobbyCode,
    showSystemNotification,
    incomingInvitation.open,
    outgoingInvitation.open,
  ]);

  // Listen for manual battle invitation sent events (for fallback)
  useEffect(() => {
    // This is a fallback for when the socket's battle_invitation_sent event doesn't fire
    const handleManualInvitationSent = (event: CustomEvent) => {
      const data = event.detail;
      log(`📤 Manual outgoing invitation triggered: ${JSON.stringify(data)}`);

      if (!data.receiverId || !data.receiverName || !data.lobbyCode) {
        log("Missing required outgoing invitation data in manual event");
        return;
      }

      // Set outgoing invitation state
      setOutgoingInvitation({
        open: true,
        receiverName: data.receiverName || "Unknown Player",
        lobbyCode: data.lobbyCode,
        receiverId: data.receiverId,
        receiverPicture: data.receiverPicture || undefined,
        receiverLevel: data.receiverLevel || 0,
        status: "pending",
        message: undefined,
      });

      log(`Manual outgoing invitation set with lobbyCode: ${data.lobbyCode}`);
    };

    // Add event listener for the custom event
    window.addEventListener(
      "battle_invitation_sent_manual",
      handleManualInvitationSent as EventListener
    );

    return () => {
      window.removeEventListener(
        "battle_invitation_sent_manual",
        handleManualInvitationSent as EventListener
      );
    };
  }, [log]);

  // Listen for invitation timeout events from NotificationCard
  useEffect(() => {
    const handleInvitationTimeout = (event: CustomEvent) => {
      debugLog("Received invitation_timeout event", event.detail);

      // When a timeout occurs and we're the host, make sure to emit a server notification
      if (outgoingInvitation.open && outgoingInvitation.receiverId) {
        debugLog(
          "We are the host of an outgoing invitation - notifying receiver of timeout"
        );

        // Emit a socket event to notify the receiver
        if (socket) {
          socket.emit("battle_invitation_expired", {
            senderId: user?.firebase_uid,
            senderName: user?.username,
            senderPicture: user?.display_picture,
            receiverId: outgoingInvitation.receiverId,
            receiverName: outgoingInvitation.receiverName,
            lobbyCode: outgoingInvitation.lobbyCode,
          });

          debugLog("Emitted battle_invitation_expired event");
        }
      }
    };

    window.addEventListener(
      "invitation_timeout",
      handleInvitationTimeout as EventListener
    );

    return () => {
      window.removeEventListener(
        "invitation_timeout",
        handleInvitationTimeout as EventListener
      );
    };
  }, [socket, user, outgoingInvitation, debugLog]);

  // Debug panel for development
  const showDebugPanel = false; // Set to true to show debug panel

  // Add a new useEffect to log cancelled invitation state changes
  useEffect(() => {
    if (DEBUG && cancelledInvitation.open) {
      console.log(
        "🔔 Cancelled notification state is open:",
        cancelledInvitation
      );
    }
  }, [cancelledInvitation, DEBUG]);

  if (!user) return null;

  return (
    <>
      {showDebugPanel && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            width: 300,
            background: "#000",
            color: "#0f0",
            padding: 10,
            borderRadius: 5,
            zIndex: 9998,
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          <div>Battle Invitation Center</div>
          <div>User: {user?.firebase_uid || "Not logged in"}</div>
          <div>Socket: {socket?.connected ? "Connected" : "Disconnected"}</div>
          <div style={{ marginTop: 10 }}>
            <strong>Event Log:</strong>
            {logs.map((entry, i) => (
              <div key={i} style={{ marginTop: 5, wordBreak: "break-all" }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming invitation notification */}
      <Snackbar
        open={incomingInvitation.open}
        autoHideDuration={isProcessing ? null : 15000}
        onClose={() =>
          !isProcessing &&
          setIncomingInvitation((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          zIndex: 10000,
          top: "20px",
          "& .MuiSnackbarContent-root": {
            padding: 0,
            backgroundColor: "transparent",
            boxShadow: "none",
            minWidth: "auto",
            minHeight: "auto",
          },
        }}
      >
        <div>
          <NotificationCard
            type={incomingInvitation.status}
            username={incomingInvitation.senderName}
            message={incomingInvitation.message}
            profilePicture={incomingInvitation.senderPicture}
            showActions={
              incomingInvitation.status === "pending" && !isProcessing
            }
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
          />
        </div>
      </Snackbar>

      {/* Outgoing invitation notification */}
      <Snackbar
        open={outgoingInvitation.open}
        autoHideDuration={15000}
        onClose={() => {
          setOutgoingInvitation((prev) => ({ ...prev, open: false }));
          // Dispatch event to notify PVPLobby that invitation is closed
          window.dispatchEvent(
            new CustomEvent("battle_invitation_closed", {
              detail: {
                lobbyCode: outgoingInvitation.lobbyCode,
                receiverId: outgoingInvitation.receiverId,
              },
            })
          );
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          zIndex: 10000,
          bottom: "20px",
          "& .MuiSnackbarContent-root": {
            padding: 0,
            backgroundColor: "transparent",
            boxShadow: "none",
            minWidth: "auto",
            minHeight: "auto",
          },
        }}
      >
        <div>
          <NotificationCard
            type={outgoingInvitation.status}
            username={outgoingInvitation.receiverName}
            message={outgoingInvitation.message}
            profilePicture={outgoingInvitation.receiverPicture}
            showCancelOnly={outgoingInvitation.status === "pending"}
            onCancel={handleCancelInvitation}
            autoHideDuration={15000}
            onAutoHideComplete={() => {
              setOutgoingInvitation((prev) => ({ ...prev, open: false }));
              // Dispatch event to notify PVPLobby that invitation is closed
              window.dispatchEvent(
                new CustomEvent("battle_invitation_closed", {
                  detail: {
                    lobbyCode: outgoingInvitation.lobbyCode,
                    receiverId: outgoingInvitation.receiverId,
                  },
                })
              );
            }}
          />
        </div>
      </Snackbar>

      {/* System notifications */}
      <Snackbar
        open={systemNotification.open}
        autoHideDuration={5000}
        onClose={() =>
          setSystemNotification((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{
          zIndex: 10000,
          bottom: outgoingInvitation.open ? "140px" : "20px",
          right: "20px",
        }}
      >
        <div>
          <Box
            sx={{
              padding: "12px 20px",
              borderRadius: "12px",
              backgroundColor:
                systemNotification.type === "error"
                  ? "#FFF1F0"
                  : systemNotification.type === "success"
                  ? "#F6FFED"
                  : systemNotification.type === "warning"
                  ? "#FFFBE6"
                  : "#E6F7FF",
              border: `1px solid ${
                systemNotification.type === "error"
                  ? "#FFA39E"
                  : systemNotification.type === "success"
                  ? "#B7EB8F"
                  : systemNotification.type === "warning"
                  ? "#FFE58F"
                  : "#91D5FF"
              }`,
              color:
                systemNotification.type === "error"
                  ? "#CF1322"
                  : systemNotification.type === "success"
                  ? "#389E0D"
                  : systemNotification.type === "warning"
                  ? "#D4B106"
                  : "#096DD9",
              display: "flex",
              alignItems: "center",
              minWidth: "250px",
              maxWidth: "450px",
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Icon based on type */}
            <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
              {systemNotification.type === "error" && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#CF1322"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 9L9 15"
                    stroke="#CF1322"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 9L15 15"
                    stroke="#CF1322"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {systemNotification.type === "success" && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572"
                    stroke="#389E0D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 4L12 14.01L9 11.01"
                    stroke="#389E0D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {systemNotification.type === "warning" && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64149 19.6871 1.81442 19.9905C1.98736 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.901 3.18058 20.9962 3.53 21H20.47C20.8194 20.9962 21.1613 20.901 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z"
                    stroke="#D4B106"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 9V13"
                    stroke="#D4B106"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17H12.01"
                    stroke="#D4B106"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {systemNotification.type === "info" && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#096DD9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 16V12"
                    stroke="#096DD9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8H12.01"
                    stroke="#096DD9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </Box>

            {/* Message */}
            <Box sx={{ fontWeight: 500 }}>{systemNotification.message}</Box>
          </Box>
        </div>
      </Snackbar>

      {/* Cancelled/Timeout invitation notification */}
      <Snackbar
        open={cancelledInvitation.open}
        autoHideDuration={5000}
        onClose={() => {
          console.log(
            "🔔 Closing cancelled notification through Snackbar onClose"
          );
          setCancelledInvitation((prev) => ({ ...prev, open: false }));
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          zIndex: 10000,
          top: "20px",
          "& .MuiSnackbarContent-root": {
            padding: 0,
            backgroundColor: "transparent",
            boxShadow: "none",
            minWidth: "auto",
            minHeight: "auto",
          },
        }}
      >
        <div>
          <NotificationCard
            type={cancelledInvitation.type}
            username={cancelledInvitation.hostName}
            profilePicture={cancelledInvitation.hostPicture}
            showActions={false}
          />
        </div>
      </Snackbar>
    </>
  );
};

export default BattleInvitationCenter;
