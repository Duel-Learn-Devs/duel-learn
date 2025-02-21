import { Box, Stack, Button, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";
import ExploreCards from "./ExploreCards";
import { useUser } from "../../../contexts/UserContext";

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

const ExplorePage = () => {
  const { user } = useUser();
  const [selected, setSelected] = useState<number>(0);
  const [cards, setCards] = useState<StudyMaterial[]>([]);
  const [filteredCards, setFilteredCards] = useState<StudyMaterial[]>([]);

  useEffect(() => {
    if (user?.displayName) {
      const encodedUser = encodeURIComponent(user.displayName);
      fetch(
        `http://localhost:5000/api/study-material/get-recommended-for-you/${encodedUser}`
      )
        .then((response) => response.json())
        .then((data: StudyMaterial[]) => {
          if (Array.isArray(data)) {
            setCards(data);
            setFilteredCards(data);
          } else {
            console.error("Unexpected response format:", data);
          }
        })
        .catch((error) =>
          console.error("Error fetching recommended cards:", error)
        );
    }
  }, [user]);

  const fetchTopPicks = () => {
    fetch("http://localhost:5000/api/study-material/get-top-picks")
      .then((response) => response.json())
      .then((data: StudyMaterial[]) => {
        if (Array.isArray(data)) {
          setFilteredCards(data);
        } else {
          console.error("Unexpected response format:", data);
        }
      })
      .catch((error) => console.error("Error fetching top picks:", error));
  };

  const handleClick = (index: number) => {
    setSelected(index);
    console.info(`You clicked breadcrumb ${index + 1}`);

    // Apply filter based on the selected breadcrumb
    switch (index) {
      case 0: // "Recommended for you"
        setFilteredCards(cards);
        break;
      case 1: // "Top picks" - Get top 3 unique total_views
        fetchTopPicks();
        break;
      case 2: // "Made by friends" - Show cards with mutual set to "true"
        setFilteredCards(
          cards.filter((card) => card.created_by === user?.displayName)
        );
        break;
      default:
        setFilteredCards(cards);
    }
  };

  const breadcrumbLabels = [
    "Recommended for you",
    "Top picks",
    "Made by friends",
  ];

  const breadcrumbs = breadcrumbLabels.map((label, index) => (
    <Button
      key={index}
      sx={{
        textTransform: "none",
        color: selected === index ? "#E2DDF3" : "#3B354D",
        transition: "all 0.3s ease", // Smooth transition for visibility

        "&:hover": {
          color: "inherit",
        },
      }}
      onClick={() => handleClick(index)} // Pass index to handle click
    >
      <Typography variant="h5">{label}</Typography>
    </Button>
  ));

  return (
    <PageTransition>
      <Box className="h-screen w-full">
        <DocumentHead title="Explore | Duel Learn" />
        <Stack className="px-5" spacing={2}>
          <Stack direction="row" spacing={1} paddingX={0.5}>
            {breadcrumbs}
          </Stack>
          <ExploreCards cards={filteredCards} />
        </Stack>
      </Box>
    </PageTransition>
  );
};

export default ExplorePage;
