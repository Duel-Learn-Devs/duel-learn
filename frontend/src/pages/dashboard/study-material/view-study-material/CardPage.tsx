import { Box, Typography } from "@mui/material";
import { Item, StudyMaterial } from "../../../../types/studyMaterial";

interface CardPageProps {
  studyMaterial: StudyMaterial;
}

const CardPage: React.FC<CardPageProps> = ({ studyMaterial }) => {
  console.log("CardPage received studyMaterial:", studyMaterial); // Debug log

  const renderContent = (item: Item) => {
    console.log("Rendering item:", item); // Debug log

    if (item.type === 'multiple-choice') {
      return (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Question: {item.definition}
          </Typography>
          {item.options && Object.entries(item.options).map(([letter, option]) => (
            <Typography key={letter} sx={{ mb: 1 }}>
              {letter}. {option}
            </Typography>
          ))}
          <Typography sx={{ mt: 2, fontWeight: 'bold' }}>
            Answer: {item.answer}
          </Typography>
        </>
      );
    } else if (item.type === 'true-false') {
      return (
        <>
          <Typography variant="h6" sx={{ mb: 2, color: '#120F1D' }}>
            Statement: {item.definition}
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#120F1D' }}>
            Answer: {item.term}
          </Typography>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #DDD' }}>
            <Typography variant="subtitle2" sx={{ color: '#120F1D' }}>
              Original Term: {item.original?.term}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#120F1D' }}>
              Original Definition: {item.original?.definition}
            </Typography>
          </Box>
        </>
      );
    } else if (item.type === 'identification') {
      return (
        <>
          <Typography variant="h6" sx={{ mb: 2, color: '#120F1D' }}>
            Question: {item.question}
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#120F1D' }}>
            Answer: {item.answer}
          </Typography>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #DDD' }}>
            <Typography variant="subtitle2" sx={{ color: '#120F1D' }}>
              Original Term: {item.original?.term}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#120F1D' }}>
              Original Definition: {item.original?.definition}
            </Typography>
          </Box>
        </>
      );
    } else {
      // Default/identification format
      return (
        <>
          <Typography variant="h6" sx={{ mb: 2, color: '#120F1D'}}>
            Term: {item.term}
          </Typography>
          <Typography sx={{ color: '#120F1D'}}>
            Definition: {item.definition}
          </Typography>
        </>
      );
    }
  };

  return (
    <Box>
      {studyMaterial?.items.map((item, index) => (
        <Box
          key={index}
          sx={{
            p: 4,
            backgroundColor: "#F2EFFF",
            borderRadius: 2,
            mb: 2,
          }}
        >
          {renderContent(item)}
        </Box>
      ))}
    </Box>
  );
};

export default CardPage;
