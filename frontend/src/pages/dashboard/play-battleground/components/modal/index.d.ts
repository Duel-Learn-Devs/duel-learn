declare module './QuestionTypeSelectionModal' {
  import { FC } from 'react';
  interface QuestionTypeSelectionModalProps {
    open: boolean;
    onClose: () => void;
    selectedTypes: string[];
    onConfirm: (selectedTypes: string[]) => void;
  }
  const QuestionTypeSelectionModal: FC<QuestionTypeSelectionModalProps>;
  export default QuestionTypeSelectionModal;
} 