import {
  Typography,
  Box,
  Modal,
  Button,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import ErrorsSnackbar from "../../../../components/ErrorsSnackbar";
import Filter from "../../../../components/Filter";
import { useState, useEffect } from "react";
import CloseRoundedIcon from "@mui/icons-material/HighlightOffRounded";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "50rem",
  bgcolor: "#120F1B",
  border: "none",
  borderRadius: "0.8rem",
  px: 6,
  py: 4,
};

interface ShareLinkProps {
  open: boolean;
  onClose: () => void;
  studyMaterialId: string;
  studyMaterialTitle: string;
  studyMaterialVisibility: number;
}

export default function ShareLink({
  open,
  onClose,
  studyMaterialId,
  studyMaterialTitle,
  studyMaterialVisibility,
}: ShareLinkProps) {
  const shareUrl = `${window.location.origin}/dashboard/study-material/view/${studyMaterialId}`;
  const [visibility, setVisibility] = useState<string>(
    studyMaterialVisibility.toString()
  );

  useEffect(() => {
    setVisibility(studyMaterialVisibility.toString());
  }, [studyMaterialVisibility]);

  const [snackbarMessage, setSnackbarMessage] = useState<string>(
    "Link copied to clipboard!"
  );
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setSnackbarMessage("Link copied to clipboard!");
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleVisibilityChange = async (value: string | number) => {
    const newVisibility = value.toString();
    const previousVisibility = studyMaterialVisibility.toString();

    // Optimistically update UI
    setVisibility(newVisibility);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/update-visibility/${studyMaterialId}`,
        {
          method: "POST", // Changed from PATCH to POST to match backend route
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visibility: parseInt(newVisibility),
          }),
        }
      );

      console.log("Response status:", response.status);

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
        console.log("Response body:", result);
      } catch (e) {
        console.error("Failed to parse response as JSON:", text);
        // Revert UI state
        setVisibility(previousVisibility);
        setSnackbarMessage("Failed to update visibility: Invalid response");
        setSnackbarOpen(true);
        return;
      }

      if (!response.ok) {
        console.error("Visibility update failed:", result.error);
        // Revert UI state if there was an API error
        setVisibility(previousVisibility);
        setSnackbarMessage(
          "Failed to update visibility: " + (result.error || "Unknown error")
        );
        setSnackbarOpen(true);
        return;
      }

      // Show success message
      setSnackbarMessage(
        `Study material is now ${newVisibility === "0" ? "private" : "public"}`
      );
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating visibility:", error);
      // Revert the state if there's an error
      setVisibility(previousVisibility);
      setSnackbarMessage("Failed to update visibility");
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="share-modal-title"
        aria-describedby="share-modal-description"
        sx={{
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        }}
      >
        <Box sx={style}>
          <Stack direction={"row"} spacing={1} alignItems={"center"} mb={2}>
            <Typography id="share-modal-title" variant="h6" component="h2">
              Share "{studyMaterialTitle}"
            </Typography>
            <Box flex={1} />
            <IconButton onClick={onClose}>
              <CloseRoundedIcon className="text-[#6F658D] hover:scale-110 transition-all duration-300 ease-in-out" />
            </IconButton>
          </Stack>

          <Stack spacing={1} className="flex items-center mt-2" direction="row">
            <div className="relative flex-grow">
              <Tooltip
                title={
                  <Typography
                    sx={{
                      wordBreak: "break-all",
                      whiteSpace: "normal",

                      fontSize: "0.875rem",
                    }}
                  >
                    {shareUrl}
                  </Typography>
                }
                placement="bottom-start"
                componentsProps={{
                  tooltip: {
                    sx: {
                      maxWidth: "none", // Remove the default max-width constraint
                      padding: "1rem 2rem",
                      bgcolor: "#3B354D",
                      borderRadius: "0.8rem",
                    },
                  },
                }}
              >
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-4 py-2 rounded-[0.8rem] bg-[#3B354D] border border-[#3B354C] hover:outline-none hover:border-[#6F658D] text-ellipsis transition-all duration-300 ease-in-out"
                />
              </Tooltip>
            </div>
            <Filter
              menuItems={[
                { value: "0", label: "Private" },
                { value: "1", label: "Public" },
              ]}
              value={visibility}
              onChange={handleVisibilityChange}
              hoverOpen
            />

            <Button
              variant="contained"
              onClick={handleCopy}
              sx={{
                alignItems: "center",
                backgroundColor: "#8565E7",
                color: "#E2DDF3",
                height: "2.65rem",
                borderRadius: "0.8rem",
                padding: "0.5rem 2rem",
                fontSize: "0.8rem",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                  backgroundColor: "#4D18E8",
                },
              }}
            >
              Copy Link
            </Button>
          </Stack>
        </Box>
      </Modal>

      <ErrorsSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        onClose={handleCloseSnackbar}
      />
    </>
  );
}
