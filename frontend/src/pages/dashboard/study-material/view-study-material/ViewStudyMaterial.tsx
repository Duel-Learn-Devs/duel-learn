import { useState, useEffect } from "react";
import { Box, Stack, Typography, Button, Chip, Divider } from "@mui/material";
import { useParams, useLocation } from "react-router-dom";
import SummaryPage from "./SummaryPage";
import CardPage from "./CardPage";
import DocumentHead from "../../../../components/DocumentHead";
import PageTransition from "../../../../styles/PageTransition";
import { Item, StudyMaterial } from "../../../../types/studyMaterial";

const ViewStudyMaterial = () => {
  const { studyMaterialId } = useParams();
  const location = useLocation();
  const [selected, setSelected] = useState("Summary");
  const [title, setTitle] = useState(location.state?.title || "");
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [modifiedItems, setModifiedItems] = useState<Item[]>([]);
  const [originalItems, setOriginalItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!studyMaterialId) return;

    const fetchStudyMaterial = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/study-material/get-by-study-material-id/${studyMaterialId}`
        );
        const data = await response.json();
        console.log("API Response for study material:", data);

        if (data && typeof data === "object") {
          let items: Item[] = [];
          let tags: string[] = [];

          try {
            tags = Array.isArray(data.tags)
              ? data.tags
              : JSON.parse(data.tags || "[]");
          } catch (error) {
            console.error("Error parsing tags:", error);
            tags = [];
          }

          // Process items to include both original and AI-generated content
          if (Array.isArray(data.items)) {
            items = data.items.map((item: any) => {
              console.log("Processing item from API:", item);
              
              // Create the processed item with all fields
              const processedItem = {
                term: item.term,
                definition: item.definition,
                image: item.image,
                item_number: item.item_number,
                type: item.type,
                question: item.question,
                answer: item.answer,
                options: item.options,
                original: item.original
              };

              console.log("Processed item:", processedItem);
              return processedItem;
            });
          }

          console.log("All processed items:", items);

          const material = {
            title: data.title,
            tags,
            images: data.images || [],
            total_items: data.total_items || 0,
            created_by: data.created_by || "Unknown",
            total_views: data.total_views || 0,
            created_at: data.created_at || new Date().toISOString(),
            items: items,
            summary: data.summary || "",
          };

          setOriginalItems(items.map(item => ({
            term: item.original?.term || item.term,
            definition: item.original?.definition || item.definition,
            image: item.image
          })));
          
          setStudyMaterial(material);
          setModifiedItems(items);
        } else {
          console.error("Invalid response format:", data);
        }
      } catch (error) {
        console.error("Error fetching study material:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyMaterial();
  }, [studyMaterialId]);

  const updateModifiedItems = (newItems: Item[]) => {
    setModifiedItems(newItems);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const originalStudyMaterial: StudyMaterial | null = studyMaterial ? {
    ...studyMaterial,
    items: originalItems
  } : null;

  const modifiedStudyMaterial: StudyMaterial | null = studyMaterial ? {
    ...studyMaterial,
    items: modifiedItems
  } : null;

  return (
    <PageTransition>
      <Box className="h-screen w-full px-8">
        <DocumentHead title={studyMaterial?.title + " | Duel Learn"} />
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h3" fontWeight="bold">
              {loading ? "Loading..." : studyMaterial?.title}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle2">
              Created on{" "}
              <strong>
                {loading
                  ? "Loading..."
                  : formatDate(studyMaterial?.created_at || "")}
              </strong>
            </Typography>
            <Typography variant="subtitle2">•</Typography>
            <Typography variant="subtitle2">
              Studied by{" "}
              <strong>
                {loading ? "Loading..." : studyMaterial?.total_views} People
              </strong>
            </Typography>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="subtitle1">Tags</Typography>
            <Stack direction="row" spacing={1}>
              {studyMaterial?.tags?.map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  sx={{ backgroundColor: "#4D18E8", color: "#E2DDF3" }}
                />
              ))}
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="subtitle1"
              className="text-[#3B354D] font-bold"
            >
              {loading
                ? "Loading..."
                : `${studyMaterial?.total_items || 0} ITEMS`}
            </Typography>
            <Divider className="bg-[#3B354D] flex-1" />
          </Stack>
          <Stack spacing={4}>
            <Stack direction="row" spacing={1} className="flex items-center">
              {["Summary", "Cards"].map((label) => (
                <Button
                  key={label}
                  variant="text"
                  onClick={() => setSelected(label)}
                  sx={{
                    color: selected === label ? "#E2DDF3" : "#3B354D",
                    backgroundColor:
                      selected === label ? "#3B354D" : "transparent",
                    "&:hover": { backgroundColor: "#3B354D", color: "#E2DDF3" },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
            <Box mt={2}>
              {selected === "Summary" ? (
                <Box sx={{ p: 4, backgroundColor: "#F2EFFF", borderRadius: 2 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#322168",
                      fontWeight: "bold",
                      mb: 4,
                      textAlign: "center"
                    }}
                  >
                    {studyMaterial?.summary || "No summary available"}
                  </Typography>
                  <SummaryPage studyMaterial={originalStudyMaterial} />
                </Box>
              ) : (
                <CardPage studyMaterial={modifiedStudyMaterial!} />
              )}
            </Box>
          </Stack>
        </Stack>
      </Box>
    </PageTransition>
  );
};

export default ViewStudyMaterial;
