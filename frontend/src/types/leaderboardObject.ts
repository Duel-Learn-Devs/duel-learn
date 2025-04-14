export interface LeaderboardPlayer {
  firebase_uid: string;
  username: string;
  level: number;
  exp: number;
  display_picture: string;
  isCurrentUser: boolean;
  rank: number;
}
