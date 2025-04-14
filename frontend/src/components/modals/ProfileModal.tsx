import { useState, useEffect } from "react";
import { Box, Stack, Modal } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import CardComponent from "../CardComponent";
import defaultPicture from "/profile-picture/default-picture.svg";
import { useUser } from "../../contexts/UserContext";
import { UserInfo } from "../../types/userInfoObject";
import { StudyMaterial } from "../../types/studyMaterialObject";
import { useNavigate } from "react-router-dom";

// Add types for friendship data (same as in SearchPage)
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

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  username?: string;
}

const ProfileModal = ({
  open,
  onClose,
  userId,
  username,
}: ProfileModalProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userMaterials, setUserMaterials] = useState<StudyMaterial[]>([]);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus | null>(null);
  const [loadingFriendshipStatus, setLoadingFriendshipStatus] = useState(false);

  // Fetch user data when modal opens
  useEffect(() => {
    if (open && (userId || username)) {
      if (username) {
        fetchUserWithMaterials(username);
      } else if (userId) {
        fetchUserById(userId);
      }
    }
  }, [open, userId, username]);

  const fetchUserById = async (userId: string) => {
    setLoadingUserData(true);
    try {
      console.log("Fetching user by ID:", userId);

      // Try the new user by ID endpoint
      try {
        const userByIdResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/search/get-user/${userId}`
        );

        if (userByIdResponse.data && userByIdResponse.data.username) {
          console.log(
            "User found via get-user endpoint:",
            userByIdResponse.data.username
          );

          setSelectedUser(userByIdResponse.data);

          // Fetch friendship status
          if (user?.firebase_uid) {
            fetchFriendshipStatus(userId);
          }

          // Fetch user's study materials
          fetchUserStudyMaterials(userByIdResponse.data.username);
          return;
        }
      } catch (error) {
        console.log(
          "Failed to fetch from get-user endpoint, trying friend info"
        );
      }

      // Try the friend info endpoint as alternative
      try {
        const friendResponse = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/friends/get-friend-info/${userId}`
        );

        if (
          Array.isArray(friendResponse.data) &&
          friendResponse.data.length > 0
        ) {
          const userData = friendResponse.data[0];
          console.log("User found via friend endpoint:", userData.username);

          setSelectedUser({
            firebase_uid: userData.firebase_uid,
            username: userData.username,
            level: userData.level,
            exp: userData.exp,
            display_picture: userData.display_picture,
            account_type: userData.account_type || "free",
            account_type_plan: userData.account_type_plan || "free",
            mana: userData.mana || 0,
            coin: userData.coin || 0,
            tech_pass: userData.tech_pass || 0,
          });

          // Fetch friendship status
          if (user?.firebase_uid) {
            fetchFriendshipStatus(userId);
          }

          // Fetch user's study materials
          fetchUserStudyMaterials(userData.username);
          return;
        }
      } catch (error) {
        console.log("Failed to fetch from friend info endpoint as well");
      }

      // If we get here, we couldn't find the user
      console.error("User data not found in any endpoint");
      setLoadingUserData(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setLoadingUserData(false);
    }
  };

  const fetchFriendshipStatus = async (targetUserId: string) => {
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

  const fetchUserWithMaterials = async (username: string) => {
    setLoadingUserData(true);
    try {
      const response = await axios.get<{
        user: UserInfo;
        study_materials: StudyMaterial[];
      }>(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/search/material-of-user/${username}`
      );

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
            images: [],
            updatedAt: material.created_at,
            visibility: material.visibility,
            status: material.status,
            tags: parsedTags,
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
                  images: [],
                  terms: item.term || "",
                  definition: item.definition || "",
                }))
              : [],
          };
        });

        setUserMaterials(materials);
      } else {
        console.error("Invalid response format", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoadingUserData(false);
    }
  };

  // New function to fetch only study materials for a user
  const fetchUserStudyMaterials = async (username: string) => {
    try {
      const response = await axios.get<{
        user: UserInfo;
        study_materials: StudyMaterial[];
      }>(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/search/material-of-user/${username}`
      );

      if (response.data && response.data.study_materials) {
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
            images: [],
            updatedAt: material.created_at,
            visibility: material.visibility,
            status: material.status,
            tags: parsedTags,
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
                  images: [],
                  terms: item.term || "",
                  definition: item.definition || "",
                }))
              : [],
          };
        });

        setUserMaterials(materials);
      }
    } catch (error) {
      console.error("Failed to fetch user materials:", error);
    } finally {
      setLoadingUserData(false);
    }
  };

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

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error updating total views:", error);
    }
  };

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
  const isOwnProfile =
    selectedUser && user?.firebase_uid === selectedUser.firebase_uid;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="profile-modal-title"
      sx={{
        "& .MuiModal-backdrop": {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", sm: "90%", md: "80%" },
          maxWidth: "900px",
          maxHeight: { xs: "80vh", sm: "90vh" },
          overflow: "auto",
          bgcolor: "#120F1B",
          borderRadius: "0.8rem",
          border: "2px solid #3B354D",
          boxShadow: 24,
          p: { xs: 2, sm: 3, md: 5 },
          "&:focus": { outline: "none" },
        }}
      >
        <Stack spacing={2}>
          <button
            className="self-start flex items-center gap-2 pb-2 text-[#3B354C] hover:text-inherit transition-colors"
            onClick={onClose}
          >
            <ArrowBackIcon fontSize="small" /> Back
          </button>

          {loadingUserData ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress sx={{ color: "#8878C7" }} />
            </Box>
          ) : selectedUser ? (
            <Stack spacing={3}>
              {/* User Profile */}
              <div className="flex flex-col sm:flex-row items-center p-3 sm:p-6 bg-[#3B354D] rounded-[0.8rem]">
                <div className="flex items-center w-full sm:w-auto">
                  <img
                    src={selectedUser.display_picture || defaultPicture}
                    alt="Avatar"
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-[5px] mr-4 sm:mr-6"
                  />
                  <div>
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
                        <p className="text-[0.75rem] text-[#C6C1D8] mt-1">
                          {friendshipStatus.mutual_friends.count}
                          {isOwnProfile
                            ? ` friend${
                                friendshipStatus.mutual_friends.count > 1
                                  ? "s"
                                  : ""
                              }`
                            : ` mutual friend${
                                friendshipStatus.mutual_friends.count > 1
                                  ? "s"
                                  : ""
                              }`}
                        </p>
                      )}
                  </div>
                </div>
                <Box flex={1} />

                {!isOwnProfile && (
                  <button
                    className={`rounded-[0.8rem] px-4 sm:px-6 py-[0.4rem] mt-3 sm:mt-0 self-end sm:self-auto h-fit text-[0.85rem] sm:text-[0.9rem] hover:scale-105 transition-all duration-300 ease-in-out ${friendButtonClass}`}
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
              {/* Mutual Friends (if any) */}
              {friendshipStatus &&
                friendshipStatus.mutual_friends.list.length > 0 && (
                  <div className="p-3 sm:p-4 bg-[#3B354D15] rounded-[0.8rem]">
                    <p className="text-[#9F9BAE] font-medium text-[0.9rem] sm:text-base mb-2">
                      {isOwnProfile ? "Your Friends:" : "Mutual Friends:"}
                    </p>
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto py-1 sm:py-2">
                      {friendshipStatus.mutual_friends.list.map((friend) => (
                        <div
                          key={friend.firebase_uid}
                          className="flex flex-col items-center min-w-[70px] sm:min-w-[80px]"
                        >
                          <img
                            src={friend.display_picture || defaultPicture}
                            alt={friend.username}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                          />
                          <p className="text-[#E2DDF3] text-[0.7rem] sm:text-xs mt-1 text-center">
                            {friend.username}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* User's Study Materials */}
              <Stack spacing={2}>
                <p className="text-[#9F9BAE] font-semibold text-[1.1rem] sm:text-[2.5vh]">
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
                  <p className="py-3 text-center text-[#9F9BAE]">
                    No study materials found for this user
                  </p>
                )}
              </Stack>
            </Stack>
          ) : (
            <Box py={4} textAlign="center">
              <p className="text-[#9F9BAE]">User not found</p>
            </Box>
          )}
        </Stack>
      </Box>
    </Modal>
  );
};

export default ProfileModal;
