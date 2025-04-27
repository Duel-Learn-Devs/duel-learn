import AddIcon from "@mui/icons-material/Add";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HelpIcon from "@mui/icons-material/Help";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";

// Admin-specific menu items
const adminMenuItems = [
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
    title: "Settings",
    icon: <SettingsIcon />,
    path: "/admin/settings",
  },
  {
    title: "Support",
    icon: <HelpIcon />,
    path: "/admin/support",
  },
];

interface AdminDrawerMenuProps {
  drawerOpen: boolean;
  toggleDrawer: (open: boolean) => void;
  collapsed: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}

export default function AdminDrawerSidebarMenu({
  drawerOpen,
  toggleDrawer,
  collapsed,
  selectedIndex,
  setSelectedIndex,
  hoveredIndex,
  setHoveredIndex,
}: AdminDrawerMenuProps) {
  const navigate = useNavigate();

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
          ...(variant === "contained" && { 
            backgroundColor: "#4D18E8",
            borderWidth: "2px",
          }),
          ...(variant === "outlined" && {
            borderColor: "#E2DDF3",
            borderWidth: "2px",
            color: "#E2DDF3",
          }),
        }}
      >
        {icon}
        <Typography
          variant="subtitle1"
          className={clsx("transition-all duration-100", {
            "opacity-0 w-auto": collapsed,
            "opacity-100 w-auto": !collapsed,
          })}
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {text}
        </Typography>
      </Button>
    </Tooltip>
  );

  return (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => toggleDrawer(false)}
      sx={{
        width: 400,
        "& .MuiDrawer-paper": {
          width: "300px",
          backgroundColor: "#080511",
          paddingX: "20px",
        },
      }}
    >
      <Box style={{ display: "flex", position: "relative" }}>
        <Stack
          className="h-full w-full mx-2 py-12 flex flex-col justify-between"
          spacing={2}
          sx={{
            width: collapsed ? "5.5rem" : "w-64",
            transition: "width 0.35s",
          }}
        >
          <Stack spacing={3} className="flex">
            <Stack direction="row" className="flex items-center" spacing={1}>
              <IconButton
                aria-label="navigate to admin dashboard"
                onClick={() => navigate("/admin/dashboard")}
              >
                <img
                  src="/duel-learn-logo.svg"
                  className="w-10 h-10"
                  alt="icon"
                />
              </IconButton>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  color: "#E2DDF3",
                }}
              >
                Admin Panel
              </Typography>
            </Stack>
            {renderButton(
              <AddIcon
                fontSize="small"
                className={clsx({ "mr-2": !collapsed })}
              />,
              "Create Content",
              "contained",
              () => {
                navigate("/admin/content/create");
                toggleDrawer(false);
              }
            )}
            {renderButton(
              <SupervisorAccountIcon
                fontSize="small"
                className={clsx({ "mr-2": !collapsed })}
              />,
              "Admin Actions",
              "outlined",
              () => {
                navigate("/admin/actions");
                toggleDrawer(false);
              }
            )}
            <Divider className="bg-[#3F3565]" />
          </Stack>

          <nav aria-label="admin-sidebar">
            <List>
              {adminMenuItems.map((item, index) => (
                <ListItem key={index} disablePadding className="mb-2">
                  <Tooltip
                    title={collapsed ? item.title : ""}
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      selected={selectedIndex === index}
                      onClick={() => {
                        setSelectedIndex(index);
                        navigate(item.path);
                        toggleDrawer(false);
                      }}
                      sx={{
                        "&:hover, &.Mui-selected": {
                          borderColor: "#4D18E8",
                          borderWidth: "2px",
                          borderStyle: "solid",
                          borderRadius: "0.8rem",
                          color: "#4D18E8",
                        },
                        justifyContent: collapsed ? "center" : "flex-start",
                        padding: "0.5rem 1.4rem",
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: "auto",
                          justifyContent: "center",
                          display: "flex",
                          marginRight: collapsed ? 0 : "1rem",
                          alignItems: "center",
                          width: collapsed ? "full" : "auto",
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
                          "opacity-0 w-0": collapsed,
                          "opacity-100 w-auto": !collapsed,
                        })}
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                      />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </nav>

          {/* Logout button */}
          <Button
            variant="outlined"
            onClick={() => {
              navigate("/landing-page");
              toggleDrawer(false);
            }}
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
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              Logout
            </Typography>
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
} 