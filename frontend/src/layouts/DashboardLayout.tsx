// src/layouts/DashboardLayout.tsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/header/Header";
import Footer from "../components/Footer";
import RightSideBar from "../components/RighSideBar/RightSideBar";
import DrawerRightSideBar from "../components/DrawerRightSideBar"; // Import the new Drawer component
import { BattleInvitationCenter } from "../components"; // Import BattleInvitationCenter
import { Box } from "@mui/system";
import "../styles/custom-scrollbar.css";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { useMediaQuery } from "@mui/material";

const DashboardLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:1022px)");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  return (
    <Box className="custom-scrollbar h-screen px-8 flex flex-col lg:flex-row w-screen overflow-x-hidden ">
      {/* BattleInvitationCenter - will only show in dashboard routes */}
      <BattleInvitationCenter />

      {/* Sidebar (hidden on small screens) */}
      <aside className="hidden lg:block pl-4 pr-4 h-screen sticky top-0">
        <Box>
          <Sidebar
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        </Box>
      </aside>

      {/* Main Section */}
      <Box className="flex-1 flex flex-col relative">
        {/* Header - Fixed at the top */}
        <header className="w-full sticky top-0 md:pr-10 pb-2 z-[100] bg-[#080511]">
          <Header />
        </header>

        {/* Main Content Section with its own scrollable area */}
        <Box className="flex flex-1">
          <main
            className={`flex-1 pt-3 relative ${
              useMediaQuery("(min-width:1200px)") ? "px-11" : "px-25"
            }`}
          >
            <Outlet />
            <Footer />
          </main>

          {/* Right Sidebar */}
          <aside
            className="pr-2 pb-12"
            style={{
              display: isMobile ? "none" : "block",
            }}
          >
            <Box className="sticky top-0">
              <RightSideBar />
            </Box>
          </aside>
        </Box>

        {/* Mobile menu button - fixed at bottom with full width */}
        {isMobile && (
          <button
            className="fixed bottom-0 left-0 w-full rounded-t-[0.8rem] bg-[#120F1B] text-white shadow-lg flex items-center justify-center transition-all duration-300 ease-in hover:bg-[#120F1B] z-[110]"
            onClick={() => toggleDrawer(true)}
          >
            <KeyboardArrowUpRoundedIcon fontSize="medium" />
          </button>
        )}
      </Box>

      {/* Bottom Drawer (visible only on mobile screens) */}
      <DrawerRightSideBar open={drawerOpen} toggleDrawer={toggleDrawer} />
    </Box>
  );
};

export default DashboardLayout;
