import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Skeleton,
  Badge,
  CircularProgress,
  Divider,
} from "@mui/material";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";
import MyLibraryCards from "./MyLibraryCards";
import Filter from "../../../components/Filter";
import { useUser } from "../../../contexts/UserContext";
import { StudyMaterial } from "../../../types/studyMaterialObject";
import NoStudyMaterial from "/images/noStudyMaterial.svg";
import RefreshIcon from "@mui/icons-material/Refresh";
import { cacheService } from "../../../services/CacheService";
import { useLocation } from "react-router-dom";

const MyLibraryPage = () => {
  const { user } = useUser();
  const location = useLocation();
  const created_by = user?.username;
  const firebase_uid = user?.firebase_uid;
  const [cards, setCards] = useState<StudyMaterial[]>([]);
  const [bookmarkedCards, setBookmarkedCards] = useState<StudyMaterial[]>([]);
  const [filteredCards, setFilteredCards] = useState<StudyMaterial[]>([]);
  const [count, setCount] = useState<number>(0);
  const [filter, setFilter] = useState<string | number>(
    location.state?.showArchived ? "archive" : "all"
  );
  const [sort, setSort] = useState<string | number>("most recent");
  const [isLoading, setIsLoading] = useState(true);
  const [previousCardCount, setPreviousCardCount] = useState(3);

  // Improved background refresh state
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Add refs to track when data was last fetched
  const lastUserMaterialsFetch = useRef<number>(0);
  const lastBookmarksFetch = useRef<number>(0);

  // Cache data
  const cachedUserMaterials = useRef<StudyMaterial[]>([]);
  const cachedBookmarks = useRef<StudyMaterial[]>([]);

  // Add these two state variables inside your component
  const [showUpdateLabel, setShowUpdateLabel] = useState(false);
  const updateLabelTimer = useRef<NodeJS.Timeout | null>(null);

  // Add this state to store grouped cards
  const [groupedCards, setGroupedCards] = useState<
    Record<string, StudyMaterial[]>
  >({});
  const [monthsOrder, setMonthsOrder] = useState<string[]>([]);

  // Create a function to handle update notifications
  const showTemporaryUpdateLabel = useCallback(() => {
    // Clear any existing timer
    if (updateLabelTimer.current) {
      clearTimeout(updateLabelTimer.current);
    }

    // Show the label
    setShowUpdateLabel(true);

    // Set timer to hide it after 5 seconds
    updateLabelTimer.current = setTimeout(() => {
      setShowUpdateLabel(false);
    }, 1000);
  }, []);

  // Create optimized fetch functions with caching
  const fetchStudyMaterials = useCallback(
    async (force = false) => {
      if (!created_by) return;

      const cacheKey = `study_materials_${created_by}`;
      if (!force) {
        const cachedData = cacheService.get<StudyMaterial[]>(cacheKey);
        if (cachedData) {
          console.log("Using cached user materials");
          setCards(cachedData);
          return cachedData;
        }
      }

      try {
        const queryParam = force ? `?timestamp=${Date.now()}` : "";
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/study-material/get-by-user/${created_by}${queryParam}`,
          {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch study materials: ${response.status}`
          );
        }

        const data = await response.json();

        // Update cache with new data
        cacheService.set(cacheKey, data);

        // Update state
        setCards(data);
        setLastUpdated(new Date());
        // Update the lastUserMaterialsFetch timestamp
        lastUserMaterialsFetch.current = Date.now();

        if (!isBackgroundRefreshing) {
          showTemporaryUpdateLabel();
        }
        return data;
      } catch (error) {
        console.error("Error fetching study materials:", error);
        return [];
      }
    },
    [created_by, isBackgroundRefreshing, showTemporaryUpdateLabel]
  );

  const fetchBookmarkedStudyMaterials = useCallback(
    async (force = false) => {
      if (!firebase_uid) return;

      const now = Date.now();
      const needsRefresh = force || now - lastBookmarksFetch.current > 900000; // 15 minutes

      if (!needsRefresh && cachedBookmarks.current.length > 0) {
        console.log("Using cached bookmarks");
        setBookmarkedCards(cachedBookmarks.current);
        return cachedBookmarks.current;
      }

      // Don't fetch if already in progress (prevent duplicate requests)
      if (isBackgroundRefreshing && !force) {
        return cachedBookmarks.current;
      }

      try {
        // Only use timestamp parameter when forcing refresh
        const queryParam = force ? `?timestamp=${now}` : "";
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/study-material/get-bookmarks-by-user/${firebase_uid}${queryParam}`,
          {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bookmarked study materials");
        }

        const data = await response.json();
        console.log("Fetched bookmarked materials:", data.length);

        // Transform the bookmarked study materials to match the StudyMaterial format
        interface BookmarkInfo {
          bookmarked_at: string;
        }

        interface BookmarkedStudyMaterialResponse {
          study_material_info: StudyMaterial;
          bookmark_info: BookmarkInfo;
        }

        const formattedBookmarks: StudyMaterial[] = data.map(
          (item: BookmarkedStudyMaterialResponse) => ({
            ...item.study_material_info,
            bookmarked: true,
            bookmarked_at: item.bookmark_info.bookmarked_at,
          })
        );

        // Update cache
        cachedBookmarks.current = formattedBookmarks;
        lastBookmarksFetch.current = now;

        // Update state
        setBookmarkedCards(formattedBookmarks);
        if (!isBackgroundRefreshing) {
          showTemporaryUpdateLabel();
        }
        return formattedBookmarks;
      } catch (error) {
        console.error("Error fetching bookmarked study materials:", error);
        return cachedBookmarks.current;
      }
    },
    [firebase_uid, isBackgroundRefreshing, showTemporaryUpdateLabel]
  );

  // Background refresh function
  const backgroundRefresh = useCallback(() => {
    if (isBackgroundRefreshing) return;

    setIsBackgroundRefreshing(true);

    Promise.all([
      fetchStudyMaterials(true),
      fetchBookmarkedStudyMaterials(true),
    ]).finally(() => {
      setIsBackgroundRefreshing(false);
      setLastUpdated(new Date());
    });
  }, [
    fetchStudyMaterials,
    fetchBookmarkedStudyMaterials,
    isBackgroundRefreshing,
  ]);

  // Initial data fetch and set up auto-refresh
  useEffect(() => {
    if (!created_by || !firebase_uid) return;

    let isMounted = true;
    const initialLoad = async () => {
      setIsLoading(true);
      setPreviousCardCount(cards.length || 3);

      // Check if we already have cached data to show immediately
      if (cachedUserMaterials.current.length > 0) {
        setCards(cachedUserMaterials.current);
      }

      if (cachedBookmarks.current.length > 0) {
        setBookmarkedCards(cachedBookmarks.current);
      }

      // Then fetch fresh data if needed
      try {
        await Promise.all([
          fetchStudyMaterials(false),
          fetchBookmarkedStudyMaterials(false),
        ]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLastUpdated(new Date());
        }
      }
    };

    initialLoad();

    // Set up background refresh interval - increase to 10 minutes from 5
    const refreshInterval = setInterval(backgroundRefresh, 600000); // Every 10 minutes

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [
    created_by,
    firebase_uid,
    fetchStudyMaterials,
    fetchBookmarkedStudyMaterials,
    backgroundRefresh,
    cards.length,
  ]);

  // Check for navigation state parameters
  useEffect(() => {
    if (location.state?.forceRefresh) {
      // Force refresh the data
      fetchStudyMaterials(true);
      fetchBookmarkedStudyMaterials(true);

      // Set filter to archive if requested
      if (location.state?.showArchived) {
        setFilter("archive");
      }

      // Clear the state to prevent repeated refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchStudyMaterials, fetchBookmarkedStudyMaterials]);

  // Handle manual refresh request from child components or refresh button
  const handleRefresh = useCallback(() => {
    console.log("Manual refresh requested");
    setIsLoading(true);

    Promise.all([
      fetchStudyMaterials(true),
      fetchBookmarkedStudyMaterials(true),
    ]).finally(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
      // Make sure both timestamps are updated
      lastUserMaterialsFetch.current = Date.now();
      lastBookmarksFetch.current = Date.now();
      showTemporaryUpdateLabel();
    });
  }, [fetchStudyMaterials, fetchBookmarkedStudyMaterials]);

  // Format last updated time for display
  const formattedLastUpdated = useCallback(() => {
    if (!lastUpdated) return "";

    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hrs ago`;
  }, [lastUpdated]);

  // Make sure to clean up the timer in useEffect
  useEffect(() => {
    return () => {
      if (updateLabelTimer.current) {
        clearTimeout(updateLabelTimer.current);
      }
    };
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    // Combine cards and bookmarked cards depending on the filter
    let allCards: StudyMaterial[] = [...cards];

    console.log(
      "Applying filters - User cards:",
      cards.length,
      "Bookmarks:",
      bookmarkedCards.length
    );

    if (filter === "all" || filter === "bookmark") {
      // Avoid duplicates - if a card is both created by user and bookmarked
      const combinedCards = [...cards];

      if (filter === "bookmark") {
        console.log("Showing only bookmarked cards");
        allCards = bookmarkedCards;
      } else {
        // For "all", merge both with no duplicates
        bookmarkedCards.forEach((bookmarkedCard) => {
          if (
            !combinedCards.some(
              (card) =>
                card.study_material_id === bookmarkedCard.study_material_id
            )
          ) {
            combinedCards.push(bookmarkedCard);
          }
        });
        allCards = combinedCards.filter((card) => card.status !== "archived");
      }
    }

    console.log("Combined cards before filtering:", allCards.length);

    let filteredData = allCards;

    if (filter !== "archive") {
      filteredData = filteredData.filter((card) => card.status !== "archived");
    }

    // Apply visibility filter
    if (filter === "public") {
      filteredData = filteredData.filter((card) => card.visibility === 1);
    } else if (filter === "private") {
      filteredData = filteredData.filter((card) => card.visibility === 0);
    } else if (filter === "archive") {
      filteredData = filteredData.filter((card) => card.status === "archived");
    }

    console.log("Cards after filtering:", filteredData.length);

    // Sorting logic
    if (sort === "most recent") {
      filteredData.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else if (sort === "least recent") {
      filteredData.sort(
        (a, b) =>
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      );
    } else if (sort === "A-Z") {
      filteredData.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "Z-A") {
      filteredData.sort((a, b) => b.title.localeCompare(a.title));
    }

    // Group cards by month and year
    const grouped = groupCardsByMonthYear(filteredData);

    // Get months in chronological order (newest to oldest)
    const months = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredCards(filteredData);
    setGroupedCards(grouped);
    setMonthsOrder(months);
    setCount(filteredData.length);
  }, [filter, sort, cards, bookmarkedCards]);

  const groupCardsByMonthYear = (cards: StudyMaterial[]) => {
    // Create object to store cards by month/year
    const groupedCards: Record<string, StudyMaterial[]> = {};

    cards.forEach((card) => {
      // Parse the created_at date
      const createdDate = new Date(card.updated_at);

      // Format the month and year as a string key: "January 2025"
      const monthYear = createdDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      // Initialize array if this month/year doesn't exist yet
      if (!groupedCards[monthYear]) {
        groupedCards[monthYear] = [];
      }

      // Add the card to its corresponding month/year group
      groupedCards[monthYear].push(card);
    });

    return groupedCards;
  };

  return (
    <PageTransition>
      <Box className="h-full w-full">
        <DocumentHead title="My Library | Duel Learn" />
        <Stack spacing={1}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 1 }}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              mb: { xs: 2, sm: 0 },
            }}
          >
            {/* Title section */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" color="inherit">
                My Library
              </Typography>
              <Typography variant="subtitle2">—</Typography>
              <Typography variant="h6">{count}</Typography>
            </Stack>

            {/* Actions section */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "flex-end" },
              }}
            >
              {/* Refresh button/indicator */}
              <Box className="flex items-center">
                <Typography
                  variant="caption"
                  sx={{
                    mr: 1,
                    color: "#6F658D",
                    opacity: isBackgroundRefreshing || showUpdateLabel ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {isBackgroundRefreshing
                    ? "Refreshing..."
                    : `Updated ${formattedLastUpdated()}`}
                </Typography>
                {isBackgroundRefreshing ? (
                  <CircularProgress size={20} color="primary" sx={{ mr: 1 }} />
                ) : (
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={
                      lastUserMaterialsFetch.current > Date.now() - 300000
                    }
                  >
                    <RefreshIcon
                      onClick={handleRefresh}
                      sx={{
                        cursor: "pointer",
                        fontSize: { xs: "1rem", sm: "1.2rem" },
                        color: "#6F658D",
                        "&:hover": {
                          color: "#E2DDF3",
                        },
                      }}
                    />
                  </Badge>
                )}
              </Box>

              {/* Filters */}
              <Stack direction={"row"} spacing={1} sx={{ flexShrink: 0 }}>
                <Filter
                  menuItems={[
                    { value: "all", label: "All" },
                    { value: "public", label: "Public" },
                    { value: "private", label: "Private" },
                    { value: "bookmark", label: "Bookmark" },
                    { value: "archive", label: "Archive" },
                  ]}
                  value={filter}
                  onChange={setFilter}
                  hoverOpen
                />
                <Filter
                  menuItems={[
                    { value: "most recent", label: "Most Recent" },
                    { value: "least recent", label: "Least Recent" },
                    { value: "A-Z", label: "A-Z" },
                    { value: "Z-A", label: "Z-A" },
                  ]}
                  value={sort}
                  onChange={setSort}
                  hoverOpen
                />
              </Stack>
            </Stack>
          </Stack>
          {isLoading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: 2,
                width: "100%",
                mt: 1,
              }}
            >
              {[...Array(previousCardCount)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rectangular"
                  animation="wave"
                  sx={{
                    height: "14rem",
                    borderRadius: "0.8rem",
                  }}
                />
              ))}
            </Box>
          ) : filteredCards.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              minHeight="60vh"
            >
              <img
                src={NoStudyMaterial}
                alt="No Study Materials"
                style={{ width: "22rem", height: "auto", opacity: 0.75 }}
              />
              <p className="text-[#6F658D] font-bold text-[1rem] mt-4 pr-4 text-center">
                {filter === "bookmark"
                  ? "You don't have any bookmarked study materials yet"
                  : filter === "archive"
                  ? "You don't have any archived study materials yet"
                  : "You don't have any study materials yet"}
              </p>
            </Box>
          ) : (
            created_by && (
              <>
                {monthsOrder.map((monthYear) => (
                  <Box key={monthYear} sx={{ mb: { xs: 3, sm: 4 } }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        width: "100%",
                        mb: { xs: 1, sm: 2 },
                        mt: { xs: 1, sm: 2 },
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: "nowrap",
                          color: "#6F658D",
                          fontSize: { xs: "0.875rem", sm: "1rem" },
                        }}
                      >
                        {monthYear}
                      </Typography>
                      <Box sx={{ width: "100%" }}>
                        <Divider
                          sx={{
                            height: { xs: "1px", sm: "2px" },
                            backgroundColor: "#3B354C",
                            width: "100%",
                          }}
                        />
                      </Box>
                    </Stack>

                    <MyLibraryCards
                      cards={groupedCards[monthYear]}
                      createdBy={created_by}
                      onRefreshNeeded={handleRefresh}
                    />
                  </Box>
                ))}
              </>
            )
          )}
        </Stack>
      </Box>
    </PageTransition>
  );
};

export default MyLibraryPage;
