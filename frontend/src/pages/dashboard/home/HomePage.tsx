import { Box, Stack, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DocumentHead from "../../../components/DocumentHead";
import PageTransition from "../../../styles/PageTransition";

import ChooseYourChallenge from "../../../components/ChooseYourChallenge";
import DiscoverMore from "./DiscoverMore";
import RecentlyOpened from "./RecentlyOpened";

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
      <Box className="h-screen w-full">
        <DocumentHead title="Home" />
        <Stack spacing={2} className="px-6">
          <Stack spacing={2} className="pb-6">
            <Stack
              direction={"row"}
              spacing={2}
              className="flex items-center justify-start"
            >
              <img src="/book.svg" className="w-10 h-10" alt="icon" />
              <Typography variant="h5">Choose your Challenge</Typography>
            </Stack>
            <ChooseYourChallenge />
          </Stack>

          <Stack spacing={0}>
            <Typography variant="h5">Recently Opened</Typography>
            <RecentlyOpened />
          </Stack>

          <Stack spacing={0}>
            <Stack direction={"row"} spacing={2} className="flex items-center">
              <Typography variant="h5">Discover more materials</Typography>
              <Box flexGrow={1} />
              <Button
                variant="text"
                onClick={handleSeeMore}
                sx={{
                  color: "#3B354D",
                  fontSize: "0.8rem",
                  borderRadius: "0.5rem", // Optional: You can add a border radius for rounded corners
                  transition: "color 0.3s ease", // Optional: You can add a transition effect
                  "&:hover": {
                    color: "#E2DDF3", // Change the text color on hover
                    borderRadius: "0.5rem", // Optional: You can add a border radius for rounded corners
                  },
                }}
              >
                See More
              </Button>
            </Stack>
            <DiscoverMore />
          </Stack>
        </Stack>
      </Box>
    </PageTransition>
  );
};

export default HomePage;
