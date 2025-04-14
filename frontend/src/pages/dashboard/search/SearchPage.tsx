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

  // New state for selected user and their materials
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userMaterials, setUserMaterials] = useState<StudyMaterial[]>([]);
  const [loadingUserData, setLoadingUserData] = useState(false);

  // New state for friendship data
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus | null>(null);
  const [loadingFriendshipStatus, setLoadingFriendshipStatus] = useState(false);

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

  // Modify fetchUserWithMaterials to also fetch friendship status
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
      // Show a user-friendly error message
      alert("Failed to load user data. Please try again.");
    } finally {
      setLoadingUserData(false);
    }
  };

  // Update handleAddFriend to account for friendship status
  const handleAddFriend = async (userId: string) => {
    if (!user?.firebase_uid) {
      alert("You must be logged in to add friends");
      return;
    }

    try {
      // Get current user information
      const [userResponse] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/${user?.firebase_uid}`
        ),
      ]);

      const userData = userResponse.data;

      // Send friend request
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/friends/send-request`,
        {
          sender_id: user.firebase_uid,
          sender_username: userData.username,
          receiver_id: userId,
          receiver_username: selectedUser?.username || "",
        }
      );

      // Update friendship status
      fetchFriendshipStatus(userId);

      // Show success message
      alert("Friend request sent successfully!");
    } catch (error) {
      console.error("Failed to send friend request:", error);
      alert("Failed to send friend request. Please try again.");
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

  // If a specific user is selected, show their profile and materials
  if (selectedUser) {
    // Determine friend button state based on friendship status
    let friendButtonText = "Add Friend";
    let friendButtonClass = "bg-[#52A647] hover:bg-[#478C3D]";
    let friendButtonDisabled = false;

    if (friendshipStatus) {
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
            {/* User Profile */}
            <div className="flex items-center p-6 bg-[#3B354D] rounded-[0.8rem]">
              <img
                src={selectedUser.display_picture || defaultPicture}
                alt="Avatar"
                className="w-16 h-16 object-cover rounded-[5px] mr-6"
              />
              <div>
                <p className="text-[1.5rem] text-[#E2DDF3] font-medium">
                  {selectedUser.username}
                </p>
                <div className="flex items-center gap-[0.5vw]">
                  {" "}
                  <p className="text-[clamp(0.8rem,0.5vw,1.5rem)]  min-text-[12px] text-[#9F9BAE]">
                    Level {selectedUser.level}
                  </p>
                  <p className="text-[#9F9BAE] text-[clamp(0.6rem,0.7vw,2rem)]">
                    •
                  </p>
                  <p className="text-[clamp(0.8rem,0.5vw,1.5rem)]  min-text-[12px] text-[#9F9BAE]">
                    EXP {selectedUser.exp}
                  </p>
                </div>

                {/* Show mutual friends if any */}
                {friendshipStatus &&
                  friendshipStatus.mutual_friends.count > 0 && (
                    <p className="text-[0.8rem] text-[#C6C1D8] mt-1">
                      {friendshipStatus.mutual_friends.count} mutual friend
                      {friendshipStatus.mutual_friends.count > 1 ? "s" : ""}
                    </p>
                  )}
              </div>
              <Box flex={1} />
              {!isOwnProfile && (
                <button
                  className={`rounded-[0.8rem] px-6 py-[0.4rem] h-fit text-[0.9rem] hover:scale-105 transition-all duration-300 ease-in-out ${friendButtonClass}`}
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

            {/* Mutual Friends (if any) */}
            {friendshipStatus &&
              friendshipStatus.mutual_friends.list.length > 0 && (
                <div className="p-4 bg-[#3B354D15] rounded-[0.8rem]">
                  <p className="text-[#9F9BAE] font-medium mb-2">
                    Mutual Friends:
                  </p>
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {friendshipStatus.mutual_friends.list.map((friend) => (
                      <div
                        key={friend.firebase_uid}
                        className="flex flex-col items-center min-w-[80px]"
                      >
                        <img
                          src={friend.display_picture || defaultPicture}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <p className="text-[#E2DDF3] text-xs mt-1 text-center">
                          {friend.username}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* User's Study Materials */}
            <Stack spacing={2}>
              <p className="text-[#9F9BAE] font-semibold text-[2.5vh]">
                Study Materials by {selectedUser.username}
              </p>

              {userMaterials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <p className="py-3 text-center text-[#9F9BAE]">
                  No study materials found for this user
                </p>
              )}
            </Stack>
          </Stack>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <p className="text-[#9F9BAE] font-semibold text-[2.3vh]">
          Matching Results for "{searchQuery}"
        </p>
        <Stack direction={"row"} spacing={0.5}>
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
                <p className="text-[#9F9BAE] font-semibold text-[2.5vh]">
                  Users
                </p>

                {filteredUsers.map((user) => {
                  return (
                    <div
                      key={user.firebase_uid}
                      onClick={() => handleViewUserProfile(user)}
                      className="flex items-center p-6 bg-[#3B354D] border border-[#3B354D] rounded-[0.8rem] cursor-pointer hover:border-[#6F658D] transition-all duration-300 ease-in-out"
                    >
                      <img
                        src={user.display_picture || defaultPicture}
                        alt="Avatar"
                        className="w-auto h-18 object-cover rounded-[5px] mr-6 hover:scale-110 transition-all duration-300 cursor-pointer"
                      />
                      <div className="cursor-pointer">
                        <p className="text-[1.3rem] text-[#E2DDF3]">
                          {user.username}
                        </p>
                        <div className="flex items-center gap-[0.5vw]">
                          {" "}
                          <p className="text-[clamp(0.8rem,0.5vw,1.5rem)]  min-text-[12px] text-[#9F9BAE]">
                            Level {user.level}
                          </p>
                          <p className="text-[#9F9BAE] text-[clamp(0.6rem,0.7vw,2rem)]">
                            •
                          </p>
                          <p className="text-[clamp(0.8rem,0.5vw,1.5rem)]  min-text-[12px] text-[#9F9BAE]">
                            EXP {user.exp}
                          </p>
                        </div>
                      </div>
                      <Box flex={1} />
                    </div>
                  );
                })}
              </Stack>
            )}

          {(filter === "all" || filter === "materials") &&
            filteredMaterials.length > 0 && (
              <Stack spacing={2}>
                <p className="text-[#9F9BAE] font-semibold text-[2.5vh]">
                  Study Materials
                </p>
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
                <p className="text-[#9F9BAE] text-lg">
                  No results found for "{searchQuery}"
                </p>
              </Box>
            )}
        </>
      )}
    </Stack>
  );
};

export default SearchPage;
