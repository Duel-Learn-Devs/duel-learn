import { Box, Container, Typography } from "@mui/material";

const featureCards = [
  {
    icon: "gamified-learning",
    title: "Gamified Learning",
    description: "Stay motivated with rewards, badges, and leaderboards.",
  },
  {
    icon: "collaboration",
    title: "Collaboration & Sharing",
    description: "Share created study materials with your friends and peers.",
  },
  {
    icon: "progress-tracking",
    title: "Progress Tracking",
    description: "Track performance and monitor learning progress.",
  },
  {
    icon: "create-generate",
    title: "Create & Generate",
    description: "Create or auto-generate flashcards from notes.",
  },
  {
    icon: "interactive-study",
    title: "Interactive Study Modes",
    description: "Single-player and multiplayer card battles.",
  },
  {
    icon: "ai-powered",
    title: "AI-Powered Learning",
    description: "Enhance flashcards with AI and cross-referencing.",
  },
];

const FeaturesSection = () => {
  return (
    <Box
      id="features"
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "#080511",
        py: 12,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            textAlign: "center",
            mb: 8,
            position: "relative",
            pt: 8,
          }}
        >
          {/* Spark Image */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "40px",
              height: "40px",
            }}
          >
            <img
              src="/landing-page/spark-2.png"
              alt="Spark"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2rem", md: "2rem" },
              fontWeight: 600,
              color: "white",
              mb: 3,
            }}
          >
            Discover our Features
          </Typography>
          <Typography
            sx={{
              color: "#6F658D",
              fontSize: "1.1rem",
              maxWidth: "600px",
              margin: "0 auto",
              mb: 8,
            }}
          >
            Create or generate content effortlessly and explore multiple
            interactive modes designed to enhance engagement and improve your
            experience.
          </Typography>

          {/* Features Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: { xs: 6, md: 8 },
              maxWidth: "900px",
              margin: "0 auto",
              px: { xs: 2, md: 4 },
              justifyContent: "center",
              alignItems: "start",
            }}
          >
            {featureCards.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <Box
    sx={{
      display: "flex",
      gap: 4,
      alignItems: "flex-start",
      position: "relative",
      maxWidth: "400px",
      margin: "0 auto",
      width: "100%",
      "&:hover": {
        "& img": {
          transform: "scale(1.05)",
        },
        "& .feature-line": {
          width: "100px",
          bgcolor: "#4D18E8",
        },
      },
    }}
  >
    {/* Icon Container */}
    <Box
      sx={{
        minWidth: "80px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <img
        src={`/landing-page/${icon}.png`}
        alt={title}
        style={{
          width: "60px",
          height: "60px",
          transition: "transform 0.3s ease",
        }}
      />
    </Box>

    {/* Content */}
    <Box sx={{ flex: 1, textAlign: "left" }}>
      <Box
        className="feature-line"
        sx={{
          width: "60px",
          height: "2px",
          bgcolor: "#2A1862",
          mb: 2,
          transition: "all 0.3s ease",
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: "white",
          mb: 1,
          fontWeight: 600,
          fontSize: "1.2rem",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          color: "#6F658D",
          fontSize: "1rem",
          fontWeight: 300,
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  </Box>
);

export default FeaturesSection;
