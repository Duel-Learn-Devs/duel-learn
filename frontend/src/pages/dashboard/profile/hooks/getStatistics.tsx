import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../../../contexts/UserContext";

interface Statistics {
  totalPvPMatches: number;
  totalPvPWins: number;
  longestStreak: number;
}

interface UseStatisticsReturn {
  statistics: Statistics;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGetStatistics = (): UseStatisticsReturn => {
  const [statistics, setStatistics] = useState<Statistics>({
    totalPvPMatches: 0,
    totalPvPWins: 0,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();

  const fetchStatistics = async () => {
    if (!user?.firebase_uid) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get longest streak from the existing endpoint
      const streakResponse = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/achievement/user-longest-streak/${user.firebase_uid}`
      );

      // For now, use temporary placeholder values for matches and wins
      // until those endpoints are implemented
      const matchesResponse = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/achievement/user-total-pvp-matches/${user.firebase_uid}`
      );
      const totalPvPMatches = matchesResponse.data.total_matches || 0;

      const winsResponse = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/achievement/user-total-pvp-wins/${user.firebase_uid}`
      );
      const totalPvPWins = winsResponse.data.total_wins || 0;

      setStatistics({
        totalPvPMatches,
        totalPvPWins,
        longestStreak: streakResponse.data.highest_streak || 0,
      });
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Failed to fetch statistics. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.firebase_uid) {
      fetchStatistics();
    }
  }, [user?.firebase_uid]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
};
