import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useUser } from "../../contexts/UserContext";

export interface BattleInvitation {
  id?: number;
  sender_id: string;
  sender_username: string;
  sender_level: number;
  receiver_id: string;
  receiver_username: string;
  receiver_level: number;
  lobby_code: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at?: string;
  question_types?: string[];
  study_material_title?: string | null;
  host_ready?: boolean;
  guest_ready?: boolean;
  battle_started?: boolean;
  selected_difficulty?: string | null;
  sender_picture?: string | null;
  receiver_picture?: string | null;
}

export interface HostInfo {
  firebase_uid: string;
  username: string;
  level: number;
  display_picture: string | null;
}

export const useBattleInvitations = () => {
  const { user } = useUser();
  const [receivedInvitation, setReceivedInvitation] = useState<BattleInvitation | null>(null);
  const [sentInvitation, setSentInvitation] = useState<BattleInvitation | null>(null);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [outgoingInvitationOpen, setOutgoingInvitationOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Add a ref to store pending invitations awaiting server confirmation
  const pendingInvitationRef = useRef<BattleInvitation | null>(null);
  
  // Set up socket connection
  useEffect(() => {
    if (!user?.firebase_uid) return;

    // Create a socket connection for battle invitations
    const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log(`Battle invitation socket connected: ${socket.id}`);
      socket.emit('setup', user.firebase_uid);
    });

    // Listen for battle invitations
    socket.on('battle_invitation', (data) => {
      console.log("Battle invitation received:", data);
      
      // Skip if it's our own invitation
      if (data.senderId === user.firebase_uid) {
        return;
      }

      // Create an invitation object
      const invitation: BattleInvitation = {
        lobby_code: data.lobbyCode,
        sender_id: data.senderId,
        sender_username: data.senderName || "Unknown Player",
        sender_level: data.senderLevel || 1,
        receiver_id: user.firebase_uid,
        receiver_username: user.username || "Unknown User",
        receiver_level: user.level || 1,
        status: 'pending',
        question_types: [], // Default empty array
        sender_picture: data.senderPicture, // Store sender's profile picture
        receiver_picture: data.receiverPicture // Store receiver's profile picture
      };

      console.log("Setting invitation with sender:", invitation.sender_username);
      setReceivedInvitation(invitation);
      setInvitationOpen(true);
    });

    // Listen for battle invitation sent confirmation
    socket.on('battle_invitation_sent', (data) => {
      console.log("Battle invitation sent confirmation:", data);
      
      // Use the pending invitation that's being tracked
      if (pendingInvitationRef.current) {
        console.log("Setting sent invitation from pending ref:", pendingInvitationRef.current);
        setSentInvitation(pendingInvitationRef.current);
        setOutgoingInvitationOpen(true);
        pendingInvitationRef.current = null;
      }
    });

    // Listen for declined invitations
    socket.on('battle_invitation_declined', (data) => {
      console.log("Battle invitation declined:", data);
      // Close outgoing invitation notification if it's showing
      if (sentInvitation && sentInvitation.receiver_id === data.receiverId) {
        setOutgoingInvitationOpen(false);
        setSentInvitation(null);
      }
    });

    // Listen for accepted invitations
    socket.on('battle_invitation_accepted', (data) => {
      console.log("Battle invitation accepted:", data);
      // Close outgoing invitation notification if it's showing
      if (sentInvitation && sentInvitation.receiver_id === data.receiverId) {
        setOutgoingInvitationOpen(false);
        setSentInvitation(null);
      }
    });

    socketRef.current = socket;

    return () => {
      console.log("Cleaning up battle invitation socket");
      if (socket) {
        socket.off('battle_invitation');
        socket.off('battle_invitation_sent');
        socket.off('battle_invitation_declined');
        socket.off('battle_invitation_accepted');
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user?.firebase_uid, sentInvitation]);

  // Handle sending an invitation
  const sendBattleInvitation = async (invitation: BattleInvitation) => {
    if (!user?.firebase_uid) {
      throw new Error("User not logged in");
    }

    setLoading(true);
    try {
      // Create the invitation in the database
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby`, 
        invitation
      );

      // Store the invitation in the ref until we get server confirmation
      pendingInvitationRef.current = invitation;
      console.log("Stored pending invitation:", invitation);

      // Send a socket notification through the socket service
      if (socketRef.current) {
        socketRef.current.emit("battle_invitation", {
          lobbyCode: invitation.lobby_code,
          senderId: user.firebase_uid,
          senderName: user.username,
          senderLevel: user.level || 1,
          senderPicture: user.display_picture || null,
          receiverId: invitation.receiver_id,
          receiverName: invitation.receiver_username,
          receiverLevel: invitation.receiver_level || 1,
          receiverPicture: invitation.receiver_picture || null
        });
      }

      // IMPORTANT: We don't wait for server confirmation (battle_invitation_sent event)
      // Instead, we directly show the outgoing invitation in two ways:
      // 1. Set local invitation state for the hook consumers
      // 2. Dispatch a custom event for BattleInvitationCenter
      // This ensures the user sees the notification immediately
      setSentInvitation(invitation);
      setOutgoingInvitationOpen(true);

      // Also trigger the custom event for BattleInvitationCenter to display
      try {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          const customEvent = new CustomEvent('battle_invitation_sent_manual', { 
            detail: {
              lobbyCode: invitation.lobby_code,
              receiverId: invitation.receiver_id,
              receiverName: invitation.receiver_username,
              receiverLevel: invitation.receiver_level || 1,
              receiverPicture: invitation.receiver_picture || null
            }
          });
          window.dispatchEvent(customEvent);
          console.log('Battle invitation sent manual event dispatched', customEvent);
        }
      } catch (e) {
        console.error('Failed to manually trigger notification:', e);
      }

      return response.data;
    } catch (error) {
      console.error("Error sending battle invitation:", error);
      setError("Failed to send battle invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle cancelling an invitation
  const cancelBattleInvitation = async (invitation: BattleInvitation) => {
    if (!user?.firebase_uid) {
      throw new Error("User not logged in");
    }

    setLoading(true);
    try {
      // Update the invitation status to 'declined'
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby/status/update`, 
        {
          lobby_code: invitation.lobby_code,
          sender_id: user.firebase_uid,
          receiver_id: invitation.receiver_id,
          status: 'declined'
        }
      );

      // Notify the receiver via socket
      if (socketRef.current) {
        socketRef.current.emit("decline_battle_invitation", {
          senderId: user.firebase_uid,
          receiverId: invitation.receiver_id,
          receiverName: invitation.receiver_username,
          lobbyCode: invitation.lobby_code
        });
      }

      // Close the outgoing invitation
      setOutgoingInvitationOpen(false);
      setSentInvitation(null);
      
      return response.data;
    } catch (error) {
      console.error("Error cancelling battle invitation:", error);
      setError("Failed to cancel battle invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle accepting an invitation
  const acceptBattleInvitation = async (invitation: BattleInvitation) => {
    if (!user?.firebase_uid) {
      throw new Error("User not logged in");
    }

    setLoading(true);
    try {
      // Update the invitation status to 'accepted'
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby/status/update`, 
        {
          lobby_code: invitation.lobby_code,
          sender_id: invitation.sender_id,
          receiver_id: user.firebase_uid,
          status: 'accepted'
        }
      );

      // Notify the sender via socket
      if (socketRef.current) {
        socketRef.current.emit("accept_battle_invitation", {
          senderId: invitation.sender_id,
          receiverId: user.firebase_uid,
          receiverName: user.username,
          lobbyCode: invitation.lobby_code
        });
      }

      // Close the invitation
      setInvitationOpen(false);
      return response.data;
    } catch (error) {
      console.error("Error accepting battle invitation:", error);
      setError("Failed to accept battle invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle declining an invitation
  const declineBattleInvitation = async (invitation: BattleInvitation) => {
    if (!user?.firebase_uid) {
      throw new Error("User not logged in");
    }

    setLoading(true);
    try {
      // Update the invitation status to 'declined'
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby/status/update`, 
        {
          lobby_code: invitation.lobby_code,
          sender_id: invitation.sender_id,
          receiver_id: user.firebase_uid,
          status: 'declined'
        }
      );

      // Notify the sender via socket
      if (socketRef.current) {
        socketRef.current.emit("decline_battle_invitation", {
          senderId: invitation.sender_id,
          receiverId: user.firebase_uid,
          receiverName: user.username,
          lobbyCode: invitation.lobby_code
        });
      }

      // Close the invitation
      setInvitationOpen(false);
      return response.data;
    } catch (error) {
      console.error("Error declining battle invitation:", error);
      setError("Failed to decline battle invitation");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get host information
  const getHostInfo = async (hostId: string): Promise<HostInfo> => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby/host/${hostId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching host information:", error);
      throw error;
    }
  };

  // Get invitation details
  const getInvitationDetails = async (lobbyCode: string, senderId: string, receiverId: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/battle/invitations-lobby/details/${lobbyCode}/${senderId}/${receiverId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching invitation details:", error);
      throw error;
    }
  };

  return {
    receivedInvitation,
    sentInvitation,
    invitationOpen,
    outgoingInvitationOpen,
    setInvitationOpen,
    setOutgoingInvitationOpen,
    loading,
    error,
    sendBattleInvitation,
    cancelBattleInvitation,
    acceptBattleInvitation,
    declineBattleInvitation,
    getHostInfo,
    getInvitationDetails
  };
}; 