import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";

interface Item {
  term: string;
  definition: string;
  image?: string | null;
}

interface StudyMaterial {
  title: string;
  tags: string[];
  images: string[];
  total_items: number;
  created_by: string;
  total_views: number;
  updated_at: string;
  items: Item[]; // Expecting an array of terms and definitions
}

interface CardPageProps {
  studyMaterial: StudyMaterial | null;
}

const CardPage = ({ studyMaterial }: CardPageProps) => {
  // Track image orientations by index
  const [imageOrientations, setImageOrientations] = useState<
    Record<number, string>
  >({});

  // Function to handle image load and determine orientation
  const handleImageLoad = (
    index: number,
    event: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const img = event.currentTarget;
    const isLandscape = img.naturalWidth > img.naturalHeight;
    const isPortrait = img.naturalHeight > img.naturalWidth;

    setImageOrientations((prev) => ({
      ...prev,
      [index]: isLandscape ? "landscape" : isPortrait ? "portrait" : "square",
    }));
  };

  return (
    <Stack spacing={1}>
      {/* Check if study material is available and contains items */}
      {studyMaterial &&
      studyMaterial.items &&
      studyMaterial.items.length > 0 ? (
        studyMaterial.items.map((item, index) => (
          <Box
            key={index}
            className="bg-[#E2DDF3] py-4 px-4 md:py-6 md:px-8 rounded-[0.8rem] shadow-lg"
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Stack spacing={1} flex={1}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  className="text-[#120F1D]"
                  sx={{ fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" } }}
                >
                  {item.term}
                </Typography>
                <Typography
                  variant="body1"
                  className="text-[#120F1D]"
                  sx={{ fontSize: { xs: "0.9rem", md: "1rem" } }}
                >
                  {item.definition}
                </Typography>
              </Stack>
              {item.image && (
                <Box
                  sx={{
                    width: {
                      xs: "100%",
                      md:
                        imageOrientations[index] === "landscape"
                          ? "18rem"
                          : imageOrientations[index] === "portrait"
                          ? "10rem"
                          : "12rem",
                    },
                    height: {
                      xs:
                        imageOrientations[index] === "portrait"
                          ? "16rem"
                          : "10rem",
                      md:
                        imageOrientations[index] === "landscape"
                          ? "10rem"
                          : imageOrientations[index] === "portrait"
                          ? "16rem"
                          : "12rem",
                    },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: { xs: 2, md: 0 },
                    minWidth: { xs: "auto", md: "10rem" },
                    maxWidth: { xs: "100%", md: "20rem" },
                    transition: "width 0.2s, height 0.2s",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={typeof item.image === "string" ? item.image : ""}
                    alt={item.term}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onLoad={(e) => handleImageLoad(index, e)}
                  />
                </Box>
              )}
            </Stack>
          </Box>
        ))
      ) : (
        // Fallback when no items are present or data is still loading
        <Box
          className="bg-[#E2DDF3] p-4 md:p-8 rounded-[0.8rem] shadow-lg"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="body1" className="text-[#120F1D]">
            {studyMaterial === null
              ? "Loading..." // Show Loading if studyMaterial is not available
              : "No items found."}{" "}
            {/* Show No items message if studyMaterial is empty */}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

export default CardPage;
