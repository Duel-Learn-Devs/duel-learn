import { useState, useEffect } from "react";
import Profile from "../../../assets/profile-picture/bunny-picture.png";
import PremiumLabel from "../../../assets/premium-star.png";

const ProfileHeader = () => {
  // State for profile data
  const [profileData, setProfileData] = useState({
    username: "JING009",
    level: 4,
    xp: 185,
    xpRequired: 2000,
    friendsCount: 20,
    xpProgress: 0,
  });

  // Calculate xpProgress dynamically based on xp and xpRequired
  const calculateXpProgress = () => {
    return (profileData.xp / profileData.xpRequired) * 100;
  };

  useEffect(() => {
    // Dynamically update the xpProgress when xp or xpRequired changes
    setProfileData((prevData) => ({
      ...prevData,
      xpProgress: calculateXpProgress(),
    }));
  }, [profileData.xp, profileData.xpRequired]);

  return (
    <div
      className="rounded-lg px-14 py-9 flex items-center mb-9"
      style={{
        backgroundColor: "rgba(61, 56, 76, 0.25)",
        border: "1px solid rgba(61, 56, 76, 0.25)",
      }}
    >
      {/* Avatar */}
      <div className="mr-4">
        <img
          src={Profile}
          alt="Profile Avatar"
          className="w-[158px] h-[158px] rounded-sm mr-6"
        />
      </div>

      {/* Profile Info */}
      <div className="flex-1">
        <div className="flex items-center">
          <h2 className="text-[30px] font-bold mr-3">{profileData.username}</h2>
          <img
            src={PremiumLabel}
            alt="Profile Premium Icon"
            className="w-[15px] h-[auto] rounded-sm mr-6"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#6F658D] text-[18px] mt-1">
            LVL {profileData.level}
          </p>
          <p className="text-[#6F658D] text-[13px] mt-1">
            {profileData.xp} / {profileData.xpRequired} XP
          </p>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4 relative w-full bg-[#3E3E50] h-[6px] rounded-full mt-2">
          <div
            className="absolute top-0 left-0 h-[6px] bg-[#2B00FF] rounded-full"
            style={{ width: `${profileData.xpProgress}%` }}
          ></div>
        </div>
        {/* Friends */}
        <p className="text-[#6F658D] text-[18px] mt-2">
          {profileData.friendsCount} Friends
        </p>
      </div>
    </div>
  );
};

export default ProfileHeader;
