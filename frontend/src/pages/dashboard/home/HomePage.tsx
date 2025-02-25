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
        <DocumentHead title="Home | Duel Learn" />
        <div
          className="h-[232px] mx-8 rounded-lg p-6 px-12 flex flex-col justify-center items-start text-left mb-10"
          style={{
            background: "linear-gradient(90deg, #9F87E5 0%, #6F58D9 100%)",
          }}
        >
          <h1
            className="text-white text-xl md:text-[29px] font-medium mb-2"
            style={{ letterSpacing: "0.01em", lineHeight: "1.1" }}
          >
            Those gaps in your <br /> materials? Let’s fill ‘em up!
          </h1>
          <p className="text-white text-sm md:text-[15px] mt-1 opacity-80">
            AI cross-referencing available in Duel-Learn Premium!
          </p>
          <button
            className="mt-4 px-6 py-2 text-sm md:text-base bg-white text-[#9F87E5] rounded-full font-bold"
            onClick={() => navigate("/dashboard/shop")}
          >
            Learn More
          </button>
        </div>
        <Stack spacing={2} className="px-6">
          <Stack spacing={2} className="pb-6">
            <Stack
              direction={"row"}
              spacing={1.5}
              className="flex items-center justify-start pl-2"
            >
              <img src="/book.png" className="w-9 h-7" alt="icon" />
              <Typography variant="h5">Choose your Challenge</Typography>
            </Stack>
            <ChooseYourChallenge />
          </Stack>

          <Stack spacing={0}>
            <Typography variant="h5" className="pl-2">
              Recently Opened
            </Typography>
            <RecentlyOpened />
          </Stack>

          <Stack spacing={0}>
            <Stack direction={"row"} spacing={2} className="flex items-center">
              <Typography variant="h5" className="pl-2">
                Discover more materials
              </Typography>
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
