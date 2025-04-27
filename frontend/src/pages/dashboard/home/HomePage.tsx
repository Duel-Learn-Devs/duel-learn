import { Box, Stack, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";

import ChooseYourChallenge from "../../../components/ChooseYourChallenge";
import YourPickedTopics from "./YourPickedTopics";
import HomeBanner from "./HomeBanner";

const HomePage = ({
  setSelectedIndex,
}: {
  setSelectedIndex: (index: number) => void;
}) => {
  const navigate = useNavigate();

  const handleSeeMore = () => {
    setSelectedIndex(1); // Set "Explore" as the active sidebar item (index 1)
    navigate("/dashboard/explore");
  };

  return (
    <PageTransition>
      <Box className="h-full w-auto" sx={{ backgroundColor: "#080511" }}>
        <DocumentHead title="Home | Duel Learn" />
        <Stack spacing={2}>
          <HomeBanner />

          <Stack spacing={2} className="pb-4  sm:pt-2">
            <Stack
              direction={"row"}
              spacing={1.5}
              className="flex items-center justify-start"
            >
              <img
                src="/book.png"
                className="w-6 h-5 sm:w-8 sm:h-6"
                alt="icon"
              />
              <Typography
                sx={{
                  color: "#E2DDF3",
                  fontSize: {
                    xs: "1rem",
                    sm: "1.1rem",
                    md: "1.25rem",
                  },
                  fontWeight: 600,
                }}
              >
                Choose your Challenge
              </Typography>
            </Stack>
            <ChooseYourChallenge />
          </Stack>

          <Stack spacing={0} className="w-full overflow-hidden">
            <Stack direction={"row"} spacing={2} className="flex items-center">
              <Stack
                direction={"row"}
                spacing={1.5}
                className="flex items-center justify-start"
              >
                <img
                  src="/book.png"
                  className="w-6 h-5 sm:w-8 sm:h-6"
                  alt="icon"
                />
                <Typography
                  sx={{
                    color: "#E2DDF3",
                    fontSize: {
                      xs: "1rem",
                      sm: "1.1rem",
                      md: "1.25rem",
                    },
                    fontWeight: 600,
                  }}
                >
                  Your Picked Topics
                </Typography>
              </Stack>
              <Box flexGrow={1} />
              <Button
                variant="text"
                onClick={handleSeeMore}
                sx={{
                  textTransform: "none",
                  borderRadius: "0.8rem",
                  padding: {
                    xs: "0.4rem 0.8rem",
                    sm: "0.5rem 1rem",
                  },
                  fontSize: {
                    xs: "0.85rem",
                    sm: "0.9rem",
                    md: "1rem",
                  },
                  color: "#3B354D",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    color: "#E2DDF3",
                    backgroundColor: "#3B354D",
                  },
                }}
              >
                See More
              </Button>
            </Stack>
            <Box className="w-full overflow-hidden">
              <YourPickedTopics />
            </Box>
          </Stack>

          {/* <Stack spacing={0}>
            <Stack
              direction={"row"}
              spacing={1.5}
              className="flex items-center justify-start pl-2"
            >
              <img src="/book.png" className="w-6 h-5 sm:w-8 sm:h-6" alt="icon" />
              <Typography
                variant="h6"
                sx={{ 
                  color: '#E2DDF3',
                  fontSize: {
                    xs: "1rem",
                    sm: "1.1rem", 
                    md: "1.25rem"
                  },
                  fontWeight: 600
                }}
              >
                Recently Opened
              </Typography>
            </Stack>
            <RecentlyOpened />
          </Stack> */}
        </Stack>
      </Box>
    </PageTransition>
  );
};

export default HomePage;
