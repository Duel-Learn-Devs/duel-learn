import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../../contexts/UserContext";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PremiumStar from "/shop-picture/PremiumStar.svg";

interface CancelSubscriptionProps {
  open: boolean;
  onClose: () => void;
}

const CancelSubscription = ({ open, onClose }: CancelSubscriptionProps) => {
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const { user, updateUser, refreshUserData } = useUser();

  useEffect(() => {
    if (open && user?.firebase_uid) {
      fetchUserSubscription();
    }
  }, [open, user]);

  const fetchUserSubscription = async () => {
    if (!user?.firebase_uid) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/payment/user-subscription/${
          user.firebase_uid
        }`
      );

      if (response.data.success) {
        setPlanDetails(response.data.planDetails);
      } else {
        setError("No active subscription found");
      }
    } catch (error) {
      console.error("Subscription check error:", error);
      setError("Failed to retrieve your subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.firebase_uid) {
      setError("User not authenticated");
      return;
    }

    setCancelLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/payment/cancel-subscription`,
        { firebase_uid: user.firebase_uid }
      );

      if (response.data.success) {
        setCancelSuccess(true);
        updateUser({ account_type: "free" });
        refreshUserData().catch((err) =>
          console.error("Error refreshing user data:", err)
        );
      } else {
        setError("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      setError("An error occurred while cancelling your subscription");
    } finally {
      setCancelLoading(false);
      setCancelConfirmOpen(false);
    }
  };

  const handleClose = () => {
    setLoading(true);
    setError(null);
    setPlanDetails(null);
    setCancelSuccess(false);
    onClose();
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="cancel-subscription-modal"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 500 },
          bgcolor: "#1E1A29",
          borderRadius: "0.8rem",
          boxShadow: 24,
          p: 4,
          outline: "none",
        }}
      >
        <IconButton
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "#C4BEDB",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              scale: 1.05,
            },
          }}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",

            mt: 1,
          }}
        >
          {loading ? (
            <CircularProgress sx={{ color: "#A38CE6", my: 4 }} />
          ) : cancelSuccess ? (
            // Success view after cancellation
            <>
              <CheckCircleIcon sx={{ color: "#4CAF50", fontSize: 64, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                Subscription Cancelled
              </Typography>
              <Typography sx={{ color: "#C4BEDB", mb: 4 }}>
                Your premium subscription has been cancelled successfully. Your
                account will revert to the free plan.
              </Typography>
              <Button
                onClick={handleClose}
                variant="contained"
                sx={{
                  bgcolor: "#A38CE6",
                  "&:hover": { bgcolor: "#8C77D1" },
                  py: 1,
                  px: 4,
                  borderRadius: "0.8rem",
                }}
              >
                Done
              </Button>
            </>
          ) : (
            // Subscription details and cancel button
            <>
              <Box sx={{ width: 56, height: "auto", mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                Cancel Subscription
              </Typography>

              {error ? (
                <Typography sx={{ color: "#f44336", mb: 2 }}>
                  {error}
                </Typography>
              ) : planDetails ? (
                <>
                  <Box
                    sx={{
                      width: "100%",
                      bgcolor: "#2A2439",
                      p: 3,
                      borderRadius: 2,
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                      {planDetails.planName}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Amount: ₱{planDetails.amount}
                    </Typography>
                    {planDetails.expiresAt && (
                      <Typography variant="body2" sx={{ color: "#C4BEDB" }}>
                        Active until: {formatExpiryDate(planDetails.expiresAt)}
                      </Typography>
                    )}
                  </Box>

                  <Typography sx={{ color: "#C4BEDB", mb: 4 }}>
                    Cancelling your subscription will remove access to premium
                    features at the end of your current billing period.
                  </Typography>

                  <Button
                    onClick={() => setCancelConfirmOpen(true)}
                    variant="contained"
                    color="error"
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        bgcolor: "#f44336",
                        scale: 1.01,
                      },
                    }}
                  >
                    Cancel Subscription
                  </Button>
                </>
              ) : (
                <Typography sx={{ color: "#C4BEDB" }}>
                  You don't have an active subscription.
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Confirmation Dialog */}
        <Dialog
          open={cancelConfirmOpen}
          onClose={() => setCancelConfirmOpen(false)}
          PaperProps={{
            style: {
              borderRadius: "0.8rem",
              backgroundColor: "#1E1A29",
            },
          }}
        >
          <DialogTitle sx={{ bgcolor: "#1E1A29", color: "white" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningAmberIcon sx={{ color: "#f44336" }} />
              Confirm Cancellation
            </Box>
          </DialogTitle>
          <DialogContent sx={{ bgcolor: "#1E1A29", color: "#C4BEDB" }}>
            <DialogContentText sx={{ color: "#C4BEDB" }}>
              Are you sure you want to cancel your premium subscription? You
              will lose access to all premium features at the end of your
              billing period.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ bgcolor: "#1E1A29", px: 3, pb: 3 }}>
            <Button
              onClick={() => setCancelConfirmOpen(false)}
              sx={{ color: "#C4BEDB" }}
            >
              Keep Subscription
            </Button>
            <Button
              onClick={handleCancelSubscription}
              variant="contained"
              color="error"
              disabled={cancelLoading}
              sx={{
                "&:hover": { bgcolor: "#f44336", scale: 1.01 },
                py: 1,
                px: 4,
                borderRadius: ["0.8rem"],
                transition: "all 0.3s ease-in-out",
              }}
              startIcon={
                cancelLoading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : null
              }
            >
              {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Modal>
  );
};

export default CancelSubscription;
