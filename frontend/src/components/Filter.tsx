import * as React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Grow from "@mui/material/Grow";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Popper from "@mui/material/Popper";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

interface FilterProps {
  menuItems: { value: number | string; label: string }[];
  value: number | string;
  onChange: (value: number | string) => void;
  hoverOpen?: boolean; // Add this prop to optionally enable hover behavior
}

const Filter: React.FC<FilterProps> = ({
  menuItems,
  value,
  onChange,
  hoverOpen = false, // Default to false to maintain backward compatibility
}) => {
  // Set the default value to the first item in the menuItems array, unless a value is passed
  const selectedValue = value || menuItems[0]?.value;
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const handleChange = (newValue: string | number) => {
    onChange(newValue);
    setOpen(false);
  };

  const handleToggle = () => {
    if (!hoverOpen) {
      setOpen((prevOpen) => !prevOpen);
    }
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  // Find the current selected label
  const selectedLabel =
    menuItems.find((item) => item.value === selectedValue)?.label || "";

  // Handle hover events
  const handleMouseEnter = () => {
    if (hoverOpen) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverOpen) {
      setOpen(false); // Immediately close without delay
    }
  };

  return (
    <Box
      sx={{
        minWidth: 120,
        maxWidth: "100%", // Changed from "full" to "100%"
        position: "relative",
      }}
      ref={anchorRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        onClick={handleToggle}
        role="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Select filter option"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleToggle();
            e.preventDefault();
          }
        }}
        sx={{
          backgroundColor: "transparent",
          color: "#6F658D",
          borderRadius: "0.8rem",
          fontSize: "14px",
          padding: "8px 14px",
          border: "2px solid #3B354C",
          display: "flex",
          alignItems: "center",
          height: "fit-content",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "scale(1.03)",
            backgroundColor: "rgba(59, 53, 76, 0.3)",
            borderColor: "#9F9BAE",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            "& > span": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
        >
          <span>{selectedLabel}</span>
          <ArrowDropDownIcon
            sx={{
              transition: "transform 0.3s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0, // Prevent icon from shrinking
            }}
          />
        </Box>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        placement="bottom-start"
        modifiers={[
          {
            name: "flip",
            enabled: true,
            options: {
              fallbackPlacements: ["top-start", "top-end", "bottom-end"],
            },
          },
          {
            name: "preventOverflow",
            enabled: true,
            options: {
              boundary: "window",
            },
          },
        ]}
        style={{
          zIndex: 1300,
          width: anchorRef.current ? anchorRef.current.clientWidth : "auto",
        }}
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: "top",
            }}
          >
            <Paper
              sx={{
                backgroundColor: "#120F1B",
                borderRadius: "0.8rem",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.5)",
                mt: 1,
                width: "100%",
                minWidth: anchorRef.current?.clientWidth || 120,
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  sx={{
                    padding: "0.5rem 0",
                    "& .MuiMenuItem-root:focus": {
                      outline: "none", // Remove default focus outline
                    },
                    "& .MuiMenuItem-root.Mui-focusVisible": {
                      outline: "none", // Also handle keyboard focus
                      backgroundColor: "rgba(59, 53, 76, 0.3)", // Custom focus background
                    },
                  }}
                >
                  {menuItems.map((item) => (
                    <MenuItem
                      key={item.value}
                      selected={item.value === selectedValue}
                      onClick={() => handleChange(item.value)}
                      sx={{
                        color: "#E2DDF3",
                        padding: { xs: "0.4rem 0.7rem", sm: "0.6rem 1rem" },
                        margin: { xs: "0.1rem 0.3rem", sm: "0.2rem 0.5rem" },
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        transition: "all 0.3s ease-in-out",
                        borderRadius: "0.5rem",
                        "&:hover": {
                          transform: "scale(1.02)",
                          backgroundColor: "#3B354C",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#3B354C",
                          color: "#E2DDF3",
                          "&:hover": {
                            backgroundColor: "#4A465A",
                          },
                        },
                      }}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};

export default Filter;
