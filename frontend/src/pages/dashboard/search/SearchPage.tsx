import { Stack, Box } from "@mui/material";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { StudyMaterial } from "../../../types/studyMaterialObject";
import { UserInfo } from "../../../types/userInfoObject";
import CardComponent from "../../../components/CardComponent";
import defaultPicture from "/profile-picture/default-picture.svg";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useUser } from "../../../contexts/UserContext";
import { useFriendList } from "../../../hooks/friends.hooks/useFriendList";
import { useFriendSocket } from "../../../hooks/friends.hooks/useFriendSocket";
import AutoHideSnackbar from "../../../components/ErrorsSnackbar";
import NoResult from "/images/NoFriend.svg";
import DocumentHead from "../../../components/DocumentHead";

// Add types for friendship data
interface MutualFriend {
  firebase_uid: string;
  username: string;
  level: number;
  display_picture: string | null;
}

interface FriendshipStatus {
  friendship_status: "friend" | "pending" | "not_friend";
  mutual_friends: {
    count: number;
    list: MutualFriend[];
  };
}

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser(); // Get current user from auth context
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "users", "materials"

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    action: false,
  });

  // New state for selected user and their materials
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userMaterials, setUserMaterials] = useState<StudyMaterial[]>([]);
  const [loadingUserData, setLoadingUserData] = useState(false);

  // New state for friendship data
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus | null>(null);
  const [loadingFriendshipStatus, setLoadingFriendshipStatus] = useState(false);

  // Add state for pending requests
  const [pendingRequests, setPendingRequests] = useState<{
    [key: string]: boolean;
  }>({});

  // Add a new state to track friendship status for all users in search results
  const [userFriendshipStatuses, setUserFriendshipStatuses] = useState<{
    [key: string]: "friend" | "pending" | "not_friend";
  }>({});

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Initialize friend hooks
  const { handleSendFriendRequest } = useFriendList(user?.firebase_uid);

  // Handle friend request sent callback
  const handleFriendRequestSent = (data: {
    success: boolean;
    receiver_id: string;
  }) => {
    if (data.success) {
      // Update UI to show request was sent successfully
      setPendingRequests((prev) => ({
        ...prev,
        [data.receiver_id]: true,
      }));
    }
  };

  // Add this to your destructured values from useFriendSocket
  const { sendFriendRequest, isConnected } = useFriendSocket({
    userId: user?.firebase_uid,
    onFriendRequestSent: handleFriendRequestSent,
  });

  useEffect(() => {
    // Extract search query from URL
    const query = new URLSearchParams(location.search).get("query");
    const username = new URLSearchParams(location.search).get("user");

    // If there's a query, reset selectedUser and fetch search results
    if (query) {
      setSearchQuery(query);
      setSelectedUser(null); // Clear selected user when a new search is performed
      setUserMaterials([]); // Clear user materials
      fetchSearchResults(query);
    }

    // If there's a username in the URL, load that user's profile
    if (username) {
      fetchUserWithMaterials(username);
    }
  }, [location.search]);
  // Reset friendship status when no user is selected
  useEffect(() => {
    if (!selectedUser) {
      setFriendshipStatus(null);
    }
  }, [selectedUser]);

  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        users: UserInfo[];
        study_materials: StudyMaterial[];
      }>(`${import.meta.env.VITE_BACKEND_URL}/api/search/global/${query}`);

      setUsers(response.data.users);
      setStudyMaterials(response.data.study_materials);
    } catch (error) {
      console.error("Search failed:", error);
    }
    setLoading(false);
  };

  // New function to fetch friendship status
  const fetchFriendshipStatus = async (targetUserId: string) => {
    // Only proceed if we have a logged-in user
    if (!user?.firebase_uid) return;

    setLoadingFriendshipStatus(true);
    try {
      const response = await axios.get<FriendshipStatus>(
        `${import.meta.env.VITE_BACKEND_URL}/api/search/friendship-status/${
          user?.firebase_uid
        }/${targetUserId}`
      );

      setFriendshipStatus(response.data);
    } catch (error) {
      console.error("Failed to fetch friendship status:", error);
      setFriendshipStatus(null);
    } finally {
      setLoadingFriendshipStatus(false);
    }
  };

  // Modify fetchUserWithMaterials to use Snackbar instead of alert
  const fetchUserWithMaterials = async (username: string) => {
    setLoadingUserData(true);
    try {
      console.log(`Fetching user materials for: ${username}`);
      const response = await axios.get<{
        user: UserInfo;
        study_materials: StudyMaterial[];
      }>(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/search/material-of-user/${username}`
      );

      console.log("API Response:", response.data);

      if (response.data && response.data.user) {
        setSelectedUser(response.data.user);

        // Also fetch friendship status if we have a current user
        if (user?.firebase_uid && response.data.user.firebase_uid) {
          fetchFriendshipStatus(response.data.user.firebase_uid);
        }

        // Transform the data to include all required fields for CardComponent
        const materials = response.data.study_materials.map((material) => {
          // Handle tags properly with safe parsing
          let parsedTags = [];
          try {
            if (material.tags === null || material.tags === undefined) {
              parsedTags = [];
            } else if (typeof material.tags === "string") {
              parsedTags = JSON.parse(material.tags);
            } else if (Array.isArray(material.tags)) {
              parsedTags = material.tags;
            }
          } catch (e) {
            console.error("Error parsing tags:", e);
            parsedTags = [];
          }

          return {
            ...material,
            images: [], // Add missing fields
            updatedAt: material.created_at,
            visibility: material.visibility,
            status: material.status,
            tags: parsedTags, // Use the safely parsed tags
            totalItems: material.total_items || 0,
            created_by: material.created_by || "",
            created_by_id: material.created_by_id || "",
            created_at: material.created_at || new Date().toISOString(),
            updated_at:
              material.updated_at ||
              material.created_at ||
              new Date().toISOString(),
            totalViews: material.total_views || 0,
            items: Array.isArray(material.items)
              ? material.items.map((item) => ({
                  ...item,
                  images: [], // Add missing fields
                  terms: item.term || "",
                  definition: item.definition || "",
                }))
              : [],
          };
        });

        setUserMaterials(materials);
        console.log("Transformed materials:", materials);
      } else {
        console.error("Invalid response format", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Show error using snackbar instead of alert
      setSnackbar({
        open: true,
        message: "Failed to load user data. Please try again.",
        action: false,
      });
    } finally {
      setLoadingUserData(false);
    }
  };

  // Update handleAddFriend to use Snackbar instead of alert
  const handleAddFriend = async (
    userId: string,
    usernameFromSearch?: string
  ) => {
    if (!user?.firebase_uid) {
      // Use snackbar instead of alert
      setSnackbar({
        open: true,
        message: "You must be logged in to add friends",
        action: false,
      });
      return;
    }

    // Get the username either from selectedUser or passed directly from search results
    const targetUsername = selectedUser?.username || usernameFromSearch;

    // Verify we have a username one way or another
    if (!targetUsername) {
      setSnackbar({
        open: true,
        message: "Cannot add user: missing username information",
        action: false,
      });
      return;
    }

    try {
      // Set pending state immediately for better UX
      setPendingRequests((prev) => ({
        ...prev,
        [userId]: true,
      }));

      // Get current user information using the CORRECT endpoint
      const userResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/user-info/${
          user?.firebase_uid
        }`
      );

      // Since this endpoint returns an array of users, not the current user,
      // we can just use the existing user info from context instead
      const userData = {
        username: user.username,
        level: user.level,
        firebase_uid: user.firebase_uid,
      };

      if (!userData?.username) {
        throw new Error("Failed to retrieve your user information");
      }

      // Log what we're about to send for debugging
      console.log("Friend request data:", {
        sender_id: user.firebase_uid,
        receiver_id: userId,
        sender_username: userData.username,
        receiver_username: targetUsername, // Use targetUsername instead of selectedUser.username
      });

      // Try direct API call to the friend request endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friend/request`,
        {
          sender_id: user.firebase_uid,
          sender_username: userData.username,
          receiver_id: userId,
          receiver_username: targetUsername,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Friend request API response:", response.data);

      // If HTTP request succeeds, also try socket notification
      if (isConnected) {
        sendFriendRequest({
          sender_id: user.firebase_uid,
          sender_username: userData.username,
          receiver_id: userId,
          receiver_username: targetUsername,
        });
      }

      // Update friendship status
      fetchFriendshipStatus(userId);

      // Show success message with snackbar instead of alert
      setSnackbar({
        open: true,
        message: "Friend request sent successfully!",
        action: false,
      });
    } catch (error) {
      console.error("Failed to send friend request:", error);

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("API Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
      }

      // Use snackbar instead of alert
      setSnackbar({
        open: true,
        message: "Failed to send friend request. Please try again.",
        action: false,
      });

      // Reset pending state on error
      setPendingRequests((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle view user profile and materials
  const handleViewUserProfile = (user: UserInfo) => {
    setSelectedUser(user);
    fetchUserWithMaterials(user.username);
    // Update URL without causing a full page reload
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("user", user.username);
    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true,
    });
  };

  // Back to search results
  const handleBackToResults = () => {
    setSelectedUser(null);
    setUserMaterials([]);
    // Remove user param from URL
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete("user");
    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true,
    });
  };

  // Filter displayed results
  const getFilteredResults = () => {
    if (filter === "users") return { users, studyMaterials: [] };
    if (filter === "materials") return { users: [], studyMaterials };
    return { users, studyMaterials }; // "all"
  };

  const handleCardClick = async (studyMaterialId: string, title: string) => {
    try {
      await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/study-material/increment-views/${studyMaterialId}`,
        {
          method: "POST",
        }
      );

      navigate(`/dashboard/study-material/view/${studyMaterialId}`, {
        state: { title },
      });
    } catch (error) {
      console.error("Error updating total views:", error);
    }
  };

  const { users: filteredUsers, studyMaterials: filteredMaterials } =
    getFilteredResults();

  // After fetching search results, fetch friendship status for all users
  useEffect(() => {
    const fetchAllFriendshipStatuses = async () => {
      if (!user?.firebase_uid || filteredUsers.length === 0) return;

      try {
        // Create a copy to avoid state mutations during the loop
        const statuses: { [key: string]: "friend" | "pending" | "not_friend" } =
          {};

        for (const searchedUser of filteredUsers) {
          try {
            const response = await axios.get<FriendshipStatus>(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/search/friendship-status/${user?.firebase_uid}/${
                searchedUser.firebase_uid
              }`
            );

            statuses[searchedUser.firebase_uid] =
              response.data.friendship_status;
          } catch (error) {
            console.error(
              `Failed to fetch status for user ${searchedUser.username}`,
              error
            );
            statuses[searchedUser.firebase_uid] = "not_friend";
          }
        }

        setUserFriendshipStatuses(statuses);
      } catch (error) {
        console.error("Failed to fetch friendship statuses:", error);
      }
    };

    fetchAllFriendshipStatuses();
  }, [filteredUsers, user?.firebase_uid]);

  // If a specific user is selected, show their profile and materials
  if (selectedUser) {
    // Friend button logic remains the same
    let friendButtonText = "Add Friend";
    let friendButtonClass = "bg-[#52A647] hover:bg-[#478C3D]";
    let friendButtonDisabled = false;

    if (pendingRequests[selectedUser.firebase_uid]) {
      friendButtonText = "Request Sent";
      friendButtonClass = "bg-[#9F9BAE] hover:bg-[#8F8B9E]";
      friendButtonDisabled = true;
    } else if (friendshipStatus) {
      switch (friendshipStatus.friendship_status) {
        case "friend":
          friendButtonText = "Friends";
          friendButtonClass = "bg-[#8878C7] hover:bg-[#7A6BB8]";
          friendButtonDisabled = true;
          break;
        case "pending":
          friendButtonText = "Request Sent";
          friendButtonClass = "bg-[#9F9BAE] hover:bg-[#8F8B9E]";
          friendButtonDisabled = true;
          break;
      }
    }

    // Don't show add friend button if viewing own profile
    const isOwnProfile = user?.firebase_uid === selectedUser.firebase_uid;

    return (
      <Stack spacing={2}>
        <button
          className="self-start flex items-center gap-2 pb-2 text-[#3B354C] hover:text-inherit transition-colors"
          onClick={handleBackToResults}
        >
          <ArrowBackIcon fontSize="small" /> Back to search results
        </button>

        {loadingUserData ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: "#8878C7" }} />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* User Profile - Updated to constrain image sizes */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 bg-[#3B354D] rounded-[0.8rem]">
              <div className="flex items-center w-full mb-4 sm:mb-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-[5px] overflow-hidden mr-4 sm:mr-6">
                  <img
                    src={selectedUser.display_picture || defaultPicture}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[1.2rem] sm:text-[1.5rem] text-[#E2DDF3] font-medium">
                    {selectedUser.username}
                  </p>
                  <div className="flex items-center gap-[0.5vw]">
                    <p className="text-[0.8rem] sm:text-[clamp(0.8rem,0.5vw,1.5rem)] text-[#9F9BAE]">
                      Level {selectedUser.level}
                    </p>
                    <p className="text-[#9F9BAE] text-[0.8rem] sm:text-[clamp(0.6rem,0.7vw,2rem)]">
                      •
                    </p>
                    <p className="text-[0.8rem] sm:text-[clamp(0.8rem,0.5vw,1.5rem)] text-[#9F9BAE]">
                      EXP {selectedUser.exp}
                    </p>
                  </div>

                  {/* Show mutual friends if any */}
                  {friendshipStatus &&
                    friendshipStatus.mutual_friends.count > 0 && (
                      <p className="text-[0.7rem] sm:text-[0.8rem] text-[#C6C1D8] mt-1">
                        {friendshipStatus.mutual_friends.count} mutual friend
                        {friendshipStatus.mutual_friends.count > 1 ? "s" : ""}
                      </p>
                    )}
                </div>
              </div>

              {/* Friend button repositioned for mobile */}
              {!isOwnProfile && (
                <button
                  className={`w-full sm:w-auto rounded-[0.8rem] px-4 sm:px-6 py-[0.4rem] text-[0.85rem] hover:scale-105 transition-all duration-300 ease-in-out ${friendButtonClass}`}
                  onClick={() => handleAddFriend(selectedUser.firebase_uid)}
                  disabled={friendButtonDisabled}
                >
                  {loadingFriendshipStatus ? (
                    <CircularProgress size={16} sx={{ color: "white" }} />
                  ) : (
                    friendButtonText
                  )}
                </button>
              )}
            </div>

            {/* Mutual Friends (if any) - Updated for mobile */}
            {friendshipStatus &&
              friendshipStatus.mutual_friends.list.length > 0 && (
                <div className="p-3 sm:p-4 bg-[#3B354D15] rounded-[0.8rem]">
                  <p className="text-[#9F9BAE] font-medium mb-2 text-[0.9rem] sm:text-base">
                    Mutual Friends:
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto py-2">
                    {friendshipStatus.mutual_friends.list.map((friend) => (
                      <div
                        key={friend.firebase_uid}
                        className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]"
                      >
                        <div className="w-12 h-auto rounded-lg overflow-hidden">
                          <img
                            src={friend.display_picture || defaultPicture}
                            alt={friend.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[#E2DDF3] text-[10px] sm:text-xs mt-1 text-center truncate w-full">
                          {friend.username}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* User's Study Materials - Updated for mobile */}
            <Stack spacing={2}>
              <p className="text-[#9F9BAE] font-semibold text-[1.2rem] sm:text-[2.5vh]">
                Study Materials by {selectedUser.username}
              </p>

              {userMaterials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {userMaterials.map((material) => (
                    <CardComponent
                      key={material.study_material_id}
                      title={material.title || ""}
                      tags={material.tags}
                      images={material.images || []}
                      totalItems={material.total_items || 0}
                      createdBy={material.created_by || ""}
                      createdById={material.created_by_id || ""}
                      createdAt={
                        material.created_at || new Date().toISOString()
                      }
                      updatedAt={
                        material.updated_at || new Date().toISOString()
                      }
                      visibility={material.visibility || 0}
                      status={material.status || "active"}
                      totalViews={material.total_views || 0}
                      items={material.items || []}
                      onClick={() =>
                        handleCardClick(
                          material.study_material_id,
                          material.title || ""
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <Box py={4} textAlign="center">
                  <img
                    src={NoResult}
                    alt="No results"
                    className="lg:w-[8rem] sm:w-[4rem] h-auto mx-auto mb-4 opacity-70"
                  />
                  <p className="text-[#9F9BAE] text-md">
                    No public study material found
                  </p>
                </Box>
              )}
            </Stack>
          </Stack>
        )}
        <AutoHideSnackbar
          open={snackbar.open}
          message={snackbar.message}
          onClose={handleCloseSnackbar}
          action={snackbar.action}
        />
      </Stack>
    );
  }

  return (
    <>
      <DocumentHead title={`Search: ${searchQuery}  | Duel Learn`} />
      <Stack spacing={2}>
        <Stack spacing={1}>
          <p className="text-[#9F9BAE] font-semibold text-[2.3vh]">
            Matching Results for "{searchQuery}"
          </p>
          <Stack direction={"row"} spacing={0.1}>
            <button
              className={`rounded-[0.8rem] py-[0.5rem] px-[1rem] ${
                filter === "all"
                  ? "bg-[#3B354C] text-[#E2DDF3]"
                  : "bg-inherit text-[#3B354D]"
              } hover:text-[#E2DDF3] hover:bg-[#3B354C] transition-all duration-300 ease-in-out`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`rounded-[0.8rem] py-[0.5rem] px-[1rem] ${
                filter === "users"
                  ? "bg-[#3B354C] text-[#E2DDF3]"
                  : "bg-inherit text-[#3B354D]"
              } hover:text-[#E2DDF3] hover:bg-[#3B354C] transition-all duration-300 ease-in-out`}
              onClick={() => setFilter("users")}
            >
              Users
            </button>
            <button
              className={`rounded-[0.8rem] py-[0.5rem] px-[1rem] ${
                filter === "materials"
                  ? "bg-[#3B354C] text-[#E2DDF3]"
                  : "bg-inherit text-[#3B354D]"
              } hover:text-[#E2DDF3] hover:bg-[#3B354C] transition-all duration-300 ease-in-out`}
              onClick={() => setFilter("materials")}
            >
              Study Materials
            </button>
          </Stack>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: "#8878C7" }} />
          </Box>
        ) : (
          <>
            {(filter === "all" || filter === "users") &&
              filteredUsers.length > 0 && (
                <Stack spacing={2}>
                  <Stack direction={"row"} spacing={2} alignItems={"center"}>
                    <p className="text-[#9F9BAE] font-semibold text-[2.5vh]">
                      User
                    </p>
                    <hr className="border-t-2 border-[#3B354D] flex-1 rounded-full" />
                  </Stack>

                  {filteredUsers.map((searchedUser) => {
                    // Define button properties for each user in the list
                    let friendButtonText: string = "Add Friend";
                    let friendButtonClass: string =
                      "bg-[#52A647] hover:bg-[#478C3D]";
                    let friendButtonDisabled: boolean = false;

                    // Check current friendship status for this user
                    const friendshipStatus =
                      userFriendshipStatuses[searchedUser.firebase_uid];

                    if (friendshipStatus === "friend") {
                      friendButtonText = "Friends";
                      friendButtonClass = "bg-[#8878C7] hover:bg-[#7A6BB8]";
                      friendButtonDisabled = true;
                    } else if (
                      friendshipStatus === "pending" ||
                      pendingRequests[searchedUser.firebase_uid]
                    ) {
                      friendButtonText = "Request Sent";
                      friendButtonClass = "bg-[#9F9BAE] hover:bg-[#8F8B9E]";
                      friendButtonDisabled = true;
                    }

                    // Check if user is the current user
                    const isOwnProfile =
                      user?.firebase_uid === searchedUser.firebase_uid;
                    if (isOwnProfile) {
                      friendButtonDisabled = true;
                      friendButtonText = "Your Profile";
                    }

                    return (
                      <div
                        key={searchedUser.firebase_uid}
                        onClick={() => handleViewUserProfile(searchedUser)}
                        className="flex items-center p-6 bg-[#3B354D] border border-[#3B354D] rounded-[0.8rem] cursor-pointer hover:border-[#6F658D] transition-all duration-300 ease-in-out"
                      >
                        <img
                          src={searchedUser.display_picture || defaultPicture}
                          alt="Avatar"
                          className="w-auto h-16 object-cover rounded-[5px] mr-6 hover:scale-110 transition-all duration-300 cursor-pointer"
                        />
                        <div className="cursor-pointer">
                          <p className="text-[1.3rem] text-[#E2DDF3]">
                            {searchedUser.username}
                          </p>
                          <div className="flex items-center gap-[0.5vw]">
                            {" "}
                            <p className="text-[clamp(0.8rem,0.5vw,1.5rem)]  min-text-[12px] text-[#9F9BAE]">
                              Level {searchedUser.level}
                            </p>
                            <p className="text-[#9F9BAE] text-[clamp(0.6rem,0.7vw,2rem)]">
                              •
                            </p>
                            <p className="text-[clamp(0.8rem,0.5vw,1.5rem)]  min-text-[12px] text-[#9F9BAE]">
                              EXP {searchedUser.exp}
                            </p>
                          </div>
                        </div>
                        <Box flex={1} />
                        <button
                          className={`w-full sm:w-auto rounded-[0.8rem] px-4 sm:px-6 py-[0.4rem] text-[0.85rem] hover:scale-105 transition-all duration-300 ease-in-out ${friendButtonClass}`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent onClick
                            handleAddFriend(
                              searchedUser.firebase_uid,
                              searchedUser.username
                            );
                          }}
                          disabled={friendButtonDisabled}
                        >
                          {loadingFriendshipStatus ? (
                            <CircularProgress
                              size={16}
                              sx={{ color: "white" }}
                            />
                          ) : (
                            friendButtonText
                          )}
                        </button>
                      </div>
                    );
                  })}
                </Stack>
              )}

            {(filter === "all" || filter === "materials") &&
              filteredMaterials.length > 0 && (
                <Stack spacing={2}>
                  <Stack direction={"row"} spacing={2} alignItems={"center"}>
                    <p className="text-[#9F9BAE] font-semibold text-[2.5vh]">
                      Study Materials
                    </p>
                    <hr className="border-t-2 border-[#3B354D] flex-1 rounded-full" />
                  </Stack>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMaterials.map((material) => {
                      // Handle tags properly with safe parsing for filtered materials as well
                      let parsedTags = [];
                      try {
                        if (
                          material.tags === null ||
                          material.tags === undefined
                        ) {
                          parsedTags = [];
                        } else if (typeof material.tags === "string") {
                          parsedTags = JSON.parse(material.tags);
                        } else if (Array.isArray(material.tags)) {
                          parsedTags = material.tags;
                        }
                      } catch (e) {
                        console.error(
                          "Error parsing tags for filtered material:",
                          e
                        );
                        parsedTags = [];
                      }

                      return (
                        <CardComponent
                          key={material.study_material_id}
                          title={material.title || ""}
                          tags={parsedTags} // Use safely parsed tags
                          images={material.images || []}
                          totalItems={material.total_items || 0}
                          createdBy={material.created_by || ""}
                          createdById={material.created_by_id || ""}
                          createdAt={
                            material.created_at || new Date().toISOString()
                          }
                          updatedAt={
                            material.updated_at ||
                            material.created_at ||
                            new Date().toISOString()
                          }
                          visibility={material.visibility || 0}
                          status={material.status || "active"}
                          totalViews={material.total_views || 0}
                          items={material.items || []}
                          onClick={() =>
                            handleCardClick(
                              material.study_material_id,
                              material.title || ""
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </Stack>
              )}

            {!loading &&
              filteredUsers.length === 0 &&
              filteredMaterials.length === 0 && (
                <Box py={4} textAlign="center">
                  <img
                    src={NoResult}
                    alt="No results"
                    className="lg:w-[10rem] sm:w-[8rem] h-auto mx-auto mb-4 opacity-70"
                  />
                  <p className="text-[#9F9BAE] text-md">
                    No results found for "{searchQuery}"
                  </p>
                </Box>
              )}
          </>
        )}
        <AutoHideSnackbar
          open={snackbar.open}
          message={snackbar.message}
          onClose={handleCloseSnackbar}
          action={snackbar.action}
        />
      </Stack>
    </>
  );
};

export default SearchPage;
