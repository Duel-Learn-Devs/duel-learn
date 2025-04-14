import * as React from "react";
import { Popover, Button, Stack, Divider, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ShareLink from "./ShareLink";
import { handlePrint } from "../../../../utils/printUtils";
import type { ExportData } from "../../../../utils/exportUtils";
import {
  exportToTxt,
  exportToDocx,
  exportToPdf,
} from "../../../../utils/exportUtils";
import headerImage from "/General/print-header.png";
import shareIcon from "/study-material-popover-icons/share-icon.svg";
import printIcon from "/study-material-popover-icons/print-icon.svg";
import exportIcon from "/study-material-popover-icons/export-icon.svg";
import archiveIcon from "/study-material-popover-icons/archive-icon.svg";
import restoreIcon from "/study-material-popover-icons/restore-icon.svg";
import deleteIcon from "/study-material-popover-icons/delete-icon.svg";

interface MoreOptionPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  studyMaterialId: string;
  studyMaterialTitle: string;
  studyMaterialVisibility: number;
  isOwner: boolean;
  status?: string; // Add this prop to track if material is archived
  studyMaterialData?: ExportData;
}

export default function MoreOptionPopover({
  anchorEl,
  open,
  onClose,
  studyMaterialId,
  studyMaterialTitle,
  studyMaterialVisibility,
  isOwner,
  status,
}: MoreOptionPopoverProps) {
  const id = open ? "more-options-popover" : undefined;

  const navigate = useNavigate();
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const handleShare = () => {
    setShareModalOpen(true);
    onClose();
  };

  const handleShareModalClose = () => {
    setShareModalOpen(false);
  };

  const fetchStudyMaterialData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/get-by-study-material-id/${studyMaterialId}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        title: data.title || "Untitled",
        totalItems: data.items?.length || 0,
        items:
          data.items?.map((item: any) => ({
            term: item.term || "",
            definition: item.definition || "",
          })) || [],
        summary: data.summary || "",
      };
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  };

  const handlePrintClick = async () => {
    try {
      const data = await fetchStudyMaterialData();
      if (!data) {
        throw new Error("Failed to fetch study material data");
      }
      await handlePrint(data);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportFormat = async (format: string) => {
    try {
      console.log("Starting export for format:", format);
      const data = await fetchStudyMaterialData();
      console.log("Fetched data:", data);

      if (!data) {
        throw new Error("Failed to fetch study material data");
      }

      switch (format) {
        case "txt":
          console.log("Exporting to TXT");
          exportToTxt(data);
          break;
        case "docx":
          console.log("Exporting to DOCX");
          await exportToDocx(data);
          break;
        case "pdf":
          console.log("Exporting to PDF");
          await exportToPdf(data, headerImage);
          break;
      }
      setExportAnchorEl(null); // Close the menu after export
    } catch (error) {
      console.error("Error in export:", error);
    }
  };

  const handleArchive = async () => {
    if (!studyMaterialId) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/archive/${studyMaterialId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        console.log("Study material archived successfully");
        onClose();
        // Navigate back to the dashboard after archiving
        navigate(`/dashboard/my-library`);
      } else {
        const errorData = await response.json();
        console.error("Error archiving study material:", errorData);
      }
    } catch (error) {
      console.error("Error archiving study material:", error);
    }
  };

  const handleRestore = async () => {
    if (!studyMaterialId) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/restore/${studyMaterialId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        console.log("Study material restored successfully");
        onClose();
        navigate(`/dashboard/my-library`);
      } else {
        const errorData = await response.json();
        console.error("Error restoring study material:", errorData);
      }
    } catch (error) {
      console.error("Error restoring study material:", error);
    }
  };

  const handleDelete = async () => {
    if (!studyMaterialId) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/delete/${studyMaterialId}`,
        {
          method: "POST", // Changed from DELETE to POST to match the backend route
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        console.log("Study material deleted successfully");
        onClose();
        // Navigate back to the dashboard after deleting
        navigate("/dashboard/my-library");
      } else {
        const errorData = await response.json();
        console.error("Error deleting study material:", errorData);
      }
    } catch (error) {
      console.error("Error deleting study material:", error);
    }
  };

  return (
    <>
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
        sx={{
          "& .MuiMenu-paper": {
            backgroundColor: "#120F1B",
            borderRadius: "0.8rem",
            padding: "1rem",
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={() => handleExportFormat("txt")}>
          Export to TXT
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat("docx")}>
          Export to DOCX
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat("pdf")}>
          Export to PDF
        </MenuItem>
      </Menu>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#120F1B", // Dark background
            borderRadius: "0.8rem",
            width: "18rem", // Set width of the popover
            padding: 2, // Adjust padding inside the popover
            mt: 1, // Space between the popover and profile button
          },
        }}
      >
        <Stack spacing={1.5}>
          <Button
            variant="text"
            startIcon={<img src={shareIcon} alt="share-icon" />}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              borderRadius: "0.8rem",
              padding: "0.6rem 1rem",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
                backgroundColor: "#3B354C",
              },
            }}
            onClick={handleShare}
          >
            Share
          </Button>
          <Button
            variant="text"
            startIcon={<img src={printIcon} alt="print-icon" />}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              padding: "0.6rem 1rem",
              borderRadius: "0.8rem",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
                backgroundColor: "#3B354C",
              },
            }}
            onClick={handlePrintClick}
          >
            Print
          </Button>
          <Button
            variant="text"
            startIcon={<img src={exportIcon} alt="export-icon" />}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              borderRadius: "0.8rem",
              padding: "0.6rem 1rem",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
                backgroundColor: "#3B354C",
              },
            }}
            onClick={handleExportClick}
          >
            Export
          </Button>

          {isOwner && (
            <>
              <Divider sx={{ height: "2px", backgroundColor: "#3B354C" }} />

              {status === "archived" ? (
                // If archived, show restore and delete buttons
                <>
                  <Button
                    variant="text"
                    startIcon={<img src={restoreIcon} alt="export-icon" />}
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      color: "inherit",
                      fontWeight: 400,
                      borderRadius: "0.8rem",
                      padding: "0.6rem 1rem",
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.05)",
                        backgroundColor: "#3B354C",
                      },
                    }}
                    onClick={handleRestore}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<img src={deleteIcon} alt="export-icon" />}
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      color: "#FF4141", // Red color for delete
                      fontWeight: 400,
                      borderRadius: "0.8rem",
                      padding: "0.6rem 1rem",
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.05)",
                        backgroundColor: "rgba(255, 82, 82, 0.1)",
                      },
                    }}
                    onClick={handleDelete}
                  >
                    Delete Permanently
                  </Button>
                </>
              ) : (
                // If not archived, show archive button
                <Button
                  variant="text"
                  startIcon={<img src={archiveIcon} alt="archive-icon" />}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    color: "inherit",
                    fontWeight: 400,
                    borderRadius: "0.8rem",
                    padding: "0.6rem 1rem",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.05)",
                      backgroundColor: "#3B354C",
                    },
                  }}
                  onClick={handleArchive}
                >
                  Archive
                </Button>
              )}
            </>
          )}
        </Stack>
      </Popover>
      <ShareLink
        open={shareModalOpen}
        onClose={handleShareModalClose}
        studyMaterialId={studyMaterialId}
        studyMaterialTitle={studyMaterialTitle}
        studyMaterialVisibility={studyMaterialVisibility}
      />
    </>
  );
}
