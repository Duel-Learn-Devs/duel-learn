import React, { useEffect } from "react";
import {
  Box,
  Button,
  Fab,
  Tooltip,
  IconButton,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import clsx from "clsx";
import AddIcon from "@mui/icons-material/Add";
import PlayIcon from "@mui/icons-material/PlayArrowRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useNavigate, useLocation } from "react-router-dom";
import ChooseModeModal from "./modals/ChooseModeModal";
import { useUser } from "../contexts/UserContext";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";

interface SidebarProps {
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const menuItems = [
  {
    title: "Home",
    icon: "/sidebar-icons/home-icon.svg",
    path: "/dashboard/home",
  },
  {
    title: "Explore",
    icon: "/sidebar-icons/explore-icon.svg",
    path: "/dashboard/explore",
  },
  {
    title: "My Library",
    icon: "/sidebar-icons/my-library-icon.svg",
    path: "/dashboard/my-library",
  },
  {
    title: "Profile",
    icon: "/sidebar-icons/profile-icon.svg",
    path: "/dashboard/profile",
  },
  {
    title: "Shop",
    icon: "/sidebar-icons/shop-icon.svg",
    path: "/dashboard/shop",
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  selectedIndex,
  setSelectedIndex,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [fromCreate, setFromCreate] = React.useState(false);
  const [openModal, setOpenModal] = React.useState(false);
  const { setUser } = useUser();

  const handleLandingPage = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      setUser(null);
      navigate("/landing-page");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleModalOpen = () => setOpenModal(true);
  const handleModalClose = () => setOpenModal(false);

  const handleItemClick = (index: number, path: string) => {
    if (selectedIndex !== index) {
      setSelectedIndex(index);
      navigate(path);
    }
  };

  const toggleCollapse = () => setCollapsed(!collapsed);

  const handleCreateStudyMaterial = () => {
    setSelectedIndex(null);
    setFromCreate(true);
    setCollapsed(true);
    navigate("/dashboard/study-material/create");
  };

  const renderButton = (
    icon: React.ReactNode,
    text: string,
    variant: "contained" | "outlined",
    onClick: () => void
  ) => (
    <Tooltip title={collapsed ? text : ""} placement="right" arrow>
      <Button
        variant={variant}
        onClick={onClick}
        sx={{
          textTransform: "none",
          borderRadius: "0.8rem",
          padding: "0.6rem 2rem",
          display: "flex",
          width: "full",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.3s ease", // Smooth transition for hover effects
          ...(variant === "contained" && {
            backgroundColor: "#4D18E8",
            borderWidth: "2px",
          }),
          ...(variant === "outlined" && {
            borderColor: "#E2DDF3",
            borderWidth: "2px",
            color: "#E2DDF3",
          }),
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      >
        {icon}
        <Typography
          variant="subtitle1"
          className={clsx("transition-all duration-100", {
            "opacity-0 w-auto": collapsed,
            "opacity-100 w-auto": !collapsed,
          })}
          sx={{ whiteSpace: "nowrap", overflow: "hidden" }}
        >
          {text}
        </Typography>
      </Button>
    </Tooltip>
  );

  useEffect(() => {
    console.log("Current Path:", location.pathname);
    const index = menuItems.findIndex(
      (item) => item.path === location.pathname
    );
    setSelectedIndex(index !== -1 ? index : null);
    window.scrollTo(0, 0); // Scroll to the top when the path changes
  }, [location.pathname]);

  return (
    <Box style={{ display: "flex", position: "relative" }}>
      <Stack
        className="h-full w-full pl-2 mx-2 py-12 flex flex-col justify-between"
        spacing={2}
        sx={{
          width: collapsed ? "5.5rem" : "15rem",
          transition: "width 0.35s",
        }}
      >
        <Stack spacing={3} className="flex">
          <Stack direction="row" className="flex items-center" spacing={2}>
            <Button
              onClick={handleLandingPage}
              sx={{
                transition: "transform 0.3s ease",
                textTransform: "none",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              <img
                src="/duel-learn-logo.svg"
                className="w-10 h-10"
                alt="icon"
              />
              <Typography
                variant="h6"
                fontWeight={600}
                className={clsx("transition-all duration-100", {
                  "opacity-0 w-auto": collapsed,
                  "opacity-100 w-auto": !collapsed,
                })}
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  color: "#E2DDF3",
                  marginLeft: "1rem",
                }}
              >
                Duel Learn
              </Typography>
            </Button>

            <Fab
              color="primary"
              onClick={toggleCollapse}
              size="small"
              sx={{
                backgroundColor: "transparent",
                transition: "all 0.3s ease", // Smooth transition for visibility
                "& .MuiSvgIcon-root": { color: "#3B354D" },
                "&:hover": {
                  backgroundColor: "#3B354D",
                  "& .MuiSvgIcon-root": { color: "#E2DDF3" },
                },
              }}
              className={clsx(
                "absolute z-50 transition-all duration-300",
                collapsed ? "left-[0rem]" : "left-[0rem]"
              )}
            >
              {collapsed ? (
                <ArrowForwardIcon fontSize="small" />
              ) : (
                <ArrowBackIcon fontSize="small" />
              )}
            </Fab>
          </Stack>
          <div style={{ marginTop: '10px' }} /> {/* This adds padding below Create */}
          {renderButton(
            <AddIcon
              fontSize="small"
              className={clsx({ "mr-2": !collapsed })}
            />,
            "Create",
            "contained",
            handleCreateStudyMaterial
          )}
          {renderButton(
            <PlayIcon
              fontSize="small"
              className={clsx({ "mr-2": !collapsed })}
            />,
            "Play",
            "outlined",
            handleModalOpen
          )}
          <Divider />
        </Stack>

        <nav aria-label="sidebar">
          <List>
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding className="mb-2">
                <Tooltip
                  title={collapsed ? item.title : ""}
                  placement="right"
                  arrow
                  sx={{
                    fontSize: "16px",
                    backgroundColor: "yellow",
                    color: "blue",
                    borderRadius: "8px",
                  }}
                >
                  <ListItemButton
                    selected={selectedIndex === index}
                    onClick={() => handleItemClick(index, item.path)}
                    sx={{
                      "&:hover, &.Mui-selected": {
                        borderColor: "#4D18E8",
                        borderWidth: "2px",
                        borderStyle: "solid",
                        color: "#4D18E8",
                        transform: "scale(1.05)",
                      },
                      "&.Mui-selected": {
                        color: "#FFFFFF",
                        fontWeight: "bold",
                      },
                      transition: "all 0.3s ease",
                      justifyContent: collapsed ? "center" : "center",
                      padding: "0.6rem 1.6rem",
                      color: "#E2DDF3",
                      borderColor: "#080511",
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderRadius: "0.8rem",
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        justifyContent: "center",
                        display: "flex",
                        alignItems: "center",
                        marginRight: collapsed ? 0 : "1rem",
                      }}
                    >
                      <img
                        src={
                          selectedIndex === index || hoveredIndex === index
                            ? item.icon.replace(".svg", "-colored.svg")
                            : item.icon
                        }
                        className="w-6.5"
                        alt={`${item.title} icon`}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      className={clsx("transition-all duration-0", {
                        "opacity-0 w-auto": collapsed,
                        "opacity-100 w-auto": !collapsed,
                      })}
                      sx={{ whiteSpace: "nowrap", overflow: "hidden" }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </nav>
      </Stack>

      <ChooseModeModal open={openModal} handleClose={handleModalClose} />
    </Box>
  );
};

export default Sidebar;