import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Modal,
  Typography,
  Stack,
  Fade,
  IconButton,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { useUser } from "../../contexts/UserContext";

interface StudyMaterial {
  title: string;
  summary: string;
  items: Array<{
    term: string;
    definition: string;
    image?: string | null;
  }>;
  created_by: string;
  created_at: string;
  total_views: number;
}

interface SelectStudyMaterialModalProps {
  open: boolean;
  handleClose: () => void;
  mode: string | null;
  isLobby?: boolean;
  onMaterialSelect: (material: StudyMaterial) => void;
  onModeSelect: (mode: string) => void;
  selectedTypes: string[];
}

const SelectStudyMaterialModal: React.FC<SelectStudyMaterialModalProps> = ({
  open,
  handleClose,
  mode,
  isLobby = false,
  onMaterialSelect,
  onModeSelect,
  selectedTypes,
}) => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("Recent");
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudyMaterials = async () => {
      if (!user?.username) return;
      setIsLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/study-material/get-by-user/${user.username}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch study materials");
        }
        const data = await response.json();
        setStudyMaterials(data);
      } catch (error) {
        console.error("Error fetching study materials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyMaterials();
  }, [user?.username]);


  const sortMaterials = (materials: StudyMaterial[], filter: string) => {
    switch (filter) {
      case "Recent":
        return [...materials].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "Popular":
        return [...materials].sort((a, b) => b.total_views - a.total_views);
      case "Oldest":
        return [...materials].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      default:
        return materials;
    }
  };

  useEffect(() => {
    const filtered = studyMaterials.filter((material) =>
      material.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMaterials(sortMaterials(filtered, filter));
  }, [searchQuery, filter, studyMaterials]);

  const handleMaterialSelect = (material: StudyMaterial) => {
    if (isLobby) {
      onMaterialSelect(material);
      onModeSelect(mode || '');
      handleClose();
      navigate("/dashboard/pvp-lobby", { state: { mode, material, selectedTypes } });
    } else {
      const formattedMode = mode === "Peaceful Mode" ? "Peaceful" : mode === "PvP Mode" ? "PvP" : mode;
      navigate("/dashboard/welcome-game-mode", { 
        state: { 
          mode: formattedMode,
          material: {
            ...material,
            items: material.items.map(item => ({
              term: item.term,
              definition: item.definition, 
              image: item.image || null
            }))
          }
        }
      });
    }
  };


  return (
    <Modal
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          handleClose();
        }
      }}
      closeAfterTransition
      BackdropProps={{
        style: { backgroundColor: "transparent" },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "1000px" },
            height: { xs: "auto", sm: "650px" },
            bgcolor: "#080511",
            borderRadius: "10px",
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: { xs: "40px", sm: "40px" },
            paddingY: { xs: "60px", sm: "40px" },
          }}
        >
          <IconButton
            aria-label="back"
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              color: "#FFFFFF",
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#FFFFFF",
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography
            sx={{
              color: "#9F9BAE",
              textAlign: "center",
              mb: 2,
              fontSize: { xs: "12px", sm: "15px" },
            }}
          >
            ({mode})
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: "#FFFFFF",
              textAlign: "center",
              fontWeight: "bold",
              mb: 1,
            }}
          >
            Select Study Material
          </Typography>
          <Typography
            sx={{
              color: "#9F9BAE",
              textAlign: "center",
              mb: 3,
              fontSize: { xs: "14px", sm: "18px" },
            }}
          >
            Select study material to use for your desired study mode.
          </Typography>

          <Box
            sx={{
              width: "80%",
              mb: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Your Library
              </Typography>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  onOpen={() => setOpenDropdown(true)}
                  onClose={() => setOpenDropdown(false)}
                  sx={{
                    backgroundColor: "transparent",
                    color: "#FFFFFF",
                    border: "2px solid #3B354B",
                    borderRadius: "7px",
                    ".MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: "#3B354C",
                        color: "#FFFFFF",
                      },
                    },
                  }}
                  IconComponent={() =>
                    openDropdown ? (
                      <ArrowDropUpIcon
                        sx={{ color: "#FFFFFF", marginRight: "5px" }}
                      />
                    ) : (
                      <ArrowDropDownIcon
                        sx={{ color: "#FFFFFF", marginRight: "5px" }}
                      />
                    )
                  }
                >
                  <MenuItem value="Recent">Recent</MenuItem>
                  <MenuItem value="Popular">Popular</MenuItem>
                  <MenuItem value="Oldest">Oldest</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              placeholder="Search material"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: { xs: "100%", sm: "40%" },
                marginTop: { xs: "20px" },
                bgcolor: "#3B354C",
                borderRadius: "8px",
                input: { color: "#FFFFFF" },
                label: { color: "#6F658D" },
                ".MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#6F658D" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box
            sx={{
              width: "80%",
              height: "280px",
              justifyContent: "flex-start",
              textAlign: "left",
              overflowY: "auto",
              marginTop: "15px",
            }}
            className="scrollbar-thin scrollbar-thumb-[#6F658B] scrollbar-track-[#3B354C]"
          >
            <Stack spacing={2}>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((material, index) => (
                  <Button
                    key={index}
                    sx={{
                      textTransform: "none",
                      bgcolor: "#E4DCFD",
                      color: "#110C21",
                      display: "flex",
                      justifyContent: "space-between",
                      borderRadius: "8px",
                      px: 3,
                      py: 2,
                      "&:hover": {
                        bgcolor: "#6c63ff",
                      },
                    }}
                    onClick={() => handleMaterialSelect(material)}
                  >
                    <Box sx={{ width: "100%" }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "18px",
                          textAlign: "left",
                        }}
                      >
                        {material.title}
                      </Typography>
                      {material.summary && (
                        <Box sx={{ mt: 1, mb: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#322168",
                              fontSize: "14px",
                              fontWeight: "bold",
                              textAlign: "left",
                            }}
                          >
                            Summary: {material.summary}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#322168",
                              fontSize: "12px",
                              textAlign: "left",
                              fontStyle: "italic",
                            }}
                          >
                            {material.summary}
                          </Typography>
                        </Box>
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#322168",
                          fontSize: "14px",
                          textAlign: "left",
                        }}
                      >
                        {material.items.length} items • Made by {material.created_by}
                      </Typography>
                    </Box>
                  </Button>
                ))
              ) : (
                <Typography
                  sx={{
                    color: "#9F9BAE",
                    textAlign: "left",
                    fontSize: "16px",
                    mt: 2,
                  }}
                >
                  No study materials found
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default SelectStudyMaterialModal;
