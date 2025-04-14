import { useState, useEffect } from "react";
import { Box, Stack, CircularProgress } from "@mui/material";
import GoldMedal from "/General/gold-medal.svg";
import SilverMedal from "/General/silver-medal.svg";
import BronzeMedal from "/General/bronze-medal.svg";
import axios from "axios";
import { useUser } from "../../../contexts/UserContext";
import defaultPicture from "/profile-picture/default-picture.svg";
import { useMediaQuery, useTheme } from "@mui/material";
import { LeaderboardPlayer } from "../../../types/leaderboardObject";
import { Friend } from "../../../contexts/UserContext";
import ProfileModal from "../../modals/ProfileModal";

const Leaderboards = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!user?.firebase_uid) {
        setLoading(false);
        return;
      }

      // Update the try-catch block in fetchLeaderboardData with better type handling:

      try {
        setLoading(true);

        // Debug the API URL
        const apiUrl = `${
          import.meta.env.VITE_BACKEND_URL
        }/api/friend/leaderboard/${user.firebase_uid}`;
        console.log("Fetching from:", apiUrl);

        const response = await axios.get(apiUrl);
        console.log("API Response type:", typeof response.data);
        console.log("API Response:", response.data);

        if (response.data === null || response.data === undefined) {
          console.error("API returned null or undefined");
          setLeaderboardData([]);
          setError("No data received from server");
          return;
        }

        // Handle string response - try to parse it as JSON if possible
        if (typeof response.data === "string") {
          console.error("API returned string instead of array:", response.data);
          try {
            // Try to parse it as JSON
            const parsedData = JSON.parse(response.data);
            if (Array.isArray(parsedData)) {
              console.log("Successfully parsed string as JSON array");

              // Add rank if missing
              const dataWithRank = parsedData.map((player, index) => ({
                ...player,
                rank: player.rank || index + 1,
              }));

              setLeaderboardData(dataWithRank);
              setError(null);
              return;
            }
          } catch (jsonError) {
            console.error("Failed to parse response as JSON:", jsonError);
          }

          // If we got here, string wasn't valid JSON array
          setLeaderboardData([]);
          setError(
            `Server returned text instead of data: ${response.data.substring(
              0,
              50
            )}...`
          );
          return;
        }
        if (Array.isArray(response.data)) {
          console.log("Processing array data:", response.data.length, "items");
          // Add rank if not already present
          const dataWithRank = response.data.map((player, index) => ({
            ...player,
            rank: player.rank || index + 1,
          }));

          setLeaderboardData(dataWithRank);
          setError(null);
        } else if (
          typeof response.data === "object" &&
          response.data !== null
        ) {
          console.error(
            "Response is an object but not an array:",
            response.data
          );
          setLeaderboardData([]);
          setError("Invalid data format: expected array but got object");
        } else {
          console.error("Unexpected response format:", typeof response.data);
          setLeaderboardData([]);
          setError(
            `Invalid data format: expected array but got ${typeof response.data}`
          );
        }
      } catch (err) {
        // Your existing error handling...
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [user]);

  // Medal assignment function
  const getMedal = (rank: number): string | undefined => {
    if (rank === 1) return GoldMedal;
    if (rank === 2) return SilverMedal;
    if (rank === 3) return BronzeMedal;
    return undefined;
  };

  const handleViewProfile = (friendId: string) => {
    setSelectedFriend(friendId);
    setProfileModalOpen(true);
  };

  // Updated renderPlayerItem with better mobile responsiveness
  const renderPlayerItem = (
    player: LeaderboardPlayer,
    showBackground = true
  ) => {
    return (
      <div
        key={player.firebase_uid}
        className={`flex items-center justify-between py-2 sm:py-3 px-1 sm:px-2 w-full ${
          showBackground && player.isCurrentUser
            ? "bg-[#221f2e] rounded-lg"
            : ""
        }`}
      >
        {/* Left side with rank, avatar and username */}
        <div className="flex items-center min-w-0 flex-1">
          {/* Rank indicator - fixed width container */}
          <div className="flex-shrink-0 w-5 sm:w-6 min-w-[20px] sm:min-w-[24px] flex justify-center mr-1 sm:mr-2">
            {player.rank <= 3 ? (
              <img
                src={getMedal(player.rank)}
                alt={`Rank ${player.rank}`}
                className="w-5 sm:w-6 h-auto"
              />
            ) : (
              <p className="text-xs sm:text-sm font-semibold text-center">
                {player.rank}
              </p>
            )}
          </div>

          {/* Avatar with fixed dimensions */}
          <div
            onClick={() => handleViewProfile(player.firebase_uid)} // Changed from friend.firebase_uid
            className="flex-shrink-0 mr-1 sm:mr-2 cursor-pointer"
          >
            <img
              src={player.display_picture || defaultPicture}
              alt="Avatar"
              className="w-8 sm:w-10 md:w-12 h-auto rounded-[5px] ml-1 sm:ml-2 object-cover hover:scale-110 transition-all duration-300 ease-in"
            />
          </div>
          {/* Username with truncation */}
          <p
            className={`truncate text-xs sm:text-sm text-[#E2DDF3] max-w-[60px] sm:max-w-none ${player.isCurrentUser}`}
          >
            {player.username}
          </p>
        </div>

        {/* Right side with level and XP - now properly pushed to the right edge */}
        <div className="flex-shrink-0 flex items-center gap-1 ml-1 sm:ml-2">
          <p className="text-[10px] sm:text-xs truncate whitespace-nowrap text-[#9F9BAE]">
            Lvl {player.level}
          </p>
          <p className="text-[#9F9BAE] text-[10px] sm:text-xs hidden xs:inline">
            •
          </p>
          <p className="text-[10px] sm:text-xs whitespace-nowrap text-[#9F9BAE]">
            {isMobile ? "XP" : "EXP"} {player.exp}
          </p>
        </div>
      </div>
    );
  };

  // Find current user
  const currentUser = leaderboardData.find((player) => player.isCurrentUser);

  // Get top 3 players
  const top3Players = leaderboardData.filter((player) => player.rank <= 3);

  return (
    <>
      <Box className="rounded-[0.8rem] shadow-md border-[0.2rem] border-[#3B354C] w-full">
        <div className="px-6 sm:px-6 md:px-8 pt-6 sm:pt-6 md:pt-8 pb-3 sm:pb-4">
          <div className="flex flex-row items-center mb-4 sm:mb-4 gap-2 sm:gap-4">
            <img
              src="/leaderboard.png"
              className="w-4 sm:w-8 md:w-8 h-auto"
              alt="icon"
            />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold">
              Leaderboards
            </h2>
          </div>

          <hr className="border-t-2 border-[#3B354D] mb-2 sm:mb-4 rounded-full" />

          {loading ? (
            <div className="flex justify-center items-center h-32 sm:h-60">
              <CircularProgress size={isMobile ? 24 : 40} />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 text-xs sm:text-sm py-2 sm:py-4">
              {error}
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center text-gray-400 text-xs sm:text-sm py-2 sm:py-4">
              No friends found. Add friends to see your leaderboard!
            </div>
          ) : (
            <div className="flex flex-col space-y-1 sm:space-y-2">
              {/* Top 3 Players - always without background styling */}
              {top3Players.map((player) => renderPlayerItem(player, false))}

              {/* Always add separator and current user with background styling */}
              {currentUser && currentUser.rank > 3 && (
                <>
                  <hr className="border-t-2 border-[#3B354D] my-1 sm:my-2 rounded-full" />
                  {renderPlayerItem(currentUser, true)}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer section */}
        {leaderboardData.length > 3 && (
          <Stack
            direction={"row"}
            spacing={1}
            className="flex justify-center bg-[#120F1C] py-2 sm:py-3 px-2 sm:px-4 border-t-[0.2rem] rounded-b-[0.8rem] border-[#3B354C]"
          >
            <p
              className={`text-xs sm:text-sm ${
                leaderboardData.length > 3
                  ? "text-[#3B354D] hover:text-[#A38CE6] cursor-pointer transition-colors font-bold"
                  : "text-[#232029] cursor-not-allowed font-bold"
              }`}
              onClick={() => leaderboardData.length > 3 && setIsModalOpen(true)}
            >
              VIEW MORE
            </p>
          </Stack>
        )}

        {/* Modal with updated styling for mobile */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-2 sm:p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-[#080511] px-3 sm:px-5 md:px-8 py-4 sm:py-6 border-[#3B354D] border rounded-[0.8rem] w-full max-w-3xl max-h-[90vh] shadow-lg flex flex-col space-y-3 sm:space-y-4 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base sm:text-lg md:text-xl text-white font-semibold">
                Friend Leaderboard
              </h2>
              <hr className="border-t-2 border-[#363D46] w-full mb-2 sm:mb-4" />
              <div className="overflow-y-auto w-full max-h-[300px] sm:max-h-[400px] scrollbar-thin scrollbar-thumb-[#221d35] scrollbar-track-transparent space-y-2 sm:space-y-3">
                {leaderboardData.map((player) => renderPlayerItem(player))}
              </div>
              <button
                className="mt-2 sm:mt-4 bg-[#4D1EE3] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-[#3B1BC9] text-xs sm:text-sm"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Box>
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedFriend || undefined}
      />
    </>
  );
};

export default Leaderboards;
