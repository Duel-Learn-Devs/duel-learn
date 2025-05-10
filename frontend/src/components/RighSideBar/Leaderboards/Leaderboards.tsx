import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  CircularProgress,
  Modal,
  Backdrop,
  Fade,
} from "@mui/material";
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
import cauldronGif from "/General/Cauldron.gif";

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

              // Add rank if missing AND mark current user
              const dataWithRank = parsedData.map((player, index) => ({
                ...player,
                rank: player.rank || index + 1,
                isCurrentUser: player.firebase_uid === user.firebase_uid,
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
          // Add rank if not already present AND mark current user
          const dataWithRank = response.data.map((player, index) => ({
            ...player,
            rank: player.rank || index + 1,
            isCurrentUser: player.firebase_uid === user.firebase_uid,
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

  // New function to render a player item
  const renderPlayerItem = (
    player: LeaderboardPlayer,
    showBackground = true
  ) => {
    return (
      <div
        key={player.firebase_uid}
        className={`flex items-center justify-between  w-full ${
          showBackground && player.isCurrentUser
            ? "bg-[#221f2e] rounded-lg px-4 py-3"
            : ""
        }`}
      >
        {/* Left side with rank, avatar and username */}
        <div className="flex items-center min-w-0 flex-1">
          {/* Rank indicator - fixed width container */}
          <div className="flex-shrink-0 w-6 min-w-[24px] flex justify-center mr-2">
            {player.rank <= 3 ? (
              <img
                src={getMedal(player.rank)}
                alt={`Rank ${player.rank}`}
                className="w-6 h-auto min-w-[30px] "
              />
            ) : (
              <p className="text-sm font-semibold text-center">{player.rank}</p>
            )}
          </div>

          {/* Avatar with fixed dimensions */}
          <div className="flex-shrink-0 mr-2">
            <img
              src={player.display_picture || defaultPicture}
              alt="Avatar"
              onClick={() => handleViewProfile(player.firebase_uid)}
              className="w-10 sm:w-10 md:w-12 cursor-pointer h-auto mr-2 ml-4 hover:scale-105 transition-all duration-300 ease-in-out rounded-[5px] object-cover"
            />
          </div>

          {/* Username with truncation */}
          <p
            className={`truncate text-sm sm:text-base text-[#E2DDF3] ${player.isCurrentUser}`}
          >
            {player.username}
          </p>
        </div>

        {/* Right side with level and XP - now properly pushed to the right edge */}
        <div className="flex-shrink-0 flex items-center gap-1 ml-2">
          <p className="text-xs truncate whitespace-nowrap text-[#9F9BAE]">
            Level {player.level}
          </p>
          <p className="text-[#9F9BAE] text-xs">•</p>
          <p className="text-xs whitespace-nowrap text-[#9F9BAE]">
            EXP {player.exp}
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
        <div className="px-6 sm:px-6 md:px-8 pt-6 sm:pt-6 md:pt-8 pb-6">
          <div className="flex flex-row items-center mb-4 sm:mb-4 gap-2 sm:gap-4">
            <img
              src="/leaderboard.png"
              className="w-6 sm:w-8 md:w-8 h-auto"
              alt="icon"
            />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold">
              Leaderboards
            </h2>
          </div>

          <hr className="border-t-2 border-[#3B354D] mb-2 sm:mb-4 rounded-full" />

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={1}
            >
              <img
                src={cauldronGif}
                alt="Loading..."
                style={{ width: "8rem", height: "auto" }}
              />
            </Box>
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
              {/* Top 3 Players - always without highlighting */}
              {top3Players.map((player) => renderPlayerItem(player, false))}

              {/* Always show current user with separator below top 3 */}
              {currentUser && (
                <>
                  <hr className="border-t-2 border-[#3B354D] rounded-full" />
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

        {/* Modal with transition effects */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              zIndex: 49,
            },
          }}
        >
          <Fade in={isModalOpen}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "689px",
                maxWidth: "95%",
                maxHeight: "95vh",
                bgcolor: "#080511",
                border: "1px solid #3B354D",
                borderRadius: "0.8rem",
                boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
                p: { xs: 2, sm: 3, md: 4 },
                zIndex: 50,
              }}
              className="px-3 sm:px-5 md:px-8 py-4 sm:py-6 flex flex-col space-y-3 sm:space-y-4 items-center"
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
            </Box>
          </Fade>
        </Modal>
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
