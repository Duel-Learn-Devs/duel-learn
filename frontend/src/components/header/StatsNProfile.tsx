import React, { useState, useEffect } from "react";
import CoinIcon from "../../assets/CoinIcon.png";
import ManaIcon from "../../assets/ManaIcon.png";
import Tooltip from "@mui/material/Tooltip";
import ProfilePopover from "./ProfilePopover";
import { Avatar, Box, CircularProgress } from "@mui/material";
import { useUser } from "../../contexts/UserContext";
import sampleAvatarDeployment from "../../assets/profile-picture/bunny-picture.png";
import axios from "axios";
import { UserInfo } from "../../types/userInfoObject";

// User info interface

const StatsNProfile = () => {
  const { user } = useUser();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State to control the popover visibility
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Fetch user info from the API
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.firebase_uid) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user-info/details/${
            user.firebase_uid
          }`
        );
        setUserInfo((response.data as { user: UserInfo }).user);
      } catch (err) {
        console.error("Error fetching user info:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user?.firebase_uid]);

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
      {loading ? (
        <CircularProgress size={24} color="inherit" />
      ) : error ? (
        <span className="text-red-500 text-sm">{error}</span>
      ) : (
        <>
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
                {userInfo?.coin || 0}
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
                {userInfo?.mana || 0}
              </span>
            </div>
          </Tooltip>
        </>
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
          src={
            userInfo?.display_picture ||
            sampleAvatarDeployment
          }
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
