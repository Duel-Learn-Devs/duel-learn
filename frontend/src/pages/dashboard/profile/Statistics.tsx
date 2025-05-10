import { useGetStatistics } from "./hooks/getStatistics";
import pvpMatches from "/images/pvp-matches-icon.svg";
import pvpWins from "/images/pvp-wins-icon.svg";
import longestStreak from "/images/longest-streak-icon.svg";

const Statistics = () => {
  // Use the hook to get statistics data
  const { statistics, loading, error } = useGetStatistics();

  // Handle loading state
  if (loading) {
    return (
      <div>
        <h3 className="text-white text-2xl font-semibold mb-5">Statistics</h3>
        <div className="rounded-[1rem] px-5 py-8 mb-10 border-[0.2rem] border-[#3B354C] text-center">
          <p className="text-white">Loading statistics...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div>
        <h3 className="text-white text-2xl font-semibold mb-5">Statistics</h3>
        <div className="rounded-[1rem] px-5 py-8 mb-10 border-[0.2rem] border-[#3B354C] text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-white text-2xl font-semibold mb-5">Statistics</h3>
      <div className="rounded-[1rem] px-5 py-8 mb-10 border-[0.2rem] border-[#3B354C]">
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Total PvP Matches */}
          <div className="flex flex-col items-center gap-3 bg-transparent pr-4 relative">
            <img src={pvpMatches} alt="PvP Matches" />
            <h3 className="text-2xl font-bold text-white">
              {statistics.totalPvPMatches}
            </h3>
            <p className="text-gray-400 text-sm">Total PvP Matches</p>
            <div className="absolute top-1/2 right-0 h-[110px] border-l border-[2px] border-[#3B354C] transform -translate-y-1/2"></div>
          </div>

          {/* Total PvP Wins */}
          <div className="flex flex-col items-center gap-3 bg-transparent pr-4 relative">
            <img src={pvpWins} alt="PvP Wins" />
            <h3 className="text-2xl font-bold text-white">
              {statistics.totalPvPWins}
            </h3>
            <p className="text-gray-400 text-sm">Total PvP Wins</p>
            <div className="absolute top-1/2 right-0 h-[110px] border-l border-[2px] border-[#3B354C] transform -translate-y-1/2"></div>
          </div>

          {/* Longest Streak */}
          <div className="flex flex-col items-center gap-3 bg-transparent relative">
            <img src={longestStreak} alt="Longest Streak" />
            <h3 className="text-2xl font-bold text-white">
              {statistics.longestStreak}
            </h3>
            <p className="text-gray-400 text-sm">Longest Streak</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
