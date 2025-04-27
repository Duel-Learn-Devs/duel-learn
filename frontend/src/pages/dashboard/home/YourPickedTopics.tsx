import {
  Box,
  Stack,
  Typography,
  Skeleton,
  useMediaQuery,
  useTheme,
  Fab,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../contexts/UserContext";
import CardComponent from "../../../components/CardComponent";
import { StudyMaterial } from "../../../types/studyMaterialObject";
import NextIcon from "@mui/icons-material/ArrowForwardIosRounded";
import PreviousIcon from "@mui/icons-material/ArrowBackIosNewRounded";

const YourPickedTopics = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const [cards, setCards] = useState<StudyMaterial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Media query to detect small screens
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Adjust cards to show based on screen size
  const maxCardsToShow = isSmallScreen ? 1 : isMediumScreen ? 2 : 3;
  const cardsToShow = Math.min(maxCardsToShow, cards.length);

  // Adjust card width based on number of cards to show
  // ...existing code...

  // Adjust card width based on number of cards to show
  const cardWidth = isSmallScreen
    ? 100 // Small screen: 100% (full width)
    : cards.length === 1
    ? 100 // Single card: 100%
    : cards.length === 2
    ? 50 // When there are exactly 2 cards: 50% each to fill width
    : isMediumScreen && cardsToShow === 2
    ? 50 // Medium screen with 2 cards: 50% each
    : 100 / maxCardsToShow; // Default distribution

  // ...existing code...

  useEffect(() => {
    setIsLoading(true);
    if (user?.username) {
      const fetchData = async () => {
        try {
          const encodedUsername = encodeURIComponent(user.username || "");
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/study-material/personalized/${encodedUsername}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: StudyMaterial[] = await response.json();
          setCards(data);
        } catch (error) {
          console.error("Error fetching cards data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
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
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/increment-views/${studyMaterialId}`,
        {
          method: "POST",
        }
      );

      navigate(`/dashboard/study-material/view/${studyMaterialId}`, {
        state: { title },
      });
    } catch (error) {
      console.error("Error updating total views:", error);
    }
  };

  const isNextDisabled = currentIndex + cardsToShow >= cards.length;
  const isPrevDisabled = currentIndex === 0;

  // Show navigation when we have more cards than we can display at once
  const showNavigation = cards.length > cardsToShow;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "auto",
        overflow: "hidden",
        paddingTop: "1rem",
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {[...Array(maxCardsToShow)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              animation="wave"
              sx={{
                height: "14rem",
                width: `${cardWidth}%`,
                borderRadius: "0.8rem",
              }}
            />
          ))}
        </Box>
      ) : cards.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          textAlign="center"
          minHeight="auto"
          py={9}
        >
          <Typography
            variant="body1"
            sx={{
              color: "#6F658D",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              textAlign: "center",
            }}
          >
            No study materials found matching your preferences.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            transition: "transform 0.3s ease-in-out",
            transform: `translateX(-${currentIndex * (100 / maxCardsToShow)}%)`,
            width: `${cards.length * (100 / maxCardsToShow)}%`,
            justifyContent:
              cards.length <= cardsToShow ? "center" : "flex-start",
          }}
        >
          {cards.map((item, index) => (
            <Box
              key={index}
              sx={{
                flex: `0 0 ${cardWidth}%`,
                paddingRight: "0.5rem", // Add padding around each card
                display: "flex",
                justifyContent: "center", // Center the card horizontally
              }}
            >
              <CardComponent
                title={item.title}
                tags={item.tags}
                images={item.images}
                totalItems={item.total_items}
                createdBy={item.created_by}
                createdById={item.created_by_id}
                totalViews={item.total_views}
                createdAt={item.updated_at}
                updatedAt={item.updated_at}
                visibility={item.visibility}
                status={item.status}
                items={item.items}
                onClick={() =>
                  handleCardClick(item.study_material_id, item.title)
                }
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Show navigation buttons when we have more cards than we can display */}
      {showNavigation && (
        <>
          {/* Left FAB */}
          <Fab
            onClick={handlePrev}
            sx={{
              position: "absolute",
              left: isSmallScreen ? "0.5rem" : "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: isPrevDisabled ? 0 : 1,
              pointerEvents: isPrevDisabled ? "none" : "auto",
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
              // Smaller size on mobile
              width: isSmallScreen ? 40 : 48,
              height: isSmallScreen ? 40 : 48,
            }}
            className="navigation-button"
            color="primary"
            size={isSmallScreen ? "small" : "medium"}
            disabled={isPrevDisabled}
          >
            <PreviousIcon fontSize={isSmallScreen ? "small" : "medium"} />
          </Fab>

          {/* Right FAB */}
          <Fab
            onClick={handleNext}
            sx={{
              position: "absolute",
              right: isSmallScreen ? "0.5rem" : "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: isNextDisabled ? 0 : 1,
              pointerEvents: isNextDisabled ? "none" : "auto",
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
              // Smaller size on mobile
              width: isSmallScreen ? 40 : 48,
              height: isSmallScreen ? 40 : 48,
            }}
            className="navigation-button"
            color="primary"
            size={isSmallScreen ? "small" : "medium"}
            disabled={isNextDisabled}
          >
            <NextIcon fontSize={isSmallScreen ? "small" : "medium"} />
          </Fab>
        </>
      )}
    </Box>
  );
};

export default YourPickedTopics;
