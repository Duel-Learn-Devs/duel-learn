import { Box, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CardComponent from "../../../components/CardComponent";
import { StudyMaterial } from "../../../types/studyMaterialObject";
import { useEffect, useState } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

// Add refresh callback prop
interface MyLibraryCardsProps {
  cards: StudyMaterial[];
  createdBy: string;
  onRefreshNeeded?: () => void;
}

const MyLibraryCards = ({ cards, onRefreshNeeded }: MyLibraryCardsProps) => {
  const navigate = useNavigate();
  const [filteredCards, setFilteredCards] = useState<StudyMaterial[]>(cards);

  // Update internal state when props change
  useEffect(() => {
    setFilteredCards(cards);
  }, [cards]);

  // Handle card click to navigate to the study material page
  const handleCardClick = (studyMaterialId: string, title: string) => {
    navigate(`/dashboard/study-material/view/${studyMaterialId}`, {
      state: { title },
    });
  };

  // Handle delete/archive
  const handleArchive = async (studyMaterialId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/archive/${studyMaterialId}`,
        { method: "PUT" }
      );

      if (response.ok) {
        // Immediately remove from local state for UI responsiveness
        setFilteredCards((prev) =>
          prev.filter((card) => card.study_material_id !== studyMaterialId)
        );

        // Then notify parent to refresh data from server
        if (onRefreshNeeded) {
          onRefreshNeeded();
        }
      }
    } catch (error) {
      console.error("Error archiving study material:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
        gap: 1.5,
        width: "100%",
      }}
    >
      {filteredCards.map((item) => (
        <Box key={item.study_material_id} position="relative">
          <CardComponent
            title={item.title}
            tags={item.tags}
            images={item.images}
            totalItems={item.total_items}
            createdBy={item.created_by}
            createdById={item.created_by_id}
            totalViews={item.total_views}
            createdAt={item.updated_at || item.created_at}
            updatedAt={item.updated_at}
            status={item.status}
            visibility={item.visibility}
            items={item.items}
            onClick={() => handleCardClick(item.study_material_id, item.title)}
          />
          {/* Add delete/archive button for owned cards */}
          {item.created_by_id ===
            window.localStorage.getItem("firebase_uid") && (
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                top: 5,
                right: 5,
                bgcolor: "rgba(255,255,255,0.8)",
                "&:hover": {
                  bgcolor: "rgba(255,200,200,0.9)",
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleArchive(item.study_material_id);
              }}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MyLibraryCards;
