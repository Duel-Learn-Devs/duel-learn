import { useState, useRef, useEffect } from "react";
import {
  InputBase,
  Paper,
  IconButton,
  List,
  Popper,
  Fade,
  Typography,
  Box,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Collapse,
  Menu,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";

const searchCategories = [
  { id: "all", label: "All" },
  { id: "users", label: "Users" },
  { id: "content", label: "Content" },
  { id: "settings", label: "Settings" },
];

export default function AdminSearchField() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    users: true,
    content: true,
    settings: true,
  });

  // Mock search results - in a real app, these would come from an API
  const mockResults = {
    users: [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ],
    content: [
      { id: 1, title: "Introduction to Learning", type: "Course" },
      { id: 2, title: "Advanced Mathematics", type: "Quiz" },
    ],
    settings: [
      { id: 1, name: "User Permissions", path: "/admin/settings/permissions" },
      { id: 2, name: "Site Configuration", path: "/admin/settings/config" },
    ],
  };

  // Handle click outside search results to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log(
        `Searching for "${searchTerm}" in category "${selectedCategory}"`
      );
      // In a real app, you would perform an actual search here
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    handleMenuClose();
  };

  const handleResultClick = (type: string, item: any) => {
    setOpen(false);
    setSearchTerm("");

    // Navigate based on result type
    if (type === "users") {
      navigate(`/admin/users?id=${item.id}`);
    } else if (type === "content") {
      navigate(`/admin/content?id=${item.id}`);
    } else if (type === "settings") {
      navigate(item.path);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl">
      <Paper
        component="form"
        onSubmit={handleSearch}
        sx={{
          p: "2px 4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: "12px",
          backgroundColor: "#3B354D",
          border: open ? "1px solid #4D18E8" : "1px solid transparent",
          transition: "all 0.3s ease",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
          <IconButton type="submit" sx={{ p: "10px", color: "#E2DDF3" }}>
            <SearchIcon />
          </IconButton>
          <InputBase
            ref={inputRef}
            sx={{ ml: 1, flex: 1, color: "#E2DDF3" }}
            placeholder="Search users, content, or settings..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.length > 0) {
                setOpen(true);
              } else {
                setOpen(false);
              }
            }}
            onFocus={() => {
              if (searchTerm.length > 0) {
                setOpen(true);
              }
            }}
          />
          <IconButton
            sx={{ p: "10px", color: "#E2DDF3" }}
            onClick={handleMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
          {searchTerm && (
            <IconButton
              sx={{ p: "10px", color: "#9F9BAE" }}
              onClick={clearSearch}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Paper>

      {/* Categories Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: "#181622",
            border: "1px solid #3B354D",
            borderRadius: "12px",
            mt: 1,
          },
        }}
      >
        {searchCategories.map((category) => (
          <MenuItem
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            sx={{
              color: selectedCategory === category.id ? "#4D18E8" : "#E2DDF3",
              backgroundColor: "transparent",
              fontWeight: selectedCategory === category.id ? "bold" : "normal",
              "&:hover": {
                backgroundColor: "rgba(77, 24, 232, 0.08)",
              },
            }}
          >
            {category.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Search Results */}
      <Popper
        open={open}
        anchorEl={searchRef.current}
        placement="bottom-start"
        transition
        style={{ width: searchRef.current?.clientWidth, zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              sx={{
                mt: 1,
                borderRadius: 2,
                backgroundColor: "#181622",
                border: "1px solid #3B354D",
                overflow: "hidden",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              <Box sx={{ display: "flex", width: "100%" }}>
                {/* Users Results */}
                {(selectedCategory === "all" ||
                  selectedCategory === "users") && (
                  <Box sx={{ flex: 1, borderRight: "1px solid #3B354D" }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        p: 2,
                        color: "#E2DDF3",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const newState = {
                          ...expandedSections,
                          users: !expandedSections.users,
                        };
                        setExpandedSections(newState);
                      }}
                    >
                      Users
                      {expandedSections.users ? (
                        <ExpandLess sx={{ color: "#E2DDF3" }} />
                      ) : (
                        <ExpandMore sx={{ color: "#E2DDF3" }} />
                      )}
                    </Typography>
                    <Collapse in={expandedSections.users}>
                      <List sx={{ p: 0 }}>
                        {mockResults.users
                          .filter(
                            (user) =>
                              user.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) ||
                              user.email
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                          )
                          .map((user) => (
                            <ListItemButton
                              key={user.id}
                              onClick={() => handleResultClick("users", user)}
                              sx={{
                                "&:hover": { backgroundColor: "#3B354D" },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <PersonIcon sx={{ color: "#E2DDF3" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#E2DDF3" }}
                                  >
                                    {user.name}
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#9F9BAE" }}
                                  >
                                    {user.email}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          ))}
                      </List>
                    </Collapse>
                  </Box>
                )}

                {/* Content Results */}
                {(selectedCategory === "all" ||
                  selectedCategory === "content") && (
                  <Box sx={{ flex: 1, borderRight: "1px solid #3B354D" }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        p: 2,
                        color: "#E2DDF3",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const newState = {
                          ...expandedSections,
                          content: !expandedSections.content,
                        };
                        setExpandedSections(newState);
                      }}
                    >
                      Content
                      {expandedSections.content ? (
                        <ExpandLess sx={{ color: "#E2DDF3" }} />
                      ) : (
                        <ExpandMore sx={{ color: "#E2DDF3" }} />
                      )}
                    </Typography>
                    <Collapse in={expandedSections.content}>
                      <List sx={{ p: 0 }}>
                        {mockResults.content
                          .filter(
                            (content) =>
                              content.title
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) ||
                              content.type
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                          )
                          .map((content) => (
                            <ListItemButton
                              key={content.id}
                              onClick={() =>
                                handleResultClick("content", content)
                              }
                              sx={{
                                "&:hover": { backgroundColor: "#3B354D" },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <ArticleIcon sx={{ color: "#E2DDF3" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#E2DDF3" }}
                                  >
                                    {content.title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#9F9BAE" }}
                                  >
                                    {content.type}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          ))}
                      </List>
                    </Collapse>
                  </Box>
                )}

                {/* Settings Results */}
                {(selectedCategory === "all" ||
                  selectedCategory === "settings") && (
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        p: 2,
                        color: "#E2DDF3",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const newState = {
                          ...expandedSections,
                          settings: !expandedSections.settings,
                        };
                        setExpandedSections(newState);
                      }}
                    >
                      Settings
                      {expandedSections.settings ? (
                        <ExpandLess sx={{ color: "#E2DDF3" }} />
                      ) : (
                        <ExpandMore sx={{ color: "#E2DDF3" }} />
                      )}
                    </Typography>
                    <Collapse in={expandedSections.settings}>
                      <List sx={{ p: 0 }}>
                        {mockResults.settings
                          .filter((setting) =>
                            setting.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          )
                          .map((setting) => (
                            <ListItemButton
                              key={setting.id}
                              onClick={() =>
                                handleResultClick("settings", setting)
                              }
                              sx={{
                                "&:hover": { backgroundColor: "#3B354D" },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <SettingsIcon sx={{ color: "#E2DDF3" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#E2DDF3" }}
                                  >
                                    {setting.name}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          ))}
                      </List>
                    </Collapse>
                  </Box>
                )}
              </Box>

              {/* No Results Message */}
              {((selectedCategory === "all" &&
                !mockResults.users.some((u) =>
                  u.name.toLowerCase().includes(searchTerm.toLowerCase())
                ) &&
                !mockResults.content.some((c) =>
                  c.title.toLowerCase().includes(searchTerm.toLowerCase())
                ) &&
                !mockResults.settings.some((s) =>
                  s.name.toLowerCase().includes(searchTerm.toLowerCase())
                )) ||
                (selectedCategory === "users" &&
                  !mockResults.users.some((u) =>
                    u.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )) ||
                (selectedCategory === "content" &&
                  !mockResults.content.some((c) =>
                    c.title.toLowerCase().includes(searchTerm.toLowerCase())
                  )) ||
                (selectedCategory === "settings" &&
                  !mockResults.settings.some((s) =>
                    s.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ))) && (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "#9F9BAE" }}>
                    No results found for "{searchTerm}"
                  </Typography>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </div>
  );
}
