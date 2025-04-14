import { Box, Button, Typography, GlobalStyles } from "@mui/material";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <>
      <GlobalStyles
        styles={`
          @keyframes flowLeftAura {
            0% {
              transform: translateX(-10%) translateY(5%) skewX(15deg) scaleY(0.9);
              opacity: 0.5;
            }
            25% {
              transform: translateX(5%) translateY(-5%) skewX(5deg) scaleY(1.1);
              opacity: 0.7;
            }
            50% {
              transform: translateX(10%) translateY(5%) skewX(-5deg) scaleY(0.9);
              opacity: 0.5;
            }
            75% {
              transform: translateX(-5%) translateY(-5%) skewX(-15deg) scaleY(1.1);
              opacity: 0.7;
            }
            100% {
              transform: translateX(-10%) translateY(5%) skewX(15deg) scaleY(0.9);
              opacity: 0.5;
            }
          }

          @keyframes flowRightAura {
            0% {
              transform: translateX(10%) translateY(5%) skewX(-15deg) scaleY(0.9);
              opacity: 0.5;
            }
            25% {
              transform: translateX(-5%) translateY(-5%) skewX(-5deg) scaleY(1.1);
              opacity: 0.7;
            }
            50% {
              transform: translateX(-10%) translateY(5%) skewX(5deg) scaleY(0.9);
              opacity: 0.5;
            }
            75% {
              transform: translateX(5%) translateY(-5%) skewX(15deg) scaleY(1.1);
              opacity: 0.7;
            }
            100% {
              transform: translateX(10%) translateY(5%) skewX(-15deg) scaleY(0.9);
              opacity: 0.5;
            }
          }

          @keyframes gradientLeft {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes gradientRight {
            0% {
              background-position: 100% 50%;
            }
            50% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 100% 50%;
            }
          }
        `}
      />

      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "80vh", md: "90vh" },
          overflow: "hidden",
        }}
      >
        {/* Decorative Auras */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          {/* Left Mascot Aura */}
          <Box
            sx={{
              position: "absolute",
              left: {
                xs: "-200px",
                sm: "-100px",
                md: "-50px",
                lg: "0px",
              },
              bottom: "0",
              width: "500px",
              height: "100%",
              zIndex: 0,
              opacity: 0.4,
              background:
                "linear-gradient(135deg, transparent 20%, rgba(255, 255, 255, 0.08) 50%, transparent 80%)",
              backgroundSize: "200% 200%",
              filter: "blur(60px)",
              animation: "gradientLeft 3s ease-in-out infinite",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, transparent 20%, rgba(77, 24, 232, 0.04) 50%, transparent 80%)",
                backgroundSize: "200% 200%",
                filter: "blur(70px)",
                animation: "flowLeftAura 4s ease-in-out infinite",
              },
            }}
          />

          {/* Right Mascot Aura */}
          <Box
            sx={{
              position: "absolute",
              right: {
                xs: "-200px",
                sm: "-100px",
                md: "-50px",
                lg: "0px",
              },
              bottom: "0",
              width: "500px",
              height: "100%",
              zIndex: 0,
              opacity: 0.4,
              background:
                "linear-gradient(225deg, transparent 20%, rgba(255, 255, 255, 0.08) 50%, transparent 80%)",
              backgroundSize: "200% 200%",
              filter: "blur(60px)",
              animation: "gradientRight 3s ease-in-out infinite",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(225deg, transparent 20%, rgba(42, 24, 98, 0.04) 50%, transparent 80%)",
                backgroundSize: "200% 200%",
                filter: "blur(70px)",
                animation: "flowRightAura 4s ease-in-out infinite",
              },
            }}
          />
        </Box>

        {/* Main Content Container */}
        <Box
          sx={{
            height: { xs: "80vh", md: "85vh" },
            position: "relative",
          }}
        >
          {/* Content Wrapper */}
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Left Mascot Section */}
            <Box
              sx={{
                position: "absolute",
                left: {
                  xs: "-300px",
                  sm: "-150px",
                  md: "-100px",
                  lg: "-50px",
                },
                bottom: "-5px",
                width: { xs: "400px", sm: "550px", md: "650px" },
                height: { xs: "400px", sm: "550px", md: "650px" },
                display: { xs: "none", sm: "flex" },
                alignItems: "flex-end",
                zIndex: 0,
              }}
            >
              <img
                src="/landing-page/bunny-hero.png"
                alt="Wizard Mascot"
                style={{
                  width: "100%",
                  display: "block",
                  transform: "scale(1.1)",
                }}
              />
            </Box>

            {/* Center Content */}
            <Box
              sx={{
                textAlign: "center",
                maxWidth: { xs: "100%", sm: "600px" },
                zIndex: 1,
                mt: { xs: 0, md: -10 },
                px: { xs: 2, sm: 0 },
                position: "relative",
                margin: "0 auto",
                width: "100%",
              }}
            >
              {/* Hero Content Group */}
              <Box sx={{ position: "relative", pt: 8 }}>
                {/* Spark Image */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "50px",
                    height: "50px",
                  }}
                >
                  <img
                    src="/landing-page/spark.png"
                    alt="Spark"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>

                {/* Text Content */}
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: "2.5rem", md: "3.3rem" },
                      fontWeight: 300,
                      lineHeight: 1.3,
                    }}
                  >
                    UNLOCK THE
                  </Typography>

                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: "2.5rem", md: "3.3rem" },
                      fontWeight: 700,
                      lineHeight: 1.5,
                    }}
                  >
                    MAGIC OF LEARNING
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: "#6F658D",
                      fontWeight: 400,
                      mb: 4,
                      mt: 2,
                    }}
                  >
                    Master your studies with powerful tools
                    <br />
                    and gamified study modes.
                  </Typography>

                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => navigate("/sign-up")}
                    sx={{
                      borderRadius: "10px",
                      px: 4,
                      py: 1.5,
                      letterSpacing: "0.05em",
                      backgroundColor: "#4D18E8",
                      "&:hover": {
                        backgroundColor: "#4315c7",
                      },
                    }}
                  >
                    CAST YOUR FIRST SPELL!
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Right Mascot Section */}
            <Box
              sx={{
                position: "absolute",
                right: {
                  xs: "-300px",
                  sm: "-150px",
                  md: "-100px",
                  lg: "-50px",
                },
                bottom: "-25px",
                width: { xs: "400px", sm: "550px", md: "650px" },
                height: { xs: "400px", sm: "550px", md: "650px" },
                display: { xs: "none", sm: "flex" },
                alignItems: "flex-end",
                zIndex: 0,
              }}
            >
              <img
                src="/landing-page/capybara-hero.png"
                alt="Cat Mascot"
                style={{
                  width: "100%",
                  display: "block",
                  transform: "scale(1.1)",
                  backgroundColor: "transparent",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default HeroSection;
