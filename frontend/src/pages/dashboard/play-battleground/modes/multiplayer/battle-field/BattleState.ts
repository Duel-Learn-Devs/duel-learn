export interface BattleState {
  current_turn: string | null;
  round_number: number;
  total_rounds: number;
  host_card: string | null;
  guest_card: string | null;
  host_score: number;
  guest_score: number;
  host_health: number;
  guest_health: number;
  is_active: boolean;
  winner_id: string | null;
  battle_end_reason: string | null;
  host_in_battle: boolean;
  guest_in_battle: boolean;
  battle_started: boolean;
  host_username: string | null;
  guest_username: string | null;
  ID: number;
  session_uuid: string;
  game_over?: boolean; // Add this property
  game_over_reason?: string; // Optional: reason for game ending
}
