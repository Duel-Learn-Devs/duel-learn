import { Button } from "@mui/material";
import CharacterImage from "/GameBattle/session-complete.png"; // Import character image
import ClockIcon from "/clock.png";
import ManaIcon from "/ManaIcon.png";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import AutoConfettiAnimation from "../../../../pages/dashboard/play-battleground/components/common/AutoConfettiAnimation";
import { useAudio } from "../../../../contexts/AudioContext"; // Import the useAudio hook
import { useEffect, useState } from "react"; // Add useState
import React from 'react';
import axios from "axios"; // Import axios for API calls
import SessionIncomplete from "/GameBattle/session-incomplete.png"; // Import session-incomplete image
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import FlareRoundedIcon from '@mui/icons-material/FlareRounded';

interface SessionReportProps {
  timeSpent: string;
  correctCount: number;
  incorrectCount: number;
  mode: "Peaceful" | "time-pressured" | "pvp";
  material: any; // Changed to any to access study_material_id
  earlyEnd?: boolean;
  startTime?: Date;
  highestStreak: number;
  masteredCount: number;
  unmasteredCount: number;
  aiQuestions?: any[]; // Add aiQuestions to the interface
}

interface StatisticProps {
  label: string;
  value: string | number;
}

const StatisticBox = ({
  label,
  value,
  icon,
  customIcon,
}: StatisticProps & { icon?: string; customIcon?: React.ReactNode }) => (
  <div
    className="w-[200px] h-[170px] rounded-[0.8rem] flex flex-col items-center justify-center flex-shrink-0"
    style={{
      backgroundColor: "#1C1827",
      border: "1px solid #6F658D"
    }}
  >
    <div className="flex flex-col items-center gap-2">
      {customIcon ? (
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center mb-1" style={{ color: "#4D18E8" }}>
          {React.cloneElement(customIcon as React.ReactElement, {
            style: {
              width: '32px',
              height: '32px',
              color: "#4D18E8"
            }
          })}
        </span>
      ) : (
        <img src={icon} alt="" className="w-8 h-8 flex-shrink-0 object-contain mb-1" style={{ filter: "invert(16%) sepia(97%) saturate(3868%) hue-rotate(257deg) brightness(89%) contrast(103%)" }} />
      )}
      <div className="text-[13px] text-white uppercase tracking-wider text-center">
        {label}
      </div>
    </div>
    <div className="text-[28px] font-bold text-white mt-3">
      {value}
    </div>
  </div>
);

const SessionReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSaved, setHasSaved] = useState(false);

  // If there's no state, redirect to home
  if (!location.state) {
    return <Navigate to="/dashboard/home" replace />;
  }

  const {
    timeSpent,
    correctCount,
    incorrectCount,
    mode,
    material,
    earlyEnd,
    highestStreak,
    masteredCount,
    unmasteredCount,
  } = location.state as SessionReportProps;

  const { pauseAudio, playSessionCompleteSound, playSessionIncompleteSound } =
    useAudio();

  // Keep the sound effects useEffects
  useEffect(() => {
    const playSound = async () => {
      if (earlyEnd) {
        await playSessionIncompleteSound();
      } else {
        await playSessionCompleteSound();
      }
    };
    playSound();
  }, [earlyEnd, playSessionCompleteSound, playSessionIncompleteSound]);

  useEffect(() => {
    const delay = mode !== "Peaceful" ? 1000 : 0;
    const timer = setTimeout(() => {
      pauseAudio();
    }, delay);

    return () => clearTimeout(timer);
  }, [pauseAudio, mode]);

  // Calculate XP based on mode and number of questions answered
  const calculateXP = () => {
    // If the game was ended early, return 0 XP
    if (earlyEnd) {
      return 0;
    }

    // For Peaceful mode
    if (mode === "Peaceful") {
      return 5;
    }

    // For Time Pressured mode
    if (mode === "time-pressured") {
      const totalQuestions = correctCount + incorrectCount;

      if (totalQuestions >= 50) return 30;
      if (totalQuestions >= 40) return 25;
      if (totalQuestions >= 30) return 20;
      if (totalQuestions >= 20) return 10;
      if (totalQuestions < 10) return 5; // For below 10 questions
    }

    // For other modes (like PVP if implemented later)
    return correctCount * 5;
  };

  const earnedXP = calculateXP();

  // Add console logs to check passed data
  console.log("Session Report Data:", {
    timeSpent,
    correctCount,
    incorrectCount,
    mode,
    material,
    earnedXP,
    highestStreak,
  });

  const totalItems = material?.items?.length || 0;
  const adjustedMasteredCount =
    mode === "Peaceful" ? totalItems : masteredCount;
  const adjustedUnmasteredCount = mode === "Peaceful" ? 0 : unmasteredCount;

  return (
    <div
      style={{ overflow: "auto", height: "100vh" }}
      className="min-h-screen flex items-center justify-center py-4"
    >
      {!earlyEnd && <AutoConfettiAnimation />}
      <div className="w-full max-w-[800px] flex flex-col items-center">
        {/* Session Complete Banner and Character */}
        <div className="flex flex-col items-center">
          {/* Character Image */}
          <div className="flex justify-center w-full">
            <div className="flex justify-center w-[800px]">
              <img
                src={earlyEnd ? SessionIncomplete : CharacterImage}
                alt={
                  earlyEnd
                    ? "Session incomplete character"
                    : "Session complete character"
                }
                className="w-full max-w-[400px] h-auto object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 mt-6">
            <h1 className="text-white text-[38px] font-bold">
              {earlyEnd ? "Almost there..." : "Session Complete"}
            </h1>
            <p className="text-[20px]" style={{ color: "#6F658D" }}>
              {earlyEnd ? "Try a little harder next time!" : "Way to go, magician!"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex gap-4 justify-center w-full max-w-[1200px] mx-auto">
            <div className="flex-shrink-0">
              <StatisticBox
                label="EARNED XP"
                value={`${earnedXP} XP`}
                customIcon={<FlareRoundedIcon />}
              />
            </div>
            <div className="flex-shrink-0">
              <StatisticBox
                label="TOTAL TIME"
                value={timeSpent}
                customIcon={<TimerRoundedIcon />}
              />
            </div>
            {mode === "Peaceful" ? (
              <>
                <div className="flex-shrink-0">
                  <StatisticBox
                    label="MASTERED"
                    value={adjustedMasteredCount}
                    customIcon={<StarsIcon />}
                  />
                </div>
                <div className="flex-shrink-0">
                  <StatisticBox
                    label="UNMASTERED"
                    value={adjustedUnmasteredCount}
                    customIcon={<RemoveCircleRoundedIcon />}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex-shrink-0">
                  <StatisticBox
                    label="HIGHEST STREAK"
                    value={`${highestStreak}x`}
                    customIcon={<LocalFireDepartmentIcon />}
                  />
                </div>
                <div className="flex-shrink-0">
                  <StatisticBox
                    label="CORRECT ANSWERS"
                    value={correctCount}
                    customIcon={<CheckCircleOutlineIcon />}
                  />
                </div>
                <div className="flex-shrink-0">
                  <StatisticBox
                    label="INCORRECT ANSWERS"
                    value={incorrectCount}
                    customIcon={<CancelOutlinedIcon />}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center mt-12">
          <Button
            sx={{
              px: 4,
              py: 1.5,
              backgroundColor: "#2C2C38",
              color: "white",
              borderRadius: "0.8rem",
              "&:hover": {
                backgroundColor: "#1E1E26",
              },
            }}
            onClick={() =>
              navigate("/dashboard/welcome-game-mode", {
                state: { mode, material },
              })
            }
          >
            STUDY AGAIN
          </Button>
          <Button
            sx={{
              px: 4,
              py: 1.5,
              backgroundColor: "#4D18E8",
              color: "white",
              borderRadius: "0.8rem",
              "&:hover": {
                backgroundColor: "#3A12B0",
              },
            }}
            onClick={() => {
              pauseAudio();
              navigate("/dashboard/home");
            }}
          >
            Go Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionReport;
