import { Box, Container, Link, Stack, Typography } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";

const Footer = () => {
  return (
    <Box
      sx={{
        bgcolor: "#120F1D",
        py: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Footer Content */}
      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 4, sm: 8, md: 12 },
          maxWidth: { xl: "1400px" },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: { xs: 6, md: 4 },
            mb: 8,
          }}
        >
          {/* About Us Column */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: "white",
                mb: 3,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              About Us
            </Typography>
            <Stack spacing={2}>
              <Link
                href="#"
                sx={{
                  color: "#6F658D",
                  textDecoration: "none",
                  "&:hover": { color: "#4D18E8" },
                }}
              >
                FAQs
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#6F658D",
                  textDecoration: "none",
                  "&:hover": { color: "#4D18E8" },
                }}
              >
                DOCUMENTATION
              </Link>
            </Stack>
          </Box>

          {/* Privacy and Terms Column */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: "white",
                mb: 3,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              Privacy and Terms
            </Typography>
            <Stack spacing={2}>
              <Link
                href="#"
                sx={{
                  color: "#6F658D",
                  textDecoration: "none",
                  "&:hover": { color: "#4D18E8" },
                }}
              >
                PRIVACY POLICY
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#6F658D",
                  textDecoration: "none",
                  "&:hover": { color: "#4D18E8" },
                }}
              >
                TERMS AND CONDITIONS
              </Link>
            </Stack>
          </Box>

          {/* Social Column */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: "white",
                mb: 3,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              Social
            </Typography>
            <Stack spacing={2}>
              <Link
                href="#"
                sx={{
                  color: "#6F658D",
                  textDecoration: "none",
                  "&:hover": { color: "#4D18E8" },
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <FacebookIcon sx={{ fontSize: "1.2rem" }} />
                FACEBOOK
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#6F658D",
                  textDecoration: "none",
                  "&:hover": { color: "#4D18E8" },
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <InstagramIcon sx={{ fontSize: "1.2rem" }} />
                INSTAGRAM
              </Link>
            </Stack>
          </Box>

          {/* Duel-Learn Column */}
          <Box
            sx={{
              textAlign: { md: "right" },
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "flex-start", md: "flex-end" },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "white",
                mb: 3,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              Duel-Learn
            </Typography>
            <Stack
              spacing={2}
              sx={{
                alignItems: { xs: "flex-start", md: "flex-end" },
              }}
            >
              <Typography sx={{ color: "#6F658D" }}>
                duellearn2024@gmail.com
              </Typography>
              <Typography sx={{ color: "#6F658D" }}>+(65) 2345 2345</Typography>
            </Stack>
          </Box>
        </Box>

        {/* Add Logo and Copyright */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 4,
            borderTop: "1px solid rgba(111, 101, 141, 0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <img
              src="/duel-learn-logo.svg"
              alt="Duel Learn"
              style={{ height: "24px", width: "auto" }}
            />
            <Typography
              sx={{
                color: "#6F658D",
                fontSize: "0.9rem",
              }}
            >
              © 2024 Duel Learn. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
