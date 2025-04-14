import { Box, Button, Container, Typography } from "@mui/material";

const PremiumSection = () => {
  return (
    <Box
      id="premium"
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "#080511",
        pt: 12,
        overflow: "hidden",
      }}
    >
      {/* Decorative Shapes */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(77, 24, 232, 0.1)",
            left: "5%",
            bottom: "15%",
            filter: "blur(60px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(42, 24, 98, 0.2)",
            right: "10%",
            top: "10%",
            filter: "blur(80px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(77, 24, 232, 0.15)",
            left: "35%",
            top: "20%",
            filter: "blur(40px)",
          }}
        />
      </Box>

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            textAlign: "center",
            position: "relative",
            maxWidth: "800px",
            margin: "0 auto",
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
            Duel-Learn <span style={{ color: "#4D18E8" }}>Premium</span>
          </Typography>
          <Typography
            sx={{
              color: "#6F658D",
              fontSize: "1.1rem",
              mb: 6,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Go ordinary, stay mundane. Go premium, master the magic!
          </Typography>
          <Button
            variant="contained"
            sx={{
              borderRadius: "10px",
              px: 4,
              py: 1.5,
              letterSpacing: "0.05em",
              backgroundColor: "#4D18E8",
              textTransform: "none",
              fontSize: "1rem",
              mt: 4,
              "&:hover": {
                backgroundColor: "#4315c7",
              },
            }}
          >
            TRY IT FOR ONE WEEK
          </Button>

          {/* Premium Illustration */}
          <Box
            sx={{
              mt: 12,
              position: "relative",
              width: "100vw",
              height: "400px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src="/landing-page/premium-solo.png"
              alt="Premium Features"
              style={{
                width: "auto",
                height: "100%",
                maxWidth: "140%",
                objectFit: "contain",
                transform: "scale(1.1)",
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PremiumSection;
