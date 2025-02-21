import { Box, Grid } from "@mui/material";
import CardComponent from "../../../components/CardComponent";
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

type ExploreCardsProps = {
  cards: StudyMaterial[]; // Receive filtered cards as prop
};

const ExploreCards = ({ cards }: ExploreCardsProps) => {
  const navigate = useNavigate();

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

  return (
    <Box className="px-3">
      <Grid container spacing={2}>
        {cards.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <CardComponent
              title={item.title}
              tags={item.tags}
              images={item.images}
              totalItems={item.total_items}
              createdBy={item.created_by}
              totalViews={item.total_views}
              createdAt={item.created_at}
              visibility={item.visibility} // Pass visibility as a number
              items={item.items}
              onClick={() =>
                handleCardClick(item.study_material_id, item.title)
              }
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ExploreCards;
