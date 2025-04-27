import { Box, Container, Typography } from "@mui/material";

const HowItWorksSection = () => {
  return (
    <Box
      id="how-it-works"
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
              mb: 1,
            }}
          >
            How <span style={{ color: "#4D18E8" }}>Duel Learn</span> Works
          </Typography>
        </Box>

        {/* Feature Cards Container */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            justifyContent: "center",
            alignItems: "stretch",
          }}
        >
          {/* Scan & Create Card */}
          <WorkCard
            image="scan-create"
            title="Scan & Create"
            description="Use AI & OCR to turn notes into flashcards instantly."
          />

          {/* Train & Play Card */}
          <WorkCard
            image="train-play"
            title="Train & Play"
            description="Study solo or challenge friends in PvP quiz battles."
            imageScale={1.1}
          />

          {/* Climb & Conquer Card */}
          <WorkCard
            image="climb-conquer"
            title="Climb & Conquer"
            description="Earn XP, top leaderboards, and level up your learning!"
          />
        </Box>
      </Container>
    </Box>
  );
};

interface WorkCardProps {
  image: string;
  title: string;
  description: string;
  imageScale?: number;
}

const WorkCard = ({
  image,
  title,
  description,
  imageScale = 1,
}: WorkCardProps) => (
  <Box
    sx={{
      flex: 1,
      bgcolor: "#381898",
      borderRadius: "24px",
      p: 4,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      maxWidth: { xs: "100%", md: "350px" },
      height: "400px",
      border: "2px solid rgba(255, 255, 255, 0.1)",
      transition: "all 0.4s ease-in-out",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "radial-gradient(circle at center, rgba(77, 24, 232, 0.1), transparent 70%)",
        opacity: 0,
        transition: "opacity 0.4s ease-in-out",
      },
      "&:hover": {
        transform: "translateY(-8px)",
        border: "2px solid rgba(77, 24, 232, 0.3)",
        boxShadow: "0 10px 30px -10px rgba(77, 24, 232, 0.3)",
        "& img": {
          transform: `scale(${imageScale * 1.1})`,
        },
        "&::before": {
          opacity: 1,
        },
      },
    }}
  >
    <Box
      sx={{
        mb: 3,
        width: "180px",
        height: "180px",
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "140%",
          height: "140%",
          background:
            "radial-gradient(circle, rgba(77, 24, 232, 0.1) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          opacity: 0.5,
          transition: "all 0.4s ease-in-out",
        },
      }}
    >
      <img
        src={`/landing-page/${image}.png`}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${imageScale})`,
          objectFit: "contain",
          transition: "transform 0.4s ease-in-out",
        }}
      />
    </Box>
    <Typography
      variant="h5"
      sx={{
        color: "white",
        mb: 2,
        fontWeight: 600,
        transition: "transform 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
        },
      }}
    >
      {title}
    </Typography>
    <Typography
      sx={{
        color: "white",
        fontWeight: 200,
        opacity: 0.8,
        transition: "opacity 0.3s ease",
        "&:hover": {
          opacity: 1,
        },
      }}
    >
      {description}
    </Typography>
  </Box>
);

export default HowItWorksSection;
