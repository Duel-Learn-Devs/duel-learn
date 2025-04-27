import React, { useState, useEffect, useRef } from "react";
import { Button, IconButton, Tooltip, CircularProgress, Fade } from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CachedIcon from "@mui/icons-material/Cached";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ManaIcon from "../../../../../../../public/ManaIcon.png";
import { useUser } from "../../../../../../contexts/UserContext";
import axios from "axios";

interface PvPHeaderProps {
  onBackClick: () => void;
  onChangeMaterial: () => void;
  onChangeQuestionType: () => void;
  selectedMaterial: { title: string } | null;
  selectedTypesFinal: string[];
  questionTypes: { display: string; value: string }[];
  isCurrentUserGuest: boolean;
}

// Status for visual feedback on refresh
type RefreshStatus = "idle" | "loading" | "success" | "error";

const PvPHeader: React.FC<PvPHeaderProps> = ({
  onBackClick,
  onChangeMaterial,
  onChangeQuestionType,
  selectedMaterial,
  selectedTypesFinal,
  questionTypes,
  isCurrentUserGuest,
}) => {
  const { user, refreshUserData } = useUser();
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");
  const [prevMana, setPrevMana] = useState<number>(user?.mana || 0);
  const [manaUpdated, setManaUpdated] = useState<boolean>(false);
  
  // Ref for tracking active polling interval
  const pollingIntervalRef = useRef<number | null>(null);
  
  // Effect to detect changes in mana value
  useEffect(() => {
    if (user?.mana !== undefined && prevMana !== user.mana) {
      setPrevMana(user.mana);
      if (prevMana !== 0) { // Skip the initial setting
        setManaUpdated(true);
        setTimeout(() => setManaUpdated(false), 2000);
      }
    }
  }, [user?.mana, prevMana]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Setup polling to refresh user data periodically
  useEffect(() => {
    if (user?.firebase_uid) {
      // Start polling for user data updates every 10 seconds
      pollingIntervalRef.current = window.setInterval(() => {
        console.log("Polling for user data updates...");
        silentRefreshUserData();
      }, 10000) as unknown as number;
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user?.firebase_uid]);

  // Direct API call for fresh data without context caching
  const fetchLatestUserData = async () => {
    if (!user?.firebase_uid) return null;
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${user.firebase_uid}`
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching latest user data:", error);
      return null;
    }
  };
  
  // Silent refresh without UI indicators
  const silentRefreshUserData = async () => {
    try {
      await refreshUserData();
    } catch (error) {
      console.error("Error in silent refresh:", error);
    }
  };

  // Manual refresh with UI feedback
  const handleRefreshUserData = async () => {
    setRefreshStatus("loading");
    try {
      // First try a direct API call to bypass any caching
      const latestData = await fetchLatestUserData();
      
      if (latestData) {
        // Use context refresh to update the global state
        await refreshUserData();
        setRefreshStatus("success");
        
        // Clear success status after 2 seconds
        setTimeout(() => {
          setRefreshStatus("idle");
        }, 2000);
      } else {
        // Fallback to regular refresh
        await refreshUserData();
        setRefreshStatus("success");
        
        // Clear success status after 2 seconds
        setTimeout(() => {
          setRefreshStatus("idle");
        }, 2000);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setRefreshStatus("error");
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setRefreshStatus("idle");
      }, 3000);
    }
  };

  // Get the appropriate icon based on status
  const getStatusIcon = () => {
    switch (refreshStatus) {
      case "loading":
        return <CircularProgress size={20} color="secondary" />;
      case "success":
        return <CheckCircleIcon sx={{ color: "#4CAF50" }} />;
      case "error":
        return <ErrorIcon sx={{ color: "#F44336" }} />;
      default:
        return <RefreshIcon />;
    }
  };

  return (
    <motion.div
      className="absolute top-0 left-0 w-full sm:px-8 md:px-16 lg:px-32 px-12 mt-5 py-12 flex justify-between items-center"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <IconButton
          className="text-gray-300"
          style={{
            border: "2px solid #6F658D",
            borderRadius: "50%",
            padding: "4px",
            color: "#6F658D",
          }}
          onClick={onBackClick}
        >
          <ArrowBackIcon />
        </IconButton>

        <div>
          <h2 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] font-semibold mb-1">
            {isCurrentUserGuest ? "LOBBY" : "PVP LOBBY"}
          </h2>
          <h6 className="text-[14px] text-gray-300 mb-1">
            {isCurrentUserGuest ? "Host selected: " : ""}
            {selectedTypesFinal.map((type, index) => {
              // Map question type values to display names
              const displayType =
                questionTypes.find((qt) => qt.value === type)?.display || type;
              return (
                <span key={type}>
                  {index > 0 ? ", " : ""}
                  {displayType}
                </span>
              );
            })}
          </h6>
          <p className="text-[12px] sm:text-[14px] text-gray-400 flex items-center">
            {isCurrentUserGuest
              ? "Host's Study Material: "
              : "Chosen Study Material: "}
            &nbsp;
            <span className="font-bold text-white">
              {selectedMaterial
                ? typeof selectedMaterial === "string" &&
                  selectedMaterial === "None"
                  ? "Waiting for host's material..."
                  : selectedMaterial.title || "Loading material..."
                : isCurrentUserGuest
                ? "Waiting for host's material..."
                : "Choose Study Material"}
            </span>
            {!isCurrentUserGuest && (
              <span className="transition-colors duration-200">
                <CachedIcon
                  sx={{
                    color: "#6F658D",
                    marginLeft: "8px",
                    fontSize: "22px",
                    cursor: "pointer",
                    "&:hover": { color: "#4B17CD" },
                  }}
                  onClick={onChangeMaterial}
                />
              </span>
            )}
            {isCurrentUserGuest && (
              <span className="ml-2 text-[12px] text-purple-300">
                (Guest mode)
              </span>
            )}
            <span className="transition-colors duration-200">
              <VisibilityIcon
                sx={{
                  color: "#6F658D",
                  marginLeft: "6px",
                  fontSize: "20px",
                  cursor: "pointer",
                  "&:hover": { color: "#4B17CD" },
                }}
              />
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="contained"
          className="bg-[#3d374d] text-white"
          onClick={onChangeQuestionType}
          sx={{
            cursor: isCurrentUserGuest ? "not-allowed" : "pointer",
            backgroundColor: "#8565E7",
            color: "#E2DDF3",
            fontWeight: "bold",
            height: "fit-content",
            width: "fit-content",
            borderRadius: "0.6rem",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: "#4D18E8",
            },
          }}
          disabled={isCurrentUserGuest}
        >
          CHANGE QUESTION TYPE
        </Button>

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
          <div className="relative flex items-center">
            <img
              src={ManaIcon}
              alt="Mana"
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 ml-6"
            />
            <span 
              className={`text-[14px] sm:text-[16px] text-gray-300 mr-2 sm:mr-3 transition-all duration-300 ${
                manaUpdated ? "text-purple-400 font-bold" : ""
              }`}
            >
              {user?.mana || 0}
            </span>
            
            {/* Pulse animation when mana updates */}
            {manaUpdated && (
              <Fade in={manaUpdated} timeout={300}>
                <div className="absolute inset-0 rounded-full animate-ping bg-purple-400 opacity-50"></div>
              </Fade>
            )}
          </div>
        </Tooltip>

        <Tooltip
          title={
            refreshStatus === "loading" 
              ? "Refreshing user data..." 
              : refreshStatus === "success" 
                ? "Data updated!" 
                : refreshStatus === "error"
                  ? "Refresh failed" 
                  : "Refresh user data"
          }
          arrow
          sx={{
            "& .MuiTooltip-tooltip": {
              padding: "8px 12px",
              fontSize: "14px",
              fontWeight: "medium",
            },
          }}
        >
          <IconButton 
            onClick={handleRefreshUserData} 
            disabled={refreshStatus === "loading"}
            sx={{
              color: refreshStatus === "idle" ? "#6F658D" : 
                    refreshStatus === "success" ? "#4CAF50" :
                    refreshStatus === "error" ? "#F44336" : "#9c27b0",
              "&:hover": {
                color: "#4B17CD",
              },
              transform: refreshStatus === "loading" ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.5s, color 0.3s",
            }}
          >
            {getStatusIcon()}
          </IconButton>
        </Tooltip>

        <span className="animate-spin text-[14px] sm:text-[16px] text-purple-400">
          ⚙️
        </span>
      </div>
    </motion.div>
  );
};

export default PvPHeader;
