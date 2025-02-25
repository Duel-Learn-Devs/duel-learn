// Header.tsx
import { useState } from "react";
import { IconButton, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DrawerSidebarMenu from "./DrawerSidebarMenu"; // Import the new DrawerMenu component
import SearchField from "./SearchField";
import StatsNProfile from "./StatsNProfile";
import { Box } from "@mui/system";

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const isMobile = useMediaQuery("(max-width:1022px)");

  return (
    <Box className="w-full h-28 pt-6 text-white shadow flex ps-7 pe-3 items-center justify-between">
      {" "}
      {/* Mobile Menu Icon */}
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
      {/* Search Field */}
      <Box className="flex-1 sm:pl-4 lg:pl-10">
        <SearchField />
      </Box>
      {/* Icon Section */}
      <div className="flex items-center space-x-2 sm:space-x-6 sm:pr-4">
        <StatsNProfile />
      </div>
      {/* Drawer Menu Component */}
      <DrawerSidebarMenu
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
