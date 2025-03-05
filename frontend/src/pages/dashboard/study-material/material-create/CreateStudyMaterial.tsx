import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation import
import DocumentHead from "../../../../components/DocumentHead";
import PageTransition from "../../../../styles/PageTransition";
import {
  Box,
  Stack,
  Button,
  Typography,
  Divider,
  TextField,
  Chip,
} from "@mui/material";
import { nanoid } from "nanoid";
import ItemComponent from "./ItemComponent";
import { motion, AnimatePresence } from "framer-motion"; // Importing from Framer Motion
import { useUser } from "../../../../contexts/UserContext"; // Import the useUser hook
import AutoHideSnackbar from "../../../../components/ErrorsSnackbar"; // Adjust the

const CreateStudyMaterial = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Add this line
  const { user } = useUser();
  const socket = io(import.meta.env.VITE_BACKEND_URL);

  // Check if we're in edit mode
  const editMode = location.state?.editMode || false;
  const studyMaterialId = location.state?.studyMaterialId || null;
  const [studyMaterial, setStudyMaterial] = useState(null);

  // Initialize state using data from location if in edit mode
  const [tags, setTags] = useState<string[]>(location.state?.tags || []);
  const [title, setTitle] = useState(location.state?.title || "");
  const [currentTag, setCurrentTag] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [items, setItems] = useState<
    {
      id: number;
      term: string;
      definition: string;
      image?: File | null;
    }[]
  >(location.state?.items || []);

  // Update document title based on mode
  useEffect(() => {
    if (editMode) {
      document.title = `Edit ${title || "Study Material"}`;
    }
  }, [editMode, title]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault(); // Prevent form submission on Enter
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  // Function to handle adding a new item
  const handleAddItem = () => {
    // Create a new item with empty fields for term and definition
    setItems([...items, { id: Date.now(), term: "", definition: "" }]);
  };

  const handleDeleteItem = (id: number) => {
    // Filter out the deleted item
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (
    id: number,
    field: string,
    value: string | File | null
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleShowSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Update the save button handler to handle both create and update
  const handleSaveButton = async () => {
    console.log("Starting save process...");
    
    if (!user?.username) {
      handleShowSnackbar("User is not authenticated.");
      return;
    }

    if (!title.trim() || items.length === 0) {
      handleShowSnackbar("Title and at least one item are required.");
      return;
    }

    try {
      // Generate summary using OpenAI
      const summaryPayload = {
        tags,
        items: items.map(item => ({
          term: item.term,
          definition: item.definition
        }))
      };
      
      console.log("Sending summary request with payload:", summaryPayload);
      
      const summaryResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryPayload)
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary } = await summaryResponse.json();
      console.log("Generated summary:", summary);

      // Generate AI questions for each item
      console.log("Starting AI question generation for items...");
      const generatedItems = await Promise.all(items.map(async (item) => {
        const questionPayload = {
          term: item.term,
          definition: item.definition,
          selectedQuestionTypes: ['multiple-choice'], // or whatever types you want
          numberOfItems: 1
        };

        console.log("Generating questions for item:", questionPayload);

        const questionResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/generate-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionPayload)
        });

        if (!questionResponse.ok) {
          throw new Error('Failed to generate questions');
        }

        const questions = await questionResponse.json();
        console.log("Received AI-generated questions:", questions);

        return {
          ...item,
          type: questions[0]?.type || 'multiple-choice',
          question: questions[0]?.question || item.definition,
          answer: questions[0]?.answer || item.term,
          options: questions[0]?.options || null,
          original: {
            term: item.term,
            definition: item.definition
          }
        };
      }));

      console.log("All AI questions generated:", generatedItems);

      // Save study material with the generated summary and AI questions
      const studyMaterial = {
        studyMaterialId: editMode ? studyMaterialId : nanoid(),
        title,
        tags,
        summary,
        totalItems: items.length,
        visibility: 0,
        createdBy: user.username,
        createdById: user.firebase_uid,
        items: generatedItems.map((item, index) => ({
          ...item,
          item_number: index + 1
        }))
      };

      console.log("Saving study material with AI-generated content:", studyMaterial);

      const saveResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/study-material/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(studyMaterial)
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || `Server error: ${saveResponse.status}`);
      }

      const savedData = await saveResponse.json();
      console.log("Study material saved successfully:", savedData);

      // Navigate to the view page
      navigate(`/dashboard/study-material/view/${studyMaterial.studyMaterialId}`);

    } catch (error) {
      console.error("Failed to save study material:", error);
      handleShowSnackbar(error instanceof Error ? error.message : "Failed to save study material");
    }
  };

  useEffect(() => {
    const fetchStudyMaterial = async () => {
      if (editMode && studyMaterialId) {
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/study-material/${studyMaterialId}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch study material");
          }

          const data = await response.json();
          setStudyMaterial(data);

          // Check if current user is the creator
          if (user && user.firebase_uid !== data.created_by_id) {
            handleShowSnackbar(
              "You don't have permission to edit this study material"
            );
            navigate(`/dashboard/study-material/view/${studyMaterialId}`);
          }
        } catch (error) {
          console.error("Error fetching study material:", error);
          handleShowSnackbar("Error loading study material");
          navigate(-1);
        }
      }
    };

    fetchStudyMaterial();
  }, [editMode, studyMaterialId, user]);

  const handleDiscard = () => {
    if (editMode && studyMaterialId) {
      // If coming from edit mode, return to the view page for that specific material
      navigate(`/dashboard/study-material/view/${studyMaterialId}`);
    } else {
      // Otherwise, just go back to the previous page
      navigate(-1);
    }
  };

  const handleUploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf, .docx, .jpg, .jpeg, .png, .gif";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log("Uploaded file:", file);
      }
    };
    input.click();
  };

  return (
    <>
      <PageTransition>
        <Box className="h-full w-full px-8">
          <DocumentHead
            title={
              editMode
                ? `Editing ${title || "Study Material"}`
                : title || "Create Study Material"
            }
          />
          <Stack spacing={2.5}>
            {/* Title Input */}
            <Box className="sticky top-4 z-10">
              <Stack
                direction={"row"}
                spacing={2}
                className="flex items-center"
              >
                <TextField
                  id="title"
                  label="Title"
                  variant="standard"
                  value={title} // <-- Bind to state
                  onChange={(e) => setTitle(e.target.value)} // <-- Update state on change
                  sx={{
                    width: "32rem",

                    "& .MuiInputLabel-root": { color: "#3B354D" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#381898" },
                    "& .MuiInput-root": {
                      color: "#E2DDF3",
                      fontWeight: 500,
                      fontSize: "1.3rem",
                    },
                    "& .MuiInput-underline:before": {
                      borderBottomColor: "#3B354D",
                    },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                      borderBottomColor: "#A38CE6",
                    },
                    "& .MuiInput-underline:after": {
                      borderBottomColor: "#381898",
                    },
                  }}
                />

                <Box flexGrow={1} />
                <Stack direction={"row"} spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={handleDiscard}
                    sx={{
                      alignItems: "center",
                      borderColor: "#E2DDF3",
                      color: "#E2DDF3",
                      height: "fit-content",

                      borderRadius: "0.8rem",
                      padding: "0.4rem 2rem",
                      fontSize: "0.8rem",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      borderRadius: "0.8rem",
                      padding: "0.4rem 2rem",
                      display: "flex",
                      width: "full",
                      height: "fit-content",
                      borderColor: "#E2DDF3",
                      color: "#E2DDF3",
                      fontSize: "0.8rem",
                      backgroundColor: "#4D18E8",
                      transition: " all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                    onClick={handleSaveButton}
                  >
                    {editMode ? "Update" : "Save"}
                  </Button>
                </Stack>
              </Stack>
            </Box>

            {/* Tags Input */}
            <Box className="flex items-center">
              <Stack spacing={1} className="flex">
                <Typography variant="subtitle1" className="text-[#3B354D]">
                  Tags
                </Typography>
                <Box
                  sx={{
                    display: "inline-flex", // Make the Box adjust based on content size
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 0.5,
                    padding: "0.6rem",
                    border: "1px solid #3B354D",
                    borderRadius: "0.5rem",
                    backgroundColor: "#3B354D",
                    transition: "all 0.3s ease", // Smooth transition for hover and active
                    minWidth: "200px", // Set the minimum width for the Box
                    maxWidth: "100%", // Let the Box expand up to 100% of its container width
                    width: "auto", // Allow Box to take the width of its content
                    "&:hover": {
                      backgroundColor: "#4A435C", // Hover styles
                      borderColor: "#A38CE6",
                    },
                    "&:active": {
                      backgroundColor: "#2F283A", // Active styles
                      borderColor: "#9B85E1",
                    },
                  }}
                  onClick={() => document.getElementById("tags")?.focus()}
                >
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleDeleteTag(tag)}
                      sx={{
                        backgroundColor: "#4D18E8",
                        color: "#E2DDF3",
                        padding: "0.4rem",
                        "& .MuiChip-deleteIcon": { color: "#E2DDF3" },
                      }}
                    />
                  ))}

                  <input
                    id="tags"
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Press enter"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "#E2DDF3",
                      width: "5.5rem", // Input should not be too small
                      fontSize: "1rem", // Adjust font size as needed
                      paddingLeft: 6, // Remove any default right padding that may create the extra space
                      textAlign: "left", // Ensure text is aligned properly
                    }}
                    className="tag-input-placeholder"
                  />
                </Box>
              </Stack>
            </Box>

            {/* Counter for Items */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">
                  {items.length} Items
                </Typography>
                <Divider className="flex-1" />
              </Stack>
            </Box>

            {/* Upload File */}
            <Box>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: "0.5rem",
                  padding: "0.4rem 2rem",
                  display: "flex",
                  width: "full",
                  justifyContent: "center",
                  color: "#3B354D",
                  border: "0.15rem solid #3B354D",
                  textTransform: "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#E2DDF3",
                    color: "#E2DDF3",
                  },
                }}
                onClick={handleUploadFile}
              >
                Upload File
              </Button>
            </Box>

            {/* Items */}
            <Box className="pb-6">
              <Stack spacing={2}>
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <ItemComponent
                        item={item}
                        deleteItem={() => handleDeleteItem(item.id)}
                        updateItem={(field, value) =>
                          handleUpdateItem(item.id, field, value)
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button
                  variant="outlined"
                  sx={{
                    borderRadius: "0.6rem",
                    padding: "0.6rem 2rem",
                    display: "flex",
                    width: "full",
                    fontSize: "1rem",
                    justifyContent: "center",
                    color: "#3B354D",
                    border: "0.15rem solid #3B354D",
                    textTransform: "none",
                    bottom: 0,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#E2DDF3",
                      color: "#E2DDF3",
                    },
                  }}
                  onClick={handleAddItem}
                >
                  Add New Item
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </PageTransition>
      <AutoHideSnackbar
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
      />
    </>
  );
};

export default CreateStudyMaterial;
