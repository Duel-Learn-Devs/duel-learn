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
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import ArrowBackIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HelpIcon from "@mui/icons-material/Help";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";

interface AdminMenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  divider?: boolean;
}

interface AdminSidebarProps {
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

// Admin-specific menu items
const adminMenuItems: AdminMenuItem[] = [
  {
    title: "Dashboard",
    icon: <DashboardIcon />,
    path: "/admin/dashboard",
  },
  {
    title: "User Management",
    icon: <PeopleIcon />,
    path: "/admin/users",
  },
  {
    title: "Content Management",
    icon: <AssessmentIcon />,
    path: "/admin/content",
  },
  {
    title: "Game Settings",
    icon: <SportsEsportsIcon />,
    path: "/admin/game-settings",
  },
  {
    title: "Admin Settings",
    icon: <SettingsIcon />,
    path: "/admin/settings",
  },
  {
    title: "Support",
    icon: <HelpIcon />,
    path: "/admin/support",
  },
  {
    title: "User Dashboard",
    icon: <SupervisorAccountIcon />,
    path: "/dashboard/home",
    divider: true, // Add a divider before this item
  },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  selectedIndex,
  setSelectedIndex,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const { setUser } = useUser();

  const handleLogout = async () => {
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

  const handleItemClick = (index: number, path: string) => {
    if (selectedIndex !== index) {
      setSelectedIndex(index);
      navigate(path);
    }
  };

  const toggleCollapse = () => setCollapsed(!collapsed);

  const handleCreateContent = () => {
    setSelectedIndex(null);
    setCollapsed(true);
    navigate("/admin/content/create");
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
    const index = adminMenuItems.findIndex(
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
          <Stack
            direction="row"
            className="flex items-center pb-2"
            spacing={2}
          >
            <Button
              onClick={() => navigate("/admin/dashboard")}
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
                Admin Panel
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

          {/* Admin action buttons */}
          {renderButton(
            <AddIcon
              fontSize="small"
              className={clsx({ "mr-1": !collapsed })}
            />,
            "Create Content",
            "contained",
            handleCreateContent
          )}
          {renderButton(
            <SupervisorAccountIcon className={clsx({ "mr-1": !collapsed })} />,
            "Admin Actions",
            "outlined",
            () => navigate("/admin/actions")
          )}
          <Divider sx={{ height: "2px", backgroundColor: "#3B354C" }} />
        </Stack>

        <nav aria-label="admin-sidebar">
          <List>
            {adminMenuItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.divider && <Divider sx={{ my: 2, backgroundColor: "#3B354C" }} />}
                <ListItem disablePadding className="mb-2">
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
                          color: "#4D18E8",
                          fontWeight: "bold",
                        },
                        transition: "all 0.3s ease",
                        justifyContent: collapsed ? "center" : "flex-start",
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
                          mr: collapsed ? 0 : 2,
                          justifyContent: "center",
                          color: selectedIndex === index || hoveredIndex === index 
                            ? "#4D18E8" 
                            : "#E2DDF3",
                        }}
                      >
                        {item.icon}
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
              </React.Fragment>
            ))}
          </List>
        </nav>

        {/* Logout button at bottom */}
        <Button
          variant="outlined"
          onClick={handleLogout}
          sx={{
            textTransform: "none",
            borderRadius: "0.8rem",
            borderColor: "#E2DDF3",
            borderWidth: "2px",
            color: "#E2DDF3",
            mt: 2,
            padding: "0.6rem 1.6rem",
            "&:hover": {
              borderColor: "#ff5252",
              color: "#ff5252",
            },
          }}
        >
          <Typography
            variant="subtitle1"
            className={clsx("transition-all duration-100", {
              "opacity-0 w-0": collapsed,
              "opacity-100 w-auto": !collapsed,
            })}
            sx={{ whiteSpace: "nowrap", overflow: "hidden" }}
          >
            Logout
          </Typography>
        </Button>
      </Stack>
    </Box>
  );
};

export default AdminSidebar; 