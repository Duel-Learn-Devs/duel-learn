import { useState, useEffect, useCallback, useRef } from "react";
import Profile from "/profile-picture/default-picture.svg";
import PremiumLabel from "/premium-star.png";
import axios from "axios";
import { UserInfo } from "../../../types/userInfoObject";
import { useUser } from "../../../contexts/UserContext";
import {
  getCurrentLevel,
  DEFAULT_LEVELS,
} from "../../../types/levelRequiredObject";

const ProfileHeader = () => {
  const { user } = useUser();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [profileData, setProfileData] = useState({
    username: "Loading...",
    level: "Loading...",
    xp: "Loading...",
    xpRequired: 200,
    xpToNextLevel: 200,
    friendsCount: 0,
    xpProgress: 0,
    account_type: "Loading...",
    account_type_plan: "Loading...",
  });

  const userInfoCache = useRef<{
    data: UserInfo | null;
    timestamp: number;
    isFetched: boolean;
  }>({
    data: null,
    timestamp: 0,
    isFetched: false,
  });

  const friendCountCache = useRef<{
    count: number;
    timestamp: number;
    isFetched: boolean;
  }>({
    count: 0,
    timestamp: 0,
    isFetched: false,
  });

  const CACHE_TTL = 5 * 60 * 1000; // Cache TTL (5 minutes)

  const isPremium = userInfo?.account_type === "premium";

  const fetchUserInfo = useCallback(
    async (forceRefresh = false) => {
      if (!user?.firebase_uid) return;

      const now = Date.now();
      const hasSessionVisited = sessionStorage.getItem("profileHeaderVisited");

      if (
        !forceRefresh &&
        userInfoCache.current.isFetched &&
        now - userInfoCache.current.timestamp < CACHE_TTL &&
        hasSessionVisited
      ) {
        console.log("Using cached user info data");
        setUserInfo(userInfoCache.current.data);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user-info/details/${
            user.firebase_uid
          }`
        );

        userInfoCache.current = {
          data: response.data.user,
          timestamp: now,
          isFetched: true,
        };

        sessionStorage.setItem("profileHeaderVisited", "true");

        setUserInfo(response.data.user);
      } catch (err) {
        console.error("Error fetching user info:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    },
    [user?.firebase_uid]
  );

  const fetchFriendCount = useCallback(
    async (forceRefresh = false) => {
      if (!user?.firebase_uid) return;

      const now = Date.now();

      if (
        !forceRefresh &&
        friendCountCache.current.isFetched &&
        now - friendCountCache.current.timestamp < CACHE_TTL
      ) {
        console.log("Using cached friend count data");
        setFriendsCount(friendCountCache.current.count);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/friend/friend-count/${
            user.firebase_uid
          }`
        );

        friendCountCache.current = {
          count: response.data.count,
          timestamp: now,
          isFetched: true,
        };

        setFriendsCount(response.data.count);
      } catch (err) {
        console.error("Error fetching friend count:", err);
      }
    },
    [user?.firebase_uid]
  );

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    fetchFriendCount();

    let interval: number | null = null;

    const startPolling = () => {
      interval = window.setInterval(() => {
        fetchFriendCount(true);
      }, 60000);
    };

    const stopPolling = () => {
      if (interval) {
        window.clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFriendCount();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchFriendCount]);

  useEffect(() => {
    if (userInfo) {
      const totalXp = userInfo.exp || 0;
      const currentLevel = getCurrentLevel(totalXp);
      const databaseLevel = userInfo.level || 1;

      if (currentLevel > databaseLevel) {
        updateUserLevel(user?.firebase_uid, currentLevel);
      }

      const currentLevelObj = DEFAULT_LEVELS.find(
        (l) => l.level === currentLevel
      );
      const nextLevelObj = DEFAULT_LEVELS.find(
        (l) => l.level === currentLevel + 1
      );

      if (currentLevelObj && nextLevelObj) {
        const xpInCurrentLevel = totalXp - currentLevelObj.totalExpRequired;
        const xpToNextLevel =
          nextLevelObj.totalExpRequired - currentLevelObj.totalExpRequired;
        const progress = (xpInCurrentLevel / xpToNextLevel) * 100;

        setProfileData({
          username: userInfo.username || "User",
          level: currentLevel.toString(),
          xp: totalXp.toString(),
          xpRequired: nextLevelObj.totalExpRequired,
          xpToNextLevel: xpToNextLevel,
          friendsCount: friendsCount,
          xpProgress: progress,
          account_type: userInfo.account_type || "Free",
          account_type_plan: userInfo.account_type_plan || "Free",
        });
      }
    }
  }, [userInfo, user?.firebase_uid, friendsCount]);

  const updateUserLevel = async (
    firebase_uid: string | undefined,
    newLevel: number
  ) => {
    if (!firebase_uid) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user-info/update-level`,
        {
          firebase_uid,
          level: newLevel,
        }
      );

      if (userInfo) {
        setUserInfo({
          ...userInfo,
          level: newLevel,
        });
      }

      console.log(`User leveled up to level ${newLevel}!`);
    } catch (error) {
      console.error("Failed to update user level:", error);
    }
  };

  return (
    <div
      className="rounded-[1rem] px-6 md:px-14 py-9 flex flex-col md:flex-row items-center md:items-start text-center md:text-left mb-9"
      style={{
        backgroundColor: "rgba(61, 56, 76, 0.25)",
        border: "1px solid rgba(61, 56, 76, 0.25)",
      }}
    >
      <div className="sm:self-center md:self-start mb-6 md:mb-0 md:mr-6">
        <img
          src={userInfo?.display_picture || Profile}
          alt="Profile Avatar"
          className="w-[158px] h-[158px] rounded-[0.8rem] sm:w-[120px] sm:h-[120px] md:w-[158px] md:h-[158px] object-cover"
        />
      </div>

      <div className="flex-1">
        <div className="flex xs:grid justify-center md:justify-start gap-2 items-center">
          <h2 className="text-[30px] font-bold mr-4 text-[#E2DDF3]">
            {profileData.username}
          </h2>
          {isPremium && (
            <>
              <img
                src={PremiumLabel}
                alt="Profile Premium Icon"
                className="w-[15px] h-auto"
              />

              <div className="flex justify-center items-center gap-1 md:justify-start">
                <p className="text-[#9F9BAE] text-[16px">Premium</p>
                <p className="text-[#9F9BAE] text-[16px">|</p>
                <p className="text-[#9F9BAE] text-[16px">
                  {profileData.account_type_plan === "MONTHLY PLAN"
                    ? "Monthly Plan"
                    : profileData.account_type_plan === "ANNUAL PLAN"
                    ? "Annual Plan"
                    : profileData.account_type_plan}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-center md:justify-between">
          <p className="text-[#9F9BAE] text-[16px">Level {profileData.level}</p>
          <p className="text-[#9F9BAE] text-[13px] mt-1 md:ml-2">
            {profileData.xp} / {profileData.xpRequired} XP
          </p>
        </div>

        <div className="relative w-full bg-[#3E3E50] h-[6px] rounded-full mt-2">
          <div
            className="absolute top-0 left-0 bottom-0 h-[6px] bg-[#2B00FF] rounded-full"
            style={{ width: `${profileData.xpProgress}%` }}
          ></div>
        </div>

        <p className="text-[#9F9BAE] text-[16px] mt-12">
          <span className="font-bold">{friendsCount}</span>{" "}
          {friendsCount === 1 ? "Friend" : "Friends"}
        </p>
      </div>
    </div>
  );
};

export const clearProfileCache = () => {
  sessionStorage.removeItem("profileHeaderVisited");
};

export default ProfileHeader;
