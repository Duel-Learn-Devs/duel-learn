import { Box, useMediaQuery, useTheme } from "@mui/material";
import homeBanner from "/images/homeBanner.svg";
import { useNavigate } from "react-router-dom";

const HomeBannerComponent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMobileScreen = useMediaQuery("(max-width:480px)");

  return (
    <Box
      className="rounded-[0.8rem] relative overflow-hidden"
      sx={{
        background: "linear-gradient(90deg, #9F87E5 0%, #6F58D9 100%)",
        height: "auto",
        minHeight: isMobileScreen ? "140px" : isXsScreen ? "170px" : "240px",
        maxHeight: isMobileScreen ? "180px" : isXsScreen ? "220px" : "300px",
        width: "100%",
        marginBottom: isMobileScreen
          ? "0.75rem"
          : isXsScreen
          ? "1rem"
          : "1.5rem",
        borderRadius: "0.8rem",
        position: "relative",
      }}
    >
      {/* Background Image (Full Container Coverage) */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          },
        }}
      >
        <img
          src={homeBanner}
          alt="Home Banner"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: isMobileScreen ? "65% center" : "center",
          }}
        />
      </Box>

      {/* Text Content */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: isMobileScreen
            ? "85%"
            : isXsScreen
            ? "80%"
            : { sm: "60%", md: "50%" },
          padding: isMobileScreen
            ? "0.75rem 1rem"
            : isXsScreen
            ? "1rem 1.25rem"
            : "1.5rem 2rem",
          textAlign: "left",
          zIndex: 2,
        }}
      >
        <h1
          style={{
            color: "white",
            fontSize: isMobileScreen
              ? "0.875rem"
              : isXsScreen
              ? "1rem"
              : "1.25rem",
            fontWeight: 500,
            marginBottom: isMobileScreen ? "0.5rem" : "0.75rem",
            letterSpacing: "0.01em",
            lineHeight: 1.2,
          }}
        >
          {isMobileScreen
            ? "Fill those gaps in your materials!"
            : "Those gaps in your materials? \nLet's fill 'em up!"}
        </h1>
        <p
          style={{
            color: "white",
            fontSize: isMobileScreen
              ? "0.7rem"
              : isXsScreen
              ? "0.75rem"
              : "0.875rem",
            marginTop: isMobileScreen ? "0.25rem" : "0.5rem",
            marginBottom: isMobileScreen ? "0.75rem" : "1rem",
            opacity: 0.8,
          }}
        >
          AI cross-referencing available in Duel-Learn Premium!
        </p>
        <button
          className="hover:scale-105 transition-all ease-in-out duration-300"
          onClick={() => navigate("/dashboard/shop")}
          style={{
            padding: isMobileScreen
              ? "0.4rem 0.875rem"
              : isXsScreen
              ? "0.5rem 1rem"
              : "0.75rem 1.5rem",
            width: "fit-content",
            fontSize: isMobileScreen
              ? "0.7rem"
              : isXsScreen
              ? "0.75rem"
              : "0.875rem",
            backgroundColor: "white",
            color: "#9F87E5",
            borderRadius: "2rem",
            fontWeight: 700,
          }}
        >
          Learn More
        </button>
      </Box>
    </Box>
  );
};

export default HomeBannerComponent;
