import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = "Yes, Leave",
  cancelText = "Cancel",
}) => {
  return (
    <Dialog
      open={open}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#120F1B",
          paddingY: "30px",
          paddingX: "20px",
          paddingRight: "40px",
          border: "2px solid #3B354D",
          borderRadius: "0.8rem",
        },
        "& .MuiDialog-root": {
          backgroundColor: "#120F1B",
        },
      }}
    >
      <DialogTitle id="confirmation-dialog-title" className=" py-4 px-6">
        {title}
      </DialogTitle>

      <DialogContent className="text-[#9F9BAE] py-6 px-6">
        <p>{content}</p>
      </DialogContent>

      <DialogActions sx={{ padding: "16px 0" }}>
        <Button
          onClick={onCancel}
          sx={{
            color: "#B0B0B0",
            fontWeight: "bold",
            padding: "10px 24px",
            borderRadius: "0.6rem",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: "#4D18E8",
              color: "#E2DDF3",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          autoFocus
          sx={{
            backgroundColor: "#8565E7",
            color: "#E2DDF3",
            fontWeight: "bold",
            padding: "10px 24px",
            borderRadius: "0.6rem",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: "#4D18E8",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
