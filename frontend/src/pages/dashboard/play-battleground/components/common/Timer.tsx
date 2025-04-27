import React, { useEffect, useState } from "react";
import ScoreStreakAnimation from "./ScoreStreakAnimation";

interface TimerProps {
  timeRemaining: number | null;
  progress: number;
  onCriticalTime?: (isCritical: boolean) => void;
  timeLimit: number;
  currentStreak: number;
  highestStreak: number;
  showTimerUI?: boolean;
}

const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  progress,
  onCriticalTime,
  timeLimit,
  currentStreak,
  highestStreak,
  showTimerUI = true,
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [showStreak, setShowStreak] = useState(false);

  // Always call useEffect, but conditionally execute logic inside
  useEffect(() => {
    if (timeRemaining === null) return;

    onCriticalTime?.(timeRemaining <= timeLimit / 2);
  }, [timeRemaining, timeLimit, onCriticalTime]);

  useEffect(() => {
    if (progress === 100) {
      setShouldAnimate(false);
      const timer = setTimeout(() => setShouldAnimate(true), 50);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  useEffect(() => {
    console.log("Current Streak:", currentStreak);
    if (currentStreak >= 3) {
      setShowStreak(true);
      console.log("Showing Streak Animation");
      const timer = setTimeout(() => {
        setShowStreak(false);
        console.log("Hiding Streak Animation");
      }, 3000); // Show for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);

  if (timeRemaining === null) return null;

  const isCriticalTime = timeRemaining <= timeLimit / 2;
  const isNearZero = timeRemaining <= 3;
  const isZero = timeRemaining === 0;

  const getProgressBarWidth = () => {
    if (isZero) return "2%";
    return `${progress}%`;
  };

  const getProgressBarClass = () => {
    if (isZero) {
      return "h-full bg-red-600 animate-health-glitch opacity-80";
    }
    if (isNearZero) {
      return "h-full bg-red-500 opacity-90";
    }
    if (isCriticalTime) {
      return "h-full bg-red-500";
    }
    return "h-full bg-[#fff]";
  };

  return (
    <>
      {(isNearZero || isZero) && (
        <div className="absolute top-[150px] left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
          <div className="bg-black/80 px-6 py-3 rounded-lg border border-red-500 backdrop-blur-sm">
            <p className="text-red-500 font-bold text-2xl animate-health-glitch">
              {isZero
                ? "TIME'S UP!"
                : `${Math.ceil(timeRemaining)}s REMAINING!`}
            </p>
          </div>
        </div>
      )}

      {showTimerUI && (
        <div className="fixed bottom-0 left-0 w-full">
          <div className="absolute left-12 bottom-8 flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}clockTimePressured.png`}
              alt="Timer"
              className={`w-6 h-6 ${isCriticalTime ? "animate-pulse" : ""}`}
            />
            <div
              className={`text-2xl font-bold ${
                isZero
                  ? "text-red-600 animate-health-glitch"
                  : isCriticalTime
                  ? "text-red-500"
                  : "text-white"
              }`}
            >
              {Math.ceil(timeRemaining)}s
            </div>
          </div>

          <div className="w-full h-2 bg-gray-700/50 relative overflow-hidden">
            <div
              className={`${getProgressBarClass()}`}
              style={{
                width: getProgressBarWidth(),
                transition: shouldAnimate ? "all 1s linear" : "none",
                boxShadow: isNearZero
                  ? "0 0 8px 2px rgba(239, 68, 68, 0.5)"
                  : "none",
              }}
            />
            {isNearZero && (
              <div
                className="absolute inset-0 bg-red-500/20"
                style={{
                  backdropFilter: "blur(1px)",
                  transition: "opacity 0.3s ease",
                }}
              />
            )}
          </div>
        </div>
      )}

      {showStreak && currentStreak >= 3 && (
        <div className="absolute top-[120px] left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
          <ScoreStreakAnimation streak={highestStreak} />
        </div>
      )}
    </>
  );
};

export default Timer;
