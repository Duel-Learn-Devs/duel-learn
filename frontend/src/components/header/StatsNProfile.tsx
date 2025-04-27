import React, { useState, useEffect } from "react";
import CoinIcon from "/CoinIcon.png";
import ManaIcon from "/ManaIcon.png";
import Tooltip from "@mui/material/Tooltip";
import TechPassIcon from "/shop-picture/tech-pass.png";
import ProfilePopover from "./ProfilePopover";
import { Avatar, Box } from "@mui/material"; // Remove CircularProgress
import { useUser } from "../../contexts/UserContext";
import DefaultPicture from "/profile-picture/default-picture.svg";
import PremiumLabel from "/premium-star.png";
import axios from "axios";
import "./ManaIndicator.css"; // We'll create this CSS file

const StatsNProfile = () => {
  const { user } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [manaStatus, setManaStatus] = useState<
    "replenishing" | "maxed" | "normal"
  >("normal");
  const [currentMana, setCurrentMana] = useState<number>(user?.mana || 0);
  const [timeToFull, setTimeToFull] = useState<string>("");
  const maxMana = 200; // Default max mana - could be fetched from user data

  const isPremium = user?.account_type === "premium";

  // Check mana status periodically
  useEffect(() => {
    // Initial update
    updateManaStatus();

    // Set up interval to check mana status every minute
    const interval = setInterval(updateManaStatus, 60000);

    return () => clearInterval(interval);
  }, [user?.firebase_uid]);

  // Function to update mana status
  const updateManaStatus = async () => {
    if (!user?.firebase_uid) return;

    // Add a timestamp check to prevent frequent API calls
    const lastUpdate = localStorage.getItem("lastManaStatusUpdate");
    const now = Date.now();

    if (lastUpdate && now - parseInt(lastUpdate) < 30000) {
      // Skip if last update was less than 30 seconds ago
      return;
    }

    try {
      // Store update timestamp
      localStorage.setItem("lastManaStatusUpdate", now.toString());

      // Use getManaDetails endpoint instead of basic mana endpoint
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mana/details/${
          user.firebase_uid
        }`
      );

      if (response.status === 200 && response.data.success) {
        const manaData = response.data.mana;
        setCurrentMana(manaData.current);

        // Set time remaining and mana status
        if (manaData.isFull) {
          setManaStatus("maxed");
          setTimeToFull("");
        } else {
          setManaStatus("replenishing");
          setTimeToFull(manaData.timeToFull.formattedTime);
        }
      }
    } catch (error) {
      console.error("Error updating mana status:", error);
    }
  };

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
        title={
          manaStatus === "replenishing"
            ? `Mana replenishing - ${timeToFull} remaining`
            : manaStatus === "maxed"
            ? "Mana at maximum capacity"
            : "Mana"
        }
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
          <span
            className={`text-[0.9rem] hover:text-[#E2DDF3] ${
              manaStatus === "replenishing"
                ? "mana-counter-replenishing"
                : manaStatus === "maxed"
                ? "mana-counter-maxed"
                : "text-[#9F9BAE]"
            }`}
          >
            {currentMana || 0}
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
          <div className="flex items-center space-x-2">
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
