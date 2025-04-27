import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Divider,
  Stack,
  GlobalStyles,
  Fade,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Scroll handler for header background
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Intersection Observer for sections
    const observerOptions = {
      threshold: [0.1, 0.2, 0.3], // Lower thresholds for earlier detection
      rootMargin: "-10% 0px -20% 0px", // Adjusted margins for better detection
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe all sections
    const sections = ["about", "how-it-works", "features", "premium"];
    sections.forEach((section) => {
      const element = document.getElementById(section);
      if (element) {
        observer.observe(element);
      }
    });

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    setMobileMenuOpen(false); // Close menu first

    // Use setTimeout to ensure menu closing animation completes before scrolling
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 300);
  }, []);

  const navButtonStyle = {
    textTransform: "none",
    fontSize: "1rem",
    transition: "color 0.3s ease",
    "&:hover": {
      color: "#4D18E8",
      backgroundColor: "transparent",
    },
    "&:active": {
      backgroundColor: "transparent",
    },
    "&.MuiButtonBase-root:hover": {
      backgroundColor: "transparent",
    },
  };

  const mobileNavButtonStyle = {
    textTransform: "none",
    fontSize: "1.5rem",
    color: "#6F658D",
    transition: "color 0.3s ease",
    "&:hover": {
      color: "#E2DDF3",
      backgroundColor: "transparent",
    },
    "&:active": {
      backgroundColor: "transparent",
    },
    "&.MuiButtonBase-root:hover": {
      backgroundColor: "transparent",
    },
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsClosing(false);
    }, 500);
  };

  return (
    <>
      <GlobalStyles
        styles={`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(60px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideOutUp {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(-30px);
            }
          }
          
          @keyframes drawerSlideOut {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-100%);
            }
          }
        `}
      />
      <AppBar
        position="sticky"
        sx={{
          background: "#080511",
          transition: "all 0.3s ease",
          boxShadow: "none",
          py: isScrolled ? 2 : 4,
          borderBottom: "2px solid rgba(255, 255, 255, 0.03)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            sx={{
              justifyContent: "space-between",
              minHeight: { xs: "40px", md: "56px" },
            }}
          >
            {/* Logo Section */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => navigate("/")}
            >
              <img
                src="/duel-learn-logo.svg"
                alt="Duel Learn"
                style={{ height: "32px", width: "auto" }}
              />
              <Typography
                variant="h6"
                sx={{
                  ml: 2,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "white",
                  display: { xs: "none", sm: "block" },
                }}
              >
                Duel Learn
              </Typography>
            </Box>

            {/* Navigation Links - Hidden on mobile */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 4,
                alignItems: "center",
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <Button
                color="inherit"
                disableRipple
                sx={{
                  ...navButtonStyle,
                  color: activeSection === "about" ? "white" : "#6F658D",
                }}
                onClick={() => scrollToSection("about")}
              >
                About
              </Button>
              <Button
                color="inherit"
                disableRipple
                sx={{
                  ...navButtonStyle,
                  color: activeSection === "how-it-works" ? "white" : "#6F658D",
                }}
                onClick={() => scrollToSection("how-it-works")}
              >
                How it Works
              </Button>
              <Button
                color="inherit"
                disableRipple
                sx={{
                  ...navButtonStyle,
                  color: activeSection === "features" ? "white" : "#6F658D",
                }}
                onClick={() => scrollToSection("features")}
              >
                Features
              </Button>
              <Button
                color="inherit"
                disableRipple
                sx={{
                  ...navButtonStyle,
                  color: activeSection === "premium" ? "white" : "#6F658D",
                }}
                onClick={() => scrollToSection("premium")}
              >
                Premium
              </Button>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {/* Mobile Menu Icon - visible only on mobile */}
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleMobileMenuToggle}
                sx={{
                  display: { md: "none" },
                  color: "white",
                  zIndex: 1000,
                }}
              >
                <MenuRoundedIcon />
              </IconButton>

              <Button
                variant="outlined"
                sx={{
                  color: "white",
                  borderColor: "white",
                  textTransform: "none",
                  borderRadius: "0.8rem",
                  px: 3,
                  "&:hover": {
                    borderColor: "#4D18E8",
                    color: "#4D18E8",
                  },
                  display: { xs: "none", sm: "flex" },
                }}
                onClick={() => navigate("/login")}
              >
                LOG IN
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#4D18E8",
                  textTransform: "none",
                  borderRadius: "0.8rem",
                  px: 3,
                  "&:hover": {
                    backgroundColor: "#4315c7",
                  },
                  display: { xs: "none", sm: "flex" },
                }}
                onClick={() => navigate("/sign-up")}
              >
                GET STARTED
              </Button>
            </Box>
          </Toolbar>
        </Container>

        {/* Mobile Menu Drawer */}
        <Drawer
          anchor="top"
          open={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          PaperProps={{
            sx: {
              width: "100%",
              height: "100vh",
              backgroundColor: "#080511",

              backdropFilter: "blur(10px)",
              borderRadius: " 0 0 0.8rem 0.8rem",
              color: "white",
              overflow: "hidden",
              animation: isClosing
                ? "drawerSlideOut 0.3s ease-in-out 0.5s forwards"
                : "none",
            },
          }}
        >
          <Stack
            spacing={2}
            padding={3}
            width="100%"
            sx={{
              animation: isClosing
                ? "none"
                : "slideInUp 0.5s ease-in-out forwards",
            }}
          >
            <Box className="flex justify-end items-center py-2.5 px-2">
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleMobileMenuClose}
                sx={{
                  display: { md: "none" },
                  color: "white",
                  zIndex: 1000,
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Box>
            {/* Navigation Links - visible only on mobile */}
            <Stack paddingX={4} paddingY={2}>
              {[
                { name: "About", section: "about" },
                { name: "How it Works", section: "how-it-works" },
                { name: "Features", section: "features" },
                { name: "Premium", section: "premium" },
                { name: "Login", action: () => navigate("/login") },
                { name: "Get Started", action: () => navigate("/sign-up") },
              ].map((item, index) => (
                <Box
                  key={item.name}
                  sx={{
                    opacity: isClosing ? 1 : 0,
                    transform: isClosing ? "translateY(0)" : "translateY(20px)",
                    animation: isClosing
                      ? `slideOutUp 0.5s ease-out forwards ${
                          (5 - index) * 0.05
                        }s`
                      : mobileMenuOpen
                      ? `slideInUp 0.5s ease-out forwards ${index * 0.09}s`
                      : "none",
                  }}
                >
                  <Button
                    disableRipple
                    sx={{
                      ...mobileNavButtonStyle,
                      color:
                        activeSection === (item.section || "")
                          ? "#6F658D"
                          : "#6F658D",
                      justifyContent: "flex-start",
                      width: "100%",
                      py: 1,
                    }}
                    onClick={() =>
                      item.action
                        ? item.action()
                        : scrollToSection(item.section || "")
                    }
                  >
                    {item.name}
                  </Button>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Drawer>
      </AppBar>
    </>
  );
};

export default Header;
