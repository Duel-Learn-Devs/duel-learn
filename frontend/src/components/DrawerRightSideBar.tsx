// src/components/DrawerRightSideBar.tsx

import React, { useState } from "react";
import { Drawer, Box } from "@mui/material";
import { useLocation } from "react-router";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// Importing the necessary content components
import Leaderboards from "./RighSideBar/Leaderboards/Leaderboards";
import FriendList from "./RighSideBar/FriendList/FriendList";
import EmptyLB from "./RighSideBar/Leaderboards/EmptyLB";
import EmptyFriendList from "./RighSideBar/FriendList/EmptyFriendList";

// Define the possible route paths based on the PrivateRoutes
type RoutePath =
  | "/dashboard/home"
  | "/dashboard/explore"
  | "/dashboard/my-library"
  | "/dashboard/profile"
  | "/dashboard/study-material/create"
  | "/dashboard/shop"
  | "/dashboard/account-settings"
  | "/dashboard/search";

interface DrawerProps {
  open: boolean;
  toggleDrawer: (open: boolean) => void;
}

const DrawerRightSideBar: React.FC<DrawerProps> = ({ open, toggleDrawer }) => {
  const location = useLocation();

  // State to simulate the number of friends (replace with actual logic if dynamic)
  const [friendCount] = useState<number>(6); // Example: Change this to dynamically update based on data

  // Determine whether to show EmptyLB or Leaderboards
  const leaderboardContent = friendCount >= 2 ? <Leaderboards /> : <EmptyLB />;
  const friendListContent =
    friendCount >= 1 ? <FriendList /> : <EmptyFriendList />;

  // Mapping route paths to content components
  const contentMap: Partial<Record<RoutePath, JSX.Element>> &
    Record<string, JSX.Element> = {
    "/dashboard/home": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/explore": leaderboardContent,
    "/dashboard/my-library": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/study-material/create": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/profile": friendListContent,
    "/dashboard/shop": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    "/dashboard/search": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
    // Return empty div for account-settings route
    "/dashboard/account-settings": <div></div>,
    "/dashboard/verify-email": <div></div>,
  };

  // Handle dynamic route `/dashboard/study-material/preview/:studyMaterialId`
  const isPreviewRoute = location.pathname.startsWith(
    "/dashboard/study-material/preview/"
  );

  // Check if we should hide the sidebar completely
  const shouldHideSidebar = location.pathname.includes(
    "/dashboard/account-settings"
  );

  // Get the content based on the current route
  const content = contentMap[location.pathname as RoutePath] || (
    <div>No Content</div>
  );

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={() => toggleDrawer(false)}
      sx={{
        width: "auto", // Full width
        height: "300px", // Set the height to 200px
        transition: "all 0.3s ease-in",
        overflowX: "hidden",
        borderRadius: "0.8rem 0.8rem 0 0",
        "& .MuiDrawer-paper": {
          height: "400px", // Full height
          width: "auto", // Full width
          borderRadius: "0.8rem 0.8rem 0 0", // Optional: rounded top corners for the drawer
          backgroundColor: "#120F1B",
          overflowX: "hidden",
          paddingBottom: "1rem",
        },
      }}
    >
      {/* Sticky header with full-width close button */}
      <div className="sticky top-0 z-50 bg-[inherit]">
        {/* Full-width close button */}
        <button
          className="w-full flex items-center justify-center bg-[#120F1B] text-white mt-2 "
          onClick={() => toggleDrawer(false)}
        >
          <KeyboardArrowDownIcon />
        </button>
      </div>

      <Box className=" py-4 flex justify-center  overflow-y-auto overflow-x-hidden ">
        {/* Render the content based on route */}
        <div className="side-list-navi pb-4 flex-shrink-0">{content}</div>
      </Box>
    </Drawer>
  );
};

export default DrawerRightSideBar;
