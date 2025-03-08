// import  React from "react";
import { Popover, Button, Stack, Divider, Box, Menu, MenuItem, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import coverPhoto from "../../../../assets/study-material-popover-icons/cover-photo.svg";
import shareIcon from "../../../../assets/study-material-popover-icons/share-icon.svg";
import printIcon from "../../../../assets/study-material-popover-icons/print-icon.svg";
import exportIcon from "../../../../assets/study-material-popover-icons/export-icon.svg";
import archiveIcon from "../../../../assets/study-material-popover-icons/archive-icon.svg";
import { handlePrint } from './utils/printUtils';
import { exportToTxt, exportToDocx, exportToPdf } from './utils/exportUtils';
import type { ExportData } from './utils/exportUtils';
import headerImage from '../../../../assets/General/print-header.png';
import { useState } from "react";

interface MoreOptionPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  studyMaterialId: string;
  isOwner: boolean;
  studyMaterialData?: ExportData;
}

export default function MoreOptionPopover({
  anchorEl,
  open,
  onClose,
  studyMaterialId,
  isOwner,
  studyMaterialData,
}: MoreOptionPopoverProps) {
  const id = open ? "more-options-popover" : undefined;

  const navigate = useNavigate();

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  const handleChangeCover = () => {
    console.log("Change Cover clicked");
    // Implement cover change functionality here
  };

  const handleShare = () => {
    console.log("Share clicked");
    // Implement share functionality here
  };

  const fetchStudyMaterialData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/study-material/get-by-study-material-id/${studyMaterialId}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        title: data.title || 'Untitled',
        totalItems: data.items?.length || 0,
        items: data.items?.map((item: any) => ({
          term: item.term || '',
          definition: item.definition || ''
        })) || [],
        summary: data.summary || ''
      };
    } catch (error) {
      console.error('Fetch error:', error);
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
      console.log('Starting export for format:', format);
      const data = await fetchStudyMaterialData();
      console.log('Fetched data:', data);
      
      if (!data) {
        throw new Error('Failed to fetch study material data');
      }

      switch (format) {
        case 'txt':
          console.log('Exporting to TXT');
          exportToTxt(data);
          break;
        case 'docx':
          console.log('Exporting to DOCX');
          await exportToDocx(data);
          break;
        case 'pdf':
          console.log('Exporting to PDF');
          await exportToPdf(data, headerImage);
          break;
      }
      setExportAnchorEl(null); // Close the menu after export
    } catch (error) {
      console.error('Error in export:', error);
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
        navigate("/dashboard/my-library");
      } else {
        const errorData = await response.json();
        console.error("Error archiving study material:", errorData);
      }
    } catch (error) {
      console.error("Error archiving study material:", error);
    }
  };

  return (
    <>
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
            backgroundColor: "#120F1B",
            borderRadius: "0.8rem",
            width: "18rem",
            padding: 2,
            mt: 1,
          },
        }}
      >
        <Stack spacing={1.5}>
          <Button
            variant="text"
            startIcon={<img src={coverPhoto} alt="cover-photo" />}
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
            onClick={handleChangeCover}
          >
            Change Cover
          </Button>
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
            onClick={handleExportClick}
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
          >
            Export
          </Button>

          {isOwner && (
            <>
              <Divider sx={{ height: "2px", backgroundColor: "#3B354C" }} />
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
            </>
          )}
        </Stack>
      </Popover>

      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#120F1B",
            borderRadius: "0.8rem",
            mt: 1,
          }
        }}
      >
        <MenuItem 
          onClick={() => handleExportFormat('txt')}
          sx={{ color: '#E2DDF3' }}
        >
          <Typography>Text File (.txt)</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleExportFormat('docx')}
          sx={{ color: '#E2DDF3' }}
        >
          <Typography>Word Document (.docx)</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleExportFormat('pdf')}
          sx={{ color: '#E2DDF3' }}
        >
          <Typography>PDF Document (.pdf)</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
