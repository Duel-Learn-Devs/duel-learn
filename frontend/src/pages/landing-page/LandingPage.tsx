import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DocumentHead from "../../components/DocumentHead";
import PageTransition from "../../styles/PageTransition";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleDashboard = () => {
    navigate("/dashboard/home"); // Navigate to the dashboard
  };

  const handleLogin = () => {
    navigate("/login"); // Navigate to the login page
  };

  const handleAdmin = () => {
    navigate("/admin/admin-dashboard"); // Navigate to the admin dashboard
  };

  return (
    <PageTransition>
      <Box>
        <DocumentHead title="Duel Learn" />
        <Typography variant="h3">Landing Page</Typography>
        <Stack spacing={3}>
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login
          </Button>
          <Button variant="contained" color="primary" onClick={handleDashboard}>
            Dashboard
          </Button>
<<<<<<< HEAD
=======
          <Button variant="contained" color="secondary" onClick={handleAdmin}>
            Admin Dashboard
          </Button>
>>>>>>> origin/beta-branch
        </Stack>
      </Box>
    </PageTransition>
  );
};

export default LandingPage;
