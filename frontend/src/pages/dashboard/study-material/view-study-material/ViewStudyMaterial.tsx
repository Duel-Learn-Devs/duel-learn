import { useState, useEffect } from "react";
import { Box, Stack, Typography, Button, Chip, Divider } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { Item, StudyMaterial } from "../../../../types/studyMaterialObject";
import SummaryPage from "./SummaryPage";
import CardPage from "./CardPage";
import DocumentHead from "../../../../components/DocumentHead";
import PageTransition from "../../../../styles/PageTransition";
import PlayIcon from "/play-button.svg";
import EditIcon from "/edit-icon.svg";
import MoreIcon from "@mui/icons-material/MoreHorizRounded";
import UnBookmarkIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkIcon from "@mui/icons-material/BookmarkRounded";
import MoreOptionPopover from "./MoreOptionPopover";
import { useUser } from "../../../../contexts/UserContext";


const ViewStudyMaterial = () => {
  const { user } = useUser();
  const { studyMaterialId } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("Summary");
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [modifiedItems, setModifiedItems] = useState<Item[]>([]);
  const [originalItems, setOriginalItems] = useState<Item[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const open = Boolean(anchorEl);

  const isOwner = studyMaterial?.created_by_id === user?.firebase_uid;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    navigate(`/dashboard/study-material/edit/${studyMaterialId}`);
  };

  useEffect(() => {
    const fetchStudyMaterial = async () => {
      if (!studyMaterialId) return;
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/study-material/get-by-study-material-id/${studyMaterialId}`
        );
        const data = await response.json();
        console.log("API Response for study material:", data);

        if (data && typeof data === "object") {
          const items: Item[] = [];
          let tags: string[] = [];

          try {
            tags = Array.isArray(data.tags)
              ? data.tags
              : JSON.parse(data.tags || "[]");
          } catch (error) {
            console.error("Error parsing tags:", error);
            tags = [];
          }

          if (Array.isArray(data.items)) {
            items = data.items.map((item: any) => ({
              term: item.term,
              definition: item.definition,
              image: item.image,
              item_number: item.item_number,
              type: item.type,
              question: item.question,
              answer: item.answer,
              options: item.options,
              original: item.original
            }));
          }

          const material = {
            title: data.title,
            tags,
            images: data.images || [],
            total_items: data.total_items || 0,
            created_by: data.created_by || "Unknown",
            created_by_id: data.created_by_id,
            total_views: data.total_views || 0,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || data.created_at || new Date().toISOString(),
            items: items,
            summary: data.summary || "No summary available yet",
            visibility: data.visibility || "private",
          };

          setOriginalItems(items.map(item => ({
            term: item.original?.term || item.term,
            definition: item.original?.definition || item.definition,
            image: item.image
          })));

          setStudyMaterial(material);
          setModifiedItems(items);
          setLoading(false);
        } else {
          console.error("Invalid response format:", data);
        }
      } catch (error) {
        console.error("Error fetching study material:", error);
        setLoading(false);
      }
    };

    fetchStudyMaterial();
  }, [studyMaterialId, user?.firebase_uid]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
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
      <Box className="h-full w-full px-8">
        <DocumentHead title={studyMaterial?.title + " | Duel Learn"} />
        <Stack spacing={2.5}>
          <Stack direction={"row"}>
            <Stack spacing={2}>
              <Typography variant="h3" fontWeight="bold">
                {loading ? "Loading..." : studyMaterial?.title}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle2">
                  Created on{" "}
                  <strong>
                    {loading
                      ? "Loading..."
                      : formatDate(studyMaterial?.updated_at || "")}
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
            </Stack>
            <Box flex={1} />
            <Stack direction={"row"} spacing={1} paddingTop={1}>
              <Button
                variant="contained"
                sx={{
                  alignItems: "center",
                  backgroundColor: "#4D18E8",
                  color: "#E2DDF3",
                  height: "fit-content",
                  borderRadius: "0.8rem",
                  padding: "0.5rem 2rem",
                  fontSize: "0.8rem",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <img src={PlayIcon} alt="" className="h-[0.9rem] w-auto mr-2" />
                Play
              </Button>
              {!isOwner && (
                <Button
                  variant="outlined"
                  onClick={handleBookmarkToggle}
                  sx={{
                    alignItems: "center",
                    borderColor: "#E2DDF3",
                    color: "#E2DDF3",
                    height: "fit-content",
                    borderRadius: "0.8rem",
                    padding: "0.4rem 1rem",
                    fontSize: "0.9rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  {isBookmarked ? (
                    <BookmarkIcon className="text-[#FBB03B]" />
                  ) : (
                    <UnBookmarkIcon />
                  )}
                </Button>
              )}

              {studyMaterial?.created_by_id === user?.firebase_uid && (
                <Button
                  variant="outlined"
                  onClick={handleEditClick}
                  sx={{
                    alignItems: "center",
                    borderColor: "#E2DDF3",
                    color: "#E2DDF3",
                    height: "fit-content",
                    borderRadius: "0.8rem",
                    padding: "0.5rem 2rem",
                    fontSize: "0.8rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <img
                    src={EditIcon}
                    alt=""
                    className="h-[0.9rem] w-auto mr-2"
                  />
                  Edit
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={handleClick}
                sx={{
                  alignItems: "center",
                  borderColor: "#E2DDF3",
                  color: "#E2DDF3",
                  height: "fit-content",
                  borderRadius: "0.8rem",
                  padding: "0.4rem 1rem",
                  fontSize: "0.9rem",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <MoreIcon />
              </Button>
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle1">Tags</Typography>
            <Stack direction="row" spacing={1}>
              {studyMaterial?.tags?.map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  sx={{
                    backgroundColor: "#4D18E8",
                    color: "#E2DDF3",
                    borderRadius: "0.8rem",
                    width: "fit-content",
                    height: "fit-content",
                    padding: "0.5rem 0.5rem",
                    fontSize: "0.9rem",
                  }}
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
                    borderRadius: "0.8rem",
                    padding: "0.5rem 1rem",
                    transition: "all 0.3s ease-in-out",
                    color: selected === label ? "#E2DDF3" : "#3B354D",
                    backgroundColor:
                      selected === label ? "#3B354D" : "transparent",
                    "&:hover": {
                      backgroundColor: "#3B354D",
                      color: "#E2DDF3",
                      transform: "scale(1.05)",
                    },
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
                    {studyMaterial?.summary || "Loading summary..."}
                  </Typography>
                  <SummaryPage studyMaterial={originalStudyMaterial} />
                </Box>
              ) : (
                <CardPage studyMaterial={modifiedStudyMaterial!} />
              )}
            </Box>
          </Stack>
        </Stack>
        <MoreOptionPopover
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          studyMaterialId={studyMaterialId || ""}
          isOwner={studyMaterial?.created_by_id === user?.firebase_uid}
        />
      </Box>
    </PageTransition>
  );
};

export default ViewStudyMaterial;
