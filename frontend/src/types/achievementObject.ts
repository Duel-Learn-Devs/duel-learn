export interface AchievementObject {
  achievement_id: number;
  achievement_name: string;
  achievement_description: string;
  achievement_requirement: string;
  achievement_level: number;
  achievement_picture_url: string;
}

export interface FormattedAchievement {
  id: number;
  name: string;
  description: string;
  progress: number;
  baseImage: string;
  progressText?: string; // Add this optional field
}

export interface MysticElderAchievement {
  achievement_id: number;
  achievement_name: string;
  achievement_description: string;
  achievement_requirement: number;
  achievement_level: number;
  achievement_picture_url: string;
  achieved: boolean;
}
