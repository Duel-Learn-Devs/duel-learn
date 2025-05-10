import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
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
  Modal,
  Paper,
  IconButton,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/HighlightOffRounded";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion"; // Importing from Framer Motion
import { useUser } from "../../../../contexts/UserContext"; // Import the useUser hook
import AutoHideSnackbar from "../../../../components/ErrorsSnackbar"; // Adjust the
import Filter from "../../../../components/Filter"; // Adjust the
import CauldronIcon from "/General/Cauldron.gif";
import "../../../../styles/custom-scrollbar.css"; // Add this import
import "./errorHighlight.css";
import SelectStudyMaterialModal from "../../../../components/modals/SelectStudyMaterialModal";

// Add these imports near the top with your other imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "../types/SortableItem";
import { topics } from "../../../user-onboarding/data/topics";
import ErrorHighlightAnimation from "../../../../styles/ErrorHighlightAnimation";

// Add constant for maximum tags
const MAX_TAGS = 5;
const MAX_CUSTOM_TAGS = 2;
const MAX_TITLE_LENGTH = 50;
const MAX_TERM_LENGTH = 50;
const MAX_DEFINITION_LENGTH = 500;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_TOTAL_PAYLOAD_MB = 50;
const MIN_REQUIRED_ITEMS = 10;

// Add this helper function to check file size
const getFileSizeInMB = (base64String: string): number => {
  // Base64 string length * 0.75 gives approximate size in bytes
  // (base64 encoding increases size by ~33%)
  const sizeInBytes = base64String.length * 0.75;
  return sizeInBytes / (1024 * 1024); // Convert to MB
};

// Add this function to recalculate item numbers after any change
const recalculateItemNumbers = (
  itemsArray: {
    id: number;
    term: string;
    definition: string;
    image?: File | null;
    item_number: number;
  }[]
) => {
  return itemsArray.map((item, index) => ({
    ...item,
    item_number: index + 1,
  }));
};

// Add this interface near the top of your file with other types
interface TermDefinitionPair {
  term: string;
  definition: string;
}

