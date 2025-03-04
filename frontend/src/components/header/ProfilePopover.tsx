import { Popover, Stack, Box, Button, Divider } from "@mui/material";
import { PopoverProps } from "@mui/material";
import { auth } from "../../services/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

interface ProfilePopoverProps {
  anchorEl: PopoverProps["anchorEl"];
  open: boolean;
  handleClose: () => void;
}

export default function ProfilePopover({
  anchorEl,
  open,
  handleClose,
}: ProfilePopoverProps) {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      setUser(null);
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
  };
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
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
          color: "#ffffff", // White text
          borderRadius: "8px", // Rounded corners
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Subtle shadow
          padding: 3, // Adjust padding inside the popover
          mt: 2, // Space between the popover and profile button
        },
      }}
    >
      <Box sx={{ width: 220 }}>
        <Stack spacing={1}>
          <Button
            variant="text"
<<<<<<< HEAD
=======
            onClick={() => navigate("/account-settings")}
>>>>>>> origin/beta-branch
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              ":hover": {
                fontWeight: 700, // Make text bold on hover
              },
            }}
          >
            Settings
          </Button>
          <Button
            variant="text"
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              ":hover": {
                fontWeight: 700, // Make text bold on hover
              },
            }}
          >
            Go Premium
          </Button>
          <Button
            variant="text"
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              ":hover": {
                fontWeight: 700, // Make text bold on hover
              },
            }}
          >
            Privacy Policy
          </Button>
          <Button
            variant="text"
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              ":hover": {
                fontWeight: 700, // Make text bold on hover
              },
            }}
          >
            Help and Feedback
          </Button>
          {/* Divider with more space above */}
          <Divider sx={{ mt: 3, mb: 2, backgroundColor: "#444" }} />
          <Button
            variant="text"
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              ":hover": {
                fontWeight: 700, // Make text bold on hover
              },
            }}
<<<<<<< HEAD
            onClick={() => navigate("/dashboard/verify-email")}
          >
            Verify Email
          </Button>
          <Button
            variant="text"
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "inherit",
              fontWeight: 400,
              ":hover": {
                fontWeight: 700, // Make text bold on hover
              },
            }}
=======
>>>>>>> origin/beta-branch
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Stack>
      </Box>
    </Popover>
  );
}
