// DrawerMenu.tsx
import AddIcon from "@mui/icons-material/Add";
import PlayIcon from "@mui/icons-material/PlayArrowRounded";
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
import ChooseModeModal from "../modals/ChooseModeModal"; // Adjust path accordingly

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

interface DrawerMenuProps {
  drawerOpen: boolean;
  toggleDrawer: (open: boolean) => void;
  collapsed: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}

export default function DrawerSidebarMenu({
  drawerOpen,
  toggleDrawer,
  collapsed,
  selectedIndex,
  setSelectedIndex,
  hoveredIndex,
  setHoveredIndex,
}: DrawerMenuProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

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
          ...(variant === "contained" && { backgroundColor: "#4D18E8" }),
          ...(variant === "outlined" && {
            borderColor: "#E2DDF3",
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

  const handleCreateStudyMaterial = () => {
    setSelectedIndex(null);
    navigate("/dashboard/study-material/create");
  };

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
          className="h-full w-full  mx-2  py-12 flex flex-col justify-between"
          spacing={2}
          sx={{
            width: collapsed ? "5.5rem" : "w-64",
            transition: "width 0.35s",
          }}
        >
          <Stack spacing={3} className="flex">
            <Stack direction="row" className="flex items-center" spacing={1}>
              <IconButton
                aria-label="navigate to landing page"
                onClick={() => navigate("/landing-page")}
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
                className={clsx("transition-all duration-100", {
                  "opacity-0 w-auto": collapsed,
                  "opacity-100 w-auto": !collapsed,
                })}
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                Duel Learn
              </Typography>
            </Stack>
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
              handleOpenModal
            )}
            <Divider className="bg-[#3F3565]" />
          </Stack>

          <nav aria-label="sidebar">
            <List>
              {menuItems.map((item, index) => (
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
        </Stack>
      </Box>

      {/* Render the ChooseModeModal */}
      <ChooseModeModal open={modalOpen} handleClose={handleCloseModal} />
    </Drawer>
  );
}
