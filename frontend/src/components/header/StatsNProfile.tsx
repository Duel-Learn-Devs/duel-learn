import React, { useState } from "react";
import CoinIcon from "/CoinIcon.png";
import ManaIcon from "/ManaIcon.png";
import Tooltip from "@mui/material/Tooltip";
import TechPassIcon from "/shop-picture/tech-pass.png";
import ProfilePopover from "./ProfilePopover";
import { Avatar, Box } from "@mui/material";
import { useUser } from "../../contexts/UserContext";
import DefaultPicture from "/profile-picture/default-picture.svg";
import PremiumLabel from "/premium-star.png";

const StatsNProfile = () => {
  const { user } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isPremium = user?.account_type === "premium";

  // Handle profile icon click to open/close popover
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  // Close the popover
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="flex items-center space-x-3 ">
      {/* Coin */}
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
          <img src={CoinIcon} alt="Coins" className="w-6 h-auto" />
          <span className="text-[#9F9BAE] text-[0.9rem] hover:text-[#E2DDF3]">
            {user?.coins || 0}
          </span>
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
          <img src={ManaIcon} alt="Mana" className="w-5 h-auto" />
          <span className="text-[#9F9BAE] text-[0.9rem] hover:text-[#E2DDF3] ">
            {user?.mana || 0}
          </span>
        </div>
      </Tooltip>

      <Tooltip
        title="Tech Pass"
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
          <img src={TechPassIcon} alt="Tech Pass" className="w-6 h-auto" />
          <span className="text-[#9F9BAE] text-[0.9rem] hover:text-[#E2DDF3] ">
            {user?.tech_pass || 0}
          </span>
        </div>
      </Tooltip>

      {isPremium && (
        <Tooltip
          title="Premium"
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
          <div className="flex items-center space-x-2 mr-4">
            <img src={PremiumLabel} alt="" className="w-5 h-auto" />
          </div>
        </Tooltip>
      )}

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
          onClick={handleProfileClick}
          src={user?.display_picture || DefaultPicture}
          alt={user?.email || "User"}
          sx={{
            cursor: "pointer",
            transition: "transform 0.3s ease, background-color 0.3s ease",
            "&:hover": {
              transform: "scale(1.1)",
              backgroundColor: "rgba(0, 0, 0, 0.08)",
            },
          }}
        />
      </Tooltip>

      {/* Profile Popover */}
      <ProfilePopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        handleClose={handlePopoverClose}
      />
    </Box>
  );
};

export default StatsNProfile;
