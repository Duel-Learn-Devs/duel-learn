export interface Friend {
  firebase_uid: string;
  username: string;
  exp: number;
  display_picture: string; // Changed from display_profile
  level: number;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  isSender: boolean;
  senderId: string;
}

export interface FriendRequestData {
  sender_id: string;
  sender_username: string;
  receiver_id?: string;
  receiver_username?: string;
}

export interface PendingRequest {
  friendrequest_id: string;
  sender_id: string;
  sender_username: string;
  receiver_id: string;
  receiver_username: string;
  status: string;
  created_at: string;
  sender_info?: {
    username: string;
    level: number;
  };
}
