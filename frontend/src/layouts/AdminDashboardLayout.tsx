import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/header/AdminHeader";
import Footer from "../components/Footer";
import { Box } from "@mui/system";
import "../styles/custom-scrollbar.css";
import WidgetsIcon from "@mui/icons-material/Widgets";
import { useMediaQuery } from "@mui/material";
import AdminDrawerSidebarMenu from "../components/header/AdminDrawerSidebarMenu";
import { useUser } from "../contexts/UserContext";

const AdminDashboardLayout = () => {
  const { user } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:1022px)");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Log when the component is rendered
  useEffect(() => {
    console.log("AdminDashboardLayout - Component rendered");
    console.log("AdminDashboardLayout - User data:", user);
    
    // Also check localStorage
    const userData = localStorage.getItem("userData");
    if (userData) {
      console.log("AdminDashboardLayout - localStorage userData:", JSON.parse(userData));
    } else {
      console.log("AdminDashboardLayout - No userData in localStorage");
    }
  }, [user]);

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  return (
    <Box
      className={`h-screen px-8 flex flex-col lg:flex-row w-screen overflow-x-hidden ${
        useMediaQuery("(min-width:1400px)") ? "px-11" : "px-25"
      }`}
      sx={{ backgroundColor: "#080511" }}
    >
      {/* AdminSidebar (hidden on small screens) */}
      <aside className="hidden lg:block pl-4 pr-4 h-screen sticky top-0">
        <Box>
          <AdminSidebar
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        </Box>
      </aside>

      {/* Main Section */}
      <Box className="flex-1 flex flex-col">
        <header className="w-full pr-2 top-0 pb-2 sticky z-50 bg-[#080511] shadow-sm">
          <AdminHeader />
        </header>

        {/* Main Content Section */}
        <Box className="flex flex-1">
          <main
            className={`flex-1 pt-3 relative ${
              useMediaQuery("(min-width:1400px)") ? "px-11" : "px-25"
            }`}
          >
            <Outlet />
            <Footer />

            {/* Absolute icon button in the top-right corner (only shown on mobile screens) */}
            {isMobile && (
              <button
                className="absolute top-2 right-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
                onClick={() => toggleDrawer(true)}
              >
                <WidgetsIcon />
              </button>
            )}
          </main>
        </Box>
      </Box>

      {/* Admin-specific drawer for mobile */}
      {isMobile && (
        <AdminDrawerSidebarMenu 
          drawerOpen={drawerOpen}
          toggleDrawer={toggleDrawer}
          collapsed={false}
          selectedIndex={selectedIndex || 0}
          setSelectedIndex={(index) => setSelectedIndex(index)}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      )}
    </Box>
  );
};

export default AdminDashboardLayout; 