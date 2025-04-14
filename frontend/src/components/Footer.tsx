import { Button, Box, Stack, useMediaQuery, useTheme } from "@mui/material";

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTermsCondition = () => {
    window.open("/terms-and-conditions", "_blank");
  };

  const handlePrivacyPolicy = () => {
    window.open("/privacy-policy", "_blank");
  };

  return (
    <footer className="mt-12 mb-5 flex justify-between text-gray-500 px-8 items-baseline">
      <Stack spacing={1} direction="row" className="flex items-center w-full">
        <Button
          variant="text"
          sx={{
            textTransform: "none",
            color: "#5A5076",
            cursor: "pointer",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            padding: { xs: "4px 0", sm: "8px 12px" },
            transition: "color 0.3s ease",
            justifyContent: { xs: "flex-start", sm: "center" },
            minWidth: { xs: "auto", sm: "64px" },
            "&:hover": {
              color: "#E2DDF3",
            },
          }}
          onClick={handlePrivacyPolicy}
        >
          Privacy
        </Button>
        <Button
          variant="text"
          sx={{
            textTransform: "none",
            color: "#5A5076",
            cursor: "pointer",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            padding: { xs: "4px 0", sm: "8px 12px" },
            transition: "color 0.3s ease",
            justifyContent: { xs: "flex-start", sm: "center" },
            minWidth: { xs: "auto", sm: "64px" },
            "&:hover": {
              color: "#E2DDF3",
            },
          }}
          onClick={handleTermsCondition}
        >
          Terms and Condition
        </Button>
        <Box flexGrow={1} />
        <p className="text-[#5a5076] text-xs sm:text-sm mt-2 sm:mt-0">
          © 2025 Duel-Learn Inc.
        </p>
      </Stack>
    </footer>
  );
};

export default Footer;
