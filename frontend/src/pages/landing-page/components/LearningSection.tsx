import { Box, Container, Typography } from "@mui/material";

const LearningSection = () => {
  return (
    <Box
      id="about"
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "#080511",
        alignContent: "center",
        justifyContent: "center",
        left: { xs: 0, md: -100 },
        py: 12,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 4, md: 0 },
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Left Side - Image */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              position: "relative",
              mr: { xs: 0, md: -8 },
            }}
          >
            <img
              src="/landing-page/overwhelmed-cat.png"
              alt="Overwhelmed Cat"
              style={{
                width: "100%",
                maxWidth: "500px",
                height: "auto",
              }}
            />
          </Box>

          {/* Right Side - Content */}
          <Box
            sx={{
              flex: 1,
              mr: { xs: 0, md: 10 },
              maxWidth: { xs: "100%", md: "450px" },
              position: "relative",
              zIndex: 1,
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2rem", md: "2rem" },
                fontWeight: 600,
                mb: 3,
                color: "white",
                lineHeight: 1.4,
              }}
            >
              Learning doesn't have to feel like schoolwork.
            </Typography>
            <Typography
              sx={{
                color: "#6F658D",
                fontSize: "1.1rem",
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              With our magical, gamified platform, you can study in a world of
              adventure—using AI (Artificial Intelligence) and OCR (Optical
              Character Recognition) to make creating study materials fast and
              effortless.
            </Typography>
            <Typography
              sx={{
                color: "#6F658D",
                fontSize: "1.1rem",
                lineHeight: 1.6,
              }}
            >
              We're here to turn challenges into quests and keep you motivated
              with every spell you cast on your path to mastery!
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LearningSection;