const CreateStudyMaterial = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Add this line
  const { user, updateUser } = useUser();
  const isPremium = user?.account_type === "premium";

  // Properly type the socket state
  const [socket, setSocket] = useState<Socket | null>(null);

  // Add modal state and file handling state
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfConfirmationOpen, setPdfConfirmationOpen] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);

  // Check if we're in edit mode
  const editMode = location.state?.editMode || false;
  const studyMaterialId = location.state?.studyMaterialId || null;
  const [_studyMaterial, setStudyMaterial] = useState(null);

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
      item_number: number;
    }[]
  >(location.state?.items || []);
  const [visibility, setVisibility] = useState<string>(
    location.state?.visibility !== undefined
      ? location.state.visibility.toString()
      : "0"
  );
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  // Add these state variables near your other state declarations
  const [titleError, setTitleError] = useState(false);
  const [tagsError, setTagsError] = useState(false);
  const [itemsError, setItemsError] = useState(false);
  const [emptyItemIds, setEmptyItemIds] = useState<number[]>([]);
  const [emptyTerms, setEmptyTerms] = useState<number[]>([]);
  const [emptyDefinitions, setEmptyDefinitions] = useState<number[]>([]);

  // Add this state variable near your other state declarations
  const [originalState, setOriginalState] = useState<{
    title: string;
    tags: string[];
    items: any[];
    visibility: string;
  } | null>(null);

  // Add these new state variables near your other state declarations
  const [selectMaterialModalOpen, setSelectMaterialModalOpen] = useState(false);
  const [newMaterialId, setNewMaterialId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("Peaceful Mode");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Flatten all subjects from topics
  const allSubjects = topics
    .flatMap((topic) => topic.subjects.map((subject) => subject.name))
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

  const filteredSubjects = allSubjects.filter((subject) =>
    subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end and update item_numbers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex(
          (item) => item.id === active.id
        );
        const newIndex = currentItems.findIndex((item) => item.id === over.id);

        // First move the items around
        const newItems = arrayMove(currentItems, oldIndex, newIndex);

        // Then reassign item_number based on new positions using our helper function
        return recalculateItemNumbers(newItems);
      });
    }
  };

  // Update document title based on mode
  useEffect(() => {
    if (editMode) {
      document.title = `Edit ${title || "Study Material"}`;
    }
  }, [editMode, title]);

  // Calculate custom tags count
  const customTagsCount = tags.filter(
    (tag) => !allSubjects.includes(tag)
  ).length;

  const handleAddTag = (newValue: string[]) => {
    // Filter out empty values and get only the new tag
    const newTag = newValue.find((tag) => !tags.includes(tag));

    if (!newTag) return;

    // Check total tags limit
    if (newValue.length > MAX_TAGS) {
      handleShowSnackbar(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }

    // Check custom tags limit for non-predefined tags
    if (!allSubjects.includes(newTag)) {
      if (customTagsCount >= MAX_CUSTOM_TAGS) {
        handleShowSnackbar(`Maximum ${MAX_CUSTOM_TAGS} custom tags allowed`);
        return;
      }
    }

    setTags(newValue);
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags((prev) => {
      const newTags = prev.filter((tag) => tag !== tagToDelete);
      return newTags;
    });
  };

  // Function to handle adding a new item
  const handleAddItem = () => {
    // Create a new item with empty fields for term and definition
    const newItems = [
      ...items,
      {
        id: Date.now(),
        term: "",
        definition: "",
        item_number: items.length + 1,
      },
    ];

    // This is optional as adding to the end doesn't affect other item numbers
    // but keeps our logic consistent
    setItems(recalculateItemNumbers(newItems));
  };

  const handleDeleteItem = (id: number) => {
    // Filter out the deleted item
    const updatedItems = items.filter((item) => item.id !== id);

    // Recalculate item numbers for all remaining items
    setItems(recalculateItemNumbers(updatedItems));
  };

  // Update the handleUpdateItem function to validate image size
  const handleUpdateItem = (
    id: number,
    field: string,
    value: string | File | null
  ) => {
    // Check if the field is an image and it's a base64 string
    if (
      field === "image" &&
      typeof value === "string" &&
      value.startsWith("data:")
    ) {
      const imageSizeMB = getFileSizeInMB(value);

      if (imageSizeMB > MAX_IMAGE_SIZE_MB) {
        handleShowSnackbar(
          `Image too large (${imageSizeMB.toFixed(
            2
          )}MB). Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`
        );
        return; // Don't update the item with this image
      }

      // Calculate total payload size after adding this image
      let totalSize = 0;
      items.forEach((item) => {
        if (item.id !== id && item.image && typeof item.image === "string") {
          totalSize += getFileSizeInMB(item.image);
        }
      });
      totalSize += imageSizeMB;

      if (totalSize > MAX_TOTAL_PAYLOAD_MB) {
        handleShowSnackbar(
          `Total images size (${totalSize.toFixed(
            2
          )}MB) exceeds maximum allowed (${MAX_TOTAL_PAYLOAD_MB}MB).`
        );
        return; // Don't update the item with this image
      }
    }

    // Add validation for term and definition length
    if (
      field === "term" &&
      typeof value === "string" &&
      value.length > MAX_TERM_LENGTH
    ) {
      handleShowSnackbar(`Term cannot exceed ${MAX_TERM_LENGTH} characters`);
      return;
    }

    if (
      field === "definition" &&
      typeof value === "string" &&
      value.length > MAX_DEFINITION_LENGTH
    ) {
      handleShowSnackbar(
        `Definition cannot exceed ${MAX_DEFINITION_LENGTH} characters`
      );
      return;
    }

    // Update the item if validation passes
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

  // Set up socket connection with proper cleanup
  useEffect(() => {
    // Initialize socket connection with proper options
    const socketInstance = io(import.meta.env.VITE_BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(socketInstance);

    // Clean up on component unmount
    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, []);

  // Modify the existing useEffect that loads study material data
  useEffect(() => {
    const fetchStudyMaterial = async () => {
      if (editMode && studyMaterialId) {
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/study-material/get-by-study-material-id/${studyMaterialId}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch study material");
          }

          const data = await response.json();
          setStudyMaterial(data);

          // Store the original state
          setOriginalState({
            title: data.title,
            tags: data.tags,
            items: data.items.map((item) => ({
              term: item.term,
              definition: item.definition,
              image: item.image,
              id: Date.now() + Math.random(), // Temporary ID for comparison
            })),
            visibility: data.visibility.toString(),
          });

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
      } else if (editMode && location.state) {
        // Store original state from location.state if available
        setOriginalState({
          title: location.state.title,
          tags: location.state.tags,
          items: location.state.items.map((item) => ({
            term: item.term,
            definition: item.definition,
            image: item.image,
            id: item.id,
          })),
          visibility: location.state.visibility.toString(),
        });
      }
    };

    fetchStudyMaterial();
  }, [editMode, studyMaterialId, user, navigate]);

  // Update the save button handler to highlight specific empty items
  const handleSaveButton = async () => {
    // Reset all error states first
    setTitleError(false);
    setTagsError(false);
    setItemsError(false);
    setEmptyItemIds([]);
    setEmptyTerms([]);
    setEmptyDefinitions([]);

    // Track if validation passes
    let isValid = true;
    let firstErrorElement = null;

    if (!user?.username) {
      handleShowSnackbar("User is not authenticated.");
      return;
    }

    if (!user.firebase_uid) {
      handleShowSnackbar("User ID is not available.");
      return;
    }

    if (!title.trim()) {
      setTitleError(true);
      handleShowSnackbar("Title is required.");
      isValid = false;
      firstErrorElement = document.getElementById("title");
    }

    // Check for minimum items requirement AND validate content of each item
    const validItems = items.filter(
      (item) => item.term.trim() !== "" && item.definition.trim() !== ""
    );

    const emptyTermItems = items.filter(
      (item) => !item.term || item.term.trim() === ""
    );
    const emptyDefItems = items.filter(
      (item) => !item.definition || item.definition.trim() === ""
    );

    // Get IDs of items with empty fields
    const termIds = emptyTermItems.map((item) => item.id);
    const defIds = emptyDefItems.map((item) => item.id);
    const allEmptyIds = [...new Set([...termIds, ...defIds])];

    setEmptyTerms(termIds);
    setEmptyDefinitions(defIds);
    setEmptyItemIds(allEmptyIds);

    if (allEmptyIds.length > 0) {
      handleShowSnackbar(`All items must have both term and definition.`);

      // Focus the first empty item
      if (allEmptyIds.length > 0) {
        const firstEmptyItemElement = document.getElementById(
          `item-${allEmptyIds[0]}`
        );
        if (firstEmptyItemElement) {
          firstErrorElement = firstEmptyItemElement;
          setTimeout(() => {
            firstEmptyItemElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            firstEmptyItemElement.focus();
            firstEmptyItemElement.classList.add("error-highlight-animation");
            setTimeout(() => {
              firstEmptyItemElement.classList.remove(
                "error-highlight-animation"
              );
            }, 1500);
          }, 100);
        }
      }

      isValid = false;
    }

    // Create a copy of current tags
    let finalTags = [...tags];

    // Check if there's text in the input field that hasn't been added as a tag yet
    if (inputValue.trim()) {
      // Add the pending tag input if tags array is empty or if it's not already in tags
      if (finalTags.length === 0 || !finalTags.includes(inputValue.trim())) {
        // Check against tag limits
        if (finalTags.length >= MAX_TAGS) {
          handleShowSnackbar(`Maximum ${MAX_TAGS} tags allowed`);
        } else {
          // Check custom tag limit
          if (!allSubjects.includes(inputValue.trim())) {
            const currentCustomTagsCount = finalTags.filter(
              (tag) => !allSubjects.includes(tag)
            ).length;

            if (currentCustomTagsCount >= MAX_CUSTOM_TAGS) {
              handleShowSnackbar(
                `Maximum ${MAX_CUSTOM_TAGS} custom tags allowed`
              );
            } else {
              // Add the pending tag
              finalTags.push(inputValue.trim());
            }
          } else {
            // Add the pending tag from predefined subjects
            finalTags.push(inputValue.trim());
          }
        }
      }
    }

    if (finalTags.length === 0) {
      setTagsError(true);
      handleShowSnackbar("At least one tag is required.");
      isValid = false;
      // Only set this as first error if no previous errors
      if (!firstErrorElement) {
        const tagsInput = document.getElementById("tags");
        firstErrorElement = tagsInput || null;
      }
    }

    // If validation fails, focus on the first error element and return early
    if (!isValid && firstErrorElement) {
      // Smooth scroll to the element
      firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Add a slight delay before focusing to ensure scrolling completes
      setTimeout(() => {
        firstErrorElement.focus();

        // Add a temporary highlight effect
        firstErrorElement.classList.add("error-highlight-animation");
        setTimeout(() => {
          firstErrorElement.classList.remove("error-highlight-animation");
        }, 1500);
      }, 500);

      return; // Don't proceed with saving if validation fails
    }

    // Check if we're in edit mode and if anything has changed
    if (editMode && originalState && isValid) {
      const hasNoChanges =
        title === originalState.title &&
        JSON.stringify(tags.sort()) ===
          JSON.stringify(originalState.tags.sort()) &&
        visibility === originalState.visibility &&
        items.length === originalState.items.length &&
        items.every((item, index) => {
          // Find corresponding item in original state
          const originalItem = originalState.items.find((oi) => {
            // For original items from API, compare term and definition
            return oi.term === item.term && oi.definition === item.definition;
          });

          if (!originalItem) return false;

          // Compare content (ignore ID and item_number which may change)
          return (
            item.term.trim() === originalItem.term.trim() &&
            item.definition.trim() === originalItem.definition.trim()
          );
        });

      if (hasNoChanges) {
        console.log("No changes detected, skipping save operation");
        // If nothing has changed, just redirect
        navigate(`/dashboard/study-material/view/${studyMaterialId}`);
        return;
      }
    }

    // Only set isSaving to true if we've passed all validation and changes are detected
    setIsSaving(true);

    // Define summary variable outside try block so it's accessible in the main scope
    let summary = "";

    try {
      // Generate summary using OpenAI
      const summaryPayload = {
        tags: finalTags,
        items: items.map((item) => ({
          term: item.term,
          definition: item.definition,
        })),
      };

      console.log("Sending summary request with payload:", summaryPayload);

      try {
        const summaryResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/openai/generate-summary`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(summaryPayload),
          }
        );

        if (!summaryResponse.ok) {
          const errorData = await summaryResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to generate summary");
        }

        const summaryData = await summaryResponse.json();
        summary = summaryData.summary;

        console.log("Generated summary:", summary);
      } catch (summaryError) {
        console.error("Error generating summary:", summaryError);
        // Create a fallback summary instead of failing the whole save process
        summary = title;
        handleShowSnackbar(
          "Couldn't generate summary, using title as fallback."
        );
      }

      // Check total payload size before sending
      let totalImageSize = 0;
      items.forEach((item) => {
        if (item.image && typeof item.image === "string") {
          totalImageSize += getFileSizeInMB(item.image);
        }
      });

      if (totalImageSize > MAX_TOTAL_PAYLOAD_MB) {
        handleShowSnackbar(
          `Total images size (${totalImageSize.toFixed(
            2
          )}MB) exceeds maximum allowed (${MAX_TOTAL_PAYLOAD_MB}MB). Please reduce image sizes or remove some images.`
        );
        return;
      }

      try {
        // Transform items to include base64 images and preserve item_number
        // But ONLY include valid items
        const transformedItems = items.map((item, index) => ({
          ...item,
          tags: tags, // Add tags to each item
        }));

        const studyMaterial = {
          studyMaterialId: editMode ? studyMaterialId : nanoid(),
          title,
          tags: finalTags,
          summary, // Use the generated or fallback summary
          totalItems: validItems.length, // Use validItems.length instead of items.length
          visibility: parseInt(visibility),
          createdBy: user.username,
          createdById: user.firebase_uid,
          items: transformedItems, // Only include valid items in the payload
        };

        // Check socket but don't block saving if not connected
        if (!socket || !socket.connected) {
          console.warn(
            "Socket connection is not established - will continue without real-time updates"
          );
        }

        // Determine the endpoint based on whether we're creating or updating
        const apiUrl = editMode
          ? `${import.meta.env.VITE_BACKEND_URL}/api/study-material/update`
          : `${import.meta.env.VITE_BACKEND_URL}/api/study-material/save`;

        console.log("Saving with payload:", studyMaterial);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studyMaterial),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message ||
              errorData?.error ||
              `Server error: ${response.status}`
          );
        }

        const savedData = await response.json();

        if (!savedData) {
          throw new Error("No data received from server");
        }

        // Create broadcast data with consistent property naming
        const broadcastData = {
          study_material_id:
            savedData.studyMaterialId || studyMaterial.studyMaterialId,
          title: savedData.title || title,
          tags: savedData.tags || finalTags,
          summary: savedData.summary || summary,
          total_items: savedData.totalItems || items.length,
          created_by: savedData.createdBy || user.username,
          created_by_id: savedData.createdById || user.firebase_uid,
          visibility: savedData.visibility,
          created_at: savedData.created_at || new Date().toISOString(),
          items: savedData.items || transformedItems,
        };

        // Emit the transformed data (now with null check for socket)
        console.log("Emitting new study material event:", broadcastData);
        if (socket && socket.connected) {
          socket.emit("newStudyMaterial", broadcastData);
        }

        // Store the new material ID in state (but don't open modal)
        setNewMaterialId(broadcastData.study_material_id);

        // Show success toast/notification
        handleShowSnackbar("Study material saved successfully!");

        navigate(
          `/dashboard/study-material/view/${broadcastData.study_material_id}`
        );

        // Reset the edit mode if needed
        if (editMode) {
          editMode(false);
        }
      } catch (error) {
        console.error(
          editMode
            ? "Failed to update study material:"
            : "Failed to save study material:",
          error
        );
        handleShowSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to save study material. Please try again."
        );
      }
    } catch (error) {
      console.error("Error in handleSaveButton:", error);
      handleShowSnackbar("An unexpected error occurred. Please try again.");
    } finally {
      // Make sure isSaving is set to false regardless of success or failure
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (editMode && studyMaterialId) {
      // Add the missing forward slash between "view" and studyMaterialId
      navigate(`/dashboard/study-material/view/${studyMaterialId}`);
    } else {
      // Otherwise, just go back to the previous page
      navigate(-1);
    }
  };

  // Function to handle opening the scan notes modal
  const handleOpenScanModal = () => {
    // Check if user is premium or has tech passes before allowing them to process
    if (!isPremium && (!user?.tech_pass || user?.tech_pass <= 0)) {
      handleShowSnackbar(
        "You need a Tech Pass to use the scanning feature. Purchase Tech Passes from the shop or upgrade to Premium."
      );
      return;
    }

    setScanModalOpen(true);
  };

  // Function to handle closing the scan notes modal
  const handleCloseScanModal = () => {
    setScanModalOpen(false);
    setUploadedFiles([]);
    setUploadProgress(0);
  };

  // Function to handle file drag and drop or selection
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    // Add strict validation at the beginning
    if (!isPremium && (!user?.tech_pass || user?.tech_pass <= 0)) {
      handleShowSnackbar(
        "You need a Tech Pass to use the scanning feature. Purchase Tech Passes from the shop or upgrade to Premium."
      );
      // Reset input if using file input
      if ("target" in event && (event.target as HTMLInputElement).files) {
        (event.target as HTMLInputElement).value = "";
      }
      return;
    }

    // Handle both drag and drop events and file input events
    let newFiles: File[] = [];

    if ("dataTransfer" in event) {
      // This is a drag event
      if (event.dataTransfer.files.length > 0) {
        newFiles = Array.from(event.dataTransfer.files);
      }
    } else if (
      event.target instanceof HTMLInputElement &&
      event.target.files &&
      event.target.files.length > 0
    ) {
      // This is a file input event
      newFiles = Array.from(event.target.files);
    }

    if (newFiles.length > 0) {
      // Check if we're mixing PDFs with images
      const hasPDF = newFiles.some((file) => file.type === "application/pdf");
      const hasImages = newFiles.some(
        (file) =>
          file.type === "image/jpeg" ||
          file.type === "image/jpg" ||
          file.type === "image/png"
      );

      if (hasPDF && hasImages) {
        handleShowSnackbar(
          "Cannot mix PDF and image files. Please upload either PDFs or images only."
        );
        return;
      }

      // Check if we already have files and their types
      const existingHasPDF = uploadedFiles.some(
        (file) => file.type === "application/pdf"
      );
      const existingHasImages = uploadedFiles.some(
        (file) =>
          file.type === "image/jpeg" ||
          file.type === "image/jpg" ||
          file.type === "image/png"
      );

      // Check if we're trying to mix with existing files
      if ((hasPDF && existingHasImages) || (hasImages && existingHasPDF)) {
        handleShowSnackbar(
          "Cannot mix PDF and image files. Please upload either PDFs or images only."
        );
        return;
      }

      // Check file types and sizes
      const validFiles = newFiles.filter((file) => {
        // Check if file exists and is valid
        if (!file || file.size === 0) {
          console.error("Empty or invalid file encountered:", file.name);
          handleShowSnackbar(
            `File ${file.name} appears to be empty or invalid`
          );
          return false;
        }

        // Check file type - now including PDF
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/pdf",
        ];
        if (!validTypes.includes(file.type)) {
          handleShowSnackbar(
            `Invalid file type: ${file.name}. Only JPG, PNG, and PDF files are accepted`
          );
          return false;
        }

        // Check file size
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          handleShowSnackbar(
            `File too large: ${file.name}. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`
          );
          return false;
        }

        return true;
      });

      // Count existing files by type
      const existingPDFCount = uploadedFiles.filter(
        (file) => file.type === "application/pdf"
      ).length;
      const existingImageCount = uploadedFiles.filter(
        (file) =>
          file.type === "image/jpeg" ||
          file.type === "image/jpg" ||
          file.type === "image/png"
      ).length;

      // Count new files by type
      const newPDFCount = validFiles.filter(
        (file) => file.type === "application/pdf"
      ).length;
      const newImageCount = validFiles.filter(
        (file) =>
          file.type === "image/jpeg" ||
          file.type === "image/jpg" ||
          file.type === "image/png"
      ).length;

      // Check PDF limit
      if (existingPDFCount + newPDFCount > 1) {
        handleShowSnackbar("Maximum 1 PDF file allowed");
        return;
      }

      // Check image limit
      if (existingImageCount + newImageCount > 5) {
        handleShowSnackbar("Maximum 5 image files allowed");
        return;
      }

      // Log validation results
      if (validFiles.length < newFiles.length) {
        console.log(
          `Filtered out ${newFiles.length - validFiles.length} invalid files`
        );
      }

      // Add all valid files
      setUploadedFiles([...uploadedFiles, ...validFiles]);
    }
  };

  const handleProcessFile = async () => {
    if (uploadedFiles.length === 0) {
      handleShowSnackbar("Please upload at least one file");
      return;
    }

    // Add strict validation at the beginning
    if (!isPremium && (!user?.tech_pass || user?.tech_pass <= 0)) {
      handleShowSnackbar(
        "You need a Tech Pass to process files. Purchase Tech Passes from the shop or upgrade to Premium."
      );
      handleCloseScanModal(); // Close the modal immediately
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress(0);
      let allPairs = [];

      // Process each file one by one
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const progressPerFile = 90 / uploadedFiles.length;
        const startProgress = i * progressPerFile + 10;

        // Update progress and status
        handleShowSnackbar(
          `Processing file ${i + 1} of ${uploadedFiles.length}...`
        );
        setUploadProgress(startProgress);

        // Create FormData for single file
        const formData = new FormData();
        formData.append("files", file);

        // Step 1: Extract text with OCR
        const ocrResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/ocr/extract-multiple`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!ocrResponse.ok) {
          const errorData = await ocrResponse.json().catch(() => ({}));
          console.error("OCR error response:", errorData);
          throw new Error(
            errorData.details || `OCR service error: ${ocrResponse.status}`
          );
        }

        const ocrData = await ocrResponse.json();
        setUploadProgress(startProgress + progressPerFile * 0.4);

        // Check if this is a PDF with more than 5 pages
        if (file.type === "application/pdf" && ocrData.totalPdfPages > 5) {
          setPdfPageCount(ocrData.totalPdfPages);

          // For premium users, continue processing without confirmation
          if (isPremium) {
            console.log(
              "Premium user - processing large PDF without confirmation"
            );
            // Continue with processing - no dialog or early return
          } else {
            // Non-premium users still need to show dialog and wait for confirmation
            setPendingPdf(file);
            setPdfConfirmationOpen(true);
            setIsProcessing(false);
            return; // Only return early for non-premium users
          }
        }

        if (!ocrData.text || ocrData.text.trim() === "") {
          console.log(`No text could be extracted from file ${i + 1}`);
          continue;
        }

        // Step 2: Process text into term-definition pairs with AI
        const aiResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/ocr/extract-pairs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: ocrData.text }),
          }
        );

        setUploadProgress(startProgress + progressPerFile * 0.8);

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json().catch(() => ({}));
          console.error("AI error response:", errorData);
          throw new Error(
            errorData.details || `AI service error: ${aiResponse.status}`
          );
        }

        const aiData = await aiResponse.json();
        if (aiData.pairs && aiData.pairs.length > 0) {
          allPairs = [...allPairs, ...aiData.pairs];
        }

        setUploadProgress(startProgress + progressPerFile);
      }

      // Final processing
      setUploadProgress(95);

      if (allPairs.length > 0) {
        // Create the new items with temporary item numbers
        const newItems = allPairs.map((pair, index) => ({
          id: Date.now() + index,
          term: pair.term || "",
          definition: pair.definition || "",
          image: null,
          item_number: items.length + index + 1,
        }));

        // Combine existing and new items, then recalculate all item numbers
        const combinedItems = [...items, ...newItems];
        const numberedItems = recalculateItemNumbers(combinedItems);

        // Update state with properly numbered items
        setItems(numberedItems);

        handleShowSnackbar(
          `Added ${newItems.length} new terms and definitions!`
        );

        // Deduct tech passes based on PDF pages
        const techPassesToDeduct = Math.ceil(pdfPageCount / 5);
        try {
          if (user?.firebase_uid && !isPremium && user?.tech_pass > 0) {
            if (user.tech_pass < techPassesToDeduct) {
              handleShowSnackbar(
                `You need ${techPassesToDeduct} Tech Passes but only have ${user.tech_pass}!`
              );
              return;
            }

            const techPassResponse = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/shop/use-tech-pass/${
                user.firebase_uid
              }/${techPassesToDeduct}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (techPassResponse.ok) {
              const responseData = await techPassResponse.json();
              console.log("PDF tech pass deduction response:", responseData);

              // Update the user context with server-provided count instead of manual calculation
              updateUser({
                ...user,
                tech_pass: responseData.updatedTechPassCount,
              });
            } else {
              // Try to parse error message from response
              try {
                const errorData = await techPassResponse.json();
                console.error("Failed to deduct tech passes:", errorData);
                handleShowSnackbar(
                  errorData.message || "Failed to deduct tech passes"
                );
              } catch (e) {
                console.error(
                  "Failed to deduct tech passes, but feature was used"
                );
                handleShowSnackbar(
                  "Failed to deduct tech passes, but feature was used"
                );
              }
            }
          }
        } catch (passError) {
          console.error("Error deducting tech passes:", passError);
        }

        // Close the modal after processing
        handleCloseScanModal();
        setUploadProgress(100);

        // Resize textareas after new items are added
        setTimeout(() => {
          const textareas = document.querySelectorAll("textarea");
          textareas.forEach((textarea) => {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
          });
        }, 300);
      } else {
        handleShowSnackbar("No term-definition pairs could be identified");
      }
    } catch (error) {
      console.error("Error processing document:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process the files";
      handleShowSnackbar(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfConfirmation = async (confirmed: boolean) => {
    setPdfConfirmationOpen(false);
    if (confirmed && pendingPdf) {
      try {
        setIsProcessing(true);
        setUploadProgress(10);

        // Create FormData for the PDF
        const formData = new FormData();
        formData.append("files", pendingPdf);

        // Step 1: Extract text with OCR
        const ocrResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/ocr/extract-multiple`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!ocrResponse.ok) {
          const errorData = await ocrResponse.json().catch(() => ({}));
          console.error("OCR error response:", errorData);
          throw new Error(
            errorData.details || `OCR service error: ${ocrResponse.status}`
          );
        }

        const ocrData = await ocrResponse.json();
        setUploadProgress(40);

        if (!ocrData.text || ocrData.text.trim() === "") {
          handleShowSnackbar("No text could be extracted from the PDF");
          return;
        }

        // Step 2: Process text into term-definition pairs with AI
        const aiResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/ocr/extract-pairs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: ocrData.text }),
          }
        );

        setUploadProgress(80);

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json().catch(() => ({}));
          console.error("AI error response:", errorData);
          throw new Error(
            errorData.details || `AI service error: ${aiResponse.status}`
          );
        }

        const aiData = await aiResponse.json();
        setUploadProgress(95);

        if (aiData.pairs && aiData.pairs.length > 0) {
          // Create the new items with temporary item numbers
          const newItems = aiData.pairs.map((pair, index) => ({
            id: Date.now() + index,
            term: pair.term || "",
            definition: pair.definition || "",
            image: null,
            item_number: items.length + index + 1,
          }));

          // Combine existing and new items, then recalculate all item numbers
          const combinedItems = [...items, ...newItems];
          const numberedItems = recalculateItemNumbers(combinedItems);

          // Update state with properly numbered items
          setItems(numberedItems);

          handleShowSnackbar(
            `Added ${newItems.length} new terms and definitions!`
          );

          // Deduct tech passes based on PDF pages
          const techPassesToDeduct = Math.ceil(pdfPageCount / 5);
          try {
            if (user?.firebase_uid && !isPremium && user?.tech_pass > 0) {
              if (user.tech_pass < techPassesToDeduct) {
                handleShowSnackbar(
                  `You need ${techPassesToDeduct} Tech Passes but only have ${user.tech_pass}!`
                );
                return;
              }

              const techPassResponse = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/shop/use-tech-pass/${
                  user.firebase_uid
                }/${techPassesToDeduct}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (techPassResponse.ok) {
                const responseData = await techPassResponse.json();
                console.log("PDF tech pass deduction response:", responseData);

                // Update the user context with server-provided count instead of manual calculation
                updateUser({
                  ...user,
                  tech_pass: responseData.updatedTechPassCount,
                });
              } else {
                // Try to parse error message from response
                try {
                  const errorData = await techPassResponse.json();
                  console.error("Failed to deduct tech passes:", errorData);
                  handleShowSnackbar(
                    errorData.message || "Failed to deduct tech passes"
                  );
                } catch (e) {
                  console.error(
                    "Failed to deduct tech passes, but feature was used"
                  );
                  handleShowSnackbar(
                    "Failed to deduct tech passes, but feature was used"
                  );
                }
              }
            }
          } catch (passError) {
            console.error("Error deducting tech passes:", passError);
          }

          // Close the modal after processing
          handleCloseScanModal();
          setUploadProgress(100);

          // Resize textareas after new items are added
          setTimeout(() => {
            const textareas = document.querySelectorAll("textarea");
            textareas.forEach((textarea) => {
              textarea.style.height = "auto";
              textarea.style.height = textarea.scrollHeight + "px";
            });
          }, 300);
        } else {
          handleShowSnackbar("No term-definition pairs could be identified");
        }
      } catch (error) {
        console.error("Error processing PDF:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process the PDF";
        handleShowSnackbar(errorMessage);
        setUploadProgress(0);
      } finally {
        setIsProcessing(false);
        setPendingPdf(null);
        setPdfPageCount(0);
      }
    } else {
      // Remove the PDF from the list
      const newFiles = uploadedFiles.filter((file) => file !== pendingPdf);
      setUploadedFiles(newFiles);
      setPendingPdf(null);
      setPdfPageCount(0);
    }
  };

  // Add this function to handle removing a file from the list
  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  // Update the handleUploadFile function to open the modal instead
  const handleUploadFile = () => {
    handleOpenScanModal();
  };

  const resizeTextarea = (input: HTMLTextAreaElement | HTMLInputElement) => {
    input.style.width = "auto"; // Reset height
    input.style.width = input.scrollWidth + "px"; // Set height to fit content
  };

  // Add a handler for the visibility change
  const handleVisibilityChange = (value: string | number) => {
    setVisibility(value.toString());
  };

  // Add effect to clear error states when user fixes the issues
  useEffect(() => {
    if (title.trim()) {
      setTitleError(false);
    }
  }, [title]);

  useEffect(() => {
    if (tags.length > 0) {
      setTagsError(false);
    }
  }, [tags]);

  useEffect(() => {
    if (items.length >= MIN_REQUIRED_ITEMS) {
      setItemsError(false);
    }
  }, [items]);

  // Add this useEffect after your existing useEffect hooks

  useEffect(() => {
    // Handle initial textarea sizing for all items when in edit mode
    if (editMode && items.length > 0) {
      // Use a small timeout to ensure the textareas are rendered
      const timer = setTimeout(() => {
        // Get all textareas in the document and adjust their height
        const textareas = document.querySelectorAll("textarea");
        textareas.forEach((textarea) => {
          // Reset height first
          textarea.style.height = "auto";
          // Set height to fit content
          textarea.style.height = textarea.scrollHeight + "px";
        });
      }, 100); // Small delay to ensure components are rendered

      return () => clearTimeout(timer);
    }
  }, [editMode, items]); // Depend on editMode and items

  // Add this useEffect near your other useEffect hooks

  useEffect(() => {
    // Resize the title textarea when it's loaded with initial data
    if (title && editMode) {
      const titleInput = document.getElementById("title") as HTMLInputElement;
      if (titleInput) {
        // Use a small timeout to ensure the DOM is ready
        setTimeout(() => {
          resizeTextarea(titleInput);
        }, 100);
      }
    }
  }, [title, editMode]);

  // Add these handler functions for the modal
  const handleMaterialSelect = (material: any) => {
    // Handle material selection (navigate to game mode, etc.)
    navigate("/dashboard/welcome-game-mode", {
      state: {
        mode: selectedMode,
        material,
      },
    });
  };

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
  };

  const handleCloseModal = () => {
    setSelectMaterialModalOpen(false);
    // Reset the newMaterialId when the modal is closed
    // This ensures it only highlights once per new material
    setNewMaterialId(null);
  };

  return (
    <>
      <ErrorHighlightAnimation />
      <PageTransition>
        <Box className="h-full w-full ">
          <DocumentHead
            title={
              editMode
                ? `Editing ${title || "Study Material"} | Duel Learn`
                : title || "Create Study Material"
            }
          />
          <Stack spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {/* Title Input */}
            <Box
              className="z-10"
              sx={{
                position: "sticky",
                top: 0,
                backgroundColor: "#080511", // Match app background color
                paddingTop: "1rem",
                width: "100%",
                borderBottom: "0.8rem",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1, sm: 2 }}
                className="flex items-start sm:items-center"
              >
                <Stack sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <TextField
                    id="title"
                    label={title ? "" : "Enter your title here..."}
                    variant="standard"
                    value={title}
                    error={titleError}
                    onChange={(e) => {
                      // Limit title to MAX_TITLE_LENGTH characters
                      if (e.target.value.length <= MAX_TITLE_LENGTH) {
                        setTitle(e.target.value);
                      } else {
                        handleShowSnackbar(
                          `Title cannot exceed ${MAX_TITLE_LENGTH} characters`
                        );
                      }
                    }}
                    onInput={(e) =>
                      resizeTextarea(e.target as HTMLInputElement)
                    }
                    sx={{
                      width: "100%",
                      minWidth: { xs: "100%", sm: "20rem", md: "32rem" },
                      maxWidth: "100%",
                      "& .MuiInputLabel-root": {
                        color: titleError ? "#f44336" : "#3B354D",
                        transform: title
                          ? "translate(0, -1.5px) scale(0.75)"
                          : "translate(0, 20px) scale(1)",
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: titleError ? "#f44336" : "#A38CE6",
                        transform: "translate(0, -1.5px) scale(0.75)",
                      },
                      "& .MuiInput-root": {
                        color: "#E2DDF3",
                        fontWeight: 500,
                        fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.3rem" },
                      },
                      "& .MuiInput-underline:before": {
                        borderBottomColor: titleError ? "#f44336" : "#3B354D",
                      },
                      "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                        borderBottomColor: titleError ? "#f44336" : "#A38CE6",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottomColor: titleError ? "#f44336" : "#A38CE6",
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "#9F9BAE",
                        opacity: 0.7,
                        transition: "opacity 0.2s ease-in-out",
                      },
                      "& .MuiInputBase-input:focus::placeholder": {
                        opacity: 0,
                      },
                    }}
                    InputProps={{
                      style: {
                        transition: "all 0.3s ease",
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        title.length >= MAX_TITLE_LENGTH
                          ? "#E57373"
                          : "#6F658D",
                      transition: "color 0.3s ease-in-out",
                      marginTop: "0.2rem",
                      fontSize: "0.75rem",
                      textAlign: "right",
                    }}
                  >
                    {title.length}/{MAX_TITLE_LENGTH} characters
                  </Typography>
                </Stack>
                <Box flexGrow={1} />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "space-between", sm: "flex-end" },
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleDiscard}
                    sx={{
                      alignItems: "center",
                      borderColor: "#E2DDF3",
                      color: "#E2DDF3",
                      height: "fit-content",
                      borderRadius: "0.8rem",
                      width: { xs: "45%", sm: "6rem", md: "7rem" },
                      fontSize: { xs: "0.75rem", sm: "0.8rem" },
                      padding: { xs: "0.4rem 0.6rem", sm: "0.5rem 0.8rem" },
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
                    disabled={isSaving}
                    sx={{
                      borderRadius: "0.8rem",
                      display: "flex",
                      width: { xs: "45%", sm: "6rem", md: "7rem" },
                      height: "fit-content",
                      borderColor: "#E2DDF3",
                      color: "#E2DDF3",
                      fontSize: { xs: "0.75rem", sm: "0.8rem" },
                      padding: { xs: "0.4rem 0.6rem", sm: "0.5rem 0.8rem" },
                      backgroundColor: "#4D18E8",
                      transition: " all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "#4D18E8",
                        color: "#E2DDF3",
                        opacity: 0.7,
                      },
                    }}
                    onClick={handleSaveButton}
                  >
                    {isSaving ? (
                      <CircularProgress size={20} sx={{ color: "#E2DDF3" }} />
                    ) : editMode ? (
                      "Update"
                    ) : (
                      "Save"
                    )}
                  </Button>
                </Stack>
              </Stack>
            </Box>

            {/* Tags Input */}
            <Box className="flex">
              <Stack
                spacing={1}
                sx={{ display: "inline-flex", maxWidth: "100%" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" className="text-[#3B354D]">
                    Tags:
                  </Typography>
                  <Typography variant="caption" className="text-[#9F9BAE]">
                    (Type a custom tag or select from predefined subjects, then
                    press Enter)
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    flexWrap: "wrap",
                    gap: 0.5,
                    padding: { xs: "0.5rem", sm: "0.6rem" },
                    width: "auto",
                    minWidth: "14ch",
                    maxWidth: "fit-content",
                    border: `1px solid ${tagsError ? "#f44336" : "#3B354D"}`,
                    borderRadius: "0.8rem",
                    backgroundColor: tagsError
                      ? "rgba(244, 67, 54, 0.08)"
                      : "#3B354D",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: tagsError
                        ? "rgba(244, 67, 54, 0.12)"
                        : "#4A435C",
                      borderColor: tagsError ? "#f44336" : "#A38CE6",
                    },
                    "&:active": {
                      backgroundColor: tagsError
                        ? "rgba(244, 67, 54, 0.2)"
                        : "#2F283A",
                      borderColor: tagsError ? "#f44336" : "#9B85E1",
                    },
                    "& > *": {
                      // Apply to all direct children
                      margin: tags.length === 0 ? "0" : "0.15rem",
                    },
                  }}
                >
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleDeleteTag(tag)}
                      sx={{
                        backgroundColor: allSubjects.includes(tag)
                          ? "#4D18E8 !important"
                          : "#2A2636 !important",
                        color: "#E2DDF3",
                        width: "fit-content",
                        height: "fit-content",
                        padding: "0.4rem",
                        borderRadius: "0.6rem",
                        margin: "0.15rem",
                        "& .MuiChip-deleteIcon": { color: "#E2DDF3" },
                      }}
                    />
                  ))}

                  {tags.length < MAX_TAGS && (
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        id="tags"
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          setSearchQuery(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && inputValue.trim()) {
                            e.preventDefault();
                            if (!tags.includes(inputValue.trim())) {
                              handleAddTag([...tags, inputValue.trim()]);
                            }
                            setInputValue("");
                            setSearchQuery("");
                          }
                        }}
                        placeholder={tags.length > 0 ? "" : "Add a tag here..."}
                        style={{
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          width: inputValue
                            ? `${inputValue.length * 8 + 8}px`
                            : tags.length > 0
                            ? "ch"
                            : "14ch",
                          color: "#E2DDF3",
                          fontSize: "1rem",
                          padding: "4px",
                          margin: 0,
                          textAlign: "left",
                          cursor: "text",
                          caretColor: "#E2DDF3",
                        }}
                        className="tag-input-placeholder"
                      />
                      {inputValue && filteredSubjects.length > 0 && (
                        <Paper
                          sx={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            width: "200px", // Set fixed width
                            mt: 1,
                            maxHeight: "200px",
                            overflow: "auto",
                            backgroundColor: "#2A2636",
                            color: "#E2DDF3",
                            border: "1px solid #3B354D",
                            borderRadius: "0.8rem",
                            zIndex: 1000,
                            "&::-webkit-scrollbar": {
                              width: "8px",
                            },
                            "&::-webkit-scrollbar-track": {
                              background: "transparent",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "#382e53",
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                              backgroundColor: "#261d3f",
                            },
                          }}
                        >
                          {filteredSubjects.map((subject, index) => (
                            <Box
                              key={index}
                              onClick={() => {
                                if (!tags.includes(subject)) {
                                  handleAddTag([...tags, subject]);
                                }
                                setInputValue("");
                                setSearchQuery("");
                              }}
                              sx={{
                                padding: "8px 16px",
                                cursor: "pointer",
                                width: "auto",
                                "&:hover": {
                                  backgroundColor: "#3B354D",
                                },
                                borderBottom:
                                  index < filteredSubjects.length - 1
                                    ? "1px solid #3B354D"
                                    : "none",
                              }}
                            >
                              <Typography variant="body2">{subject}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </Box>
                  )}
                </Box>
                {/* Tag counters */}

                {tags.length > 0 && (
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 0,
                      marginTop: "0.5rem",
                      clear: "both",
                    }}
                  >
                    <Stack direction="row" spacing={2}>
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            tags.length >= MAX_TAGS ? "#E57373" : "#6F658D",
                          transition: "color 0.3s ease-in-out",
                          fontSize: "0.75rem",
                          textAlign: "left",
                        }}
                      >
                        {tags.length}/{MAX_TAGS} total tags
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            customTagsCount >= MAX_CUSTOM_TAGS
                              ? "#E57373"
                              : "#6F658D",
                          transition: "color 0.3s ease-in-out",
                          fontSize: "0.75rem",
                          textAlign: "left",
                        }}
                      >
                        {customTagsCount}/{MAX_CUSTOM_TAGS} custom tags
                      </Typography>
                    </Stack>
                  </Box>
                )}
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
              <Stack
                direction="row" // Changed from responsive to always row
                spacing={2}
                alignItems="center" // Always center aligned
                flexWrap={{ xs: "wrap", sm: "nowrap" }} // Added flexWrap for mobile
                sx={{ gap: { xs: 2, sm: 2 } }} // Maintain gap on wrap
              >
                <Button
                  variant="outlined"
                  sx={{
                    borderRadius: "0.8rem",
                    paddingX: { xs: "1rem", sm: "2rem" },
                    display: "flex",
                    width: "auto", // Changed from responsive width
                    justifyContent: "center",
                    color: "#3B354D",
                    height: { xs: "2.5rem", sm: "2.8rem" },
                    border: "0.15rem solid #3B354D",
                    textTransform: "none",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.03)",
                      borderColor: "#9F9BAE",
                      color: "#E2DDF3",
                    },
                  }}
                  onClick={handleOpenScanModal}
                >
                  Scan Notes
                </Button>
                <Box flex={1} />
                <Box sx={{ width: "auto" }}>
                  {" "}
                  {/* Changed from responsive width */}
                  <Filter
                    menuItems={[
                      { value: "0", label: "Private" },
                      { value: "1", label: "Public" },
                    ]}
                    value={visibility}
                    onChange={handleVisibilityChange}
                    hoverOpen={true}
                  />
                </Box>
              </Stack>
            </Box>

            {/* Items */}
            <Box>
              <Stack
                spacing={2}
                sx={{
                  border: "none",
                  borderRadius: "0.8rem",
                  backgroundColor: "transparent",
                }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <SortableItem
                            id={item.id}
                            item={item}
                            deleteItem={() => handleDeleteItem(item.id)}
                            updateItem={(field, value) =>
                              handleUpdateItem(item.id, field, value)
                            }
                            isError={emptyItemIds.includes(item.id)}
                            isTermError={emptyTerms.includes(item.id)}
                            isDefinitionError={emptyDefinitions.includes(
                              item.id
                            )}
                            key={item.id}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </SortableContext>
                </DndContext>

                <Button
                  id="add-new-item-button"
                  variant="outlined"
                  sx={{
                    borderRadius: "0.8rem",
                    padding: { xs: "0.5rem 1rem", sm: "0.6rem 2rem" },
                    display: "flex",
                    width: "100%",
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    justifyContent: "center",
                    color: itemsError ? "#f44336" : "#3B354D",
                    border: `2px solid ${itemsError ? "#f44336" : "#3B354D"}`,
                    backgroundColor: itemsError
                      ? "rgba(244, 67, 54, 0.08)"
                      : "transparent",
                    textTransform: "none",
                    bottom: 0,
                    transform: "scale(1)",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.005)",
                      borderColor: itemsError ? "#f44336" : "#9F9BAE",
                      color: itemsError ? "#f44336" : "#E2DDF3",
                    },
                  }}
                  onClick={handleAddItem}
                  className={itemsError ? "error-highlight-animation" : ""}
                >
                  Add New Item
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </PageTransition>
      {/* Scan Notes Modal */}
      <Modal
        open={scanModalOpen}
        onClose={handleCloseScanModal}
        aria-labelledby="scan-notes-modal"
        aria-describedby="modal-to-scan-and-process-notes"
      >
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600, // Increased width for better UI
            maxWidth: "95%",
            bgcolor: "#292639",
            boxShadow: 24,
            p: 4,
            borderRadius: "0.8rem",
            outline: "none",
            maxHeight: "80vh", // Reduced from 90vh
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Hide overflow on the container
          }}
        >
          {/* Header - stays fixed */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              width: "100%",
            }}
          >
            <Typography variant="h6" component="h2" sx={{ color: "#E2DDF3" }}>
              Extract Text from Files
            </Typography>
            <IconButton
              onClick={handleCloseScanModal}
              sx={{ color: "#E2DDF3" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Scrollable content area */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: "auto",
              mb: 2,
              pr: 1, // Right padding for scrollbar
              mr: -1, // Compensate for padding
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#382e53",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#261d3f",
              },
            }}
          >
            <Typography variant="body2" sx={{ mb: 1, color: "#9F9BAE" }}>
              Upload up to 5 files (max 10MB each) in JPG, PNG, or PDF format.
              We'll use OCR to extract text and AI to identify terms and
              definitions.
            </Typography>

            <Typography
              variant="body2"
              sx={{ mb: 1, color: "#A38CE6", fontWeight: "bold" }}
            >
              Multiple files are processed in order - ideal for multi-page
              notes!
            </Typography>

            {/* Add informational section about PDFs */}
            <Box
              sx={{
                mb: 3,
                backgroundColor: "#3B354D",
                p: 2,
                borderRadius: "0.5rem",
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "#E2DDF3", mb: 1 }}>
                File Type Tips:
              </Typography>
              <Typography variant="body2" sx={{ color: "#9F9BAE", mb: 0.5 }}>
                • <b>Images (JPG/PNG)</b>: Best for handwritten notes and
                diagrams
              </Typography>
              <Typography variant="body2" sx={{ color: "#9F9BAE", mb: 0.5 }}>
                • <b>PDFs</b>: Ideal for digital documents, textbooks, and typed
                notes
              </Typography>
              <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                For best results with PDFs, ensure they contain actual text
                rather than scanned images.
              </Typography>
            </Box>

            {/* File Upload Area */}
            <Box
              sx={{
                border: "2px dashed #675D84",
                borderRadius: "1rem",
                p: 3,
                textAlign: "center",
                mb: 3,
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "#4A435C",
                  borderColor: "#A38CE6",
                },
              }}
              onClick={() => document.getElementById("file-upload")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileChange}
            >
              <input
                type="file"
                id="file-upload"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple // Enable multiple file selection
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <CloudUploadIcon sx={{ fontSize: 48, color: "#A38CE6", mb: 1 }} />

              {uploadedFiles.length > 0 ? (
                <Typography variant="body1" sx={{ color: "#E2DDF3", mt: 1 }}>
                  {uploadedFiles.length}{" "}
                  {uploadedFiles.length === 1 ? "file" : "files"} selected
                </Typography>
              ) : (
                <>
                  <Typography variant="body1" sx={{ color: "#E2DDF3", mt: 1 }}>
                    Drag & drop or click to upload multiple files
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#9F9BAE", mt: 0.5 }}
                  >
                    JPG, PNG, PDF files accepted (max 5 files, 10MB each)
                  </Typography>
                </>
              )}
            </Box>

            {/* Show selected files */}
            {uploadedFiles.length > 0 && (
              <Box
                sx={{
                  mb: 3,
                  backgroundColor: "#3B354D",
                  borderRadius: "0.5rem",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#A38CE6",
                    pt: 1.5,
                    pb: 1,
                    px: 2,
                    borderBottom: "1px solid #4A435C",
                    fontWeight: "500",
                  }}
                >
                  Selected Files:
                </Typography>
                <Box sx={{ p: 1.5 }}>
                  {uploadedFiles.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: "0.5rem",
                        mb: index === uploadedFiles.length - 1 ? 0 : 1,
                        backgroundColor: "#342D46",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "#3F3853",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          overflow: "hidden",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#E2DDF3",
                            mr: 1,
                            minWidth: "1.5rem",
                            fontWeight: "500",
                          }}
                        >
                          {index + 1}.
                        </Typography>
                        {/* Show PDF icon for PDFs */}
                        {file.type === "application/pdf" ? (
                          <Box
                            component="span"
                            sx={{
                              color: "#ff5252",
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              fontWeight: "medium",
                            }}
                          >
                            [PDF]
                          </Box>
                        ) : (
                          <Box
                            component="span"
                            sx={{
                              color: "#A38CE6",
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              fontWeight: "medium",
                            }}
                          ></Box>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#E2DDF3",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flexGrow: 1,
                            maxWidth: "240px",
                          }}
                        >
                          {file.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#9F9BAE",
                            ml: 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        sx={{
                          color: "#9F9BAE",
                          ml: 1,
                          "&:hover": {
                            color: "#E2DDF3",
                            backgroundColor: "rgba(255,255,255,0.1)",
                          },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Processing progress if active */}
            {isProcessing && (
              <Box sx={{ width: "100%", mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#E2DDF3", mb: 1 }}>
                  Processing {uploadedFiles.length}{" "}
                  {uploadedFiles.length === 1 ? "file" : "files"}...
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#3B354D",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#A38CE6",
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "#9F9BAE", mt: 0.5, textAlign: "right" }}
                >
                  {uploadProgress}%
                </Typography>
              </Box>
            )}
          </Box>

          {/* Footer with button - stays fixed */}
          <Button
            variant="contained"
            fullWidth
            disabled={
              uploadedFiles.length === 0 ||
              isProcessing ||
              (!isPremium && (!user?.tech_pass || user.tech_pass <= 0))
            }
            onClick={() => {
              // Double-check tech pass availability right before processing
              if (!isPremium && (!user?.tech_pass || user?.tech_pass <= 0)) {
                handleShowSnackbar(
                  "You need a Tech Pass to use the scanning feature. Purchase Tech Passes from the shop or upgrade to Premium."
                );
                return;
              }
              handleProcessFile();
            }}
            sx={{
              backgroundColor:
                isPremium || (user?.tech_pass && user.tech_pass > 0)
                  ? "#4D18E8"
                  : "#3B354D",
              color:
                isPremium || (user?.tech_pass && user.tech_pass > 0)
                  ? "#E2DDF3"
                  : "#9F9BAE",
              borderRadius: "0.8rem",
              padding: "0.8rem",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor:
                  isPremium || (user?.tech_pass && user.tech_pass > 0)
                    ? "#6939FF"
                    : "#3B354D",
                transform:
                  isPremium || (user?.tech_pass && user.tech_pass > 0)
                    ? "scale(1.02)"
                    : "scale(1)",
              },
              "&.Mui-disabled": {
                backgroundColor: "#3B354D",
                color: "#9F9BAE",
              },
            }}
          >
            {isProcessing ? (
              <>
                <CircularProgress size={24} sx={{ color: "#E2DDF3", mr: 1 }} />
                Processing...
              </>
            ) : isPremium || (user?.tech_pass && user.tech_pass > 0) ? (
              <>
                Generate cards from{" "}
                {uploadedFiles.length > 0 ? uploadedFiles.length : ""}
                {uploadedFiles.length === 1 ? " File" : " Files"}
                {!isPremium && (
                  <span className="ml-2 text-[#A38CE6] font-medium">
                    (Uses 1 Tech Pass)
                  </span>
                )}
              </>
            ) : (
              <>
                Generate cards
                <span className="ml-2 text-[#8b6d8d] font-medium">
                  (No Tech Pass Available)
                </span>
              </>
            )}
          </Button>
        </Paper>
      </Modal>
      <AutoHideSnackbar
        message={snackbarMessage}
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
      />
      {/* Saving overlay */}
      <Modal
        open={isSaving}
        aria-labelledby="saving-modal"
        aria-describedby="modal-showing-saving-progress"
        disableAutoFocus
        disableEnforceFocus
        disableEscapeKeyDown
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "#120F1B",
            boxShadow: 24,
            p: 4,
            borderRadius: "0.8rem",
            outline: "none",
            textAlign: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <img src={CauldronIcon} alt="" className="w-32 h-auto" />
          <Typography variant="h6" sx={{ color: "#E2DDF3", mb: 1 }}>
            {editMode ? "Updating" : "Saving"} Your Study Material
          </Typography>
        </Box>
      </Modal>
      {/* PDF Confirmation Dialog */}
      <Dialog
        open={pdfConfirmationOpen && !isPremium} // Only show for non-premium users
        onClose={() => handlePdfConfirmation(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#120F1B",
            borderRadius: "0.8rem",
            border: "2px solid #3B354D",
            maxWidth: "500px",
          },
        }}
      >
        <DialogTitle
          sx={{ color: "#E2DDF3", borderBottom: "1px solid #3B354D" }}
        >
          PDF Processing Notice
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ color: "#E2DDF3", mb: 2 }}>
            The PDF you uploaded has {pdfPageCount} pages. Since it has more
            than 5 pages, it will require additional Tech Passes to process.
          </Typography>
          <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
            Tech Passes required: {Math.ceil(pdfPageCount / 5)} (1 Tech Pass per
            5 pages)
          </Typography>
          <Typography variant="body2" sx={{ color: "#E57373", mt: 1 }}>
            You currently have {user?.tech_pass || 0} Tech Passes available.
          </Typography>
          <Typography variant="body2" sx={{ color: "#A38CE6", mt: 1 }}>
            Note: Premium users can process PDFs of any size without using Tech
            Passes.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #3B354D" }}>
          <Button
            onClick={() => handlePdfConfirmation(false)}
            sx={{
              color: "#E2DDF3",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handlePdfConfirmation(true)}
            disabled={user?.tech_pass < Math.ceil(pdfPageCount / 5)}
            sx={{
              backgroundColor: "#4D18E8",
              color: "#E2DDF3",
              borderRadius: "0.8rem",
              "&:hover": { backgroundColor: "#6939FF" },
              "&.Mui-disabled": {
                backgroundColor: "#3B354D",
                color: "#9F9BAE",
              },
            }}
          >
            Process PDF
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add the modal component at the bottom of your JSX, before the closing tag */}
      <SelectStudyMaterialModal
        open={selectMaterialModalOpen}
        handleClose={handleCloseModal}
        mode={selectedMode}
        isLobby={false}
        onMaterialSelect={handleMaterialSelect}
        onModeSelect={handleModeSelect}
        selectedTypes={selectedTypes}
        newMaterialId={newMaterialId}
      />
    </>
  );
};

export default CreateStudyMaterial;
