import { Box, Card, CardContent, Typography, CardMedia } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from 'react-router-dom';
import { useAudio } from "../contexts/AudioContext";
import { useState } from "react";

const ModeCard = styled(Card)({
  padding: "2rem",
  borderRadius: "1rem",
  height: "14rem",
  width: "auto",
  cursor: "pointer",
  background: "#E2DDF3",
  transform: "scale(1)",
  transition: "all 0.3s",
  "& .cardMedia": {
    transform: "scale(1)",
    transition: "transform 0.5s ease-in-out",
  },
  "&:hover": {
    transform: "scale(1.03)",
    "& .cardMedia": {
      transform: "scale(1.07)",
    },
  },
});

const ChooseYourChallenge = () => {
  const navigate = useNavigate();
  const audioContext = useAudio();
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('ChooseYourChallenge mounted, audioContext:', !!audioContext);

  const handleModeSelection = async (mode: string) => {
    // Prevent multiple clicks/processing
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log(`Mode selected: ${mode}`);
    
    try {
      let audioStarted = false;
      
      // Play the appropriate audio based on mode
      if (mode === "Peaceful") {
        console.log('Starting Peaceful Mode audio');
        await audioContext.playPeacefulModeAudio();
        audioStarted = true;
      } else if (mode === "Time Pressured") {
        console.log('Starting Time Pressured audio');
        await audioContext.playTimePressuredAudio();
        audioStarted = true;
      } else if (mode === "PvP") {
        console.log('Starting PvP Mode audio');
        await audioContext.playPvPModeAudio(); // Play PvP mode audio
        audioStarted = true;
      }
      
      console.log('Audio started successfully:', audioStarted);

      // Give audio a moment to start before navigating
      setTimeout(() => {
        console.log('Navigating to welcome-game-mode with mode:', mode);
        navigate("/dashboard/welcome-game-mode", {
          state: { mode }
        });
        setIsProcessing(false);
      }, 300);
    } catch (error) {
      console.error('Error in handleModeSelection:', error);
      setIsProcessing(false);
      
      // Navigate anyway if audio fails
      navigate("/dashboard/welcome-game-mode", {
        state: { mode }
      });
    }
  };

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
      <ModeCard onClick={() => !isProcessing && handleModeSelection("Peaceful")}>
        <CardMedia
          component="svg"
          className="cardMedia"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: -1,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          image="/game-mode-selection/peaceful-mode.svg"
        />
        <CardContent>
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
              fontWeight="700"
              className="text-[#266349]"
            >
              Peaceful Mode
            </Typography>
            <Typography
              variant="body2"
              fontWeight="650"
              className="text-[#266349]"
            >
              Study your way, no rush, just flow!
            </Typography>
          </Box>
        </CardContent>
      </ModeCard>

      {/* Time Pressured Mode */}
      <ModeCard onClick={() => !isProcessing && handleModeSelection("Time Pressured")}>
        <CardMedia
          component="svg"
          className="cardMedia"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: -1,
            width: "100%",
            height: "100%",
          }}
          image="/game-mode-selection/time-pressured-mode.svg"
        />
        <CardContent>
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
              fontWeight="700"
              className="text-[#504c36]"
            >
              Time Pressured
            </Typography>
            <Typography
              variant="body2"
              fontWeight="650"
              className="text-[#504c36]"
            >
              Beat the clock, challenge your speed!
            </Typography>
          </Box>
        </CardContent>
      </ModeCard>

      {/* PvP Mode */}
      <ModeCard onClick={() => !isProcessing && handleModeSelection("PvP")}>
        <CardMedia
          component="svg"
          className="cardMedia"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: -1,
            width: "100%",
            height: "100%",
          }}
          image="/game-mode-selection/pvp-mode.svg"
        />
        <CardContent>
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
              fontWeight="700"
              className="text-[#303869]"
            >
              PvP Mode
            </Typography>
            <Typography
              variant="body2"
              fontWeight="650"
              className="text-[#303869]"
            >
              Outsmart your opponent and win!
            </Typography>
          </Box>
        </CardContent>
      </ModeCard>
    </Box>
  );
};

export default ChooseYourChallenge;