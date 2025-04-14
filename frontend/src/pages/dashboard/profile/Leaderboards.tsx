import { useState, useEffect } from "react";
import GoldMedal from "/General/gold-medal.svg";
import SilverMedal from "/General/silver-medal.svg";
import BronzeMedal from "/General/bronze-medal.svg";
import "./media-queries/LeaderboardResponsive.css";
import { useUser } from "../../../contexts/UserContext";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import defaultProfile from "/profile-picture/default-picture.svg";
import noLeaderboard from "/images/noLeaderboard.svg";
import { LeaderboardPlayer } from "../../../types/leaderboardObject";

const Leaderboards = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!user?.firebase_uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = `${
          import.meta.env.VITE_BACKEND_URL
        }/api/friend/leaderboard/${user.firebase_uid}`;
        console.log("Fetching leaderboard from:", apiUrl);

        const response = await axios.get(apiUrl);
        console.log("Leaderboard response:", response.data);

        if (Array.isArray(response.data)) {
          // Add rank if not already present
          const dataWithRank = response.data.map((player, index) => ({
            ...player,
            rank: player.rank || index + 1,
          }));

          setLeaderboardData(dataWithRank);
          setError(error);
        } else {
          console.error("Unexpected response format:", typeof response.data);
          setLeaderboardData([]);
          setError(`Invalid data format: expected array`);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [user]);

  // Get friend count for displaying appropriate UI
  const [friendCount, setFriendCount] = useState(0);
  useEffect(() => {
    const fetchFriendCount = async () => {
      if (!user?.firebase_uid) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/friend/friend-count/${
            user.firebase_uid
          }`
        );
        setFriendCount(response.data.count || 0);
      } catch (error) {
        console.error("Error fetching friend count:", error);
      }
    };

    fetchFriendCount();
  }, [user]);

  // Medal assignment function
  const getMedal = (rank: number): string | undefined => {
    if (rank === 1) return GoldMedal;
    if (rank === 2) return SilverMedal;
    if (rank === 3) return BronzeMedal;
    return undefined;
  };

  const getDefaultAvatar = (player: LeaderboardPlayer) => {
    return player.display_picture || defaultProfile;
  };

  const openModal = () => setIsModalOpen(true);

  return (
    <div className="mt-10">
      <h3 className="text-white text-2xl font-bold mb-5">Leaderboards</h3>

      {/* Show Leaderboard if we have at least 5 friends */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      ) : friendCount >= 2 ? (
        <div className="rounded-[0.8rem] border-[0.2rem] border-[#3B354C]">
          {leaderboardData.slice(0, 3).map((player, index) => (
            <div
              key={index}
              className="rank-entry"
              style={{
                backgroundColor: index % 2 === 0 ? "#120F1C" : "transparent",
                borderRadius: "0.8rem",
              }}
            >
              {/* Medal + Profile Pic (Grouped) */}
              <div className="rank-profile">
                {/* Medal */}
                <div className="rank-icon">
                  {getMedal(player.rank) ? (
                    <img
                      src={getMedal(player.rank)}
                      alt={`Rank ${player.rank} Medal`}
                      className="medal-icon"
                    />
                  ) : (
                    <span className="rank-number mr-4 ml-4">{player.rank}</span>
                  )}
                </div>

                {/* Profile Picture */}
                <div className="profile-icon">
                  <img
                    src={getDefaultAvatar(player)}
                    alt="Profile"
                    className="w-12 h-auto sm:w-4 rounded-[0.8rem] object-cover"
                  />
                </div>
              </div>

              {/* Player Name - highlight current user */}
              <span
                className={`player-name ${
                  player.isCurrentUser ? "text-[#A38CE6]" : ""
                }`}
              >
                {player.username}
              </span>

              {/* XP */}
              <span className="xp-text">{player.exp} XP</span>

              {/* Level */}
              <span className="level-text">LVL {player.level}</span>
            </div>
          ))}

          {leaderboardData.length > 3 && (
            <button
              className="w-full cursor-pointer sm:py-2.5 md:py-3 lg:py-4 rounded-b-[0.8rem] bg-[#120F1D] text-[#5b5277] text-md border-t-2 border-[#3B354C] hover:text-white"
              onClick={openModal}
            >
              VIEW MORE
            </button>
          )}
        </div>
      ) : (
        // Show "No Friends More Than 5" section
        <div className="mt-10 flex flex-col items-center justify-center border-[0.2rem] border-[#3B354C] rounded-[0.8rem]">
          <div className="flex flex-col items-center justify-center px-10 py-14">
            <img
              src={noLeaderboard}
              alt="No Leaderboard"
              className=" w-[16em] h-auto"
            />
            <p className="text-center  text-[#9F9BAE] mt-4">
              Add more friends to unlock the Leaderboards and <br />
              compete with them for the top spot!
            </p>
          </div>
        </div>
      )}

      {/* Modal - reusing the same modal structure from sidebar leaderboard */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#080511] px-6 py-8 border-[#3B354D] border rounded-[0.8rem] w-full max-w-[689px] max-h-[90vh] shadow-lg flex flex-col space-y-6 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl text-white font-semibold">
              Friend Leaderboard
            </h2>
            <hr className="border-t-2 border-[#363D46] w-full mb-6" />
            <div className="overflow-y-auto w-full max-h-[40vh] scrollbar-thin scrollbar-thumb-[#221d35] scrollbar-track-transparent space-y-4">
              {leaderboardData.map((player) => (
                <div
                  key={player.firebase_uid}
                  className={`flex items-center justify-between w-full px-6 mb-4 ${
                    player.isCurrentUser ? "bg-[#221f2e] rounded-lg p-2" : ""
                  }`}
                >
                  <div className="flex items-center">
                    {player.rank <= 3 ? (
                      <img
                        src={getMedal(player.rank)}
                        alt={`Rank ${player.rank}`}
                        className="w-8 h-8 mr-5"
                      />
                    ) : (
                      <p className="text-lg font-semibold ml-3 mr-7">
                        {player.rank}
                      </p>
                    )}
                    <img
                      src={getDefaultAvatar(player)}
                      alt="Avatar"
                      className="w-12 h-12 rounded-[5px] object-cover mr-3"
                    />
                    <p
                      className={`font-medium ${
                        player.isCurrentUser ? "text-[#A38CE6]" : ""
                      }`}
                    >
                      {player.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">{player.exp} XP</p>
                    <p className="text-sm text-gray-500">
                      Level {player.level}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-6 bg-[#4D1EE3] text-white px-6 py-2 rounded-[0.8rem] hover:scale-105 transition-all ease-in-out"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboards;
