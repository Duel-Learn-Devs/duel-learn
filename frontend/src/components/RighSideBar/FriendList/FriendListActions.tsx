import React from "react";
import { Stack, Divider, Tooltip } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import Badge from "@mui/material/Badge";

interface FriendListActionsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number; // Use this prop instead of requestsCount from hook
}

const FriendListActions: React.FC<FriendListActionsProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
}) => {
  return (
    <Stack
      direction={"row"}
      spacing={1}
      className="flex justify-between bg-[#120F1C] py-3 sm:py-4 px-2 sm:px-4 border-t-[0.2rem] rounded-b-[0.8rem] border-[#3B354C]"
    >
      <Tooltip title="Your Friends" placement="top" enterDelay={100} arrow>
        <button
          onClick={() => onTabChange("YOUR FRIENDS")}
          className={`flex items-center justify-center hover:scale-110 hover:text-[#A38CE6] transition-all duration-300 flex-1 ${
            activeTab === "YOUR FRIENDS" ? "text-[#A38CE6]" : "text-[#3B354D]"
          }`}
        >
          <PeopleIcon
            sx={{ fontSize: { xs: "0.85rem", sm: "1.1rem", md: "1.3rem" } }}
          />
        </button>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ width: "2px" }} />

      <Tooltip title="Friend Requests" placement="top" enterDelay={100} arrow>
        <button
          onClick={() => onTabChange("FRIEND REQUESTS")}
          className={`flex items-center justify-center hover:scale-110 hover:text-[#A38CE6] transition-all duration-300 flex-1 ${
            activeTab === "FRIEND REQUESTS"
              ? "text-[#A38CE6]"
              : "text-[#3B354D]"
          }`}
        >
          {pendingCount > 0 ? (
            <Badge
              badgeContent={pendingCount}
              overlap="circular"
              sx={{
                "& .MuiBadge-badge": {
                  left: 14,
                  backgroundColor: "#A38CE6",
                  color: "#3B354D",
                  fontSize: "0.7rem",
                },
              }}
            >
              <PersonAddIcon
                sx={{ fontSize: { xs: "0.85rem", sm: "1.1rem", md: "1.3rem" } }}
              />
            </Badge>
          ) : (
            <PersonAddIcon
              sx={{ fontSize: { xs: "0.85rem", sm: "1.1rem", md: "1.3rem" } }}
            />
          )}
        </button>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ width: "2px" }} />
      <Tooltip title="Find Friends" placement="top" enterDelay={100} arrow>
        <button
          onClick={() => onTabChange("FIND FRIENDS")}
          className={`flex items-center justify-center hover:scale-110 hover:text-[#A38CE6] transition-all duration-300 flex-1 ${
            activeTab === "FIND FRIENDS" ? "text-[#A38CE6]" : "text-[#3B354D]"
          }`}
        >
          <PersonSearchIcon
            sx={{ fontSize: { xs: "0.85rem", sm: "1.1rem", md: "1.3rem" } }}
          />
        </button>
      </Tooltip>
    </Stack>
  );
};

export default FriendListActions;
