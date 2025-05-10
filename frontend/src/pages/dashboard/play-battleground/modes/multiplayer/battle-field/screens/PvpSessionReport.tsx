import { Button } from "@mui/material";
import SessionComplete from "/General/SessionComplete.png";
import ClockIcon from "/clock.png";
import ManaIcon from "/ManaIcon.png";
import CoinsIcon from "/CoinIcon.png";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import AutoConfettiAnimation from "../../../../../../../pages/dashboard/play-battleground/components/common/AutoConfettiAnimation";
import { useAudio } from "../../../../../../../contexts/AudioContext";
import { useEffect, useState, useRef } from "react";
import CompleteOrVictory from "/session-reports/CompleteOrVictory.png";
import IncompleteOrDefeat from "/session-reports/IncompleteOrDefeat.png";
import TieGameImage from "/session-reports/TieGame.png";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Heart,
  Sword,
  Zap,
  Check,
  X,
  Trophy,
  Award,
  Scale,
} from "lucide-react";

interface PvpSessionReportProps {
  timeSpent: string;
  correctCount: number;
  incorrectCount: number;
  mode: "pvp";
  material: any;
  earlyEnd?: boolean;
  startTime?: Date;
  highestStreak: number;
  playerHealth: number;
  opponentHealth: number;
  playerName: string;
  opponentName: string;
  isWinner: boolean;
  isTie?: boolean;
  sessionUuid: string;
  hostId?: string;
  guestId?: string;
  isHost?: boolean;
  earnedXP?: number;
  earnedCoins?: number;
}

interface StatisticProps {
  label: string;
  value: string | number;
  iconSrc?: string | React.ReactNode;
  bonusText?: string;
}

// Define the stat item interface
interface StatItem {
  label: string;
  value: string | number;
  bonusText?: string;
  iconSrc?: string | React.ReactNode;
}

// Updated icon component that can handle both image and Lucide icons
const IconDisplay = ({ icon }: { icon: string | React.ReactNode }) => {
  if (typeof icon === "string") {
    return <img src={icon} alt="" className="w-6 h-6 text-[#9A88FF]" />;
  }
  return <div className="text-[#9A88FF]">{icon}</div>;
};

const StatisticBox = ({
  label,
  value,
  iconSrc = ManaIcon,
  bonusText,
}: StatisticProps) => (
  <div
    style={{ width: "200px", minWidth: "200px" }}
    className="rounded-[0.8rem] h-[185px] bg-[#1C1827] border border-[#6F658D] flex flex-col items-center p-4"
  >
    <div className="flex items-center justify-center w-full pt-4 mb-3">
      {typeof iconSrc === "string" ? (
        <img src={iconSrc} alt="" className="w-6 h-6 text-[#9A88FF]" />
      ) : (
        <div className="text-[#9A88FF]">{iconSrc}</div>
      )}
    </div>
    <div className="text-sm text-[#9A88FF] uppercase mb-3 font-medium tracking-wide">
      {label}
    </div>
    <div className="text-3xl font-bold text-white mb-3">{value}</div>
    {bonusText ? (
      <div className="text-sm text-green-500 mt-auto mb-2">{bonusText}</div>
    ) : (
      <div className="mt-auto"></div> // Empty spacer when no bonus text
    )}
  </div>
);

const PvpSessionReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [winStreak, setWinStreak] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { pauseAudio, playSessionCompleteSound } = useAudio();

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
    playerHealth,
    opponentHealth,
    playerName,
    opponentName,
    isWinner,
    isTie = false,
    sessionUuid,
    hostId,
    guestId,
    isHost,
    earnedXP = 0,
    earnedCoins = 0,
  } = location.state as PvpSessionReportProps;

  const currentUserId = isHost ? hostId : guestId;

  // Helper functions
  const getBonusPoints = (streak: number) => {
    if (streak <= 0) return 0;
    if (streak === 1) return 3;
    if (streak === 2) return 6;
    if (streak === 3) return 9;
    if (streak === 4) return 12;
    return 15; // Max bonus is 15 for streak of 5 or more
  };

  // Helper function for XP bonus calculation
  const getXpBonusPoints = (streak: number) => {
    return Math.min(streak * 10, 50); // 10 points per win, maxed at 50
  };

  const getBattleResultMessage = () => {
    if (isTie) {
      return "TIE GAME";
    } else if (isWinner) {
      return earlyEnd ? "VICTORY" : "VICTORY";
    } else {
      return "DEFEAT";
    }
  };

  // Data preparation for different slides
  const slide1Stats: StatItem[] = [
    {
      label: "EARNED XP",
      value: `${earnedXP} XP`,
      bonusText:
        earlyEnd && isWinner
          ? "Reduced reward"
          : winStreak > 0 && !earlyEnd && !isTie
          ? `+${getXpBonusPoints(winStreak)} from win streak`
          : undefined,
    },
    {
      label: "EARNED COINS",
      value: `${earnedCoins} Coins`,
      bonusText:
        earlyEnd && isWinner
          ? "Reduced reward"
          : winStreak > 0 && !earlyEnd && !isTie
          ? `+${getBonusPoints(winStreak)} from win streak`
          : undefined,
      iconSrc: CoinsIcon,
    },
    {
      label: "YOUR HP",
      value: `${playerHealth} HP`,
      iconSrc: <Heart className="h-6 w-6" />,
    },
    {
      label: "ENEMY HP",
      value: `${opponentHealth} HP`,
      iconSrc: <Heart className="h-6 w-6 text-red-500" />,
    },
    {
      label: "HIGHEST STREAK",
      value: `${highestStreak}x`,
      iconSrc: <Zap className="h-6 w-6" />,
    },
  ];

  const slide2Stats: StatItem[] = [
    {
      label: "CORRECT",
      value: correctCount,
      iconSrc: <Check className="h-6 w-6" />,
    },
    {
      label: "INCORRECT",
      value: incorrectCount,
      iconSrc: <X className="h-6 w-6" />,
    },
    {
      label: "TOTAL TIME",
      value: timeSpent,
      iconSrc: ClockIcon,
    },
    {
      label: "BATTLE RESULT",
      value: getBattleResultMessage(),
      bonusText: earlyEnd && isWinner ? `${opponentName} left` : undefined,
      iconSrc: isTie ? (
        <Scale className="h-6 w-6" />
      ) : (
        <Sword className="h-6 w-6" />
      ),
    },
    {
      label: "WIN STREAK",
      value: `${winStreak}x`,
      bonusText: undefined,
      iconSrc: <Trophy className="h-6 w-6" />,
    },
  ];

  // All slides data
  const allSlides: StatItem[][] = [slide1Stats, slide2Stats];
  const totalSlides = allSlides.length;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  // Effects
  useEffect(() => {
    const playSound = async () => {
      if (!earlyEnd) {
        await playSessionCompleteSound();
      }
    };
    playSound();
  }, [earlyEnd, playSessionCompleteSound]);

  useEffect(() => {
    const delay = 1000;
    const timer = setTimeout(() => {
      pauseAudio();
    }, delay);

    return () => clearTimeout(timer);
  }, [pauseAudio]);

  useEffect(() => {
    const fetchWinStreak = async () => {
      try {
        const userId = isHost ? hostId : guestId;
        if (userId) {
          const response = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/gameplay/battle/win-streak/${userId}`
          );
          if (response.data.success) {
            setWinStreak(response.data.data.win_streak);
          }
        }
      } catch (error) {
        console.error("Error fetching win streak:", error);
      }
    };

    fetchWinStreak();
  }, [hostId, guestId, isHost]);

  // Helper function to get the appropriate image and text color based on game result
  const getResultStyling = () => {
    if (isTie) {
      return {
        image: TieGameImage || CompleteOrVictory, // Fallback to victory image if TieGameImage not available
        textColor: "text-yellow-400",
      };
    } else if (isWinner) {
      return {
        image: CompleteOrVictory,
        textColor: "text-[#FFC93F]",
      };
    } else {
      return {
        image: IncompleteOrDefeat,
        textColor: "text-red-400",
      };
    }
  };

  const resultStyling = getResultStyling();

  return (
    <div className="min-h-screen flex items-center justify-center">
      {!earlyEnd && isWinner && !isTie && <AutoConfettiAnimation />}

      <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-8 text-center">
        {/* Victory/Defeat/Tie Image first */}
        <div className="flex flex-col items-center">
          {/* Image comes first */}
          <div className="py-4 mb-4">
            <img
              src={resultStyling.image}
              alt={isTie ? "Tie Game" : isWinner ? "Victory" : "Defeat"}
              className="h-[240px] w-auto mx-auto"
            />
          </div>

          {/* Title based on battle outcome */}
          <h1
            className={`text-4xl mb-4 font-bold flex items-center justify-center text-white`}
          >
            <span className={resultStyling.textColor + " mr-3"}>●</span>
            <span>
              {isTie
                ? "It's a Tie!"
                : isWinner
                ? earlyEnd
                  ? "Session Complete"
                  : "Victory!"
                : "Almost there..."}
            </span>
            <span className={resultStyling.textColor + " ml-3"}>●</span>
          </h1>

          {/* Subtitle based on battle outcome */}
          <p className="text-xl text-gray-400 mb-3">
            {isTie
              ? "Both magicians are evenly matched!"
              : isWinner
              ? "Way to go, magician!"
              : "Try a little harder next time!"}
          </p>
        </div>

        {/* Stats Carousel - Complete Redesign */}
        <div className="w-full flex justify-center items-center mb-8 px-4 md:px-12">
          {/* Full-width container with relative positioning for buttons */}
          <div className="relative w-full max-w-[1300px]">
            {/* Left button - positioned far off to the left */}
            <button
              onClick={handlePrev}
              className="absolute left-[-210px] top-1/2 -translate-y-1/2 z-10 text-white"
              aria-label="Previous slide"
            >
              <div className="w-0 h-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-white"></div>
            </button>

            {/* Center aligned card container */}
            <div className="flex items-center justify-center gap-6 w-full mx-auto">
              {allSlides[currentSlide].map((stat, index) => (
                <StatisticBox
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  bonusText={stat.bonusText}
                  iconSrc={stat.iconSrc}
                />
              ))}
            </div>

            {/* Right button - positioned far off to the right */}
            <button
              onClick={handleNext}
              className="absolute left-[980px] top-1/2 -translate-y-1/2 z-10 text-white"
              aria-label="Next slide"
            >
              <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[12px] border-l-white"></div>
            </button>
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mb-10">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full cursor-pointer ${
                currentSlide === index ? "bg-[#BA54F5]" : "bg-[#5f5f5f]"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-6 justify-center mt-10">
          <button
            className="w-[190px] py-4 text-base font-bold bg-[#2F2C3B] text-white rounded-xl hover:bg-[#3A3A4A] transition-colors"
            onClick={() => navigate("/dashboard/home")}
          >
            BACK
          </button>
          <button
            className="w-[190px] py-4 text-base font-bold bg-[#6222EE] text-white rounded-xl hover:bg-[#4A12C0] transition-colors"
            onClick={() =>
              navigate("/dashboard/welcome-game-mode", {
                state: { mode, material },
              })
            }
          >
            STUDY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default PvpSessionReport;
