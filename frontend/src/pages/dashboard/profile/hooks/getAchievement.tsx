import {
  AchievementObject,
  FormattedAchievement,
} from "../../../../types/achievementObject";
import { useCallback, useRef } from "react";

// Update the getFullImagePath function to properly handle public folder assets
const getFullImagePath = (relativePath: string): string => {
  if (!relativePath) return "";

  // Normalize path - remove any double slashes, ensure it starts with /
  let normalizedPath = relativePath.replace(/\/+/g, "/");
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = "/" + normalizedPath;
  }

  // When using the public folder, we use relative paths from the root
  // No need for a CDN URL as these assets are served directly from your app

  // Add cache-busting parameter for production to prevent stale images
  const cacheBuster = import.meta.env.PROD
    ? `?v=${new Date().getTime().toString().slice(0, 8)}`
    : "";

  console.log("Using public folder image path:", normalizedPath);
  return `${normalizedPath}${cacheBuster}`;
};

// Define the response structure
interface AchievementResponse {
  success: boolean;
  data: AchievementObject[];
  message?: string;
}

export const useGetAchievements = () => {
  // Update the cache type
  const achievementsCache = useRef<{
    isFetched: boolean;
    data: AchievementResponse | null;
  }>({
    isFetched: false,
    data: null,
  });
  const fetchStartTimeRef = useRef(0);

  const fetchAchievements = useCallback(async (forceRefresh = false) => {
    const isBrowser = typeof window !== "undefined";
    const isFirstLoad =
      isBrowser && !sessionStorage.getItem("achievementsVisited");

    // Return cached data only on subsequent visits, not first load
    if (achievementsCache.current.isFetched && !forceRefresh && !isFirstLoad) {
      return achievementsCache.current.data;
    }

    // Mark that we've visited this page
    if (isBrowser && isFirstLoad) {
      sessionStorage.setItem("achievementsVisited", "true");
    }

    try {
      const startTime = Date.now();
      fetchStartTimeRef.current = startTime;

      // Add cache-busting parameter when forcing a refresh
      const url = `${
        import.meta.env.VITE_BACKEND_URL
      }/api/achievement/get-achievements${
        forceRefresh ? `?timestamp=${Date.now()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Fetch duration: ${duration} ms`);
      if (duration > 1000) {
        console.warn(`Fetch took too long: ${duration} ms`);
      }
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      // Store the fetched data in the cache
      achievementsCache.current = {
        isFetched: true,
        data: data,
      };

      return data as AchievementResponse;
    } catch (error) {
      console.error("Error fetching achievements:", error);
      // Still mark as fetched to prevent infinite retry loops
      achievementsCache.current.isFetched = true;
      return null;
    }
  }, []);

  // Return the fetch function so it can be used
  return { fetchAchievements };
};

export const getMysticElder = () => {
  // Define the response structure for Mystic Elder
  interface MysticElderResponse {
    success: boolean;
    userLevel: number;
    mysticElderAchievement: {
      achievement_id: number;
      achievement_name: string;
      achievement_description: string;
      achievement_requirement: number;
      achievement_level: number;
      achievement_picture_url: string;
      achieved: boolean;
    };
    message?: string;
  }

  // Add structured response with formatted achievement
  interface EnhancedMysticElderResponse extends MysticElderResponse {
    formattedAchievement: FormattedAchievement;
  }

  const achievementsCache = useRef<{
    isFetched: boolean;
    data: EnhancedMysticElderResponse | null;
  }>({
    isFetched: false,
    data: null,
  });

  const fetchStartTimeRef = useRef(0);

  // Helper functions for Mystic Elder achievement processing
  const getMysticElderLevel = (userLevel: number): number => {
    if (userLevel >= 30) return 4; // Gold
    if (userLevel >= 20) return 3; // Silver
    if (userLevel >= 10) return 2; // Bronze
    if (userLevel >= 5) return 1; // White/Basic
    return 0; // Locked
  };

  const getMysticElderRequirement = (level: number): number => {
    if (level === 0) return 5;
    if (level === 1) return 10;
    if (level === 2) return 20;
    if (level === 3) return 30;
    return 30; // Max level
  };

  const getMysticElderDescription = (level: number): string => {
    if (level === 0) return "Reach level 5.";
    if (level === 1) return "Reach level 10.";
    if (level === 2) return "Reach level 20.";
    if (level === 3 || level === 4) return "Reach level 30.";
    return "Reach level 5.";
  };

  const getMysticElderProgress = (
    level: number,
    actualUserLevel: number
  ): number => {
    // Full achievements remain the same
    if (level === 4) return 100; // Gold (max level)
    if (level === 3) return 100; // Silver (level 3 complete)
    if (level === 2) return 60; // Bronze (level 2 complete)
    if (level === 1) return 20; // White (level 1 complete)

    // For users below level 5, make progress more visible
    if (level === 0 && actualUserLevel > 0) {
      // Calculate proportional progress toward level 5 (first threshold)
      // Scale it to be 1-19% for levels 1-4
      return Math.max(5, Math.floor((actualUserLevel / 5) * 20)); // Minimum 5% for visibility
    }

    return 0; // Only if truly at level 0
  };

  // Update the getMysticElderImage function in your hook
  const getMysticElderImage = (baseImage: string, level: number): string => {
    if (!baseImage) return "";

    // Extract path and base filename
    let path = "";
    let filename = baseImage;

    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }

    // Get the base name - remove any existing suffix regardless of what it is
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");

    // Determine suffix based on user level
    let suffix = "-w.png"; // Default
    if (level >= 4) suffix = "-g.png"; // Gold
    else if (level >= 3) suffix = "-s.png"; // Silver
    else if (level >= 2) suffix = "-b.png"; // Bronze

    // Use getFullImagePath for consistent path handling
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    console.log("Generated Mystic Elder image path:", resultPath);

    return resultPath;
  };

  const fetchMysticElder = useCallback(
    async (firebase_uid: string, forceRefresh = false) => {
      const isBrowser = typeof window !== "undefined";
      const isFirstLoad =
        isBrowser && !sessionStorage.getItem("achievementsVisited");

      // Return cached data only on subsequent visits, not first load
      if (
        achievementsCache.current.isFetched &&
        !forceRefresh &&
        !isFirstLoad
      ) {
        return achievementsCache.current.data;
      }

      // Mark that we've visited this page
      if (isBrowser && isFirstLoad) {
        sessionStorage.setItem("achievementsVisited", "true");
      }

      try {
        const startTime = Date.now();
        fetchStartTimeRef.current = startTime;

        const url = `${
          import.meta.env.VITE_BACKEND_URL
        }/api/achievement/check-mystic-elder/${firebase_uid}${
          forceRefresh ? `?timestamp=${Date.now()}` : ""
        }`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`Fetch Mystic Elder duration: ${duration} ms`);

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = (await response.json()) as MysticElderResponse;

        // Process the achievement data to handle progressive levels
        const userLevel = data.userLevel;
        const mysticElderLevel = getMysticElderLevel(userLevel);

        // Determine progress text based on level
        let progressText = "";
        if (userLevel >= 30) {
          progressText = "Complete";
        } else if (userLevel >= 20) {
          progressText = `${userLevel}/30`;
        } else if (userLevel >= 10) {
          progressText = `${userLevel}/20`;
        } else if (userLevel >= 5) {
          progressText = `${userLevel}/10`;
        } else if (userLevel > 0) {
          progressText = `${userLevel}/5`;
        } else {
          progressText = "0/5";
        }

        // Create formatted achievement with correct level and image
        const formattedAchievement: FormattedAchievement = {
          id: data.mysticElderAchievement.achievement_id,
          name: data.mysticElderAchievement.achievement_name,
          description: getMysticElderDescription(mysticElderLevel),
          progress: getMysticElderProgress(mysticElderLevel, userLevel),
          baseImage: getMysticElderImage(
            data.mysticElderAchievement.achievement_picture_url,
            mysticElderLevel
          ),
          progressText: progressText, // Add the new progress text
        };

        // Create enhanced response with formatted achievement
        const enhancedData: EnhancedMysticElderResponse = {
          ...data,
          formattedAchievement,
        };

        // Store the processed data in cache
        achievementsCache.current = {
          isFetched: true,
          data: enhancedData,
        };

        return enhancedData;
      } catch (error) {
        console.error("Error fetching Mystic Elder achievement:", error);
        achievementsCache.current.isFetched = true;
        return null;
      }
    },
    []
  );

  // Function to clear the cache if needed
  const clearCache = useCallback(() => {
    achievementsCache.current = {
      isFetched: false,
      data: null,
    };
  }, []);

  // Return the fetch function so it can be used
  return { fetchMysticElder, clearCache };
};

export const getWisdomCollector = () => {
  // Define the response structure for Wisdom Collector
  interface WisdomCollectorResponse {
    success: boolean;
    userStudyMaterialCount: number;
    wisdomCollectorAchievement: {
      achievement_id: number;
      achievement_name: string;
      achievement_description: string;
      achievement_requirement: number;
      achievement_level: number;
      achievement_picture_url: string;
      achieved: boolean;
    };
    message?: string;
  }

  // Add structured response with formatted achievement
  interface EnhancedWisdomCollectorResponse extends WisdomCollectorResponse {
    formattedAchievement: FormattedAchievement;
  }

  const achievementsCache = useRef<{
    isFetched: boolean;
    data: EnhancedWisdomCollectorResponse | null;
  }>({
    isFetched: false,
    data: null,
  });

  const fetchStartTimeRef = useRef(0);

  // Helper functions for Wisdom Collector achievement processing
  const getWisdomCollectorLevel = (studyMaterialCount: number): number => {
    if (studyMaterialCount >= 30) return 4; // Gold
    if (studyMaterialCount >= 20) return 3; // Silver
    if (studyMaterialCount >= 10) return 2; // Bronze
    if (studyMaterialCount >= 5) return 1; // White/Basic
    return 0; // Locked
  };

  const getWisdomCollectorRequirement = (level: number): number => {
    if (level === 0) return 5;
    if (level === 1) return 10;
    if (level === 2) return 20;
    if (level === 3) return 30;
    return 30; // Max level
  };

  const getWisdomCollectorDescription = (level: number): string => {
    if (level === 0) return "Create 5 study materials.";
    if (level === 1) return "Create 10 study materials.";
    if (level === 2) return "Create 20 study materials.";
    if (level === 3 || level === 4) return "Create 30 study materials.";
    return "Create 5 study materials.";
  };

  const getWisdomCollectorProgress = (
    level: number,
    actualCount: number
  ): number => {
    // Full achievements remain the same
    if (level === 4) return 100; // Gold (max level)
    if (level === 3) return 100; // Silver (level 3 complete)
    if (level === 2) return 60; // Bronze (level 2 complete)
    if (level === 1) return 20; // White (level 1 complete)

    // For users below 5 study materials, create a more accurate visual representation
    if (level === 0 && actualCount > 0) {
      // Make the progress bar more accurately represent actual completion percentage
      // 1/5 = 4%, 2/5 = 8%, 3/5 = 12%, 4/5 = 16%
      const baseProgress = Math.floor((actualCount / 5) * 50);

      // Enhance visual progress to make it more noticeable while staying below level 1 (20%)
      // This gives a better visual sense of how far along they are
      return Math.min(19, Math.max(baseProgress, actualCount * 100));
    }

    return 0; // Only if truly at count 0
  };

  const getWisdomCollectorImage = (
    baseImage: string,
    level: number
  ): string => {
    if (!baseImage) return "";

    // Extract path and base filename
    let path = "";
    let filename = baseImage;

    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }

    // Get the base name - remove any existing suffix regardless of what it is
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");

    // Determine suffix based on user level
    let suffix = "-w.png"; // Default
    if (level >= 4) suffix = "-g.png"; // Gold
    else if (level >= 3) suffix = "-s.png"; // Silver
    else if (level >= 2) suffix = "-b.png"; // Bronze

    // Use getFullImagePath for consistent path handling
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    console.log("Generated Wisdom Collector image path:", resultPath);

    return resultPath;
  };

  const fetchWisdomCollector = useCallback(async (firebase_uid: string) => {
    const isBrowser = typeof window !== "undefined";
    const isFirstLoad =
      isBrowser && !sessionStorage.getItem("achievementsVisited");

    // Return cached data only on subsequent visits, not first load
    if (achievementsCache.current.isFetched && !isFirstLoad) {
      return achievementsCache.current.data;
    }

    // Mark that we've visited this page
    if (isBrowser && isFirstLoad) {
      sessionStorage.setItem("achievementsVisited", "true");
    }

    try {
      const startTime = Date.now();
      fetchStartTimeRef.current = startTime;

      const url = `${
        import.meta.env.VITE_BACKEND_URL
      }/api/achievement/check-wisdom-collector/${firebase_uid}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Fetch Wisdom Collector duration: ${duration} ms`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = (await response.json()) as WisdomCollectorResponse;

      // Process the achievement data to handle progressive levels
      const studyMaterialCount = data.userStudyMaterialCount;
      const wisdomCollectorLevel = getWisdomCollectorLevel(studyMaterialCount);

      // Determine progress text based on count
      let progressText = "";
      if (studyMaterialCount >= 30) {
        progressText = "Complete";
      } else if (studyMaterialCount >= 20) {
        progressText = `${studyMaterialCount}/30`;
      } else if (studyMaterialCount >= 10) {
        progressText = `${studyMaterialCount}/20`;
      } else if (studyMaterialCount >= 5) {
        progressText = `${studyMaterialCount}/10`;
      } else if (studyMaterialCount > 0) {
        progressText = `${studyMaterialCount}/5`;
      } else {
        progressText = "0/5";
      }

      // Create formatted achievement with correct level and image
      const formattedAchievement: FormattedAchievement = {
        id: data.wisdomCollectorAchievement.achievement_id,
        name: data.wisdomCollectorAchievement.achievement_name,
        description: getWisdomCollectorDescription(wisdomCollectorLevel),
        progress: getWisdomCollectorProgress(
          wisdomCollectorLevel,
          studyMaterialCount
        ),
        baseImage: getWisdomCollectorImage(
          data.wisdomCollectorAchievement.achievement_picture_url,
          wisdomCollectorLevel
        ),
        progressText: progressText, // Add the new progress text
      };

      // Create enhanced response with formatted achievement
      const enhancedData: EnhancedWisdomCollectorResponse = {
        ...data,
        formattedAchievement,
      };

      // Store the processed data in cache
      achievementsCache.current = {
        isFetched: true,
        data: enhancedData,
      };

      return enhancedData;
    } catch (error) {
      console.error("Error fetching Wisdom Collector achievement:", error);
      achievementsCache.current.isFetched = true;
      return null;
    }
  }, []);

  // Function to clear the cache if needed
  const clearCache = useCallback(() => {
    achievementsCache.current = {
      isFetched: false,
      data: null,
    };
  }, []);

  // Return the fetch function so it can be used
  return { fetchWisdomCollector, clearCache };
};

export const getArcaneScholar = () => {
  // Define the response structure for Arcane Scholar
  interface ArcaneScholarResponse {
    success: boolean;
    userStudyMaterialCount: number; // This will contain completed study sessions count
    arcaneScholarAchievement: {
      achievement_id: number;
      achievement_name: string;
      achievement_description: string;
      achievement_requirement: number;
      achievement_level: number;
      achievement_picture_url: string;
      achieved: boolean;
    };
    message?: string;
  }

  // Add structured response with formatted achievement
  interface EnhancedArcaneScholarResponse extends ArcaneScholarResponse {
    formattedAchievement: FormattedAchievement;
  }

  const achievementsCache = useRef<{
    isFetched: boolean;
    data: EnhancedArcaneScholarResponse | null;
  }>({
    isFetched: false,
    data: null,
  });

  const fetchStartTimeRef = useRef(0);

  // Helper functions for Arcane Scholar achievement processing
  const getArcaneScholarLevel = (completedSessionsCount: number): number => {
    if (completedSessionsCount >= 20) return 4; // Gold
    if (completedSessionsCount >= 15) return 3; // Silver
    if (completedSessionsCount >= 10) return 2; // Bronze
    if (completedSessionsCount >= 5) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getArcaneScholarRequirement = (level: number): number => {
    if (level === 0) return 5;
    if (level === 1) return 10;
    if (level === 2) return 15;
    if (level === 3) return 20;
    return 20; // Max level
  };

  const getArcaneScholarDescription = (level: number): string => {
    if (level === 0) return "Complete 5 study sessions.";
    if (level === 1) return "Complete 10 study sessions.";
    if (level === 2) return "Complete 15 study sessions.";
    if (level === 3 || level === 4) return "Complete 20 study sessions.";
    return "Complete 5 study sessions.";
  };

  const getArcaneScholarProgress = (
    level: number,
    actualCount: number
  ): number => {
    // Full achievements remain the same
    if (level === 4) return 100; // Gold (max level)
    if (level === 3) return 100; // Silver (level 3 complete)
    if (level === 2) return 60; // Bronze (level 2 complete)
    if (level === 1) return 20; // White (level 1 complete)

    // For users below 5 completed sessions, create a more accurate visual representation
    if (level === 0 && actualCount > 0) {
      // Make the progress bar more accurately represent actual completion percentage
      // 1/5 = 4%, 2/5 = 8%, 3/5 = 12%, 4/5 = 16%
      // Using the same formula as WisdomCollector for consistency
      const baseProgress = Math.floor((actualCount / 5) * 20);
      return Math.min(19, Math.max(baseProgress, actualCount * 4));
    }

    return 0; // Only if truly at count 0
  };

  const getArcaneScholarImage = (baseImage: string, level: number): string => {
    if (!baseImage) return "";

    // Extract path and base filename
    let path = "";
    let filename = baseImage;

    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }

    // Get the base name - remove any existing suffix regardless of what it is
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");

    // Determine suffix based on user level
    let suffix = "-w.png"; // Default
    if (level >= 4) suffix = "-g.png"; // Gold
    else if (level >= 3) suffix = "-s.png"; // Silver
    else if (level >= 2) suffix = "-b.png"; // Bronze

    // Use getFullImagePath for consistent path handling
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    console.log("Generated Arcane Scholar image path:", resultPath);

    return resultPath;
  };

  const fetchArcaneScholar = useCallback(async (firebase_uid: string) => {
    const isBrowser = typeof window !== "undefined";
    const isFirstLoad =
      isBrowser && !sessionStorage.getItem("achievementsVisited");

    // Return cached data only on subsequent visits, not first load
    if (achievementsCache.current.isFetched && !isFirstLoad) {
      return achievementsCache.current.data;
    }

    // Mark that we've visited this page
    if (isBrowser && isFirstLoad) {
      sessionStorage.setItem("achievementsVisited", "true");
    }

    try {
      const startTime = Date.now();
      fetchStartTimeRef.current = startTime;

      const url = `${
        import.meta.env.VITE_BACKEND_URL
      }/api/achievement/check-arcane-scholar/${firebase_uid}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Fetch Arcane Scholar duration: ${duration} ms`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = (await response.json()) as ArcaneScholarResponse;

      // Even if count is 0, proceed with formatting the achievement
      const completedSessionsCount = data.userStudyMaterialCount || 0;
      const arcaneScholarLevel = getArcaneScholarLevel(completedSessionsCount);

      // Determine progress text based on count
      let progressText = "";
      if (completedSessionsCount >= 20) {
        progressText = "Complete";
      } else if (completedSessionsCount >= 15) {
        progressText = `${completedSessionsCount}/20`;
      } else if (completedSessionsCount >= 10) {
        progressText = `${completedSessionsCount}/15`;
      } else if (completedSessionsCount >= 5) {
        progressText = `${completedSessionsCount}/10`;
      } else {
        progressText = `${completedSessionsCount}/5`;
      }

      // Create formatted achievement with correct level and image
      const formattedAchievement: FormattedAchievement = {
        id: data.arcaneScholarAchievement.achievement_id,
        name: data.arcaneScholarAchievement.achievement_name,
        description: getArcaneScholarDescription(arcaneScholarLevel),
        progress: getArcaneScholarProgress(
          arcaneScholarLevel,
          completedSessionsCount
        ),
        baseImage: getArcaneScholarImage(
          data.arcaneScholarAchievement.achievement_picture_url,
          arcaneScholarLevel
        ),
        progressText: progressText,
      };

      // Create enhanced response with formatted achievement
      const enhancedData: EnhancedArcaneScholarResponse = {
        ...data,
        formattedAchievement,
      };

      // Store the processed data in cache
      achievementsCache.current = {
        isFetched: true,
        data: enhancedData,
      };

      return enhancedData;
    } catch (error) {
      console.error("Error fetching Arcane Scholar achievement:", error);
      achievementsCache.current.isFetched = true;
      return null;
    }
  }, []);

  // Function to clear the cache if needed
  const clearCache = useCallback(() => {
    achievementsCache.current = {
      isFetched: false,
      data: null,
    };
  }, []);

  // Return the fetch function so it can be used
  return { fetchArcaneScholar, clearCache };
};

export const getBattleArchmage = () => {
  // Define the response structure for Battle Archmage
  interface BattleArchmageResponse {
    success: boolean;
    total_matches: number; // Matches the response field from your API
    battleArchmageAchievement: {
      achievement_id: number;
      achievement_name: string;
      achievement_description: string;
      achievement_requirement: number;
      achievement_level: number;
      achievement_picture_url: string;
      achieved: boolean;
    };
    message?: string;
  }

  // Add structured response with formatted achievement
  interface EnhancedBattleArchmageResponse extends BattleArchmageResponse {
    formattedAchievement: FormattedAchievement;
  }

  const achievementsCache = useRef<{
    isFetched: boolean;
    data: EnhancedBattleArchmageResponse | null;
  }>({
    isFetched: false,
    data: null,
  });

  const fetchStartTimeRef = useRef(0);

  // Helper functions for Battle Archmage achievement processing
  const getBattleArchmageLevel = (pvpMatches: number): number => {
    if (pvpMatches >= 30) return 4; // Gold
    if (pvpMatches >= 20) return 3; // Silver
    if (pvpMatches >= 10) return 2; // Bronze
    if (pvpMatches >= 5) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getBattleArchmageRequirement = (level: number): number => {
    if (level === 0) return 5;
    if (level === 1) return 10;
    if (level === 2) return 20;
    if (level === 3) return 30;
    return 30; // Max level
  };

  const getBattleArchmageDescription = (level: number): string => {
    if (level === 0) return "Reach 5 PvP battles.";
    if (level === 1) return "Reach 10 PvP battles.";
    if (level === 2) return "Reach 20 PvP battles.";
    if (level === 3 || level === 4) return "Reach 30 PvP battles.";
    return "Reach 5 PvP battles.";
  };

  const getBattleArchmageProgress = (
    level: number,
    actualMatches: number
  ): number => {
    // Full achievements remain the same
    if (level === 4) return 100; // Gold (max level)
    if (level === 3) return 100; // Silver (level 3 complete)
    if (level === 2) return 60; // Bronze (level 2 complete)
    if (level === 1) return 20; // White (level 1 complete)

    // For users below 5 matches, create a more accurate visual representation
    if (level === 0 && actualMatches > 0) {
      // Make the progress bar more accurately represent actual completion percentage
      const baseProgress = Math.floor((actualMatches / 5) * 20);
      return Math.min(19, Math.max(baseProgress, actualMatches * 4));
    }

    return 0; // Only if truly at count 0
  };

  const getBattleArchmageImage = (baseImage: string, level: number): string => {
    if (!baseImage) return "";

    // Extract path and base filename
    let path = "";
    let filename = baseImage;

    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }

    // Get the base name - remove any existing suffix regardless of what it is
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");

    // Determine suffix based on user level
    let suffix = "-w.png"; // Default
    if (level >= 4) suffix = "-g.png"; // Gold
    else if (level >= 3) suffix = "-s.png"; // Silver
    else if (level >= 2) suffix = "-b.png"; // Bronze

    // Use getFullImagePath for consistent path handling
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    console.log("Generated Battle Archmage image path:", resultPath);

    return resultPath;
  };

  const fetchBattleArchmage = useCallback(async (firebase_uid: string) => {
    const isBrowser = typeof window !== "undefined";
    const isFirstLoad =
      isBrowser && !sessionStorage.getItem("achievementsVisited");

    // Return cached data only on subsequent visits, not first load
    if (achievementsCache.current.isFetched && !isFirstLoad) {
      return achievementsCache.current.data;
    }

    // Mark that we've visited this page
    if (isBrowser && isFirstLoad) {
      sessionStorage.setItem("achievementsVisited", "true");
    }

    try {
      const startTime = Date.now();
      fetchStartTimeRef.current = startTime;

      // Use your getUserTotalPvPMatches endpoint
      const url = `${
        import.meta.env.VITE_BACKEND_URL
      }/api/achievement/user-total-pvp-matches/${firebase_uid}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Fetch Battle Archmage duration: ${duration} ms`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const apiResponse = await response.json();
      const pvpMatches = apiResponse.total_matches || 0;

      // Use the actual achievement data from API instead of mock data
      const battleArchmageAchievement = apiResponse.battleArchmageAchievement;

      // Create the response structure with real data
      const data: BattleArchmageResponse = {
        success: true,
        total_matches: pvpMatches,
        battleArchmageAchievement,
      };

      // Process the achievement data to handle progressive levels
      const battleArchmageLevel = getBattleArchmageLevel(pvpMatches);

      // Determine progress text based on count
      let progressText = "";
      if (pvpMatches >= 30) {
        progressText = "Complete";
      } else if (pvpMatches >= 20) {
        progressText = `${pvpMatches}/30`;
      } else if (pvpMatches >= 10) {
        progressText = `${pvpMatches}/20`;
      } else if (pvpMatches >= 5) {
        progressText = `${pvpMatches}/10`;
      } else {
        progressText = `${pvpMatches}/5`;
      }

      // Create formatted achievement with correct level and image
      const formattedAchievement: FormattedAchievement = {
        id: battleArchmageAchievement.achievement_id,
        name: battleArchmageAchievement.achievement_name,
        description: getBattleArchmageDescription(battleArchmageLevel),
        progress: getBattleArchmageProgress(battleArchmageLevel, pvpMatches),
        baseImage: getBattleArchmageImage(
          battleArchmageAchievement.achievement_picture_url,
          battleArchmageLevel
        ),
        progressText: progressText,
      };

      // Create enhanced response with formatted achievement
      const enhancedData: EnhancedBattleArchmageResponse = {
        ...data,
        formattedAchievement,
      };

      // Store the processed data in cache
      achievementsCache.current = {
        isFetched: true,
        data: enhancedData,
      };

      return enhancedData;
    } catch (error) {
      console.error("Error fetching Battle Archmage achievement:", error);
      achievementsCache.current.isFetched = true;
      return null;
    }
  }, []);

  // Function to clear the cache if needed
  const clearCache = useCallback(() => {
    achievementsCache.current = {
      isFetched: false,
      data: null,
    };
  }, []);

  // Return the fetch function so it can be used
  return { fetchBattleArchmage, clearCache };
};

export const getDuelist = () => {
  // Define the response structure for Duelist
  interface DuelistResponse {
    success: boolean;
    highest_streak: number; // From the API
    duelistAchievement: {
      achievement_id: number;
      achievement_name: string;
      achievement_description: string;
      achievement_requirement: number;
      achievement_level: number;
      achievement_picture_url: string;
      achieved: boolean;
    };
    message?: string;
  }

  // Add structured response with formatted achievement
  interface EnhancedDuelistResponse extends DuelistResponse {
    formattedAchievement: FormattedAchievement;
  }

  const achievementsCache = useRef<{
    isFetched: boolean;
    data: EnhancedDuelistResponse | null;
  }>({
    isFetched: false,
    data: null,
  });

  const fetchStartTimeRef = useRef(0);

  // Helper functions for Duelist achievement processing
  const getDuelistLevel = (winStreak: number): number => {
    if (winStreak >= 12) return 4; // Gold
    if (winStreak >= 9) return 3; // Silver
    if (winStreak >= 6) return 2; // Bronze
    if (winStreak >= 3) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getDuelistRequirement = (level: number): number => {
    if (level === 0) return 3;
    if (level === 1) return 6;
    if (level === 2) return 9;
    if (level === 3) return 12;
    return 12; // Max level
  };

  const getDuelistDescription = (level: number): string => {
    if (level === 0) return "Reach 3-win streak in PvP mode.";
    if (level === 1) return "Reach 6-win streak in PvP mode.";
    if (level === 2) return "Reach 9-win streak in PvP mode.";
    if (level === 3 || level === 4) return "Reach 12-win streak in PvP mode.";
    return "Reach 3-win streak in PvP mode.";
  };

  const getDuelistProgress = (level: number, actualStreak: number): number => {
    // Full achievements remain the same
    if (level === 4) return 100; // Gold (max level)
    if (level === 3) return 100; // Silver (level 3 complete)
    if (level === 2) return 60; // Bronze (level 2 complete)
    if (level === 1) return 20; // White (level 1 complete)

    // For users below 3 streak, create a more accurate visual representation
    if (level === 0 && actualStreak > 0) {
      // Make the progress bar more accurately represent actual completion percentage
      const baseProgress = Math.floor((actualStreak / 3) * 20);
      return Math.min(19, Math.max(baseProgress, actualStreak * 5));
    }

    return 0; // Only if truly at count 0
  };

  const getDuelistImage = (baseImage: string, level: number): string => {
    if (!baseImage) return "";

    // Extract path and base filename
    let path = "";
    let filename = baseImage;

    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }

    // Get the base name - remove any existing suffix regardless of what it is
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");

    // Determine suffix based on user level
    let suffix = "-w.png"; // Default
    if (level >= 4) suffix = "-g.png"; // Gold
    else if (level >= 3) suffix = "-s.png"; // Silver
    else if (level >= 2) suffix = "-b.png"; // Bronze

    // Use getFullImagePath for consistent path handling
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    console.log("Generated Duelist image path:", resultPath);

    return resultPath;
  };

  const fetchDuelist = useCallback(async (firebase_uid: string) => {
    const isBrowser = typeof window !== "undefined";
    const isFirstLoad =
      isBrowser && !sessionStorage.getItem("achievementsVisited");

    // Return cached data only on subsequent visits, not first load
    if (achievementsCache.current.isFetched && !isFirstLoad) {
      return achievementsCache.current.data;
    }

    // Mark that we've visited this page
    if (isBrowser && isFirstLoad) {
      sessionStorage.setItem("achievementsVisited", "true");
    }

    try {
      const startTime = Date.now();
      fetchStartTimeRef.current = startTime;

      // Use the user-longest-streak endpoint
      const url = `${
        import.meta.env.VITE_BACKEND_URL
      }/api/achievement/user-longest-streak/${firebase_uid}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Fetch Duelist duration: ${duration} ms`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const apiResponse = await response.json();
      const winStreak = apiResponse.highest_streak || 0;

      // Use the actual achievement data from API instead of mock data
      const duelistAchievement = apiResponse.duelistAchievement;

      // Create the response structure with real data
      const data: DuelistResponse = {
        success: true,
        highest_streak: winStreak,
        duelistAchievement,
      };

      // Process the achievement data to handle progressive levels
      const duelistLevel = getDuelistLevel(winStreak);

      // Determine progress text based on streak
      let progressText = "";
      if (winStreak >= 12) {
        progressText = "Complete";
      } else if (winStreak >= 9) {
        progressText = `${winStreak}/12`;
      } else if (winStreak >= 6) {
        progressText = `${winStreak}/9`;
      } else if (winStreak >= 3) {
        progressText = `${winStreak}/6`;
      } else {
        progressText = `${winStreak}/3`;
      }

      // Create formatted achievement with correct level and image
      const formattedAchievement: FormattedAchievement = {
        id: data.duelistAchievement.achievement_id,
        name: data.duelistAchievement.achievement_name,
        description: getDuelistDescription(duelistLevel),
        progress: getDuelistProgress(duelistLevel, winStreak),
        baseImage: getDuelistImage(
          data.duelistAchievement.achievement_picture_url,
          duelistLevel
        ),
        progressText: progressText,
      };

      // Create enhanced response with formatted achievement
      const enhancedData: EnhancedDuelistResponse = {
        ...data,
        formattedAchievement,
      };

      // Store the processed data in cache
      achievementsCache.current = {
        isFetched: true,
        data: enhancedData,
      };

      return enhancedData;
    } catch (error) {
      console.error("Error fetching Duelist achievement:", error);
      achievementsCache.current.isFetched = true;
      return null;
    }
  }, []);

  // Function to clear the cache if needed
  const clearCache = useCallback(() => {
    achievementsCache.current = {
      isFetched: false,
      data: null,
    };
  }, []);

  // Return the fetch function so it can be used
  return { fetchDuelist, clearCache };
};

export const getBestMagician = () => {
  // Define the response structure for Best Magician
  interface BestMagicianResponse {
    success: boolean;
    total_wins: number; // From the API
    bestMagicianAchievement: {
      achievement_id: number;
      achievement_name: string;
      achievement_description: string;
      achievement_requirement: number;
      achievement_level: number;
      achievement_picture_url: string;
      achieved: boolean;
    };
    message?: string;
  }

  // Add structured response with formatted achievement
  interface EnhancedBestMagicianResponse extends BestMagicianResponse {
    formattedAchievement: FormattedAchievement;
  }

  const achievementsCache = useRef<{
    isFetched: boolean;
    data: EnhancedBestMagicianResponse | null;
  }>({
    isFetched: false,
    data: null,
  });

  const fetchStartTimeRef = useRef(0);

  // Helper functions for Best Magician achievement processing
  const getBestMagicianLevel = (pvpWins: number): number => {
    if (pvpWins >= 30) return 4; // Gold
    if (pvpWins >= 20) return 3; // Silver
    if (pvpWins >= 10) return 2; // Bronze
    if (pvpWins >= 5) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getBestMagicianRequirement = (level: number): number => {
    if (level === 0) return 5;
    if (level === 1) return 10;
    if (level === 2) return 20;
    if (level === 3) return 30;
    return 30; // Max level
  };

  const getBestMagicianDescription = (level: number): string => {
    if (level === 0) return "Win 5 PvP battles.";
    if (level === 1) return "Win 10 PvP battles.";
    if (level === 2) return "Win 20 PvP battles.";
    if (level === 3 || level === 4) return "Win 30 PvP battles.";
    return "Win 5 PvP battles.";
  };

  const getBestMagicianProgress = (
    level: number,
    actualWins: number
  ): number => {
    // Full achievements remain the same
    if (level === 4) return 100; // Gold (max level)
    if (level === 3) return 100; // Silver (level 3 complete)
    if (level === 2) return 60; // Bronze (level 2 complete)
    if (level === 1) return 20; // White (level 1 complete)

    // For users below 5 wins, create a more accurate visual representation
    if (level === 0 && actualWins > 0) {
      // Make the progress bar more accurately represent actual completion percentage
      const baseProgress = Math.floor((actualWins / 5) * 20);
      return Math.min(19, Math.max(baseProgress, actualWins * 4));
    }

    return 0; // Only if truly at count 0
  };

  const getBestMagicianImage = (baseImage: string, level: number): string => {
    if (!baseImage) return "";

    // Extract path and base filename
    let path = "";
    let filename = baseImage;

    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }

    // Get the base name - remove any existing suffix regardless of what it is
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");

    // Determine suffix based on user level
    let suffix = "-w.png"; // Default
    if (level >= 4) suffix = "-g.png"; // Gold
    else if (level >= 3) suffix = "-s.png"; // Silver
    else if (level >= 2) suffix = "-b.png"; // Bronze

    // Use getFullImagePath for consistent path handling
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    console.log("Generated Best Magician image path:", resultPath);

    return resultPath;
  };

  const fetchBestMagician = useCallback(async (firebase_uid: string) => {
    const isBrowser = typeof window !== "undefined";
    const isFirstLoad =
      isBrowser && !sessionStorage.getItem("achievementsVisited");

    // Return cached data only on subsequent visits, not first load
    if (achievementsCache.current.isFetched && !isFirstLoad) {
      return achievementsCache.current.data;
    }

    // Mark that we've visited this page
    if (isBrowser && isFirstLoad) {
      sessionStorage.setItem("achievementsVisited", "true");
    }

    try {
      const startTime = Date.now();
      fetchStartTimeRef.current = startTime;

      // Use the user-total-pvp-wins endpoint
      const url = `${
        import.meta.env.VITE_BACKEND_URL
      }/api/achievement/user-total-pvp-wins/${firebase_uid}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Fetch Best Magician duration: ${duration} ms`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const apiResponse = await response.json();
      const pvpWins = apiResponse.total_wins || 0;

      // Use the actual achievement data from API instead of mock data
      const bestMagicianAchievement = apiResponse.bestMagicianAchievement;

      // Create the response structure with real data
      const data: BestMagicianResponse = {
        success: true,
        total_wins: pvpWins,
        bestMagicianAchievement,
      };

      // Process the achievement data to handle progressive levels
      const bestMagicianLevel = getBestMagicianLevel(pvpWins);

      // Determine progress text based on wins count
      let progressText = "";
      if (pvpWins >= 30) {
        progressText = "Complete";
      } else if (pvpWins >= 20) {
        progressText = `${pvpWins}/30`;
      } else if (pvpWins >= 10) {
        progressText = `${pvpWins}/20`;
      } else if (pvpWins >= 5) {
        progressText = `${pvpWins}/10`;
      } else {
        progressText = `${pvpWins}/5`;
      }

      // Create formatted achievement with correct level and image
      const formattedAchievement: FormattedAchievement = {
        id: data.bestMagicianAchievement.achievement_id,
        name: data.bestMagicianAchievement.achievement_name,
        description: getBestMagicianDescription(bestMagicianLevel),
        progress: getBestMagicianProgress(bestMagicianLevel, pvpWins),
        baseImage: getBestMagicianImage(
          data.bestMagicianAchievement.achievement_picture_url,
          bestMagicianLevel
        ),
        progressText: progressText,
      };

      // Create enhanced response with formatted achievement
      const enhancedData: EnhancedBestMagicianResponse = {
        ...data,
        formattedAchievement,
      };

      // Store the processed data in cache
      achievementsCache.current = {
        isFetched: true,
        data: enhancedData,
      };

      return enhancedData;
    } catch (error) {
      console.error("Error fetching Best Magician achievement:", error);
      achievementsCache.current.isFetched = true;
      return null;
    }
  }, []);

  // Function to clear the cache if needed
  const clearCache = useCallback(() => {
    achievementsCache.current = {
      isFetched: false,
      data: null,
    };
  }, []);

  // Return the fetch function so it can be used
  return { fetchBestMagician, clearCache };
};

export const useAllUserAchievements = () => {
  // Define the response structure for all achievements
  interface AllUserAchievementsResponse {
    success: boolean;
    mysticElder: {
      success: boolean;
      userLevel: number;
      mysticElderAchievement: {
        achievement_id: number;
        achievement_name: string;
        achievement_description: string;
        achievement_requirement: number;
        achievement_level: number;
        achievement_picture_url: string;
        achieved: boolean;
      };
    };
    wisdomCollector: {
      success: boolean;
      userStudyMaterialCount: number;
      wisdomCollectorAchievement: {
        achievement_id: number;
        achievement_name: string;
        achievement_description: string;
        achievement_requirement: number;
        achievement_level: number;
        achievement_picture_url: string;
        achieved: boolean;
      };
    };
    arcaneScholar: {
      success: boolean;
      userStudyMaterialCount: number;
      arcaneScholarAchievement: {
        achievement_id: number;
        achievement_name: string;
        achievement_description: string;
        achievement_requirement: number;
        achievement_level: number;
        achievement_picture_url: string;
        achieved: boolean;
      };
    };
    duelist: {
      success: boolean;
      highest_streak: number;
      duelistAchievement: {
        achievement_id: number;
        achievement_name: string;
        achievement_description: string;
        achievement_requirement: number;
        achievement_level: number;
        achievement_picture_url: string;
        achieved: boolean;
      };
    };
    battleArchmage: {
      success: boolean;
      total_matches: number;
      battleArchmageAchievement: {
        achievement_id: number;
        achievement_name: string;
        achievement_description: string;
        achievement_requirement: number;
        achievement_level: number;
        achievement_picture_url: string;
        achieved: boolean;
      };
    };
    bestMagician: {
      success: boolean;
      total_wins: number;
      bestMagicianAchievement: {
        achievement_id: number;
        achievement_name: string;
        achievement_description: string;
        achievement_requirement: number;
        achievement_level: number;
        achievement_picture_url: string;
        achieved: boolean;
      };
    };
  }

  // Add structured response with formatted achievements
  interface EnhancedAllUserAchievementsResponse
    extends AllUserAchievementsResponse {
    formattedAchievements: {
      mysticElder: FormattedAchievement;
      wisdomCollector: FormattedAchievement;
      arcaneScholar: FormattedAchievement;
      duelist: FormattedAchievement;
      battleArchmage: FormattedAchievement;
      bestMagician: FormattedAchievement;
    };
  }

  const getMysticElderLevel = (userLevel: number): number => {
    if (userLevel >= 30) return 4; // Gold
    if (userLevel >= 20) return 3; // Silver
    if (userLevel >= 10) return 2; // Bronze
    if (userLevel >= 5) return 1; // White/Basic
    return 0; // Locked
  };

  const getMysticElderDescription = (level: number): string => {
    if (level === 0) return "Reach level 5.";
    if (level === 1) return "Reach level 10.";
    if (level === 2) return "Reach level 20.";
    if (level === 3 || level === 4) return "Reach level 30.";
    return "Reach level 5.";
  };

  const getMysticElderProgress = (
    level: number,
    actualUserLevel: number
  ): number => {
    if (level === 4) return 100;
    if (level === 3) return 100;
    if (level === 2) return 60;
    if (level === 1) return 20;
    if (level === 0 && actualUserLevel > 0) {
      return Math.max(5, Math.floor((actualUserLevel / 5) * 20));
    }
    return 0;
  };

  const getMysticElderImage = (baseImage: string, level: number): string => {
    // Existing implementation
    if (!baseImage) return "";
    let path = "";
    let filename = baseImage;
    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");
    let suffix = "-w.png";
    if (level >= 4) suffix = "-g.png";
    else if (level >= 3) suffix = "-s.png";
    else if (level >= 2) suffix = "-b.png";
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    return resultPath;
  };

  // Wisdom Collector helpers
  const getWisdomCollectorLevel = (studyMaterialCount: number): number => {
    if (studyMaterialCount >= 30) return 4; // Gold
    if (studyMaterialCount >= 20) return 3; // Silver
    if (studyMaterialCount >= 10) return 2; // Bronze
    if (studyMaterialCount >= 5) return 1; // White/Basic
    return 0; // Locked
  };

  const getWisdomCollectorDescription = (level: number): string => {
    if (level === 0) return "Create 5 study materials.";
    if (level === 1) return "Create 10 study materials.";
    if (level === 2) return "Create 20 study materials.";
    if (level === 3 || level === 4) return "Create 30 study materials.";
    return "Create 5 study materials.";
  };

  const getWisdomCollectorProgress = (
    level: number,
    actualCount: number
  ): number => {
    if (level === 4) return 100;
    if (level === 3) return 100;
    if (level === 2) return 60;
    if (level === 1) return 20;
    if (level === 0 && actualCount > 0) {
      const baseProgress = Math.floor((actualCount / 5) * 50);
      return Math.min(19, Math.max(baseProgress, actualCount * 4));
    }
    return 0;
  };

  const getWisdomCollectorImage = (
    baseImage: string,
    level: number
  ): string => {
    // Same implementation pattern as getMysticElderImage
    if (!baseImage) return "";
    let path = "";
    let filename = baseImage;
    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");
    let suffix = "-w.png";
    if (level >= 4) suffix = "-g.png";
    else if (level >= 3) suffix = "-s.png";
    else if (level >= 2) suffix = "-b.png";
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    return resultPath;
  };

  // Arcane Scholar helpers
  const getArcaneScholarLevel = (completedSessionsCount: number): number => {
    if (completedSessionsCount >= 20) return 4; // Gold
    if (completedSessionsCount >= 15) return 3; // Silver
    if (completedSessionsCount >= 10) return 2; // Bronze
    if (completedSessionsCount >= 5) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getArcaneScholarDescription = (level: number): string => {
    if (level === 0) return "Complete 5 study sessions.";
    if (level === 1) return "Complete 10 study sessions.";
    if (level === 2) return "Complete 15 study sessions.";
    if (level === 3 || level === 4) return "Complete 20 study sessions.";
    return "Complete 5 study sessions.";
  };

  const getArcaneScholarProgress = (
    level: number,
    actualCount: number
  ): number => {
    if (level === 4) return 100;
    if (level === 3) return 100;
    if (level === 2) return 60;
    if (level === 1) return 20;
    if (level === 0 && actualCount > 0) {
      const baseProgress = Math.floor((actualCount / 5) * 20);
      return Math.min(19, Math.max(baseProgress, actualCount * 4));
    }
    return 0;
  };

  const getArcaneScholarImage = (baseImage: string, level: number): string => {
    // Same implementation pattern as other image functions
    if (!baseImage) return "";
    let path = "";
    let filename = baseImage;
    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");
    let suffix = "-w.png";
    if (level >= 4) suffix = "-g.png";
    else if (level >= 3) suffix = "-s.png";
    else if (level >= 2) suffix = "-b.png";
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    return resultPath;
  };

  // Battle Archmage helpers
  const getBattleArchmageLevel = (pvpMatches: number): number => {
    if (pvpMatches >= 30) return 4; // Gold
    if (pvpMatches >= 20) return 3; // Silver
    if (pvpMatches >= 10) return 2; // Bronze
    if (pvpMatches >= 5) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getBattleArchmageDescription = (level: number): string => {
    if (level === 0) return "Reach 5 PvP battles.";
    if (level === 1) return "Reach 10 PvP battles.";
    if (level === 2) return "Reach 20 PvP battles.";
    if (level === 3 || level === 4) return "Reach 30 PvP battles.";
    return "Reach 5 PvP battles.";
  };

  const getBattleArchmageProgress = (
    level: number,
    actualMatches: number
  ): number => {
    if (level === 4) return 100;
    if (level === 3) return 100;
    if (level === 2) return 60;
    if (level === 1) return 20;
    if (level === 0 && actualMatches > 0) {
      const baseProgress = Math.floor((actualMatches / 5) * 20);
      return Math.min(19, Math.max(baseProgress, actualMatches * 4));
    }
    return 0;
  };

  const getBattleArchmageImage = (baseImage: string, level: number): string => {
    // Same implementation pattern
    if (!baseImage) return "";
    let path = "";
    let filename = baseImage;
    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");
    let suffix = "-w.png";
    if (level >= 4) suffix = "-g.png";
    else if (level >= 3) suffix = "-s.png";
    else if (level >= 2) suffix = "-b.png";
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    return resultPath;
  };

  // Duelist helpers
  const getDuelistLevel = (winStreak: number): number => {
    if (winStreak >= 12) return 4; // Gold
    if (winStreak >= 9) return 3; // Silver
    if (winStreak >= 6) return 2; // Bronze
    if (winStreak >= 3) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getDuelistDescription = (level: number): string => {
    if (level === 0) return "Reach 3-win streak in PvP mode.";
    if (level === 1) return "Reach 6-win streak in PvP mode.";
    if (level === 2) return "Reach 9-win streak in PvP mode.";
    if (level === 3 || level === 4) return "Reach 12-win streak in PvP mode.";
    return "Reach 3-win streak in PvP mode.";
  };

  const getDuelistProgress = (level: number, actualStreak: number): number => {
    if (level === 4) return 100;
    if (level === 3) return 100;
    if (level === 2) return 60;
    if (level === 1) return 20;
    if (level === 0 && actualStreak > 0) {
      const baseProgress = Math.floor((actualStreak / 3) * 20);
      return Math.min(19, Math.max(baseProgress, actualStreak * 5));
    }
    return 0;
  };

  const getDuelistImage = (baseImage: string, level: number): string => {
    // Same implementation pattern
    if (!baseImage) return "";
    let path = "";
    let filename = baseImage;
    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");
    let suffix = "-w.png";
    if (level >= 4) suffix = "-g.png";
    else if (level >= 3) suffix = "-s.png";
    else if (level >= 2) suffix = "-b.png";
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    return resultPath;
  };

  // Best Magician helpers
  const getBestMagicianLevel = (pvpWins: number): number => {
    if (pvpWins >= 30) return 4; // Gold
    if (pvpWins >= 20) return 3; // Silver
    if (pvpWins >= 10) return 2; // Bronze
    if (pvpWins >= 5) return 1; // White/Basic
    return 0; // Not yet achieved
  };

  const getBestMagicianDescription = (level: number): string => {
    if (level === 0) return "Win 5 PvP battles.";
    if (level === 1) return "Win 10 PvP battles.";
    if (level === 2) return "Win 20 PvP battles.";
    if (level === 3 || level === 4) return "Win 30 PvP battles.";
    return "Win 5 PvP battles.";
  };

  const getBestMagicianProgress = (
    level: number,
    actualWins: number
  ): number => {
    if (level === 4) return 100;
    if (level === 3) return 100;
    if (level === 2) return 60;
    if (level === 1) return 20;
    if (level === 0 && actualWins > 0) {
      const baseProgress = Math.floor((actualWins / 5) * 20);
      return Math.min(19, Math.max(baseProgress, actualWins * 4));
    }
    return 0;
  };

  const getBestMagicianImage = (baseImage: string, level: number): string => {
    // Same implementation pattern
    if (!baseImage) return "";
    let path = "";
    let filename = baseImage;
    if (baseImage.includes("/")) {
      path = baseImage.substring(0, baseImage.lastIndexOf("/") + 1);
      filename = baseImage.substring(baseImage.lastIndexOf("/") + 1);
    }
    const baseName = filename.replace(/-(w|b|s|g)\.png$/, "");
    let suffix = "-w.png";
    if (level >= 4) suffix = "-g.png";
    else if (level >= 3) suffix = "-s.png";
    else if (level >= 2) suffix = "-b.png";
    const resultPath = getFullImagePath(`${path}${baseName}${suffix}`);
    return resultPath;
  };

  // Now complete all the formatter functions:
  const formatArcaneScholar = (
    arcaneScholarData: AllUserAchievementsResponse["arcaneScholar"]
  ): FormattedAchievement => {
    if (!arcaneScholarData || !arcaneScholarData.arcaneScholarAchievement) {
      return createEmptyAchievement("Arcane Scholar");
    }

    const completedSessionsCount = arcaneScholarData.userStudyMaterialCount;
    const arcaneScholarLevel = getArcaneScholarLevel(completedSessionsCount);

    // Determine progress text based on count
    let progressText = "";
    if (completedSessionsCount >= 20) {
      progressText = "Complete";
    } else if (completedSessionsCount >= 15) {
      progressText = `${completedSessionsCount}/20`;
    } else if (completedSessionsCount >= 10) {
      progressText = `${completedSessionsCount}/15`;
    } else if (completedSessionsCount >= 5) {
      progressText = `${completedSessionsCount}/10`;
    } else {
      progressText = `${completedSessionsCount}/5`;
    }

    return {
      id: arcaneScholarData.arcaneScholarAchievement.achievement_id,
      name: arcaneScholarData.arcaneScholarAchievement.achievement_name,
      description: getArcaneScholarDescription(arcaneScholarLevel),
      progress: getArcaneScholarProgress(
        arcaneScholarLevel,
        completedSessionsCount
      ),
      baseImage: getArcaneScholarImage(
        arcaneScholarData.arcaneScholarAchievement.achievement_picture_url,
        arcaneScholarLevel
      ),
      progressText: progressText,
    };
  };

  const formatBattleArchmage = (
    battleArchmageData: AllUserAchievementsResponse["battleArchmage"]
  ): FormattedAchievement => {
    if (!battleArchmageData || !battleArchmageData.battleArchmageAchievement) {
      return createEmptyAchievement("Battle Archmage");
    }

    const pvpMatches = battleArchmageData.total_matches;
    const battleArchmageLevel = getBattleArchmageLevel(pvpMatches);

    // Determine progress text based on count
    let progressText = "";
    if (pvpMatches >= 30) {
      progressText = "Complete";
    } else if (pvpMatches >= 20) {
      progressText = `${pvpMatches}/30`;
    } else if (pvpMatches >= 10) {
      progressText = `${pvpMatches}/20`;
    } else if (pvpMatches >= 5) {
      progressText = `${pvpMatches}/10`;
    } else {
      progressText = `${pvpMatches}/5`;
    }

    return {
      id: battleArchmageData.battleArchmageAchievement.achievement_id,
      name: battleArchmageData.battleArchmageAchievement.achievement_name,
      description: getBattleArchmageDescription(battleArchmageLevel),
      progress: getBattleArchmageProgress(battleArchmageLevel, pvpMatches),
      baseImage: getBattleArchmageImage(
        battleArchmageData.battleArchmageAchievement.achievement_picture_url,
        battleArchmageLevel
      ),
      progressText: progressText,
    };
  };

  const formatDuelist = (
    duelistData: AllUserAchievementsResponse["duelist"]
  ): FormattedAchievement => {
    if (!duelistData || !duelistData.duelistAchievement) {
      return createEmptyAchievement("Duelist");
    }

    const winStreak = duelistData.highest_streak;
    const duelistLevel = getDuelistLevel(winStreak);

    // Determine progress text based on streak
    let progressText = "";
    if (winStreak >= 12) {
      progressText = "Complete";
    } else if (winStreak >= 9) {
      progressText = `${winStreak}/12`;
    } else if (winStreak >= 6) {
      progressText = `${winStreak}/9`;
    } else if (winStreak >= 3) {
      progressText = `${winStreak}/6`;
    } else {
      progressText = `${winStreak}/3`;
    }

    return {
      id: duelistData.duelistAchievement.achievement_id,
      name: duelistData.duelistAchievement.achievement_name,
      description: getDuelistDescription(duelistLevel),
      progress: getDuelistProgress(duelistLevel, winStreak),
      baseImage: getDuelistImage(
        duelistData.duelistAchievement.achievement_picture_url,
        duelistLevel
      ),
      progressText: progressText,
    };
  };

  const formatBestMagician = (
    bestMagicianData: AllUserAchievementsResponse["bestMagician"]
  ): FormattedAchievement => {
    if (!bestMagicianData || !bestMagicianData.bestMagicianAchievement) {
      return createEmptyAchievement("Best Magician");
    }

    const pvpWins = bestMagicianData.total_wins;
    const bestMagicianLevel = getBestMagicianLevel(pvpWins);

    // Determine progress text based on wins count
    let progressText = "";
    if (pvpWins >= 30) {
      progressText = "Complete";
    } else if (pvpWins >= 20) {
      progressText = `${pvpWins}/30`;
    } else if (pvpWins >= 10) {
      progressText = `${pvpWins}/20`;
    } else if (pvpWins >= 5) {
      progressText = `${pvpWins}/10`;
    } else {
      progressText = `${pvpWins}/5`;
    }

    return {
      id: bestMagicianData.bestMagicianAchievement.achievement_id,
      name: bestMagicianData.bestMagicianAchievement.achievement_name,
      description: getBestMagicianDescription(bestMagicianLevel),
      progress: getBestMagicianProgress(bestMagicianLevel, pvpWins),
      baseImage: getBestMagicianImage(
        bestMagicianData.bestMagicianAchievement.achievement_picture_url,
        bestMagicianLevel
      ),
      progressText: progressText,
    };
  };

  const achievementsCache = useRef<{
    isFetched: boolean;
    data: EnhancedAllUserAchievementsResponse | null;
  }>({
    isFetched: false,
    data: null,
  });

  const fetchStartTimeRef = useRef(0);

  const fetchAllAchievements = useCallback(
    async (firebase_uid: string, forceRefresh = false) => {
      const isBrowser = typeof window !== "undefined";
      const isFirstLoad =
        isBrowser && !sessionStorage.getItem("achievementsVisited");

      // Return cached data only on subsequent visits, not first load
      if (
        achievementsCache.current.isFetched &&
        !forceRefresh &&
        !isFirstLoad
      ) {
        return achievementsCache.current.data;
      }

      // Mark that we've visited this page
      if (isBrowser && isFirstLoad) {
        sessionStorage.setItem("achievementsVisited", "true");
      }

      try {
        const startTime = Date.now();
        fetchStartTimeRef.current = startTime;

        const url = `${
          import.meta.env.VITE_BACKEND_URL
        }/api/achievement/all-user-achievements/${firebase_uid}${
          forceRefresh ? `?timestamp=${Date.now()}` : ""
        }`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`Fetch ALL ACHIEVEMENTS duration: ${duration} ms`);

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = (await response.json()) as AllUserAchievementsResponse;

        // Process each achievement type to create formatted versions
        const formattedAchievements = {
          mysticElder: formatMysticElder(data.mysticElder),
          wisdomCollector: formatWisdomCollector(data.wisdomCollector),
          arcaneScholar: formatArcaneScholar(data.arcaneScholar),
          duelist: formatDuelist(data.duelist),
          battleArchmage: formatBattleArchmage(data.battleArchmage),
          bestMagician: formatBestMagician(data.bestMagician),
        };

        // Create enhanced response with formatted achievements
        const enhancedData: EnhancedAllUserAchievementsResponse = {
          ...data,
          formattedAchievements,
        };

        // Store the processed data in cache
        achievementsCache.current = {
          isFetched: true,
          data: enhancedData,
        };

        return enhancedData;
      } catch (error) {
        console.error("Error fetching all achievements:", error);
        achievementsCache.current.isFetched = true;
        return null;
      }
    },
    []
  );

  // Helper functions to format each achievement type
  const formatMysticElder = (
    mysticElderData: AllUserAchievementsResponse["mysticElder"]
  ): FormattedAchievement => {
    if (!mysticElderData || !mysticElderData.mysticElderAchievement) {
      return createEmptyAchievement("Mystic Elder");
    }

    const userLevel = mysticElderData.userLevel;
    const mysticElderLevel = getMysticElderLevel(userLevel);

    // Determine progress text based on level
    let progressText = "";
    if (userLevel >= 30) {
      progressText = "Complete";
    } else if (userLevel >= 20) {
      progressText = `${userLevel}/30`;
    } else if (userLevel >= 10) {
      progressText = `${userLevel}/20`;
    } else if (userLevel >= 5) {
      progressText = `${userLevel}/10`;
    } else if (userLevel > 0) {
      progressText = `${userLevel}/5`;
    } else {
      progressText = "0/5";
    }

    return {
      id: mysticElderData.mysticElderAchievement.achievement_id,
      name: mysticElderData.mysticElderAchievement.achievement_name,
      description: getMysticElderDescription(mysticElderLevel),
      progress: getMysticElderProgress(mysticElderLevel, userLevel),
      baseImage: getMysticElderImage(
        mysticElderData.mysticElderAchievement.achievement_picture_url,
        mysticElderLevel
      ),
      progressText: progressText,
    };
  };

  const formatWisdomCollector = (
    wisdomCollectorData: AllUserAchievementsResponse["wisdomCollector"]
  ): FormattedAchievement => {
    if (
      !wisdomCollectorData ||
      !wisdomCollectorData.wisdomCollectorAchievement
    ) {
      return createEmptyAchievement("Wisdom Collector");
    }

    const studyMaterialCount = wisdomCollectorData.userStudyMaterialCount;
    const wisdomCollectorLevel = getWisdomCollectorLevel(studyMaterialCount);

    // Determine progress text based on count
    let progressText = "";
    if (studyMaterialCount >= 30) {
      progressText = "Complete";
    } else if (studyMaterialCount >= 20) {
      progressText = `${studyMaterialCount}/30`;
    } else if (studyMaterialCount >= 10) {
      progressText = `${studyMaterialCount}/20`;
    } else if (studyMaterialCount >= 5) {
      progressText = `${studyMaterialCount}/10`;
    } else if (studyMaterialCount > 0) {
      progressText = `${studyMaterialCount}/5`;
    } else {
      progressText = "0/5";
    }

    return {
      id: wisdomCollectorData.wisdomCollectorAchievement.achievement_id,
      name: wisdomCollectorData.wisdomCollectorAchievement.achievement_name,
      description: getWisdomCollectorDescription(wisdomCollectorLevel),
      progress: getWisdomCollectorProgress(
        wisdomCollectorLevel,
        studyMaterialCount
      ),
      baseImage: getWisdomCollectorImage(
        wisdomCollectorData.wisdomCollectorAchievement.achievement_picture_url,
        wisdomCollectorLevel
      ),
      progressText: progressText,
    };
  };

  // Helper to create an empty achievement object for error cases
  const createEmptyAchievement = (name: string): FormattedAchievement => {
    return {
      id: 0,
      name,
      description: `${name} not found`,
      progress: 0,
      baseImage: "",
      progressText: "N/A",
    };
  };

  // Function to clear the cache if needed
  const clearCache = useCallback(() => {
    achievementsCache.current = {
      isFetched: false,
      data: null,
    };
  }, []);

  // Return the fetch function so it can be used
  return { fetchAllAchievements, clearCache };
};
