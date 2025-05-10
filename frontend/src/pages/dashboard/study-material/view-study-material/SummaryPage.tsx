import { Box, Stack, Typography, Paper } from "@mui/material";
import { StudyMaterial } from "../../../../types/studyMaterialObject";

interface SummaryPageProps {
  studyMaterial: StudyMaterial | null;
}

const SummaryPage = ({ studyMaterial }: SummaryPageProps) => {
  return (
    <Box className="h-full w-full px-3 py-3 md:px-4 md:py-4 rounded-[0.8rem] bg-[#E2DDF3]">
      <Stack spacing={2}>
        {studyMaterial ? (
          <Paper
            elevation={0}
            sx={{ bgcolor: "transparent", p: { xs: 1, md: 2 } }}
          >
            <Typography
              variant="body1"
              className="text-[#120F1D]"
              sx={{ fontSize: { xs: "0.95rem", md: "1.1rem" } }}
            >
              {studyMaterial.summary ||
                "No summary available for this study material."}
            </Typography>
          </Paper>
        ) : (
          <Typography variant="body1" className="text-[#120F1D]">
            Loading...
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default SummaryPage;
