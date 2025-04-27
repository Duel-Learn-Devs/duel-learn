import { useState } from "react";
import { IconButton, useMediaQuery, Badge, Box, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import AdminDrawerSidebarMenu from "./AdminDrawerSidebarMenu";
import AdminSearchField from "./AdminSearchField";
import AdminStatsNProfile from "./AdminStatsNProfile";
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const isMobile = useMediaQuery("(max-width:1022px)");

  const handleNotificationsClick = () => {
    // Navigate to admin notifications page or open notifications panel
    navigate("/admin/notifications");
  };

  const handleSettingsClick = () => {
    // Navigate to admin settings page
    navigate("/admin/settings");
  };

  return (
    <Box className="w-full h-28 pt-6 text-white shadow flex ps-7 pe-3 items-center justify-between z-0 bg-[#080511]">
      {/* Left Section - Title and Mobile Menu */}
      <Box className="flex items-center">
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => toggleDrawer(true)}
            sx={{
              display: "block",
              mr: "10px",
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h5" sx={{ color: '#E2DDF3', fontWeight: 'bold', ml: 2, display: { xs: 'none', sm: 'block' } }}>
          Admin Dashboard
        </Typography>
      </Box>

      {/* Middle Section - Search Field */}
      <Box className="flex-1 sm:px-4 lg:px-10 max-w-xl">
        <AdminSearchField />
      </Box>

      {/* Right Section - Admin Actions and Profile */}
      <Box className="flex items-center space-x-2 sm:space-x-4">
        {/* Admin-specific action buttons */}
        <IconButton
          color="inherit"
          aria-label="notifications"
          onClick={handleNotificationsClick}
          sx={{
            "&:hover": { color: "#4D18E8" },
          }}
        >
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton
          color="inherit"
          aria-label="settings"
          onClick={handleSettingsClick}
          sx={{
            "&:hover": { color: "#4D18E8" },
          }}
        >
          <SettingsIcon />
        </IconButton>

        {/* User profile and stats */}
        <AdminStatsNProfile />
      </Box>

      {/* Drawer Menu Component */}
      <AdminDrawerSidebarMenu
        drawerOpen={drawerOpen}
        toggleDrawer={toggleDrawer}
        collapsed={collapsed}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
      />
    </Box>
  );
} 