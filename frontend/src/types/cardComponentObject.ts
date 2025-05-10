export interface CardComponentProps {
  title: string;
  tags: string[];
  images: string[];
  totalItems: number;
  createdBy: string;
  createdById: string;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
  visibility: number;
  status: string;
  items: Item[];
  onClick?: () => void; // Optional onClick prop to handle card clicks
}

export interface Item {
  term: string;
  definition: string;
  image?: string | null; // Update to string for Base64 images
}
