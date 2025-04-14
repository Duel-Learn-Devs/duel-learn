import {
  AchievementObject,
  FormattedAchievement,
} from "src/types/achievementObject";
import { useCallback, useRef } from "react";

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
    // Return cached data if available and not forcing refresh
    if (achievementsCache.current.isFetched && !forceRefresh) {
      return achievementsCache.current.data;
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

    // Debug the image path being generated
    const resultPath = `${path}${baseName}${suffix}`;
    console.log("Generated image path:", resultPath);

    return resultPath;
  };

  const fetchMysticElder = useCallback(
    async (firebase_uid: string, forceRefresh = false) => {
      // Return cached data if available
      if (achievementsCache.current.isFetched && !forceRefresh) {
        return achievementsCache.current.data;
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

    // Debug the image path being generated
    const resultPath = `${path}${baseName}${suffix}`;
    console.log("Generated Wisdom Collector image path:", resultPath);

    return resultPath;
  };

  const fetchWisdomCollector = useCallback(async (firebase_uid: string) => {
    // Return cached data if available
    if (achievementsCache.current.isFetched) {
      return achievementsCache.current.data;
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

    // Debug the image path being generated
    const resultPath = `${path}${baseName}${suffix}`;
    console.log("Generated Arcane Scholar image path:", resultPath);

    return resultPath;
  };

  const fetchArcaneScholar = useCallback(async (firebase_uid: string) => {
    // Return cached data if available
    if (achievementsCache.current.isFetched) {
      return achievementsCache.current.data;
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
