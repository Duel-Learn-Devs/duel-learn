export type GameMode = "Peaceful" | "Time Pressured" | "pvp";

export interface StudyMaterialItem {
  term: string;
  definition: string;
}

export interface StudyMaterial {
  study_material_id: string;
  title: string;
  tags: string[];
  summary: string;
  total_items: number;
  items: StudyMaterialItem[];
}

export interface Question {
  id?: string;
  question: string;
  type: "multiple-choice" | "identification" | "true-false" | string;
  questionType?: string;
  options?: string[] | { [key: string]: string };
  correctAnswer: string;
  correct_answer?: string; // For API compatibility
  answer?: string;
  mode?: string;
  explanation?: string;
  study_material_id?: string;
  created_at?: string;
  updated_at?: string;
  difficulty?: "easy" | "average" | "hard";
  itemInfo?: {
    term?: string;
    definition?: string;
    itemId?: string;
    itemNumber?: number;
    image?: string;
  };
  // Additional fields used in the codebase
  rawOptions?: any;
  image?: string;
  term?: string;
  definition?: string;
  item_id?: string;
  item_number?: number;
}

export interface GameState {
  mode: string; // Changed from GameMode to string to be more flexible
  material: {
    study_material_id: string;
    title: string;
    tags: string[];
    summary: string;
    total_items: number;
    items: StudyMaterialItem[];
  };
  selectedTypes: string[];
  timeLimit?: number | null;
  aiQuestions?: Question[];
}
