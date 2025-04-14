// src/components/DrawerRightSideBar.tsx

import React, { useState } from "react";
import { Drawer, Box, IconButton } from "@mui/material";
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
  | "/dashboard/shop";

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
  const contentMap: Record<RoutePath, JSX.Element> = {
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
    "/dashboard/profile": friendListContent,
    "/dashboard/shop": (
      <>
        {friendListContent}
        <div className="my-7"></div>
        {leaderboardContent}
      </>
    ),
  };

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
        width: "100%", // Full width
        height: "200px", // Set the height to 200px
        transition: "all 0.3s ease-in",
        "& .MuiDrawer-paper": {
          height: "430px", // Set the drawer height
          width: "100%", // Full width
          borderRadius: "16px 16px 0 0", // Optional: rounded top corners for the drawer
          backgroundColor: "#120F1B",
          overflowX: "hidden",
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

      <Box className="p-4 flex justify-center overflow-y-auto mt-2">
        {/* Render the content based on route */}
        <div className="side-list-navi pr-8 mb-10 p-4 flex-shrink-0">
          {content}
        </div>
      </Box>
    </Drawer>
  );
};

export default DrawerRightSideBar;
