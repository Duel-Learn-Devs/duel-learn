import { Box, Grid } from "@mui/material";
import CardComponent from "../../../components/CardComponent";
import { useNavigate } from "react-router-dom";
import { StudyMaterial } from "../../../types/studyMaterialObject";

type ExploreCardsProps = {
  cards: StudyMaterial[];
};

const ExploreCards = ({ cards }: ExploreCardsProps) => {
  const navigate = useNavigate();

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

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(auto-fill, minmax(250px, 1fr))",
          sm: "repeat(auto-fill, minmax(290px, 1fr))",
        },
        gap: { xs: 1, sm: 1.5 },
        width: "100%",
      }}
    >
      {cards.map((item) => (
        <Box key={item.study_material_id} position="relative">
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
            onClick={() => handleCardClick(item.study_material_id, item.title)}
          />
        </Box>
      ))}
    </Box>
  );
};

export default ExploreCards;
