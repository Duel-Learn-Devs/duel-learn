import {
  Box,
  Stack,
  Typography,
  Skeleton,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";
import ExploreCards from "./ExploreCards";
import { useUser } from "../../../contexts/UserContext";
import AutoHideSnackbar from "../../../components/ErrorsSnackbar";
import { StudyMaterial } from "../../../types/studyMaterialObject";
import NoStudyMaterial from "/images/noStudyMaterial.svg";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Tooltip } from "@mui/material";
import { cacheService } from "../../../services/CacheService";

const ExplorePage = () => {
  const { user } = useUser();
  const [selected, setSelected] = useState<number>(0);
  const [_cards, setCards] = useState<StudyMaterial[]>([]);
  const [filteredCards, setFilteredCards] = useState<StudyMaterial[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  // Add state for background refreshes
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  // Track last update time for display purposes
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Track if updates are available (new content since last fetch)
  const [updatesAvailable, setUpdatesAvailable] = useState(false);
  // Add these state variables
  const [showUpdateLabel, setShowUpdateLabel] = useState(false);
  const updateLabelTimer = useRef<NodeJS.Timeout | null>(null);

  // Track data for all tabs to avoid refetching when switching tabs
  const cachedTabData = useRef<{ [key: number]: StudyMaterial[] }>({});

  // Track when data was last loaded for each tab
  const tabDataTimestamps = useRef<{ [key: number]: number }>({});

  // Cached timestamp for each tab - used to bypass backend cache
  const tabLastForcedRefresh = useRef<{ [key: number]: number }>({});

  // Track if component is mounted (for socket cleanup)
  const isMounted = useRef(true);

  // In ExplorePage.tsx
  const socket = useMemo(
    () =>
      io(import.meta.env.VITE_BACKEND_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: false,
        path: "/socket.io/", // Make sure path matches server
      }),
    []
  );

  // Function to format the last updated time
  const formattedLastUpdated = useCallback(() => {
    if (!lastUpdated) return "";

    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hrs ago`;
  }, [lastUpdated]);

  // Function to check if data needs refresh
  const needsRefresh = useCallback((tabIndex: number): boolean => {
    const timestamp = tabDataTimestamps.current[tabIndex];
    if (!timestamp) return true;

    // Refresh if data is older than 5 minutes (align with backend's 10 minute cache TTL)
    // This makes it refresh client data halfway through backend's cache lifetime
    return Date.now() - timestamp > 300000;
  }, []);

  // Get the appropriate URL based on tab index and if force refresh is needed
  const getUrlForTab = useCallback(
    (tabIndex: number, force = false): string | null => {
      if (!user?.username) return null;

      let baseUrl = "";
      switch (tabIndex) {
        case 0:
          baseUrl = `${
            import.meta.env.VITE_BACKEND_URL
          }/api/study-material/get-top-picks`;
          break;
        case 1:
          // Fix the encoding of the username to ensure special characters are properly handled
          baseUrl = `${
            import.meta.env.VITE_BACKEND_URL
          }/api/study-material/get-recommended-for-you/${encodeURIComponent(
            user.username.trim()
          )}`;
          break;
        case 2:
          baseUrl = `${
            import.meta.env.VITE_BACKEND_URL
          }/api/study-material/get-made-by-friends/${encodeURIComponent(
            user.firebase_uid
          )}`;
          break;
        default:
          return null;
      }

      // Add timestamp query parameter to force backend to bypass cache when needed
      if (force) {
        tabLastForcedRefresh.current[tabIndex] = Date.now();
        return `${baseUrl}?timestamp=${Date.now()}`;
      }

      return baseUrl;
    },
    [user?.username, user?.firebase_uid]
  );

  // Last fetch timestamps to prevent duplicates within a short timeframe
  const lastFetchTimestamp = useRef<{ [key: number]: number }>({});

  // Optimized fetch function
  const fetchData = useCallback(
    async (tabIndex = selected, force = false) => {
      // Get the URL for this tab
      const url = getUrlForTab(tabIndex, force);
      if (!url) return;

      const cacheKey = `explore_tab_${tabIndex}`;

      if (!force) {
        const cachedData = cacheService.get<StudyMaterial[]>(cacheKey);
        if (cachedData) {
          console.log(`Using cached data for tab ${tabIndex}`);
          if (tabIndex === selected) {
            setCards(cachedData);
            setFilteredCards(cachedData);
            setIsLoading(false);
          }
          return;
        }
      }

      // Prevent duplicate fetches within 500ms unless forced
      const now = Date.now();
      if (
        !force &&
        lastFetchTimestamp.current[tabIndex] &&
        now - lastFetchTimestamp.current[tabIndex] < 500
      ) {
        console.log(`Ignoring duplicate fetch for tab ${tabIndex} - too soon`);
        return;
      }

      // Record this fetch attempt
      lastFetchTimestamp.current[tabIndex] = now;

      // If we have cached data for this tab and it's recent, use it unless forced refresh
      if (
        !force &&
        cachedTabData.current[tabIndex] &&
        !needsRefresh(tabIndex)
      ) {
        console.log(`Using cached data for tab ${tabIndex}`);
        if (tabIndex === selected) {
          setCards(cachedTabData.current[tabIndex]);
          setFilteredCards(cachedTabData.current[tabIndex]);
          setIsLoading(false);
        }
        return;
      }

      console.log(
        `Fetching data for tab: ${tabIndex}${force ? " (forced)" : ""}`
      );

      // Only show loading state if this is the current tab and not a background refresh
      if (tabIndex === selected && !isBackgroundRefreshing) {
        setIsLoading(true);
      }

      try {
        // Set a reasonable timeout to avoid hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          // More detailed error handling
          console.error(
            `API error: ${response.status} for tab ${tabIndex}, URL: ${url}`
          );

          if (response.status === 404) {
            // Return empty array for 404s to avoid breaking the UI
            if (tabIndex === selected) {
              setCards([]);
              setFilteredCards([]);
              setIsLoading(false);
            }
            return;
          }

          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data: StudyMaterial[] = await response.json();

        if (Array.isArray(data)) {
          // Check if data is different from what we already have
          const hasNewData =
            !cachedTabData.current[tabIndex] ||
            JSON.stringify(data) !==
              JSON.stringify(cachedTabData.current[tabIndex]);

          // Cache the data for this tab
          cachedTabData.current[tabIndex] = data;
          tabDataTimestamps.current[tabIndex] = Date.now();

          // Cache the data using cacheService
          cacheService.set(cacheKey, data);

          // If this is background refresh and we have new data, show indicator
          if (hasNewData && tabIndex === selected) {
            setLastUpdated(new Date());

            // Show temporary update label when we get new data
            if (!isBackgroundRefreshing) {
              showTemporaryUpdateLabel();
            } else {
              setUpdatesAvailable(true);
            }
          }

          // Only update state if this is the currently selected tab
          if (tabIndex === selected) {
            setCards(data);
            setFilteredCards(data);
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Request was aborted due to timeout");
          if (tabIndex === selected) {
            setSnackbarMessage("Taking too long to load. Try again later.");
            setSnackbarOpen(true);
          }
        } else {
          console.error(`Error fetching data for tab ${tabIndex}:`, error);
        }
      } finally {
        // Only update loading state if this is current tab and not background refresh
        if (tabIndex === selected && !isBackgroundRefreshing) {
          setIsLoading(false);
        }
      }
    },
    [selected, isBackgroundRefreshing, needsRefresh, getUrlForTab]
  );

  // Add this function after formattedLastUpdated
  const showTemporaryUpdateLabel = useCallback(() => {
    // Clear any existing timer
    if (updateLabelTimer.current) {
      clearTimeout(updateLabelTimer.current);
    }

    // Show the label
    setShowUpdateLabel(true);

    // Set timer to hide it after 2 seconds
    updateLabelTimer.current = setTimeout(() => {
      setShowUpdateLabel(false);
    }, 1000);
  }, []);

  // Background refresh function - doesn't show loading state
  const backgroundRefresh = useCallback(async () => {
    if (!user?.username || isBackgroundRefreshing || !isMounted.current) return;

    setIsBackgroundRefreshing(true);
    console.log("Starting background refresh of all tabs");

    try {
      // First refresh the active tab (higher priority)
      await fetchData(selected, true);

      // Then refresh the other tabs
      for (let i = 0; i < 3; i++) {
        if (i !== selected && isMounted.current) {
          await fetchData(i, true);
        }
      }
    } catch (error) {
      console.error("Error during background refresh:", error);
    } finally {
      if (isMounted.current) {
        setIsBackgroundRefreshing(false);
      }
    }
  }, [fetchData, user?.username, isBackgroundRefreshing, selected]);

  // Manual refresh function with visual feedback
  const refreshData = useCallback(async () => {
    if (!user?.username) return;

    // Reset updates available indicator
    setUpdatesAvailable(false);
    setIsLoading(true);

    try {
      await fetchData(selected, true);
      showTemporaryUpdateLabel();
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, selected, user?.username, showTemporaryUpdateLabel]);

  // Create a stable reference to track if initial data was loaded
  const initialLoadRef = useRef<{ [key: number]: boolean }>({});

  // Memoize the initial data fetch
  const initialData = useMemo(() => {
    if (!user?.username) return null;

    console.log(`Initial data load for tab ${selected}`);

    // Only fetch if we haven't loaded this tab's data yet
    if (!initialLoadRef.current[selected]) {
      initialLoadRef.current[selected] = true;

      // If we have cached data that's not stale, use it
      if (cachedTabData.current[selected] && !needsRefresh(selected)) {
        setCards(cachedTabData.current[selected]);
        setFilteredCards(cachedTabData.current[selected]);
        setIsLoading(false);
        return cachedTabData.current[selected];
      }
    }

    return null;
  }, [user?.username, selected, fetchData, needsRefresh]);

  // Set up the background refresh interval only once
  useEffect(() => {
    if (!user?.username) return;

    // Reset the component mounted flag
    isMounted.current = true;

    // Set up background refresh interval - align with backend's cache TTL
    const refreshInterval = setInterval(backgroundRefresh, 300000);

    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
    };
  }, [user?.username, backgroundRefresh]);

  // Simplified tab change handler - only handle actual tab changes
  useEffect(() => {
    // Skip the initial render since it's handled by useMemo
    if (initialLoadRef.current[selected]) {
      console.log(`Tab changed to: ${selected}`);

      // Reset updates available indicator when changing tabs
      setUpdatesAvailable(false);

      // If we have cached data for this tab, use it immediately
      if (cachedTabData.current[selected]) {
        setCards(cachedTabData.current[selected]);
        setFilteredCards(cachedTabData.current[selected]);

        // If data is stale, refresh in background
        if (needsRefresh(selected)) {
          fetchData(selected, true);
        }
      } else {
        fetchData(selected);
      }
    }
  }, [selected, fetchData, needsRefresh]);

  // Make sure initialData is used somewhere to avoid it being tree-shaken
  useEffect(() => {
    if (initialData) {
      // This is just to ensure the useMemo hook runs
      console.log("Initial data available");
    }
  }, [initialData]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!user?.firebase_uid) return;

    socket.connect();
    socket.emit("setup", user.firebase_uid);

    // Listen for different types of updates
    const handleNewMaterial = (data: { creator?: string }) => {
      console.log("New study material broadcast received:", data);

      // If user is the creator, don't need to refresh as they just created it
      if (data.creator === user.username) return;

      // Set the updates available flag for better UX
      setUpdatesAvailable(true);
    };

    socket.on("broadcastStudyMaterial", handleNewMaterial);

    return () => {
      socket.off("broadcastStudyMaterial", handleNewMaterial);
      socket.disconnect();
    };
  }, [socket, user?.firebase_uid, backgroundRefresh]);

  // Add cleanup for the timer in the component unmount
  useEffect(() => {
    return () => {
      if (updateLabelTimer.current) {
        clearTimeout(updateLabelTimer.current);
      }
    };
  }, []);

  return (
    <PageTransition>
      <Box className="h-full w-full">
        <DocumentHead title="Explore | Duel Learn" />
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 1 }}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              mb: { xs: 2, sm: 0 },
            }}
          >
            {/* Title with tab navigation */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                flexWrap: { xs: "wrap", sm: "nowrap" },
                mb: { xs: 1, sm: 0 },
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "flex-start" },
              }}
            >
              {["Top picks", "Recommended for you", "Made by friends"].map(
                (label, index) => (
                  <Button
                    key={index}
                    sx={{
                      textTransform: "none",
                      borderRadius: "0.8rem",
                      padding: {
                        xs: "0.3rem 0.8rem",
                        sm: "0.5rem 0.8rem",
                        md: "0.5rem 1rem",
                      },
                      fontSize: "inherit",
                      color: selected === index ? "#E2DDF3" : "#3B354D",
                      transition: "all 0.3s ease",
                      backgroundColor:
                        selected === index ? "#3B354C" : "transparent",
                      "&:hover": {
                        color: selected === index ? "#E2DDF3" : "inherit",
                        transform: "scale(1.01)",
                        backgroundColor:
                          selected === index
                            ? "#3B354C"
                            : "rgba(59, 53, 76, 0.1)",
                      },
                      mb: { xs: 0.5, sm: 0 },
                      flex: { xs: "1 1 auto", sm: "0 0 auto" },
                      minWidth: { xs: "30%", sm: "auto" },
                      maxWidth: { xs: "32%", sm: "none" },
                    }}
                    onClick={() => setSelected(index)}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: {
                          xs: "0.7rem",
                          sm: "0.9rem",
                          md: "1.1rem",
                          lg: "1.25rem",
                        },
                        whiteSpace: { xs: "normal", sm: "nowrap" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "center",
                        width: "100%",
                        lineHeight: { xs: "1.1", sm: "normal" },
                        height: { xs: "auto", sm: "auto" },
                      }}
                    >
                      {label}
                    </Typography>
                  </Button>
                )
              )}
            </Stack>
            {/* Actions section */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "flex-end", sm: "flex-end" },
                mt: { xs: 1, sm: 0 },
              }}
            >
              {/* Refresh button/indicator */}
              <Box className="flex items-center">
                {lastUpdated && (
                  <Typography
                    variant="caption"
                    sx={{
                      mr: 1,
                      color: "#6F658D",
                      opacity:
                        isBackgroundRefreshing ||
                        updatesAvailable ||
                        showUpdateLabel
                          ? 1
                          : 0,
                      transition: "opacity 0.3s ease-in-out",
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    {isBackgroundRefreshing
                      ? "Refreshing..."
                      : `Refreshed ${formattedLastUpdated()}`}
                  </Typography>
                )}

                <Tooltip
                  title={updatesAvailable ? "New content available" : "Refresh"}
                >
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    {isBackgroundRefreshing ? (
                      <CircularProgress size={20} color="primary" />
                    ) : (
                      <RefreshIcon
                        onClick={refreshData}
                        sx={{
                          cursor: "pointer",
                          fontSize: { xs: "1.2rem", sm: "1.4rem" },
                          color: updatesAvailable ? "#6F4CAF" : "#3B354D",
                          animation: updatesAvailable
                            ? "pulse 2s infinite"
                            : "none",
                          "@keyframes pulse": {
                            "0%": { opacity: 0.6 },
                            "50%": { opacity: 1 },
                            "100%": { opacity: 0.6 },
                          },
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>
              </Box>
            </Stack>
          </Stack>

          {isLoading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(auto-fill, minmax(250px, 1fr))",
                  sm: "repeat(auto-fill, minmax(290px, 1fr))",
                },
                gap: { xs: 1, sm: 1 },
              }}
            >
              {[...Array(Math.max(filteredCards.length || 3))].map(
                (_, index) => (
                  <Skeleton
                    key={index}
                    variant="rectangular"
                    animation="wave"
                    sx={{
                      height: "14rem",
                      borderRadius: "0.8rem",
                    }}
                  />
                )
              )}
            </Box>
          ) : filteredCards.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              minHeight={{ xs: "40vh", sm: "60vh" }}
            >
              <img
                src={NoStudyMaterial}
                alt="No Study Materials"
                style={{
                  width: "100%",
                  maxWidth: "20rem",
                  height: "auto",
                  opacity: 0.75,
                }}
              />
              <p className="text-[#6F658D] font-bold text-[0.9rem] sm:text-[1rem] mt-4 px-2 sm:px-0 text-center">
                {selected === 1
                  ? "No recommended study materials found for you yet."
                  : selected === 2
                  ? "No study materials from your friends found"
                  : "No study materials available"}
              </p>
            </Box>
          ) : (
            <ExploreCards cards={filteredCards} />
          )}
        </Stack>
        <AutoHideSnackbar
          message={snackbarMessage}
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
        />
      </Box>
    </PageTransition>
  );
};

export default ExplorePage;
