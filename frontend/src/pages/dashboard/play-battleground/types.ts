export interface Question {
  id: string;
  type?: string;
  question: string;
  options?: string[] | { [key: string]: string };
  correct_answer: string;
  answer?: string;
  explanation?: string;
  study_material_id: string;
  created_at?: string;
  updated_at?: string;
  correctAnswer: string;
  questionType?: string;
  mode?: string;
  difficulty?: "easy" | "average" | "hard";
  itemInfo?: {
    term: string;
    definition: string;
    itemId: string;
    itemNumber: number;
  };
}
