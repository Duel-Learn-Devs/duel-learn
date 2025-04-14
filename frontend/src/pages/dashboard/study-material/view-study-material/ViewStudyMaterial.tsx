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
import ChooseModeModal from "../../../../components/modals/ChooseModeModal";

const ViewStudyMaterial = () => {
  const { user } = useUser();
  const { studyMaterialId } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("Summary");
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const open = Boolean(anchorEl);
  const [showModeModal, setShowModeModal] = useState(false);

  const isOwner = studyMaterial?.created_by_id === user?.firebase_uid;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!studyMaterialId) return;

    const fetchStudyMaterial = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/study-material/get-by-study-material-id/${studyMaterialId}`
        );
        const data = await response.json();
        console.log("API Response:", data);

        if (data && typeof data === "object" && "title" in data) {
          const items: Item[] = data.items || [];
          let tags: string[] = [];

          try {
            tags = Array.isArray(data.tags)
              ? data.tags
              : JSON.parse(data.tags || "[]");
          } catch (error) {
            console.error("Error parsing tags:", error);
            tags = [];
          }

          // Store the created_by_id from the API response
          const createdById = data.created_by_id || "";

          setStudyMaterial({
            title: data.title,
            tags,
            summary: data.summary || "",
            images: data.images || [],
            total_items: data.total_items || 0,
            created_by: data.created_by || "Unknown",
            created_by_id: createdById,
            total_views: data.total_views || 0,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            items,
            study_material_id: data.study_material_id || studyMaterialId || "",
            visibility: data.visibility || 0,
            status: data.status || "",
          });
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
  }, [studyMaterialId, user?.firebase_uid]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleEditClick = () => {
    if (!studyMaterial) return;

    // Transform items to match the format expected by CreateStudyMaterial
    const transformedItems = studyMaterial.items.map((item, index) => ({
      id: index, // Using index as id
      term: item.term || "",
      definition: item.definition || "",
      image: item.image || null,
      item_number: item.item_number || "",
    }));

    // Navigate to create page with study material data
    navigate("/dashboard/study-material/create", {
      state: {
        editMode: true,
        studyMaterialId: studyMaterial.study_material_id,
        title: studyMaterial.title,
        tags: studyMaterial.tags,
        items: transformedItems,
        visibility: studyMaterial.visibility,
      },
    });
  };

  const handleBookmarkToggle = async () => {
    if (!user || !studyMaterialId) return;

    try {
      // Optimistically update UI
      setIsBookmarked((prevState) => !prevState);

      console.log("Toggling bookmark for study material:", studyMaterialId);

      // Call backend API to toggle bookmark
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/study-material/bookmark`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            study_material_id: studyMaterialId,
            bookmarked_by_id: user.firebase_uid,
          }),
        }
      );

      // Log the full response for debugging
      console.log("Response status:", response.status);

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
        console.log("Response body:", result);
      } catch (e) {
        console.error("Failed to parse response as JSON:", text);
        // Revert UI state
        setIsBookmarked((prevState) => !prevState);
        return;
      }

      if (!response.ok) {
        console.error("Bookmark operation failed:", result.error);
        // Revert UI state if there was an API error
        setIsBookmarked((prevState) => !prevState);
        return;
      }

      // Log success message
      console.log(
        `Study material ${
          result.bookmarked ? "bookmarked" : "unbookmarked"
        } successfully`
      );

      // You could show a toast notification here if desired
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // Revert the state if there's an error
      setIsBookmarked((prevState) => !prevState);
    }
  };
  // Check if study material is bookmarked
  useEffect(() => {
    if (!user?.firebase_uid || !studyMaterialId) return;

    const checkBookmarkStatus = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/study-material/check-bookmark-status?study_material_id=${studyMaterialId}&bookmarked_by_id=${
            user.firebase_uid
          }`
        );

        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    checkBookmarkStatus();
  }, [studyMaterialId, user?.firebase_uid]);

  // Update handlePlayClick to show mode selection modal
  const handlePlayClick = () => {
    if (!studyMaterial) return;
    setShowModeModal(true);
  };

  // Handle mode selection
  const handleModeSelect = (mode: string) => {
    navigate("/dashboard/welcome-game-mode", {
      state: {
        mode,
        material: studyMaterial,
        preSelectedMaterial: studyMaterial,
        skipMaterialSelection: true,
      },
    });
  };

  return (
    <PageTransition>
      <Box className="min-h-screen w-full ">
        <DocumentHead title={studyMaterial?.title + " | Duel Learn"} />

        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
          >
            <Stack spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                className="text-[#E2DDF3]"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                }}
              >
                {loading ? "Loading..." : studyMaterial?.title}
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Typography variant="subtitle2" className="text-[#9F9BAE]">
                  Created on{" "}
                  <strong>
                    {loading
                      ? "Loading..."
                      : formatDate(studyMaterial?.updated_at || "")}
                  </strong>
                </Typography>
                <Typography
                  variant="subtitle2"
                  className="text-[#9F9BAE]"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  •
                </Typography>
                <Typography variant="subtitle2" className="text-[#9F9BAE]">
                  Studied by{" "}
                  <strong>
                    {loading ? "Loading..." : studyMaterial?.total_views} People
                  </strong>
                </Typography>

                {!loading && studyMaterial?.visibility?.toString() === "1" && (
                  <>
                    <Typography
                      variant="subtitle2"
                      className="text-[#9F9BAE]"
                      sx={{ display: { xs: "none", sm: "block" } }}
                    >
                      •
                    </Typography>
                    <Typography variant="subtitle2" className="text-[#9F9BAE]">
                      <strong>Public</strong>
                    </Typography>
                  </>
                )}

                {!loading &&
                  studyMaterial?.status?.toLowerCase() === "archived" && (
                    <>
                      <Typography
                        variant="subtitle2"
                        className="text-[#9F9BAE]"
                        sx={{ display: { xs: "none", sm: "block" } }}
                      >
                        •
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        className="text-[#9F9BAE]"
                      >
                        <strong>Archived</strong>
                      </Typography>
                    </>
                  )}
              </Stack>
            </Stack>
            <Box flex={1} sx={{ display: { xs: "none", sm: "block" } }} />
            <Stack
              direction={"row"}
              spacing={1}
              sx={{
                mt: { xs: 1, sm: 0 },
                flexWrap: { xs: "wrap", sm: "nowrap" },
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "justify-evenly", sm: "flex-end" },
              }}
            >
              <Button
                variant="contained"
                onClick={handlePlayClick}
                sx={{
                  alignItems: "center",
                  backgroundColor: "#4D18E8",
                  color: "#E2DDF3",
                  height: "fit-content",
                  borderRadius: "0.8rem",
                  padding: { xs: "0.4rem 1rem", sm: "0.5rem 2rem" },
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
                    minWidth: { xs: "40px", sm: "auto" },
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
                    padding: { xs: "0.4rem 1rem", sm: "0.5rem 2rem" },
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
                  minWidth: { xs: "40px", sm: "auto" },
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

          <Stack
            spacing={1.5}
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mt: 2 }}
          >
            <Typography variant="subtitle1" className="text-[#9F9BAE]">
              Tags:
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", gap: "8px" }}
            >
              {studyMaterial?.tags?.map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  sx={{
                    backgroundColor: "#4D18E8 !important",
                    color: "#E2DDF3",
                    borderRadius: "0.8rem",
                    width: "fit-content",
                    height: "fit-content",
                    padding: "0.5rem 0.5rem",
                    fontSize: "0.9rem",
                    mb: { xs: 1, sm: 0 },
                  }}
                />
              ))}
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
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
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={1}
              className="flex items-center"
              sx={{ overflowX: "auto", pb: 1 }}
            >
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
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
            <Box sx={{ width: "100%" }}>
              {selected === "Summary" ? (
                <SummaryPage studyMaterial={studyMaterial} />
              ) : (
                <CardPage studyMaterial={studyMaterial} />
              )}
            </Box>
          </Stack>
        </Stack>

        <MoreOptionPopover
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          studyMaterialId={studyMaterialId || ""}
          studyMaterialTitle={studyMaterial?.title || ""}
          studyMaterialVisibility={studyMaterial?.visibility || 0}
          isOwner={studyMaterial?.created_by_id === user?.firebase_uid}
          status={studyMaterial?.status} // Pass the status to the popover
        />

        {/* Add ChooseModeModal */}
        <ChooseModeModal
          open={showModeModal}
          handleClose={() => setShowModeModal(false)}
          preSelectedMaterial={studyMaterial}
          onModeSelect={handleModeSelect}
        />
      </Box>
    </PageTransition>
  );
};

export default ViewStudyMaterial;
