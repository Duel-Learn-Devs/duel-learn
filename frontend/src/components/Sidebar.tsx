import React, { useEffect } from "react";
import {
  Box,
  Button,
  Fab,
  Tooltip,
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
import MenuOpenIcon from "@mui/icons-material/MenuOpenRounded";

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
          padding: collapsed ? "0.6rem" : "0.6rem 1rem", // Change from vw to rem
          display: "flex",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.3s ease-in-out",
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
          "& .MuiSvgIcon-root": {
            fontSize: "1.3rem", // Change from clamp to rem
            margin: collapsed ? "0 auto" : "0",
          },
        }}
      >
        {icon}
        <Typography
          variant="subtitle1"
          className={clsx("transition-all duration-100", {
            "opacity-0 w-0 absolute pointer-events-none": collapsed,
            "opacity-100 ": !collapsed,
          })}
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            fontSize: "0.875rem", // Change from clamp to rem
            marginLeft: collapsed ? 0 : "0.5rem", // Add marginLeft for spacing
          }}
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
    <Box
      style={{
        display: "flex",
        position: "relative",
        height: "100vh",
      }}
    >
      <Stack
        className="h-full w-full flex flex-col justify-between"
        spacing={2}
        sx={{
          width: collapsed ? "5rem" : "14rem", // Change from vw to rem
          minWidth: collapsed ? "4rem" : "12rem",
          maxWidth: collapsed ? "6rem" : "18rem",
          paddingY: "4rem",
          paddingX: "0.5rem",
          marginLeft: collapsed ? 0 : "0.3rem", // Change from vw to rem
          transition: "all 0.35s ease",
        }}
      >
        <Stack spacing={3} className="flex">
          <Stack direction="row" className="flex items-center pb-2" spacing={1}>
            <Button
              onClick={handleLandingPage}
              sx={{
                transition: "transform 0.3s ease",
                textTransform: "none",
                padding: 0,
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              <img
                src="/duel-learn-logo.svg"
                style={{
                  width: "2.5rem",
                  height: "auto",
                }}
                alt="icon"
              />
              <Typography
                fontWeight={600}
                className={clsx("transition-all duration-100", {
                  "opacity-0 w-0": collapsed,
                  "opacity-100 ml-2": !collapsed,
                })}
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  color: "#E2DDF3",
                  fontSize: "1.3rem", // Change from clamp to rem
                  marginLeft: { xs: "0.5rem", sm: "1rem" },
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
                backgroundColor: "inherit",
                transition: "all 0.3s ease-in-out",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                "& .MuiSvgIcon-root": {
                  color: "#3B354D",
                },
                "&:hover": {
                  backgroundColor: "#080511",
                  "& .MuiSvgIcon-root": { color: "#E2DDF3" },
                },
              }}
              className="absolute z-50 left-0"
            >
              {collapsed ? (
                <MenuOpenIcon className=" rotate-180" />
              ) : (
                <MenuOpenIcon />
              )}
            </Fab>
          </Stack>

          <Stack spacing={2} sx={{ marginTop: "1.5rem" }}>
            {" "}
            {/* Change from vh to rem */}
            {renderButton(
              <AddIcon fontSize="small" />,
              "Create",
              "contained",
              handleCreateStudyMaterial
            )}
            {renderButton(<PlayIcon />, "Play", "outlined", handleModalOpen)}
          </Stack>

          <Divider
            sx={{ height: "2px", backgroundColor: "#3B354C", margin: "1rem 0" }}
          />
        </Stack>

        <nav aria-label="sidebar" style={{ flex: 1, marginTop: "2vh" }}>
          <List sx={{ height: "100%" }}>
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ marginBottom: "1vh" }}>
                <Tooltip
                  title={collapsed ? item.title : ""}
                  placement="right"
                  arrow
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
                        color: "#4D18E8",
                        fontWeight: "bold",
                      },
                      transition: "all 0.3s ease-in-out",
                      justifyContent: collapsed ? "center" : "flex-start",
                      alignItems: "center",
                      padding: collapsed ? "0.5rem " : "0.5rem 1.2rem",
                      color: "#E2DDF3",
                      borderColor: "#080511",
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderRadius: "0.8rem",
                      width: "100%",
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 0 : "2rem", // Change from vw to rem
                        width: collapsed ? "auto" : "auto",
                        justifyContent: "center",
                        display: "flex",
                        alignItems: "center",
                        marginRight: collapsed ? 0 : "0.5rem", // Change from vw to rem
                        padding: collapsed ? "0" : "0",
                      }}
                    >
                      <img
                        src={
                          selectedIndex === index || hoveredIndex === index
                            ? item.icon.replace(".svg", "-colored.svg")
                            : item.icon
                        }
                        style={{
                          width: "1.5rem", // Change from clamp to rem
                          margin: collapsed ? "0 auto" : "0",
                        }}
                        alt={`${item.title} icon`}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      className={clsx("transition-all duration-0", {
                        "opacity-0 w-0 absolute": collapsed,
                        "opacity-100": !collapsed,
                      })}
                      primaryTypographyProps={{
                        sx: {
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          fontSize: "0.925rem", // Change from clamp to rem
                        },
                      }}
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
