export interface Item {
  term: string;
  definition: string;
  image?: string | null;
  type?: 'multiple-choice' | 'true-false' | 'identification';
  question?: string;
  answer?: string;
  options?: Record<string, string>;
  original?: {
    term: string;
    definition: string;
  };
  item_number?: number;
}

export interface Summary {
  term: string;
  definition: string;
}

export interface StudyMaterial {
  title: string;
  tags: string[];
  images: string[];
  total_items: number;
  created_by: string;
  total_views: number;
  created_at: string;
  items: Item[];
  study_material_id?: string;
  summary: string;
}
