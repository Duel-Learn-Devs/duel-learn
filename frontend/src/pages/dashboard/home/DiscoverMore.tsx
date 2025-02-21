import { useState, useEffect } from "react";
import { Box, Fab } from "@mui/material";
import CardComponent from "../../../components/CardComponent";
import NextIcon from "@mui/icons-material/ArrowForwardIosRounded";
import PreviousIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { useUser } from "../../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

interface Item {
  term: string;
  definition: string;
  image?: string | null; // Update to string for Base64 images
}

interface StudyMaterial {
  title: string;
  tags: string[];
  images: string[];
  total_items: number;
  created_by: string;
  total_views: number;
  visibility: number;
  created_at: string;
  study_material_id: string;
  items: Item[]; // Expecting an array of terms and definitions
}

const DiscoverMore = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [cards, setCards] = useState<StudyMaterial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsToShow = 3; // Number of cards to display at once
  const cardWidth = 100 / cardsToShow; // Each card takes a fraction of the total width

  useEffect(() => {
    if (user?.displayName) {
      fetch(
        `http://localhost:5000/api/study-material/non-matching-tags/${user.displayName}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data: StudyMaterial[]) => setCards(data))
        .catch((error) => {
          console.error("Error fetching cards data:", error);
          // Log the response text for debugging
          fetch(
            `http://localhost:5000/api/study-material/non-matching-tags/${user.displayName}`
          )
            .then((response) => response.text())
            .then((text) => console.log("Response text:", text));
        });
    }
  }, [user]);

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

  const handleCardClick = async (studyMaterialId: string, title: string) => {
    try {
      await fetch(
        `http://localhost:5000/api/study-material/increment-views/${studyMaterialId}`,
        {
          method: "POST",
        }
      );

      navigate(`/dashboard/study-material/preview/${studyMaterialId}`, {
        state: { title },
      });
    } catch (error) {
      console.error("Error updating total views:", error);
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
              tags={item.tags}
              images={item.images}
              totalItems={item.total_items}
              createdBy={item.created_by}
              totalViews={item.total_views}
              createdAt={item.created_at}
              visibility={item.visibility}
              items={item.items}
              onClick={() =>
                handleCardClick(item.study_material_id, item.title)
              }
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

export default DiscoverMore;
