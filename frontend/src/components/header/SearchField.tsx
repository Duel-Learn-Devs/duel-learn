import { useState, useEffect } from "react";
import axios from "axios";
import { Box, Stack, IconButton, useMediaQuery } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { UserInfo } from "../../types/userInfoObject";
import { StudyMaterial } from "../../types/studyMaterialObject";
import PersonIcon from "@mui/icons-material/Person";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import "../../styles/custom-scrollbar.css";
import { useNavigate } from "react-router-dom";
import ProfileModal from "../modals/ProfileModal";

// Define a union type for search results
type SearchResult = UserInfo | StudyMaterial;

export default function SearchField() {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Check if on mobile view
  const isMobile = useMediaQuery("(max-width:640px)");

  // Add state for ProfileModal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<
    string | undefined
  >();

  // Handle API search
  useEffect(() => {
    if (inputValue.trim() === "") {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await axios.get<{
          users: UserInfo[];
          study_materials: StudyMaterial[];
        }>(
          `${import.meta.env.VITE_BACKEND_URL}/api/search/global/${inputValue}`
        );

        setResults([...response.data.users, ...response.data.study_materials]);
      } catch (error) {
        console.error("Search failed:", error);
      }
      setLoading(false);
    };

    // Debounce API calls
    const delayDebounce = setTimeout(fetchResults, 300);

    return () => clearTimeout(delayDebounce);
  }, [inputValue]);

  // Handle Enter key press to navigate to search page
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      // First close the modal if it's open
      setProfileModalOpen(false);
      setSelectedUsername(undefined);

      // Then navigate to search page
      navigate(`/dashboard/search?query=${encodeURIComponent(inputValue)}`);
      setIsFocused(false);
      if (isMobile) setIsExpanded(false);
    }
  };

  // Handle item selection
  const handleSelectItem = (item: SearchResult) => {
    if ("username" in item) {
      // Open ProfileModal for users instead of navigating
      setSelectedUsername(item.username);
      setProfileModalOpen(true);
    } else {
      // Navigate to study material details
      navigate(`/dashboard/study-material/view/${item.study_material_id}`);
    }
    setIsFocused(false);
    if (isMobile) setIsExpanded(false);
  };

  // Handle closing the profile modal
  const handleCloseProfileModal = () => {
    setProfileModalOpen(false);
    setSelectedUsername(undefined);
  };

  // Toggle expanded search on mobile
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Focus the input after expanding
      setTimeout(() => {
        document.getElementById("search-input")?.focus();
      }, 10);
    }
  };

  // Hide search on blur if empty
  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      if (isMobile && !inputValue) {
        setIsExpanded(false);
      }
    }, 100);
  };

  if (isMobile && !isExpanded) {
    return (
      <IconButton
        onClick={toggleExpanded}
        sx={{
          color: "#6F658D",
          backgroundColor: "rgba(59, 53, 77, 0.5)",
          borderRadius: "50%",
          padding: "8px",
          transition: "all 0.3s ease-in",
          "&:hover": {
            backgroundColor: "rgba(59, 53, 77, 0.8)",
          },
        }}
      >
        <SearchIcon sx={{ fontSize: "22px" }} />
      </IconButton>
    );
  }

  return (
    <Box
      className={`w-full max-w-[567px] min-w-[170px] transition-all duration-200 ease-in ${
        isMobile && isExpanded
          ? "absolute top-0 left-0 right-0 z-50 p-2 bg-[#080511] transition-all duration-200 ease-in  h-full flex items-center"
          : ""
      }`}
    >
      <Box
        className="relative w-full"
        onClick={() => document.getElementById("search-input")?.focus()}
      >
        <input
          id="search-input"
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="peer w-full h-[48px] pl-10 pr-10 text-[18px] bg-[#3B354D] rounded-[0.8rem] focus:outline-none focus:ring-2 focus:ring-[#6F658D] placeholder-transparent sm:max-w-full [&::-webkit-search-cancel-button]:appearance-none text-ellipsis"
          placeholder="Search input"
          style={{
            width: "100%",
            minWidth: isMobile
              ? "100%"
              : inputValue
              ? `${Math.min(inputValue.length * 10 + 80, 567)}px`
              : "170px",
            transition: isMobile ? "none" : "min-width 0.2s ease",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />
        {/* Hide default clear button and add custom one */}
        {inputValue && (
          <Box
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setInputValue("");
            }}
          >
            <ClearIcon sx={{ color: "#6F658D", fontSize: "20px" }} />
          </Box>
        )}
        {!inputValue && !isFocused && (
          <label
            htmlFor="search-input" // Fixed to match input id
            className="absolute left-[40px] top-1/2 transform -translate-y-1/2 text-[#6F658D] text-[18px] transition-opacity duration-300 opacity-100 pointer-events-none"
          >
            Search
          </label>
        )}
        <Box className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <SearchIcon sx={{ color: "#6F658D", fontSize: "22px" }} />
        </Box>

        {/* Autocomplete dropdown */}
        {isFocused && inputValue.trim() !== "" && (
          <Box className="absolute top-[55px] bg-[#3B354D] w-full max-h-[400px] overflow-y-auto rounded-[0.8rem] shadow-lg z-10 custom-scrollbar">
            {loading ? (
              <Box className="py-3 px-4">Loading...</Box>
            ) : results.length > 0 ? (
              results.map((item, index) => (
                <Stack className="p-2" key={index}>
                  <Box
                    className="cursor-pointer py-3 px-4 hover:bg-[#6F658D] rounded-[0.8rem] flex items-center gap-2"
                    onClick={() => handleSelectItem(item)}
                  >
                    {/* Type indicator icon */}
                    {"username" in item ? (
                      <PersonIcon fontSize="small" sx={{ color: "#8878C7" }} />
                    ) : (
                      <MenuBookIcon
                        fontSize="small"
                        sx={{ color: "#8878C7" }}
                      />
                    )}

                    {"username" in item ? item.username : item.title}
                  </Box>
                </Stack>
              ))
            ) : (
              <Box className="py-3 px-4">No results found</Box>
            )}
          </Box>
        )}
      </Box>

      {/* Profile Modal */}
      <ProfileModal
        open={profileModalOpen}
        onClose={handleCloseProfileModal}
        username={selectedUsername}
      />
    </Box>
  );
}
