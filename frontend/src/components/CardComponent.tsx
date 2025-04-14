import {
  Box,
  Stack,
  Typography,
  Chip,
  Card,
  CardContent,
  CardMedia,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/system";
import defaultCover from "/study-material-cover/cardBackground.svg";
import { CardComponentProps } from "src/types/cardComponentObject";

const CardComponent: React.FC<CardComponentProps> = ({
  title,
  tags,
  totalItems,
  createdBy,
  totalViews,
  onClick, // Destructured onClick handler
}) => {
  const safeTags = Array.isArray(tags) ? tags : []; // Ensure it's always an array
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isSmScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const ModeCard = styled(Card)(() => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    borderRadius: "0.8rem",
    height: isXsScreen ? "180px" : isSmScreen ? "180px" : "220px",
    width: isXsScreen ? "100%" : "100%",
    cursor: "pointer",
    maxHeight: "100%",
    background: "#E2DDF3",
    position: "relative",
    transform: "scale(1)", // Initial transform state
    transition: "all 0.3s ease-in-out", // Ensure smooth transition between hover and unhover states
    "& .cardMedia": {
      transform: "scale(1)", // Initial scale
      transition: "transform 0.5s ease-in-out", // Always apply transition, not just on hover
    },
    "&:hover": {
      transform: "scale(1.03)", // Scales slightly on hover
      "& .cardMedia": {
        transform: "scale(1.05)", // Scale the image on hover
      },
    },
  }));

  return (
    <ModeCard onClick={onClick}>
      {" "}
      {/* Added onClick to the card */}
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: isXsScreen ? "12px" : isSmScreen ? "14px" : "16px",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: isXsScreen ? 16 : isSmScreen ? 24 : 26,
            left: isXsScreen ? 16 : isSmScreen ? 24 : 26,
            textAlign: "left",
            maxWidth: isXsScreen ? "80%" : "85%",
          }}
        >
          <Stack spacing={0} className="flex items-baseline justify-end">
            <Stack
              direction="row"
              spacing={isXsScreen ? 0.5 : 1}
              alignItems={"center"}
            >
              <Typography
                sx={{
                  color: "#080511",
                  fontSize: isXsScreen
                    ? "0.7rem"
                    : isSmScreen
                    ? "0.75rem"
                    : "0.8rem",
                  fontWeight: "650",
                  lineHeight: 1.4,
                }}
              >
                {totalItems} Items
              </Typography>
              <Typography
                sx={{
                  color: "#080511",
                  fontSize: isXsScreen
                    ? "0.7rem"
                    : isSmScreen
                    ? "0.75rem"
                    : "0.8rem",
                  fontWeight: "65",
                }}
              >
                &#x2022;
              </Typography>
              <Typography
                sx={{
                  color: "#080511",
                  fontSize: isXsScreen
                    ? "0.7rem"
                    : isSmScreen
                    ? "0.75rem"
                    : "0.8rem",
                  fontWeight: "650",
                  lineHeight: 1.4,
                }}
              >
                {totalViews} Views
              </Typography>
            </Stack>{" "}
            <Typography
              className="text-[#080511]"
              fontWeight="bold"
              sx={{
                fontSize: isXsScreen
                  ? "0.9rem"
                  : isSmScreen
                  ? "1rem"
                  : "1.1rem",
                lineHeight: isXsScreen ? 1.3 : 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                flexWrap: "wrap",
                gap: 0.5,
                mb: isXsScreen ? 1 : 1.5,
              }}
            >
              {safeTags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  sx={{
                    backgroundColor: "#4D18E8 !important", // Force background color
                    color: "#E2DDF3 !important", // Force text color
                    borderRadius: "0.8rem",
                    width: "fit-content",
                    height: "1.75rem",
                    py: isXsScreen ? "0.15rem" : "0.2rem",
                    px: isXsScreen ? "0.4rem" : "0.5rem",
                    fontSize: isXsScreen
                      ? "0.6rem"
                      : isSmScreen
                      ? "0.65rem"
                      : "0.7rem",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    "& .MuiChip-label": {
                      padding: isXsScreen ? "0 2px" : "0 4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#E2DDF3 !important", // Force label text color
                      lineHeight: 1.2,
                    },
                  }}
                />
              ))}
            </Stack>
            <Typography
              sx={{
                color: "#000000",
                fontSize: isXsScreen
                  ? "0.65rem"
                  : isSmScreen
                  ? "0.7rem"
                  : "0.75rem",
                fontWeight: "600",
                paddingLeft: "1px",
                lineHeight: 1.3,
              }}
            >
              Made by <strong>{createdBy}</strong>
            </Typography>
          </Stack>
        </Box>
        <CardMedia
          component="svg"
          className="cardMedia"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: -1,
            width: isXsScreen ? "7rem" : isSmScreen ? "9rem" : "12rem",
            height: "100%",
            objectFit: "cover",
          }}
          image={defaultCover}
        />
      </CardContent>
    </ModeCard>
  );
};

export default CardComponent;
