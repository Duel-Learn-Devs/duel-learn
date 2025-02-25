import React, { useState } from "react";
import CoinIcon from "../../assets/CoinIcon.png";
import ManaIcon from "../../assets/ManaIcon.png";
import Tooltip from "@mui/material/Tooltip"; // Import Tooltip from Material-UI
import ProfilePopover from "./ProfilePopover"; // Import the ProfilePopover component
import { Avatar, Box } from "@mui/material"; // Import Avatar from Material-UI
import { useUser } from "../../contexts/UserContext"; // Import the useUser hook
import sampleAvatarDeployment from "../../assets/profile-picture/bunny-picture.png"; // Import the sample avatar image

const StatsNProfile = () => {
  const { user } = useUser();
  // State for dynamic data
  const [stats] = useState({
    xp: 500,
    mana: 200,
    hasNotifications: true, // Default notification status
    profileImg: "", // Avatar image
  });

  // State to control the popover visibility
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Handle profile icon click to open/close popover
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  // Close the popover
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="flex items-center space-x-2 sm:space-x-6">
      {/* Xp */}
      <Tooltip
        title="Coin"
        arrow
        sx={{
          "& .MuiTooltip-tooltip": {
            padding: "8px 12px",
            fontSize: "16px",
            fontWeight: "bold",
            animation: "fadeInOut 0.3s ease-in-out",
          },
        }}
      >
        <div className="flex items-center space-x-2">
          <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
          <span className="text-[#fff]">{stats.xp}</span>
        </div>
      </Tooltip>

      {/* Mana Icon */}
      <Tooltip
        title="Mana"
        arrow
        sx={{
          "& .MuiTooltip-tooltip": {
            padding: "8px 12px",
            fontSize: "16px",
            fontWeight: "bold",
            animation: "fadeInOut 0.3s ease-in-out",
          },
        }}
      >
        <div className="flex items-center space-x-2">
          <img src={ManaIcon} alt="Mana" className="w-6 h-6" />
          <span className="text-[#fff]">{stats.mana}</span>
        </div>
      </Tooltip>

      {/* Profile Avatar */}
      <Tooltip
        title="Profile"
        arrow
        sx={{
          "& .MuiTooltip-tooltip": {
            padding: "8px 12px",
            fontSize: "16px",
            fontWeight: "bold",
            animation: "fadeInOut 0.3s ease-in-out",
          },
        }}
      >
        <Avatar
          variant="rounded"
          onClick={handleProfileClick} // Open popover on click
          src={user?.display_picture || sampleAvatarDeployment} // Ensure null is converted to undefined
          alt={user?.email || "User"} // Fallback if displayName is not available
          sx={{
            cursor: "pointer", // Change cursor to pointer on hover
            transition: "transform 0.3s ease, background-color 0.3s ease", // Smooth transition for hover effects
            "&:hover": {
              transform: "scale(1.1)", // Slightly enlarge the avatar on hover
              backgroundColor: "rgba(0, 0, 0, 0.08)", // Optional: add a subtle background color change on hover
            },
          }}
        />
      </Tooltip>

      {/* Profile Popover */}
      <ProfilePopover
        anchorEl={anchorEl} // Pass the anchor element
        open={Boolean(anchorEl)} // Open if anchorEl is not null
        handleClose={handlePopoverClose} // Close the popover
      />
    </Box>
  );
};

export default StatsNProfile;
