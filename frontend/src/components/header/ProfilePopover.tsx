import { Popover, Stack, Box, Button, Divider } from "@mui/material";
import { PopoverProps } from "@mui/material";
import { auth } from "../../services/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CancelSubscription from "../premium/CancelSubscription";
import SettingsIcon from "@mui/icons-material/SettingsRounded";
import PersonalizationIcon from "@mui/icons-material/AutoAwesomeRounded";
import PrivacyIcon from "@mui/icons-material/PrivacyTipRounded";
import PremiumIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CancelIcon from "@mui/icons-material/HighlightOffRounded";
import VerifyIcon from "@mui/icons-material/SecurityRounded";
import LogoutIcon from "@mui/icons-material/LogoutRounded";

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
  const { user } = useUser();
  const navigate = useNavigate();
  const isVerified = user.email_verified || 1;
  const isPremium = user.account_type === "premium";
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleGoPremium = () => {
    navigate("/dashboard/buy-premium-account");
  };

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

  const handleSettings = () => {
    navigate("/dashboard/account-settings");
  };
  const handlePersonalization = () => {
    navigate("/dashboard/my-preferences");
  };

  const handleOpenCancelSubsModal = () => {
    setShowCancelModal(true);
  };

  return (
    <>
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
            borderRadius: "0.8rem",
            width: "16rem", // Set width of the popover
            padding: 2, // Adjust padding inside the popover
            mt: 1, // Space between the popover and profile button
          },
        }}
      >
        <Box sx={{ width: 220 }}>
          <Stack spacing={1}>
            <Button
              variant="text"
              onClick={handleSettings}
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
              <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
              Settings
            </Button>
            <Button
              variant="text"
              onClick={handlePersonalization}
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
              <PersonalizationIcon sx={{ mr: 1 }} fontSize="small" />
              Preference
            </Button>

            <Button
              variant="text"
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
              onClick={() => window.open("/privacy-policy", "_blank")}
            >
              <PrivacyIcon sx={{ mr: 1 }} fontSize="small" />
              Privacy Policy
            </Button>

            {/* Divider with more space above */}
            <Divider sx={{ mt: 3, mb: 2, backgroundColor: "#444" }} />
            {!isPremium ? (
              <Button
                variant="text"
                onClick={handleGoPremium}
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
                <PremiumIcon sx={{ mr: 1 }} fontSize="small" />
                Go Premium
              </Button>
            ) : (
              <Button
                variant="text"
                onClick={handleOpenCancelSubsModal}
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
                <CancelIcon sx={{ mr: 1 }} fontSize="small" />
                Cancel Subscription
              </Button>
            )}
            {!isVerified ? (
              <Button
                variant="text"
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
                onClick={() => navigate("/dashboard/verify-email")}
              >
                <VerifyIcon sx={{ mr: 1 }} fontSize="small" />
                Verify Email
              </Button>
            ) : null}

            <Button
              variant="text"
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
              onClick={handleLogout}
            >
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Logout
            </Button>
          </Stack>
        </Box>
      </Popover>
      <CancelSubscription
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
    </>
  );
}
