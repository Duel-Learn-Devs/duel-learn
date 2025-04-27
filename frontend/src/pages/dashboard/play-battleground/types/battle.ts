export interface BattleRoundResponse {
  success: boolean;
  data: {
    session_uuid: string;
    round_number: number;
    host_card?: string;
    guest_card?: string;
    host_answer?: string;
    guest_answer?: string;
    current_turn: string;
    card_effect?: {
      type: string;
      reduction_percent?: number;
      health_amount?: number;
    };
    question_count_total?: number;
    question_ids_done?: string | string[] | null;
  };
  message?: string;
}

export interface BattleScoresResponse {
  success: boolean;
  data: {
    session_uuid: string;
    host_health: number;
    guest_health: number;
    question_count_total?: number;
  };
  message?: string;
}

export interface BattleSessionResponse {
  success: boolean;
  data: {
    ID: number;
    session_uuid: string;
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
    difficulty_mode: string;
    question_types: string[];
    study_material_id: string;
  };
  message?: string;
}

export interface BattleStatusResponse {
  success: boolean;
  data: {
    battle_started: boolean;
    current_turn: string | null;
    host_in_battle: boolean;
    guest_in_battle: boolean;
    is_active: boolean;
  };
  message?: string;
}

export interface WinStreakResponse {
  success: boolean;
  data: {
    win_streak: number;
  };
  message?: string;
}

export interface StudyMaterialInfoResponse {
  success: boolean;
  data: {
    total_items: number;
  };
  message?: string;
} 