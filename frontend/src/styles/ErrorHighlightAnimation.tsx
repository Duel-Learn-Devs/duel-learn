import { styled } from "@mui/material";

// Add this to the top of your file, after your imports
const ErrorHighlightAnimation = styled("style")({
  "@keyframes errorPulse": {
    "0%": { boxShadow: "0 0 0 0 rgba(244, 67, 54, 0.7)" },
    "70%": { boxShadow: "0 0 0 10px rgba(244, 67, 54, 0)" },
    "100%": { boxShadow: "0 0 0 0 rgba(244, 67, 54, 0)" },
  },
  ".error-highlight-animation": {
    animation: "errorPulse 1.5s ease-in-out",
  },
});

export default ErrorHighlightAnimation;
