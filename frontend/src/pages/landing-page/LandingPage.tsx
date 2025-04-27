import { Box } from "@mui/material";
import DocumentHead from "../../components/DocumentHead";
import PageTransition from "../../styles/PageTransition";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import LearningSection from "./components/LearningSection";
import HowItWorksSection from "./components/HowItWorksSection";
import FeaturesSection from "./components/FeaturesSection";
import PremiumSection from "./components/PremiumSection";
import Footer from "./components/Footer";

const LandingPage = () => {
  return (
    <PageTransition>
      <Box
        sx={{
          bgcolor: "#080511",
          minHeight: "100vh",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <DocumentHead title="Duel Learn" />

        {/* Header */}
        <Header />

        {/* Main Content Container */}
        <Box
          component="main"
          sx={{
            flex: 1,
            position: "relative",
          }}
        >
          {/* Hero Section */}
          <HeroSection />

          {/* Learning Section */}
          <LearningSection />

          {/* How It Works Section */}
          <HowItWorksSection />

          {/* Features Section */}
          <FeaturesSection />

          {/* Premium Section */}
          <PremiumSection />

          {/* Footer */}
          <Footer />
        </Box>
      </Box>
    </PageTransition>
  );
};

export default LandingPage;
