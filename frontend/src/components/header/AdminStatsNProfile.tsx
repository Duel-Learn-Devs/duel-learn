import React, { useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import defaultPicture from "/profile-picture/default-picture.svg";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import PersonIcon from "@mui/icons-material/Person";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";

const AdminStatsNProfile = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Number of pending approval items - could be connected to a real API
  const pendingApprovals = 3;

  // Handle profile icon click to open/close menu
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Close the menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      setUser(null);
      navigate("/landing-page");
    } catch (error) {
      console.error("Error during logout:", error);
    }
    handleMenuClose();
  };

  const handleViewProfile = () => {
    navigate("/admin/settings");
    handleMenuClose();
  };

  const handleViewUserMgmt = () => {
    navigate("/admin/users");
    handleMenuClose();
  };

  return (
    <Box className="flex items-center space-x-2 sm:space-x-4">
      {/* Admin Pending Approvals */}
      <Tooltip
        title="Pending Approvals"
        arrow
        sx={{
          "& .MuiTooltip-tooltip": {
            padding: "8px 12px",
            fontSize: "16px",
            fontWeight: "bold",
          },
        }}
      >
        <div className="flex items-center space-x-2">
          <Badge badgeContent={pendingApprovals} color="error">
            <SupervisorAccountIcon sx={{ color: "#E2DDF3" }} />
          </Badge>
        </div>
      </Tooltip>

      {/* Admin Label */}
      <Box
        sx={{
          backgroundColor: "#4D18E8",
          px: 2,
          py: 0.5,
          borderRadius: 4,
          display: { xs: "none", sm: "flex" },
        }}
      >
        <Typography variant="body2" sx={{ color: "white", fontWeight: "bold" }}>
          Admin
        </Typography>
      </Box>

      {/* Profile Avatar */}
      <Tooltip
        title="Admin Profile"
        arrow
        sx={{
          "& .MuiTooltip-tooltip": {
            padding: "8px 12px",
            fontSize: "16px",
            fontWeight: "bold",
          },
        }}
      >
        <Avatar
          variant="rounded"
          onClick={handleProfileClick}
          src={user?.display_picture || defaultPicture}
          alt={user?.email || "Admin User"}
          sx={{
            cursor: "pointer",
            transition: "transform 0.3s ease, background-color 0.3s ease",
            "&:hover": {
              transform: "scale(1.1)",
              backgroundColor: "rgba(0, 0, 0, 0.08)",
            },
            border: "2px solid #4D18E8",
          }}
        />
      </Tooltip>

      {/* Admin Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "#181622",
            color: "#E2DDF3",
            minWidth: "200px",
            borderRadius: "12px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {user?.username || "Admin User"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
            {user?.email}
          </Typography>
          <Box
            sx={{
              mt: 1,
              display: "inline-block",
              backgroundColor: "#4D18E8",
              px: 1.5,
              py: 0.3,
              borderRadius: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              Administrator
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ backgroundColor: "#3B354C" }} />

        <MenuItem onClick={handleViewProfile} sx={{ py: 1.5 }}>
          <PersonIcon sx={{ mr: 2, color: "#E2DDF3" }} />
          <Typography variant="body2">Profile Settings</Typography>
        </MenuItem>

        <MenuItem onClick={handleViewUserMgmt} sx={{ py: 1.5 }}>
          <AdminPanelSettingsIcon sx={{ mr: 2, color: "#E2DDF3" }} />
          <Typography variant="body2">User Management</Typography>
        </MenuItem>

        <Divider sx={{ backgroundColor: "#3B354C" }} />

        <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
          <ExitToAppIcon sx={{ mr: 2, color: "#ff5252" }} />
          <Typography variant="body2" sx={{ color: "#ff5252" }}>
            Logout
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminStatsNProfile;
