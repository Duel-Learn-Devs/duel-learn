import React from "react";
import { Snackbar, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

type SnackbarProps = {
  message: string;
  open: boolean;
  onClose: () => void;
  onClick?: () => void;
  action?: boolean;
};

const AutoHideSnackbar: React.FC<SnackbarProps> = ({
  message,
  open,
  onClose,
  onClick,
  action = false,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      message={message}
      onClick={onClick}
      action={
        action ? (
          <Button
            color="inherit"
            size="small"
            onClick={onClick}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        ) : undefined
      }
      sx={{
        cursor: onClick ? "pointer" : "default",
        "& .MuiSnackbarContent-root": {
          backgroundColor: "#3B354D", // Dark blue-gray background
          color: "#E2DDF3", // White text
          fontSize: "0.9rem", // Adjust font size
          alignItems: "center",
          justifyContent: "center",
          padding: "0.5rem 2rem",
          borderRadius: "0.8rem",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // Add shadow
          marginBottom: "0.8rem", // Add margin at the bottom
          "&:hover": {
            backgroundColor: onClick ? "#4D4660" : "#3B354D",
          },
        },
      }}
    />
  );
};

export default AutoHideSnackbar;
