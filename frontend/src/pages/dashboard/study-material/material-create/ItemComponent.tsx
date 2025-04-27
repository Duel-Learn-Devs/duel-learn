import { FC, useState, useEffect } from "react";
import {
  Box,
  Stack,
  Button,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
  Divider,
  Fab,
  Typography,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicatorRounded";
import AddPhotoIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import DeleteIcon from "@mui/icons-material/DeleteRounded";
import RemovePhotoIcon from "@mui/icons-material/HighlightOffRounded";
import VerifiedIcon from "@mui/icons-material/VerifiedOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { motion, AnimatePresence } from "framer-motion";
import { ItemComponentProps } from "../types/itemComponent";
import { useUser } from "../../../../contexts/UserContext"; // Import the useUser hook
import "./errorHighlight.css";

const MAX_TERM_LENGTH = 50; // Define max term length
const MAX_DEFINITION_LENGTH = 200; // Define max definition length

const ItemComponent: FC<ItemComponentProps> = ({
  item,
  deleteItem,
  updateItem,
  dragHandleProps,
  isDragging,
  isError = false, // Add this line to destructure the prop with default value
}) => {
  const { user, updateUser } = useUser();
  const isPremium = user?.account_type === "premium";

  // Add MUI theme and media query to detect mobile view
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Add a state to track grabbing state
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Add states for AI cross-referencing
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<{
    isAccurate: boolean | null;
    accuracyScore: number;
    assessment: string;
    incorrectParts: string[];
    suggestedCorrections: string[];
    missingKeywords: string[];
    suggestedAdditions: string[];
  } | null>(null);
  const [showFactCheckDetails, setShowFactCheckDetails] = useState(false);
  const [scanningEffect, setScanningEffect] = useState(false);
  const [factCheckError, setFactCheckError] = useState<string | null>(null);

  const [previewSrc, setPreviewSrc] = useState<string | null>(
    typeof item.image === "string"
      ? item.image
      : item.image instanceof File
      ? URL.createObjectURL(item.image)
      : null
  );

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isDeductingTechPass, setIsDeductingTechPass] = useState(false);

  // Replace your existing resizeTextarea function with this enhanced version:

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    // Store the current scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Reset height first to correctly calculate new height
    textarea.style.height = "auto";

    // Calculate new height based on scrollHeight
    const newHeight = textarea.scrollHeight;

    // Apply the new height
    textarea.style.height = `${newHeight}px`;

    // For mobile view, ensure the width is properly constrained
    if (isMobile) {
      // Setting width to 100% and box-sizing to border-box ensures
      // the textarea respects the container boundaries
      textarea.style.width = "100%";
      textarea.style.boxSizing = "border-box";
      textarea.style.maxWidth = "100%"; // Ensure it doesn't overflow

      // Additional reset for any potentially problematic styles
      textarea.style.minWidth = "0";
    }

    // Restore scroll position (prevents page jumping)
    window.scrollTo(0, scrollTop);
  };

  const handleAddPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPreviewSrc(base64String);
          updateItem("image", base64String);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleDeleteImage = () => {
    setPreviewSrc(null);
    updateItem("image", null); // Remove image from state
  };

  // Add functions to handle grab and release
  const handleGrabStart = () => setIsGrabbing(true);
  const handleGrabEnd = () => setIsGrabbing(false);

  // Handle fact checking
  const handleFactCheck = async () => {
    // Reset previous results
    setFactCheckResult(null);
    setFactCheckError(null);
    setShowFactCheckDetails(false);

    // Validate if we have enough content to check
    if (!item.term.trim() || item.term.length < 2) {
      setFactCheckError("Please enter a valid term first");
      return;
    }

    if (!item.definition.trim() || item.definition.split(/\s+/).length < 5) {
      setFactCheckError("Definition is too short for basic fact-checking");
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const handleConfirmFactCheck = async () => {
    setShowConfirmationModal(false);
    setIsDeductingTechPass(true);
    setScanningEffect(true);

    try {
      // For premium users, skip tech pass deduction
      if (!isPremium) {
        // First, deduct tech pass
        const deductResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/shop/deduct-tech-pass`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firebase_uid: user?.firebase_uid,
            }),
          }
        );

        const deductResult = await deductResponse.json();

        if (!deductResult.success) {
          throw new Error(
            deductResult.message === "Insufficient tech passes"
              ? `You need at least 1 Tech Pass to use this feature. You currently have ${deductResult.currentTechPasses || 0} Tech Passes.`
              : deductResult.message || "Failed to deduct tech pass"
          );
        }

        // Update user's tech pass count
        if (deductResult.remainingTechPasses !== undefined) {
          updateUser({
            ...user,
            tech_pass: deductResult.remainingTechPasses,
          });
        }
      }

      // Then proceed with fact checking
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/openai/cross-reference-definition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            term: item.term,
            definition: item.definition,
            tags: item.tags || [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to check definition");
      }

      // Add a slight delay to make the scanning effect more noticeable
      setTimeout(() => {
        setFactCheckResult(data);
        setScanningEffect(false);
        setIsFactChecking(false);
        // Automatically show details if there are issues
        if (!data.isAccurate && data.incorrectParts && data.incorrectParts.length > 0) {
          setShowFactCheckDetails(true);
        }
      }, 1200);
    } catch (error) {
      console.error("Error during fact checking:", error);
      setFactCheckError(
        error instanceof Error ? error.message : "Failed to check definition"
      );
      setScanningEffect(false);
      setIsFactChecking(false);
    } finally {
      setIsDeductingTechPass(false);
    }
  };

  // Apply a specific correction
  const handleApplySpecificCorrection = (index: number) => {
    if (
      factCheckResult &&
      factCheckResult.incorrectParts &&
      factCheckResult.suggestedCorrections &&
      index < factCheckResult.incorrectParts.length &&
      index < factCheckResult.suggestedCorrections.length
    ) {
      const incorrectPart = factCheckResult.incorrectParts[index];
      const correction = factCheckResult.suggestedCorrections[index];

      // Use a more precise replacement approach to maintain context
      // This ensures we only replace the exact incorrect part, not the surrounding context
      const newDefinition = item.definition.replace(
        new RegExp(`\\b${escapeRegExp(incorrectPart)}\\b`, "i"), // Case insensitive, word boundary match
        correction
      );

      updateItem("definition", newDefinition);

      // Trigger resize after a short delay to ensure the DOM has updated
      setTimeout(() => {
        const textarea = document.getElementById('definition') as HTMLTextAreaElement;
        if (textarea) {
          resizeTextarea(textarea);
        }
      }, 0);

      // Reset fact check results after applying a correction
      setFactCheckResult(null);
    }
  };

  // Apply a missing keyword addition
  const handleApplyMissingKeyword = (index: number) => {
    console.log('Applying missing keyword:', {
      index,
      factCheckResult,
      currentDefinition: item.definition
    });

    if (
      factCheckResult &&
      factCheckResult.missingKeywords &&
      factCheckResult.suggestedAdditions &&
      index < factCheckResult.missingKeywords.length &&
      index < factCheckResult.suggestedAdditions.length
    ) {
      const suggestion = factCheckResult.suggestedAdditions[index];

      console.log('Processing suggestion:', {
        suggestion,
        currentDefinition: item.definition
      });

      // Use the complete suggested definition directly
      const newDefinition = suggestion;

      if (newDefinition) {
        console.log('New definition:', newDefinition);
        
        // Update the definition in the parent component
        updateItem("definition", newDefinition);
        
        // Trigger resize after a short delay to ensure the DOM has updated
        setTimeout(() => {
          const textarea = document.getElementById('definition') as HTMLTextAreaElement;
          if (textarea) {
            resizeTextarea(textarea);
          }
        }, 0);
        
        // Reset fact check results
        setFactCheckResult(null);
        setShowFactCheckDetails(false);
      } else {
        console.warn('Failed to generate new definition');
      }
    } else {
      console.warn('Invalid fact check result or index:', {
        hasResult: !!factCheckResult,
        missingKeywords: factCheckResult?.missingKeywords,
        suggestedAdditions: factCheckResult?.suggestedAdditions,
        index
      });
    }
  };

  // Helper function to escape special characters in regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Reset fact check results
  const handleResetFactCheck = () => {
    setFactCheckResult(null);
    setFactCheckError(null);
  };

  // Determine the border class based on the current state
  const getBorderClass = () => {
    if (isDragging) return "ring-[0.1rem] ring-[#A38CE6] border-[#A38CE6]";
    if (isGrabbing) return "border-[#A38CE6] z-10";
    if (isError) return "border-[#f44336] error-highlight-animation"; // Add error styling
    return "border-[#3B354D] hover:border-[#9F9BAE]";
  };

  // Get color for fact check score indicator
  const getScoreColor = (score: number) => {
    if (score >= 90) return "#4CAF50"; // Green for high accuracy
    if (score >= 70) return "#8BC34A"; // Light green for good accuracy
    return "#FF9800"; // Orange for issues found
  };

  // Get badge text for fact check result
  const getAccuracyBadgeText = (isAccurate: boolean | null, score: number) => {
    if (isAccurate === null) return "Needs Detail";
    if (isAccurate) {
      if (score >= 90) return "No Issues";
      return "Minor Issues";
    }
    return "Review Needed";
  };

  return (
    <Box
      id={`item-${item.id}`} // Add an ID for targeting with scroll
      className={`bg-[#080511] rounded-[0.8rem] border-2 ${getBorderClass()} w-full transition-colors duration-300 ease-in-out ${
        isMobile ? "relative cursor-grab active:cursor-grabbing" : ""
      }`}
      {...(isMobile ? dragHandleProps : {})}
    >
      <Stack spacing={1} direction={"row"} className="flex">
        {/* Drag Indicator with Item Number - Hidden on mobile */}
        {!isMobile && (
          <Box
            className={`flex items-center rounded-tl-[0.6rem] rounded-bl-[0.8rem] border-[#211D2F] ${
              isGrabbing ? "bg-[#3B354D]" : "bg-[#211D2F]"
            } w-auto border transition-colors duration-200`}
            {...dragHandleProps?.attributes}
          >
            <Button
              className="h-full"
              sx={{
                cursor: isGrabbing ? "grabbing" : "grab",
                color: isGrabbing ? "#3B354D" : "inherit",
                "&:active": { cursor: "grabbing", color: "#3B354D" },
                "&:hover": { color: "#6C63FF" },
                "& .MuiTouchRipple-root": { color: "#3B354D" },
                transition: "all 0.2s ease",
              }}
              {...dragHandleProps?.listeners}
              onMouseDown={handleGrabStart}
              onMouseUp={handleGrabEnd}
              onMouseLeave={handleGrabEnd} // In case the user drags out of the button
              onTouchStart={handleGrabStart}
              onTouchEnd={handleGrabEnd}
            >
              <DragIndicatorIcon
                className={isGrabbing ? "text-[#A38CE6]" : "text-[#3B354D]"}
              />
            </Button>
          </Box>
        )}

        {/* Terms and Definition */}
        <Stack
          spacing={2}
          className={`py-4 sm:py-6 ${
            isMobile ? "px-4" : "pr-4 sm:pr-8 pl-3 sm:pl-5"
          } w-full ${isMobile ? "rounded-[0.8rem]" : ""}`}
        >
          {/* Item number for mobile - Shown at the top on mobile */}
          {isMobile && (
            <p className="text-[#9F9BAE] font-bold text-[0.9rem]">
              No. {item.item_number}
            </p>
          )}

          <Stack spacing={2} className="w-full">
            {/* Image */}
            {previewSrc && (
              <AnimatePresence>
                <motion.div
                  key="photo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box className="relative flex justify-center items-center w-full rounded-[0.8rem]">
                    <img
                      src={previewSrc}
                      alt="Uploaded"
                      className=" max-w-full w-full h-auto max-h-[250px] object-contain"
                    />

                    <Tooltip title="Remove Photo" placement="top" arrow>
                      <Fab
                        size="small"
                        color="secondary"
                        aria-label="delete"
                        onClick={handleDeleteImage}
                        sx={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          color: "#3B354D",
                          backgroundColor: "inherit",
                          padding: "0.3rem",
                          transition: "all 0.3s ease-in-out",
                          "&:hover": {
                            backgroundColor: "#080511",
                            color: "#CD171A",
                            scale: 1.1,
                          },
                        }}
                      >
                        <RemovePhotoIcon />
                      </Fab>
                    </Tooltip>
                  </Box>
                </motion.div>
              </AnimatePresence>
            )}

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 2 }}
              className="flex items-start w-full"
            >
              <Stack className="w-full sm:w-1/3 min-w-0">
                {" "}
                {/* added min-w-0 to prevent overflow */}
                <textarea
                  id="term"
                  className="border-none outline-none bg-[#3B354D] hover:bg-[#564e70] focus:bg-[#4A4361] text-[#E2DDF3] resize-none w-full content-stretch text-[1rem] py-2 px-4 text-left rounded-[0.8rem] overflow-hidden transition-all ease-in-out duration-200 box-border"
                  rows={1}
                  placeholder="Term"
                  onInput={(e) =>
                    resizeTextarea(e.target as HTMLTextAreaElement)
                  }
                  value={item.term}
                  onChange={(e) => {
                    updateItem("term", e.target.value);
                    // Reset fact check when term changes
                    if (factCheckResult) {
                      handleResetFactCheck();
                    }
                  }}
                />
                {item.term.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        item.term.length >= MAX_TERM_LENGTH
                          ? "#E57373"
                          : "#6F658D",
                      transition: "color 0.3s ease-in-out",
                      fontSize: "0.75rem",
                      textAlign: "left",
                      marginTop: "0.8rem",
                    }}
                  >
                    {item.term.length}/{MAX_TERM_LENGTH} characters
                  </Typography>
                )}
              </Stack>

              <Stack className="w-full sm:w-2/3 min-w-0">
                {" "}
                {/* added min-w-0 to prevent overflow */}
                <div className="relative w-full">
                  <textarea
                    id="definition"
                    className={`border-none outline-none bg-[#3B354D] hover:bg-[#564e70] focus:bg-[#4A4361] text-[#E2DDF3] resize-none w-full content-stretch text-[1rem] py-2 px-4 text-left rounded-[0.8rem] overflow-hidden transition-colors duration-200 box-border ${
                      scanningEffect ? "opacity-80" : ""
                    }`}
                    rows={1}
                    placeholder="Definition"
                    onInput={(e) =>
                      resizeTextarea(e.target as HTMLTextAreaElement)
                    }
                    value={item.definition}
                    onChange={(e) => {
                      updateItem("definition", e.target.value);
                      // Reset fact check when definition changes
                      if (factCheckResult) {
                        handleResetFactCheck();
                      }
                    }}
                  />

                  {/* Scanning effect overlay */}
                  {scanningEffect && (
                    <motion.div
                      className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-[0.8rem] overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                    >
                      <motion.div
                        className="w-full h-[1px] bg-[#A38CE6] absolute top-0 left-0"
                        initial={{ top: 0 }}
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "linear",
                        }}
                      />
                      <div className="absolute top-0 left-0 w-full h-full bg-[#4D18E8] opacity-10" />
                    </motion.div>
                  )}
                </div>
                <Box flex={1} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 0.5,
                  }}
                >
                  {item.definition.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          item.definition.length >= MAX_DEFINITION_LENGTH
                            ? "#E57373"
                            : "#6F658D",
                        transition: "color 0.3s ease-in-out",
                        fontSize: "0.75rem",
                        textAlign: "right",
                        marginTop: "0.2rem",
                      }}
                    >
                      {item.definition.length}/{MAX_DEFINITION_LENGTH}{" "}
                      characters
                    </Typography>
                  )}

                  {/* Fact check button */}
                </Box>
                {/* Fact Check Details Section */}
                <AnimatePresence>
                  {showFactCheckDetails && factCheckResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        sx={{
                          mt: 1,
                          p: 1.5,
                          borderRadius: "0.8rem",
                          bgcolor: "#211D2F",
                          border: "1px solid #3B354D",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#E2DDF3",
                            fontWeight: "medium",
                            display: "block",
                            mb: 1,
                          }}
                        >
                          {factCheckResult.assessment}
                        </Typography>

                        {factCheckResult.isAccurate && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#9F9BAE",
                              display: "block",
                              fontStyle: "italic",
                              mt: 0.5,
                            }}
                          >
                            Your definition looks good!
                          </Typography>
                        )}

                        {factCheckResult.incorrectParts &&
                          factCheckResult.incorrectParts.length > 0 && (
                            <>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#A38CE6",
                                  display: "block",
                                  mt: 1,
                                  mb: 0.5,
                                }}
                              >
                                Potential Issues:
                              </Typography>
                              {factCheckResult.incorrectParts.map(
                                (incorrectPart, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      mb:
                                        index ===
                                        factCheckResult.incorrectParts.length -
                                          1
                                          ? 0
                                          : 1,
                                      p: 1,
                                      bgcolor: "rgba(0,0,0,0.15)",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        mb: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "#FF9800", flexShrink: 0 }}
                                      >
                                        Incorrect:
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "#FF9800", ml: 1 }}
                                      >
                                        "{incorrectPart}"
                                      </Typography>
                                    </Box>

                                    {factCheckResult.suggestedCorrections &&
                                      factCheckResult.suggestedCorrections[
                                        index
                                      ] && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            mb: 0.5,
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "#4CAF50",
                                              flexShrink: 0,
                                            }}
                                          >
                                            Replace with:
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            sx={{ color: "#4CAF50", ml: 1 }}
                                          >
                                            "
                                            {
                                              factCheckResult
                                                .suggestedCorrections[index]
                                            }
                                            "
                                          </Typography>
                                        </Box>
                                      )}

                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() =>
                                        handleApplySpecificCorrection(index)
                                      }
                                      sx={{
                                        borderColor: "#A38CE6",
                                        color: "#A38CE6",
                                        textTransform: "none",
                                        fontSize: "0.7rem",
                                        padding: "0.1rem 0.5rem",
                                        minHeight: 0,
                                        mt: 0.5,
                                        "&:hover": {
                                          borderColor: "#E2DDF3",
                                          color: "#E2DDF3",
                                          backgroundColor:
                                            "rgba(163, 140, 230, 0.08)",
                                        },
                                      }}
                                    >
                                      Apply Suggestion
                                    </Button>
                                  </Box>
                                )
                              )}
                            </>
                          )}

                        {factCheckResult.missingKeywords &&
                          factCheckResult.missingKeywords.length > 0 && 
                          factCheckResult.suggestedAdditions && 
                          factCheckResult.missingKeywords.some((_, index) => factCheckResult.suggestedAdditions[index]) && (
                            <>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#A38CE6",
                                  display: "block",
                                  mt: 2,
                                  mb: 0.5,
                                }}
                              >
                                Missing Crucial Keywords:
                              </Typography>
                              {factCheckResult.missingKeywords.map((keyword, index) => (
                                // Only render if there's a corresponding suggestion
                                factCheckResult.suggestedAdditions[index] && (
                                  <Box
                                    key={index}
                                    sx={{
                                      mb: index === factCheckResult.missingKeywords.length - 1 ? 0 : 1,
                                      p: 1,
                                      bgcolor: "rgba(0,0,0,0.15)",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        mb: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "#FF9800", flexShrink: 0 }}
                                      >
                                        Missing:
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "#FF9800", ml: 1 }}
                                      >
                                        "{keyword}"
                                      </Typography>
                                    </Box>

                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        mb: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "#4CAF50",
                                          flexShrink: 0,
                                        }}
                                      >
                                        Suggested Addition:
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "#4CAF50", ml: 1 }}
                                      >
                                        "{factCheckResult.suggestedAdditions[index]}"
                                      </Typography>
                                    </Box>

                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleApplyMissingKeyword(index)}
                                      sx={{
                                        borderColor: "#A38CE6",
                                        color: "#A38CE6",
                                        textTransform: "none",
                                        fontSize: "0.7rem",
                                        padding: "0.1rem 0.5rem",
                                        minHeight: 0,
                                        mt: 0.5,
                                        "&:hover": {
                                          borderColor: "#E2DDF3",
                                          color: "#E2DDF3",
                                          backgroundColor: "rgba(163, 140, 230, 0.08)",
                                        },
                                      }}
                                    >
                                      Apply Addition
                                    </Button>
                                  </Box>
                                )
                              ))}
                            </>
                          )}

                        <Typography
                          variant="caption"
                          sx={{
                            color: "#9F9BAE",
                            display: "block",
                            fontStyle: "italic",
                            mt: 1,
                            fontSize: "0.7rem",
                          }}
                        >
                          These suggestions only fix clearly incorrect parts and
                          add missing crucial keywords to your definition. Your
                          original phrasing and style will be preserved with
                          minimal changes.
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Stack>
            </Stack>
          </Stack>

          {/* Buttons for Image and Delete */}
          <Stack
            direction={"row"}
            spacing={1}
            className="flex items-center justify-end w-full"
          >
            {/* Show item number for desktop */}
            {!isMobile && (
              <Typography
                variant="body2"
                sx={{
                  color: "#9F9BAE",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  marginRight: "auto",
                }}
              >
                No. {item.item_number}
              </Typography>
            )}

            <Box flex={1} />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {factCheckError && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#F44336",
                    mr: 1,
                    fontSize: "0.75rem",
                  }}
                >
                  {factCheckError}
                </Typography>
              )}

              {factCheckResult && (
                <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                  <Tooltip title={factCheckResult.assessment} arrow>
                    <Box
                      onClick={() =>
                        setShowFactCheckDetails(!showFactCheckDetails)
                      }
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        bgcolor: "rgba(0,0,0,0.1)",
                        px: 1,
                        py: 0.2,
                        borderRadius: 1,
                      }}
                    >
                      {factCheckResult.isAccurate ? (
                        <VerifiedIcon
                          sx={{
                            fontSize: "16px",
                            mr: 0.5,
                            color: getScoreColor(factCheckResult.accuracyScore),
                          }}
                        />
                      ) : (
                        <ErrorOutlineIcon
                          sx={{
                            fontSize: "16px",
                            mr: 0.5,
                            color: getScoreColor(factCheckResult.accuracyScore),
                          }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: getScoreColor(factCheckResult.accuracyScore),
                          fontWeight: "medium",
                        }}
                      >
                        {getAccuracyBadgeText(
                          factCheckResult.isAccurate,
                          factCheckResult.accuracyScore
                        )}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              )}
            </Box>

            <Tooltip
              title={isFactChecking ? "Checking..." : "AI Fact Check"}
              arrow
              placement="bottom"
            >
              <IconButton
                onClick={handleFactCheck}
                disabled={isFactChecking}
                sx={{
                  color: "#3B354D",
                  padding: "0.3rem",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#080511",
                    color: "#E2DDF3",
                    scale: 1.1,
                  },
                }}
              >
                {isFactChecking ? (
                  <CircularProgress size={16} sx={{ color: "#A38CE6" }} />
                ) : (
                  <FactCheckIcon />
                )}
              </IconButton>
            </Tooltip>

            {/* Add photo button */}
            <Tooltip title="Add Photo" arrow>
              <IconButton
                onClick={handleAddPhoto}
                sx={{
                  color: "#3B354D",
                  padding: "0.3rem",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#080511",
                    color: "#E2DDF3",
                    scale: 1.1,
                  },
                }}
              >
                <AddPhotoIcon />
              </IconButton>
            </Tooltip>

            {/* Delete button */}
            <Tooltip title="Delete Item" arrow>
              <IconButton
                size="small"
                onClick={deleteItem}
                sx={{
                  color: "#3B354D",
                  padding: "0.3rem",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#080511",
                    color: "#CD171A",
                    scale: 1.1,
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        PaperProps={{
          sx: {
            bgcolor: "#211D2F",
            color: "#E2DDF3",
            borderRadius: "0.8rem",
          },
        }}
      >
        <DialogTitle>Confirm AI Cross-Reference</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
            {isPremium
              ? "This feature is free for Premium users!"
              : "This action will use 1 Tech Pass to cross-reference your definition with AI. Are you sure you want to proceed?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmationModal(false)}
            sx={{
              color: "#9F9BAE",
              "&:hover": { color: "#E2DDF3" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmFactCheck}
            disabled={isDeductingTechPass}
            sx={{
              color: "#A38CE6",
              "&:hover": { color: "#E2DDF3" },
            }}
          >
            {isDeductingTechPass ? "Processing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemComponent;
