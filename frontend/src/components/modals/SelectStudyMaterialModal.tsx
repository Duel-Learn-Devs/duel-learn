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

interface SelectStudyMaterialModalProps {
  open: boolean;
  handleClose: () => void;
  mode: string | null;
<<<<<<< HEAD
  isLobby?: boolean;
  onMaterialSelect: (material: any) => void;
  onModeSelect: (mode: string) => void;
  selectedTypes: string[];
=======
>>>>>>> origin/beta-branch
}

const SelectStudyMaterialModal: React.FC<SelectStudyMaterialModalProps> = ({
  open,
  handleClose,
  mode,
<<<<<<< HEAD
  isLobby = false,
  onMaterialSelect,
  onModeSelect,
  selectedTypes,
=======
>>>>>>> origin/beta-branch
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("Recent");
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const navigate = useNavigate();

  const studyMaterials = [
    {
      title: "Software Engineering",
      items: 50,
      creator: "You",
      date: "2024-01-01",
    },
    {
      title: "System Fundamentals",
      items: 10,
      creator: "beau.aly",
      date: "2023-12-01",
    },
    {
      title: "Networking Lesson 2",
      items: 30,
      creator: "kintaxx_002",
      date: "2023-11-01",
    },
    {
      title: "Software Engineering",
      items: 50,
      creator: "You",
      date: "2022-01-01",
    },
    {
      title: "System Fundamentals",
      items: 10,
      creator: "beau.aly",
      date: "2021-06-01",
    },
    {
      title: "Networking Lesson 2",
      items: 30,
      creator: "kintaxx_002",
      date: "2020-03-01",
    },
  ];

  const sortMaterials = (materials: any[], filter: string) => {
    switch (filter) {
      case "Recent":
        return materials.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      case "Popular":
        return materials.sort((a, b) => b.items - a.items);
      case "Oldest":
        return materials.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
  }, [searchQuery, filter]);

  const handleMaterialSelect = (material: any) => {
<<<<<<< HEAD
    if (isLobby) {
      onMaterialSelect(material);
      onModeSelect(mode || '');
      handleClose();
      navigate("/dashboard/pvp-lobby", { state: { mode, material, selectedTypes } });
    } else {
      const formattedMode = mode === "Peaceful Mode" ? "Peaceful" : mode;
      navigate("/dashboard/welcome-game-mode", { state: { mode: formattedMode, material } });
    }
  };

=======
    const formattedMode = mode === "Peaceful Mode" ? "Peaceful" : mode;
    navigate("/dashboard/welcome-game-mode", { state: { mode: formattedMode, material } });
  };
  
>>>>>>> origin/beta-branch

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
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "18px",
                        }}
                      >
                        {material.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#322168",
                          fontSize: "14px",
                        }}
                      >
                        {material.items} items • Made by {material.creator}
                      </Typography>
                    </Box>
                  </Button>
                ))
              ) : (
                <Typography
                  sx={{
                    color: "#9F9BAE",
                    textAlign: "center",
                    fontSize: "16px",
                    mt: 2,
                  }}
                >
                  No materials found
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
