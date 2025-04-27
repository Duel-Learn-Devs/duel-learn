import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// Function to create the theme with the specified mode
function ThemeContext() {
  let theme = createTheme({
    typography: {
      fontFamily: "Nunito, sans-serif", // Set Nunito font globally
    },
    palette: {
      // Allow for light or dark mode based on the `mode` parameter
      background: {
        default: "#080511", // Background color
      },
      text: {
        primary: "#E2DDF3", // Text color
      },
    },
    components: {
      // Customizing Tooltip globally
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: "0.8rem", // Font size for tooltip
            backgroundColor: "#3B354D", // Tooltip background color
            color: "#E2DDF3", // Tooltip text color
            borderRadius: "0.5rem", // Tooltip border radius
            padding: "0.5rem 1rem", // Tooltip padding
            transition: "all 0.5s ease", // Tooltip transition
          },
          arrow: {
            color: "#3B354D", // Arrow color
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            backgroundColor: "#3B354D", // Divider color
          },
        },
      },
    },
  });

  // Optionally apply responsive font sizes
  theme = responsiveFontSizes(theme);

  return theme;
}

export default ThemeContext;
