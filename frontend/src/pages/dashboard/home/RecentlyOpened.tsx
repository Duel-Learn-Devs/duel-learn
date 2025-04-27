import { useState } from "react";
import { Box, Fab } from "@mui/material";
import CardComponent from "../../../components/CardComponent";
import NextIcon from "@mui/icons-material/ArrowForwardIosRounded";
import PreviousIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { StudyMaterial } from "../../../types/studyMaterialObject";

const RecentlyOpened = () => {
  const [cards, _setCards] = useState<StudyMaterial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsToShow = 3; // Number of cards to display at once
  const cardWidth = 100 / cardsToShow; // Each card takes a fraction of the total width

  const handleNext = () => {
    if (currentIndex + cardsToShow < cards.length) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  const isNextDisabled = currentIndex + cardsToShow >= cards.length;
  const isPrevDisabled = currentIndex === 0;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "auto",
        overflow: "hidden",
        paddingY: "1rem",
      }}
    >
      <Box
        sx={{
          display: "flex",
          transition: "transform 0.3s ease-in-out",
          transform: `translateX(-${currentIndex * cardWidth}%)`,
          width: `${cards.length * cardWidth}%`,
        }}
      >
        {cards.map((item, index) => (
          <Box
            key={index}
            sx={{ flex: `0 0 ${cardWidth}%`, padding: "0 0.5rem" }}
          >
            <CardComponent
              title={item.title}
              totalItems={item.total_items}
              tags={item.tags}
              createdBy={item.created_by}
              createdById={item.created_by_id}
              totalViews={item.total_views}
              createdAt={item.updated_at}
              updatedAt={item.updated_at}
              images={item.images}
              status={item.status}
              visibility={item.visibility}
              items={[]} // Provide appropriate value
            />
          </Box>
        ))}
      </Box>

      {/* Left FAB */}
      <Fab
        onClick={handlePrev}
        sx={{
          position: "absolute",
          left: "1rem",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: isPrevDisabled ? 0 : 1, // Hide when disabled
          pointerEvents: isPrevDisabled ? "none" : "auto", // Disable interactions when not visible
          backgroundColor: "transparent",
          transition: "all 0.3s ease", // Smooth transition for visibility
          "& .MuiSvgIcon-root": {
            color: "#3B354D",
          },
          "&:hover": {
            backgroundColor: "#3B354D",
            "& .MuiSvgIcon-root": {
              color: "#E2DDF3",
            },
          },
        }}
        className="navigation-button"
        color="primary"
        size="small"
        disabled={isPrevDisabled}
      >
        <PreviousIcon />
      </Fab>

      {/* Right FAB */}
      <Fab
        onClick={handleNext}
        sx={{
          position: "absolute",
          right: "1rem",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: isNextDisabled ? 0 : 1, // Hide when disabled
          pointerEvents: isNextDisabled ? "none" : "auto", // Disable interactions when not visible
          backgroundColor: "transparent",
          "& .MuiSvgIcon-root": {
            color: "#3B354D",
          },
          "&:hover": {
            backgroundColor: "#3B354D",
            "& .MuiSvgIcon-root": {
              color: "#E2DDF3",
            },
          },
        }}
        className="navigation-button"
        color="primary"
        size="small"
        disabled={isNextDisabled}
      >
        <NextIcon />
      </Fab>
    </Box>
  );
};

export default RecentlyOpened;
