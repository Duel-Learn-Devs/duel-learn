export interface UserInfo {
  firebase_uid: string;
  username: string;
  display_picture: string | null;
  account_type: string;
  account_type_plan: string;
  level: number;
  exp: number;
  mana: number;
  coin: number;
  tech_pass: number;
  is_friend?: boolean;
  friendship_status?:
    | "friend"
    | "pending"
    | "request_sent"
    | "request_received"
    | "not_friend";
}
