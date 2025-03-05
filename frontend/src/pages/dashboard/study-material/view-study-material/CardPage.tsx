import { Box, Typography, Stack, Button } from "@mui/material";
import { Item, StudyMaterial } from "../../../../types/studyMaterialObject";

interface CardPageProps {
  studyMaterial: StudyMaterial;
}

const CardPage: React.FC<CardPageProps> = ({ studyMaterial }) => {
  console.log("CardPage received studyMaterial:", studyMaterial);

  const renderContent = (item: Item) => {
    console.log("Rendering item with options:", item.options);

    if (item.type === 'multiple-choice' && item.options) {
      return (
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ mb: 2, color: '#120F1D' }}>
            Question: {item.question || item.definition}
          </Typography>
          
          {/* Display multiple choice options */}
          {Object.entries(item.options).map(([letter, option]) => (
            <Button
              key={letter}
              variant={item.answer?.startsWith(letter) ? "contained" : "outlined"}
              sx={{
                justifyContent: "flex-start",
                padding: "1rem",
                borderRadius: "0.8rem",
                color: item.answer?.startsWith(letter) ? "#fff" : "#120F1D",
                backgroundColor: item.answer?.startsWith(letter) ? "#4D18E8" : "transparent",
                "&:hover": {
                  backgroundColor: item.answer?.startsWith(letter) ? "#4D18E8" : "rgba(77, 24, 232, 0.1)",
                }
              }}
            >
              {letter}. {option}
            </Button>
          ))}

          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #DDD' }}>
            <Typography variant="subtitle2" sx={{ color: '#120F1D' }}>
              Original Term: {item.original?.term}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#120F1D' }}>
              Original Definition: {item.original?.definition}
            </Typography>
          </Box>
        </Stack>
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
      return (
        <Stack
          direction="row"
          spacing={4}
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack spacing={1} flex={1}>
            <Typography
              variant="h6"
              fontWeight="bold"
              className="text-[#120F1D] text-lg"
            >
              {item.term}
            </Typography>
            <Typography
              variant="body1"
              className="text-[#120F1D] text-base"
            >
              {item.definition}
            </Typography>
          </Stack>
          {item.image && (
            <Box className="w-48 h-48 flex-shrink-0">
              <img
                src={typeof item.image === "string" ? item.image : ""}
                alt={item.term}
                className="w-full h-full object-cover rounded-lg"
              />
            </Box>
          )}
        </Stack>
      );
    }
  };

  return (
    <Stack spacing={2}>
      {studyMaterial &&
      studyMaterial.items &&
      studyMaterial.items.length > 0 ? (
        studyMaterial.items.map((item, index) => (
          <Box
            key={index}
            className="bg-[#E2DDF3] py-4 px-8 rounded-[0.8rem] shadow-lg"
          >
            {renderContent(item)}
          </Box>
        ))
      ) : (
        <Box
          className="bg-[#E2DDF3] p-8 rounded-[0.8rem] shadow-lg"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="body1" className="text-[#120F1D]">
            {studyMaterial === null
              ? "Loading..."
              : "No items found."}{" "}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

export default CardPage;

