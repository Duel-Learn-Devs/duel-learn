import { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";
import MyLibraryCards from "./MyLibraryCards";
import Filter from "./Filter";
import { useUser } from "../../../contexts/UserContext";

// Define StudyMaterial interface
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
  visibility: number;
  created_at: string;
  total_views: number;
  study_material_id: string;
  items: Item[]; // Expecting an array of terms and definitions
}

const MyLibraryPage = () => {
  const { user } = useUser();
  const created_by = user?.displayName;
  const [cards, setCards] = useState<StudyMaterial[]>([]);
  const [filteredCards, setFilteredCards] = useState<StudyMaterial[]>([]);
  const [count, setCount] = useState<number>(0);
  const [filter, setFilter] = useState<string | number>("all");
  const [sort, setSort] = useState<string | number>("most recent");

  // Fetch study materials created by the user
  useEffect(() => {
    const fetchStudyMaterials = async () => {
      if (!created_by) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/study-material/get-by-user/${created_by}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch study materials");
        }
        const data = await response.json();
        setCards(data);
      } catch (error) {
        console.error("Error fetching study materials:", error);
      }
    };

    fetchStudyMaterials();
  }, [created_by]);

  useEffect(() => {
    let filteredData = cards;

    // Apply visibility filter
    if (filter !== "all") {
      if (filter === "public") {
        filteredData = filteredData.filter((card) => card.visibility === 1);
      } else if (filter === "private") {
        filteredData = filteredData.filter((card) => card.visibility === 0);
      }
    }

    // Sorting logic
    if (sort === "most recent") {
      filteredData.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "least recent") {
      filteredData.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "A-Z") {
      filteredData.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "Z-A") {
      filteredData.sort((a, b) => b.title.localeCompare(a.title));
    }

    setFilteredCards(filteredData);
    setCount(filteredData.length);
  }, [filter, sort, cards]);

  return (
    <PageTransition>
      <Box className="h-screen w-full">
        <DocumentHead title="My Library | Duel Learn" />
        <Stack spacing={2} className="px-8">
          <Stack
            direction={"row"}
            spacing={1}
            className="flex items-center justify-center"
          >
            <Typography variant="h5" color="inherit">
              My Library
            </Typography>
            <Typography variant="h5" color="#6F658D">
              ({count})
            </Typography>
            <Box flexGrow={1} />
            <Stack direction={"row"} spacing={2}>
              <Filter
                menuItems={[
                  { value: "all", label: "All" },
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                  { value: "bookmark", label: "Bookmark" },
                  { value: "archive", label: "Archive" },
                ]}
                value={filter}
                onChange={setFilter}
              />
              <Filter
                menuItems={[
                  { value: "most recent", label: "Most Recent" },
                  { value: "least recent", label: "Least Recent" },
                  { value: "A-Z", label: "A-Z" },
                  { value: "Z-A", label: "Z-A" },
                ]}
                value={sort}
                onChange={setSort}
              />
            </Stack>
          </Stack>
          {created_by && (
            <MyLibraryCards cards={filteredCards} createdBy={created_by} />
          )}
        </Stack>
      </Box>
    </PageTransition>
  );
};

export default MyLibraryPage;
