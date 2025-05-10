import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FormattedAchievement,
  MysticElderAchievement,
} from "../../../types/achievementObject";
import { useAllUserAchievements } from "./hooks/getAchievement";
import { useUser } from "../../../contexts/UserContext";

const Achievements = () => {
  const { fetchAllAchievements } = useAllUserAchievements();
  const { user } = useUser();
  const location = useLocation();
  const [achievements, setAchievements] = useState<FormattedAchievement[]>([]);
  const [studyMaterialCount, setStudyMaterialCount] = useState(0);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [userLevel, setUserLevel] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pvpMatchesCount, setPvpMatchesCount] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [pvpWinsCount, setPvpWinsCount] = useState(0);

  // Convert achievement level to progress percentage
  const levelToProgress = (level: number): number => {
    switch (level) {
      case 3:
        return 100;
      case 2:
        return 60;
      case 1:
        return 20;
      default:
        return 0;
    }
  };

  // Add this function to calculate Mystic Elder progress based on user level
  const calculateMysticElderProgress = (
    userLevel: number,
    requirement: number
  ): number => {
    // Calculate progress percentage (capped at 100%)
    return Math.min(Math.floor((userLevel / requirement) * 100), 100);
  };

  useEffect(() => {
    if (!user?.firebase_uid) return;

    setLoading(true);

    fetchAllAchievements(user.firebase_uid)
      .then((data) => {
        if (!data) {
          setError("Failed to fetch achievements");
          return;
        }

        try {
          // Check if formatttedAchievements exist before using them
          if (data.formattedAchievements) {
            // Set all achievements at once
            setAchievements(
              [
                data.formattedAchievements.mysticElder,
                data.formattedAchievements.wisdomCollector,
                data.formattedAchievements.arcaneScholar,
                data.formattedAchievements.duelist,
                data.formattedAchievements.battleArchmage,
                data.formattedAchievements.bestMagician,
              ].filter(Boolean)
            ); // Filter out any undefined values
          }

          // Set individual values with safe defaults
          setUserLevel(data.mysticElder?.userLevel || 0);
          setStudyMaterialCount(
            data.wisdomCollector?.userStudyMaterialCount || 0
          );
          setCompletedSessionsCount(
            data.arcaneScholar?.userStudyMaterialCount || 0
          );
          setPvpMatchesCount(data.battleArchmage?.total_matches || 0);
          setWinStreak(data.duelist?.highest_streak || 0);
          setPvpWinsCount(data.bestMagician?.total_wins || 0);
        } catch (err) {
          console.error("Error processing achievement data:", err);
          setError("Error processing achievement data");
        }
      })
      .catch((err) => {
        console.error("Error fetching achievements:", err);
        setError("An error occurred while fetching achievements");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.firebase_uid, location.pathname, fetchAllAchievements]);

  // Universal getBadgeImage function that handles all achievements appropriately
  const getBadgeImage = (baseImage: string, progress: number) => {
    // Check if the image URL exists
    if (!baseImage) {
      console.warn("Missing baseImage URL");
      return ""; // Return empty or a default placeholder
    }

    // Check if this image path already has a specific suffix (-w, -b, -s, -g)
    // These are likely pre-processed by specialized achievement hooks
    const hasSuffix = baseImage.match(/-(w|b|s|g)\.png$/);

    // If it already has the correct suffix pattern, it was pre-processed by a hook
    // (like the Mystic Elder images from getMysticElder hook)
    if (hasSuffix) {
      console.log("Using pre-processed achievement image:", baseImage);
      return baseImage;
    }

    // Extract path and filename for regular achievements
    let path = "";
    let filename = baseImage;

    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }

    // Remove any existing suffix if present (unlikely since we checked above)
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");

    // Determine suffix based on progress for regular achievements
    let suffix = "-w.png"; // Default (white/locked)
    if (progress >= 100) {
      suffix = "-g.png"; // Gold
    } else if (progress >= 60) {
      suffix = "-s.png"; // Silver
    } else if (progress >= 20) {
      suffix = "-b.png"; // Bronze
    }

    return `${path}${baseName}${suffix}`;
  };

  // Update the getOpacity function to still apply opacity for level 0
  const getOpacity = (progress: number) => {
    // Only apply opacity when progress is 0 (level 0/not started)
    if (progress === 0) return "opacity-30";
    return "";
  };

  // Simplified calculateScale function
  const calculateScale = (
    progress: number,
    achievement: FormattedAchievement
  ) => {
    // If the achievement has a pre-formatted progress text, use it
    if (achievement.progressText) {
      return achievement.progressText;
    }

    // Default behavior for standard achievements
    if (progress >= 100) return "Complete";
    if (progress >= 60) return "2/3";
    if (progress >= 20) return "1/3";
    return "0/3";
  };

  // Helper function to get achievement level based on progress
  const getAchievementLevel = (progress: number) => {
    if (progress >= 100) return "Level 3";
    if (progress >= 60) return "Level 2";
    if (progress >= 20) return "Level 1";
    return "Level 0"; // Changed from "Locked" to "Level 0"
  };

  // Only render when all achievements are loaded
  if (loading) {
    return (
      <div className="text-white text-center p-8">Loading achievements...</div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">Error: {error}</div>;
  }

  return (
    <div>
      <h3 className="text-white text-2xl font-semibold mb-5">Achievements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sort achievements by progress before mapping them */}
        {[...achievements]
          .sort((a, b) => b.progress - a.progress) // Sort by descending progress
          .map((achievement) => (
            <div
              key={achievement.id}
              className="rounded-[1rem] px-7 py-8 flex flex-col items-center border-[0.2rem] border-[#3B354C]"
            >
              <img
                src={getBadgeImage(achievement.baseImage, achievement.progress)}
                alt={achievement.name}
                className={`w-24 h-24 object-contain ${getOpacity(
                  achievement.progress
                )}`}
              />
              <h4
                className={`text-lg pt-4 pb-1 font-bold text-center ${
                  achievement.progress === 0 ? "opacity-30" : ""
                }`}
              >
                {achievement.name}
              </h4>

              <p
                className={`text-gray-400 text-sm text-center mb-4 h-[40px] flex items-center ${
                  achievement.progress === 0 ? "opacity-30" : ""
                }`}
              >
                {achievement.description}
                <br />
                &nbsp;
              </p>
              <div className="flex items-center w-[85%]">
                <div className="w-full bg-[#3E3E50] rounded-full h-2">
                  <div
                    className="bg-[#2B00FF] h-2 rounded-full"
                    style={{ width: `${achievement.progress}%` }}
                  ></div>
                </div>
                <p
                  className={`text-sm text-gray-300 ml-3 ${
                    achievement.progress < 100 ? "opacity-50" : ""
                  }`}
                >
                  {calculateScale(achievement.progress, achievement)}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Achievements;
