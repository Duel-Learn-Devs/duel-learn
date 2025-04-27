import * as React from "react";
import { IconButton, Box } from "@mui/material";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";

type InviteSnackbarProps = {
  message: string;
  actionButtons?: React.ReactNode; // Accepts multiple buttons or icon buttons
  autoHideDuration?: number;
  open: boolean;
  onClose: () => void;
};

export default function InviteSnackbar({
  message,
  actionButtons,
  autoHideDuration = 3000,
  open,
  onClose,
}: InviteSnackbarProps) {
  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }
    onClose();
  };

  return (
    <Box>
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        message={message}
        action={
          <React.Fragment>
            {actionButtons || (
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </React.Fragment>
        }
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "#3B354D", // Dark blue-gray background
            color: "#E2DDF3", // White text
            fontSize: "0.9rem", // Adjust font size
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem 2rem",
            borderRadius: "0.8rem",
            gap: "0.5rem",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // Add shadow
            marginBottom: "0.8rem", // Add margin at the bottom
          },
        }}
      />
    </Box>
  );
}
