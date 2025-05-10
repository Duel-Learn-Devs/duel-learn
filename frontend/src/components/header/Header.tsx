// Header.tsx
import { useState } from "react";
import { IconButton, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DrawerSidebarMenu from "./DrawerSidebarMenu";
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
  const isSmallMobile = useMediaQuery("(max-width:640px)");
  const isVerySmall = useMediaQuery("(max-width:460px)");

  return (
    <Box
      className={`w-full shadow flex items-center justify-between bg-[#080511] ${
        isVerySmall ? "h-20 py-2 " : "h-28 pt-10 "
      }`}
      sx={{ zIndex: 1, position: "relative" }}
    >
      {/* Left side container for Mobile Menu Icon and Search */}
      <Box className="flex items-center">
        {/* Mobile Menu Icon */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => toggleDrawer(true)}
            className={isVerySmall ? "ml-1" : "ml-1"}
            sx={{
              display: "block",
              mr: isVerySmall ? "6px" : "10px",
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Search Field */}
        <Box
          className={`${
            isSmallMobile
              ? "mx-1"
              : isVerySmall
              ? "mx-1"
              : isMobile
              ? "sm:pl-1"
              : "sm:pl-0 lg:pl-11"
          } ${isSmallMobile ? "" : "flex-1"}`}
        >
          <SearchField />
        </Box>
      </Box>

      {/* Icon Section (Right Side) */}
      <div className="flex items-center">
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
