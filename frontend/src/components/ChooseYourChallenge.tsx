//import * as React from "react";
import { Box, Card, CardContent, Typography, CardMedia } from "@mui/material";
import { styled } from "@mui/system";

const ModeCard = styled(Card)({
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "flex-start",
  padding: "2rem",
  borderRadius: "1rem",
  height: "14rem",
  cursor: "pointer",
  background: "#E2DDF3",
  position: "relative",
  transform: "scale(1)", // Initial transform state
  transition: "all 0.3s", // Ensure smooth transition between hover and unhover states
  "&:hover": {
    transform: "scale(1.03)", // Scales slightly on hover
  },
});

const ChooseYourChallenge = () => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 2,
        mt: 6,
        paddingX: 1,
        "@media (min-width: 768px)": {
          gridTemplateColumns: "repeat(3, 1fr)",
        },
      }}
    >
      {/* Peaceful Mode */}
      <ModeCard>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingBottom: "16px",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              bottom: 28,
              left: 28,
              textAlign: "left",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              className="text-[#080511]"
            >
              Peaceful Mode
            </Typography>
            <Typography variant="body2" className="text-[#322168]">
              Study your way, no rush, just flow!
            </Typography>
          </Box>
          <CardMedia
            component="svg"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: -1,
              width: "auto",
              height: "100%",
            }}
            image="/trial5.svg"
          />
        </CardContent>
      </ModeCard>

      {/* Time Pressured Mode */}
      <ModeCard>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingBottom: "16px",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              bottom: 28,
              left: 28,
              textAlign: "left",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              className="text-[#080511]"
            >
              Time Pressured
            </Typography>
            <Typography variant="body2" className="text-[#322168]">
              Beat the clock, challenge your speed!
            </Typography>
          </Box>
        </CardContent>
      </ModeCard>

      {/* PvP Mode */}
      <ModeCard>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingBottom: "16px",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              bottom: 28,
              left: 28,
              textAlign: "left",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              className="text-[#080511]"
            >
              PvP Mode
            </Typography>
            <Typography variant="body2" className="text-[#322168]">
              Outsmart your opponent and win!
            </Typography>
          </Box>
        </CardContent>
      </ModeCard>
    </Box>
  );
};

export default ChooseYourChallenge;
